// remote-sync.js - Sincronización híbrida: Local (BroadcastChannel) + Nube 4G/5G (MQTT over WSS) + P2P (PeerJS)

const DEFAULT_MATCH_STATE = {
    mode: 'single', // 'single' or 'dual'
    activeField: 1,
    fields: {
        1: {
            homeName: 'EQUIPO LOCAL',
            awayName: 'EQUIPO VISITANTE',
            homeBadge: '',
            awayBadge: '',
            homeScore: 0,
            awayScore: 0,
            homeYellows: 0,
            homeReds: 0,
            awayYellows: 0,
            awayReds: 0,
            homeScorers: [],  // [{name, minute}]
            awayScorers: [],
            homeRoster: [], // [{number, name, starter}]
            awayRoster: [],
            homeCoach: '',
            awayCoach: '',
            homeFouls: 0,
            awayFouls: 0,
            referees: { main: '', as1: '', as2: '' },
            matchEvents: [], // [{type, team, player, minute, data}]
            period: '1ª PARTE',
            timerSeconds: 0,
            timerRunning: false,
            timerStartTimestamp: null,
            timerMaxSeconds: 2400, // 40 min default
            timerDirection: 'up', // 'up' or 'down'
            timerBaseSeconds: 0,
            addedTimeMinutes: 0,
            addedTime: 0,
            showAddedTime: false,
            status: 'pre_match',
            extraMessage: '',
            showGoalAnimation: false,
            goalTeam: null,
            goalScorerName: ''
        },
        2: {
            homeName: 'EQUIPO LOCAL',
            awayName: 'EQUIPO VISITANTE',
            homeBadge: '',
            awayBadge: '',
            homeScore: 0,
            awayScore: 0,
            homeYellows: 0,
            homeReds: 0,
            awayYellows: 0,
            awayReds: 0,
            homeScorers: [],
            awayScorers: [],
            homeRoster: [],
            awayRoster: [],
            homeCoach: '',
            awayCoach: '',
            homeFouls: 0,
            awayFouls: 0,
            referees: { main: '', as1: '', as2: '' },
            matchEvents: [],
            period: '1ª PARTE',
            timerSeconds: 0,
            timerRunning: false,
            timerStartTimestamp: null,
            timerMaxSeconds: 2400,
            timerDirection: 'up',
            timerBaseSeconds: 0,
            addedTimeMinutes: 0,
            addedTime: 0,
            showAddedTime: false,
            status: 'pre_match',
            extraMessage: '',
            showGoalAnimation: false,
            goalTeam: null,
            goalScorerName: ''
        }
    },
    sponsors: [
        { prefix: 'Patrocina', name: '' },
    ],
    // Tournament / Match Label (shows at top of display)
    tournamentName: '',
    // Sponsor logos for rotating overlay
    sponsorLogos: [],  // [{name, logoUrl}]
    sponsorRotationInterval: 8, // seconds between sponsor logo changes
    // Halftime overlay config
    halftimeTeamName: '', // e.g. "Infantil" — shown during DESCANSO overlay
    // New fields for graphics
    activeGraphic: null, // null, 'lineup', 'substitution', 'card', 'referees', 'summary', 'halftime'
    graphicData: {}
};

// Global state
let matchState = JSON.parse(JSON.stringify(DEFAULT_MATCH_STATE));

class SyncManager {
    constructor(role) {
        this.role = role; // 'display' o 'control'
        this.clientId = 'client_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
        this.roomId = null;
        this.onMessageCallback = null;

        // Canales de comunicación
        this.localChannel = null;
        this.peer = null;
        this.conn = null;
        this.mqttClient = null;

        // Estados de conectividad
        this.mqttConnected = false;
        this.peerConnected = false;
        this._connecting = false;
        this._reconnectTimeout = null;

        // Lista de brokers MQTT seguros (WSS) públicos con alta disponibilidad
        this.mqttBrokers = [
            'wss://broker.emqx.io:8084/mqtt',
            'wss://broker.hivemq.com:8884/mqtt'
        ];
        this._brokerIndex = 0;

        // Servidores STUN redundantes para WebRTC
        this.iceServers = [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' },
            { urls: 'stun:stun.cloudflare.com:3478' }
        ];

        // 1. Canal local para pestañas en la misma máquina
        try {
            this.localChannel = new BroadcastChannel('marcador-sync');
            this.localChannel.onmessage = (event) => {
                if (event.data && event.data._senderId === this.clientId) return;
                if (this.onMessageCallback) {
                    this.onMessageCallback(event.data);
                }
            };
        } catch(e) {
            console.warn('[Sync] BroadcastChannel no soportado en este entorno');
        }
    }

    onMessage(callback) {
        this.onMessageCallback = callback;
    }

    sendMessage(data) {
        if (!data || typeof data !== 'object') return;
        
        // Identificador del remitente para evitar rebotes/loops
        data._senderId = this.clientId;
        data._timestamp = Date.now();

        // 1. Enviar por BroadcastChannel local
        if (this.localChannel) {
            try {
                this.localChannel.postMessage(data);
            } catch(e) {}
        }

        // 2. Enviar por WebRTC P2P (si estuviera abierto)
        if (this.conn && this.conn.open) {
            try {
                this.conn.send(data);
            } catch(e) {}
        }

        // 3. Enviar por Nube MQTT over WSS (funciona en 4G/5G y cualquier red del mundo)
        if (this.mqttClient && this.mqttConnected && this.roomId) {
            try {
                const topic = this.role === 'display' 
                    ? `precioled/${this.roomId}/state` 
                    : `precioled/${this.roomId}/cmd`;
                this.mqttClient.publish(topic, JSON.stringify(data), { qos: 0 });
            } catch(e) {
                console.warn('[Sync:Cloud] Error publicando mensaje en broker MQTT:', e);
            }
        }
    }

    // ── HOST (Display / Pantalla del Marcador) ──────────────────────────
    initHost(roomIdPrefix = 'AZAGRESA-') {
        const randomId = Math.floor(1000 + Math.random() * 9000);
        this.roomId = `${roomIdPrefix}${randomId}`.toUpperCase();

        console.log(`[Sync] Iniciando Host en sala: ${this.roomId}`);

        // A. Conectar a la Nube (MQTT over WSS) para soportar 4G/5G de inmediato
        this._initMqttHost();

        // B. Inicializar PeerJS como canal P2P complementario
        this._initPeerHost();

        // C. Mostrar QR y datos de conexión en pantalla
        this.showRoomIdOnScreen(this.roomId);
    }

    _initMqttHost() {
        if (typeof mqtt === 'undefined') {
            console.warn('[Sync:Cloud] Biblioteca MQTT no cargada aún. Reintentando en 1s...');
            setTimeout(() => this._initMqttHost(), 1000);
            return;
        }

        const brokerUrl = this.mqttBrokers[this._brokerIndex];
        const clientId = `pl_host_${this.roomId}_${Math.random().toString(16).substring(2, 8)}`;

        try {
            console.log(`[Sync:Cloud] Conectando Host a broker MQTT: ${brokerUrl}`);
            this.mqttClient = mqtt.connect(brokerUrl, {
                clientId,
                clean: true,
                connectTimeout: 8000,
                reconnectPeriod: 2500,
                keepalive: 30
            });

            this.mqttClient.on('connect', () => {
                this.mqttConnected = true;
                const cmdTopic = `precioled/${this.roomId}/cmd`;
                this.mqttClient.subscribe(cmdTopic, { qos: 0 }, (err) => {
                    if (!err) {
                        console.log(`[Sync:Cloud] ✅ Host suscrito a comandos remotos (4G/5G) en: ${cmdTopic}`);
                    }
                });
            });

            this.mqttClient.on('message', (topic, payload) => {
                try {
                    const data = JSON.parse(payload.toString());
                    if (data._senderId === this.clientId) return;

                    // Si un nuevo mando móvil solicita el estado completo al conectar
                    if (data.type === 'REQUEST_FULL_STATE') {
                        console.log('[Sync:Cloud] Solicitud de estado completo recibida de móvil 4G/5G');
                        this.sendMessage({
                            type: 'FULL_STATE',
                            payload: matchState
                        });
                        return;
                    }

                    // Procesar la acción o actualización en el display
                    if (this.onMessageCallback) {
                        this.onMessageCallback(data);
                    }
                    if (this.localChannel) {
                        try { this.localChannel.postMessage(data); } catch(e) {}
                    }
                } catch(err) {
                    console.error('[Sync:Cloud] Error parseando payload MQTT:', err);
                }
            });

            this.mqttClient.on('error', (err) => {
                console.warn('[Sync:Cloud] Advertencia en broker MQTT:', err.message);
            });

            this.mqttClient.on('close', () => {
                this.mqttConnected = false;
            });
        } catch(e) {
            console.error('[Sync:Cloud] Error inicializando MQTT Host:', e);
        }
    }

    _initPeerHost() {
        if (typeof Peer === 'undefined') return;

        try {
            this.peer = new Peer(this.roomId, {
                host: '0.peerjs.com',
                port: 443,
                path: '/',
                secure: true,
                debug: 0,
                config: { iceServers: this.iceServers }
            });

            this.peer.on('open', (id) => {
                console.log('[Sync:P2P] PeerJS Host abierto con ID:', id);
            });

            this.peer.on('connection', (conn) => {
                console.log('[Sync:P2P] Nueva conexión P2P recibida');
                this.conn = conn;
                this.peerConnected = true;

                // Enviar estado inicial
                setTimeout(() => {
                    if (this.conn && this.conn.open) {
                        this.conn.send({ type: 'FULL_STATE', payload: matchState, _senderId: this.clientId });
                    }
                }, 300);

                conn.on('data', (data) => {
                    if (data._senderId === this.clientId) return;
                    if (this.onMessageCallback) this.onMessageCallback(data);
                    if (this.localChannel) {
                        try { this.localChannel.postMessage(data); } catch(e) {}
                    }
                });

                conn.on('close', () => {
                    this.peerConnected = false;
                    console.log('[Sync:P2P] Conexión P2P cerrada');
                });
            });

            this.peer.on('error', (err) => {
                // PeerJS a veces colisiona con IDs si no se cerró previamente; el canal MQTT sigue activo
                console.warn('[Sync:P2P] Info de PeerJS:', err.type);
            });
        } catch(e) {
            console.warn('[Sync:P2P] Error creando PeerJS:', e);
        }
    }

    // ── CLIENT (Control Panel / Móvil 4G / 5G / Tablet) ────────────────
    connectToHost(roomId) {
        if (!roomId) return;
        this.roomId = roomId.trim().toUpperCase();
        this._connecting = true;
        this._updateStatusBadge('connecting');

        console.log(`[Sync] Conectando panel de control a la sala: ${this.roomId}`);

        // A. Conexión primaria por la Nube (MQTT over WSS) para compatibilidad 4G/5G
        this._connectMqttClient();

        // B. Conexión complementaria PeerJS P2P
        this._connectPeerClient();
    }

    _connectMqttClient() {
        if (typeof mqtt === 'undefined') {
            setTimeout(() => this._connectMqttClient(), 500);
            return;
        }

        // Si ya había una conexión previa, cerrarla
        if (this.mqttClient) {
            try { this.mqttClient.end(true); } catch(e) {}
            this.mqttClient = null;
        }

        const brokerUrl = this.mqttBrokers[this._brokerIndex];
        const clientId = `pl_ctrl_${this.roomId}_${Math.random().toString(16).substring(2, 8)}`;

        try {
            console.log(`[Sync:Cloud] Conectando mando a broker MQTT: ${brokerUrl}`);
            this.mqttClient = mqtt.connect(brokerUrl, {
                clientId,
                clean: true,
                connectTimeout: 8000,
                reconnectPeriod: 2500,
                keepalive: 30
            });

            this.mqttClient.on('connect', () => {
                console.log(`[Sync:Cloud] ✅ Mando conectado a la Nube. Suscribiéndose al estado del marcador...`);
                this.mqttConnected = true;
                this._connecting = false;
                this._updateStatusBadge();

                const stateTopic = `precioled/${this.roomId}/state`;
                this.mqttClient.subscribe(stateTopic, { qos: 0 }, (err) => {
                    if (!err) {
                        // Solicitar de inmediato el estado actual del marcador a la pantalla
                        this.sendMessage({
                            type: 'REQUEST_FULL_STATE'
                        });
                    }
                });
            });

            this.mqttClient.on('message', (topic, payload) => {
                try {
                    const data = JSON.parse(payload.toString());
                    if (data._senderId === this.clientId) return;

                    if (this.onMessageCallback) {
                        this.onMessageCallback(data);
                    }
                } catch(e) {
                    console.error('[Sync:Cloud] Error parseando estado recibido:', e);
                }
            });

            this.mqttClient.on('reconnect', () => {
                console.log('[Sync:Cloud] Reconectando a la red móvil/nube...');
                this._updateStatusBadge('reconnecting');
            });

            this.mqttClient.on('close', () => {
                this.mqttConnected = false;
                this._updateStatusBadge();
            });

            this.mqttClient.on('error', (err) => {
                console.warn('[Sync:Cloud] Error en broker MQTT:', err.message);
                // Si falla el broker principal, probar con el broker de respaldo
                if (!this.mqttConnected && this._brokerIndex < this.mqttBrokers.length - 1) {
                    this._brokerIndex++;
                    console.log(`[Sync:Cloud] Cambiando a broker alternativo: ${this.mqttBrokers[this._brokerIndex]}`);
                    setTimeout(() => this._connectMqttClient(), 1000);
                }
            });
        } catch(e) {
            console.error('[Sync:Cloud] Error conectando MQTT Client:', e);
        }
    }

    _connectPeerClient() {
        if (typeof Peer === 'undefined') return;

        if (this.peer) {
            try { this.peer.destroy(); } catch(e) {}
            this.peer = null;
            this.conn = null;
        }

        try {
            this.peer = new Peer(undefined, {
                host: '0.peerjs.com',
                port: 443,
                path: '/',
                secure: true,
                debug: 0,
                config: { iceServers: this.iceServers }
            });

            this.peer.on('open', () => {
                try {
                    this.conn = this.peer.connect(this.roomId, { reliable: true, serialization: 'json' });
                    this.conn.on('open', () => {
                        console.log('[Sync:P2P] ✅ Conexión P2P directa establecida con:', this.roomId);
                        this.peerConnected = true;
                        this._updateStatusBadge();

                        this.conn.on('data', (data) => {
                            if (data._senderId === this.clientId) return;
                            if (this.onMessageCallback) this.onMessageCallback(data);
                        });
                    });

                    this.conn.on('close', () => {
                        this.peerConnected = false;
                        this._updateStatusBadge();
                    });

                    this.conn.on('error', () => {
                        this.peerConnected = false;
                    });
                } catch(e) {}
            });

            this.peer.on('error', () => {
                // Si P2P falla (normal en redes móviles con CGNAT), no pasa nada: MQTT ya maneja todo
                this.peerConnected = false;
                this._updateStatusBadge();
            });
        } catch(e) {}
    }

    _updateStatusBadge(overrideState) {
        const el = document.getElementById('remote-status');
        if (!el) return;

        if (overrideState === 'connecting' || this._connecting) {
            el.textContent = '⏳ Conectando...';
            el.className = 'badge bg-yellow-500/20 text-yellow-300 border border-yellow-500/40';
            return;
        }
        if (overrideState === 'reconnecting') {
            el.textContent = '🔄 Reconectando...';
            el.className = 'badge bg-yellow-500/20 text-yellow-300 border border-yellow-500/40';
            return;
        }

        if (this.mqttConnected && this.peerConnected) {
            el.textContent = '✅ Conectado (Nube 4G/5G + P2P)';
            el.className = 'badge bg-emerald-500/20 text-emerald-300 border border-emerald-500/40';
        } else if (this.mqttConnected) {
            el.textContent = '✅ Conectado por Nube (4G/5G)';
            el.className = 'badge bg-emerald-500/20 text-emerald-300 border border-emerald-500/40';
        } else if (this.peerConnected) {
            el.textContent = '✅ Conectado (P2P Local)';
            el.className = 'badge bg-blue-500/20 text-blue-300 border border-blue-500/40';
        } else {
            el.textContent = '❌ Desconectado';
            el.className = 'badge bg-red-500/20 text-red-300 border border-red-500/40';
        }
    }

    // ── Ventana modal de conexión con QR para el Display ────────────────
    showRoomIdOnScreen(id) {
        let idContainer = document.getElementById('peer-id-display');
        if (!idContainer) {
            idContainer = document.createElement('div');
            idContainer.id = 'peer-id-display';
            idContainer.style.position = 'fixed';
            idContainer.style.top = '24px';
            idContainer.style.left = '24px';
            idContainer.style.background = 'rgba(10, 15, 29, 0.95)';
            idContainer.style.color = '#fff';
            idContainer.style.padding = '22px 24px';
            idContainer.style.borderRadius = '18px';
            idContainer.style.fontFamily = "'Lexend', sans-serif";
            idContainer.style.zIndex = '99999';
            idContainer.style.display = 'flex';
            idContainer.style.flexDirection = 'column';
            idContainer.style.alignItems = 'center';
            idContainer.style.gap = '14px';
            idContainer.style.boxShadow = '0 25px 60px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.12)';
            idContainer.style.backdropFilter = 'blur(12px)';
            idContainer.style.maxWidth = '300px';
            document.body.appendChild(idContainer);
        }

        // Si se ejecuta en localhost o red interna privada, el QR debe apuntar a la URL pública en Render
        // para que cualquier teléfono con datos móviles 4G/5G pueda cargar el panel de control.
        const isLocalHost = window.location.hostname === 'localhost' || 
                            window.location.hostname === '127.0.0.1' || 
                            window.location.hostname === '' ||
                            window.location.protocol === 'file:' ||
                            window.location.hostname.startsWith('192.168.') ||
                            window.location.hostname.startsWith('10.');

        let targetUrl;
        if (isLocalHost) {
            targetUrl = `https://precioled.onrender.com/index.html?room=${encodeURIComponent(id)}`;
        } else {
            const u = new URL(window.location.href);
            u.pathname = u.pathname.replace('display.html', 'index.html');
            u.searchParams.set('room', id);
            targetUrl = u.toString();
        }

        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(targetUrl)}&bgcolor=ffffff&color=0a0f1d&margin=1`;

        idContainer.innerHTML = `
            <button onclick="this.parentElement.style.display='none'" style="position:absolute; top:10px; right:14px; background:none; border:none; color:#94a3b8; font-size:1.6rem; cursor:pointer; line-height:1;" title="Cerrar">&times;</button>
            
            <div style="display:flex; align-items:center; gap:8px;">
                <span style="font-size:1.1rem;">📱</span>
                <span style="font-size: 0.95rem; font-weight: 800; letter-spacing: 0.05em; color: #f6ee36; text-transform: uppercase;">
                    CONTROL REMOTO
                </span>
            </div>

            <div style="background: white; padding: 10px; border-radius: 14px; box-shadow: 0 8px 20px rgba(0,0,0,0.4);">
                <img src="${qrUrl}" alt="QR Control Remoto" style="width: 170px; height: 170px; display: block; border-radius: 6px;">
            </div>

            <div style="text-align: center; width: 100%;">
                <div style="font-size: 0.75rem; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">ID DE SALA</div>
                <div style="font-size: 1.65rem; font-weight: 900; font-family: monospace; letter-spacing: 2px; color: #38bdf8; text-shadow: 0 0 15px rgba(56,189,248,0.4);">${id}</div>
            </div>

            <div style="display:flex; align-items:center; gap:6px; background:rgba(34,197,94,0.15); border:1px solid rgba(34,197,94,0.3); border-radius:8px; padding:6px 12px; font-size:0.75rem; color:#86efac; text-align:center;">
                <span>🌐</span> <strong>Conexión Nube Activa (4G/5G)</strong>
            </div>

            <div style="font-size: 0.72rem; color: #cbd5e1; text-align: center; line-height: 1.35;">
                Escanea con cualquier móvil con datos 4G/5G o abre <strong>precioled.onrender.com</strong> e introduce el ID.
            </div>
        `;

        // Configurar el indicador en la esquina inferior izquierda para reabrir el QR si se cierra
        const debugEl = document.getElementById('debug-host-id');
        if (debugEl) {
            debugEl.textContent = `📶 Sala: ${id} (Haz clic para mostrar QR)`;
            debugEl.style.color = 'rgba(255,255,255,0.6)';
            debugEl.style.cursor = 'pointer';
            debugEl.style.padding = '4px 8px';
            debugEl.style.background = 'rgba(0,0,0,0.5)';
            debugEl.style.borderRadius = '4px';
            debugEl.onclick = () => {
                idContainer.style.display = 'flex';
            };
        }

        // Auto-ocultar si el partido ya está en curso y corriendo
        setTimeout(() => {
            if (matchState && matchState.fields && matchState.fields[1]) {
                if (matchState.fields[1].timerRunning) {
                    idContainer.style.display = 'none';
                }
            }
        }, 15000);
    }
}

// Instancia global
const syncManager = new SyncManager(window.location.pathname.includes('display') ? 'display' : 'control');
window.syncManager = syncManager;

function loadState() {
    try {
        const saved = localStorage.getItem('marcador-led-state');
        if (saved) {
            matchState = JSON.parse(saved);
        }
    } catch(e) {}
}

function broadcastState() {
    try {
        localStorage.setItem('marcador-led-state', JSON.stringify(matchState));
    } catch(e) {}
    
    syncManager.sendMessage({
        type: 'state-update',
        state: matchState
    });
}
