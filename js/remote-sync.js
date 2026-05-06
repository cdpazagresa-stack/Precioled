// remote-sync.js - Maneja la sincronización vía BroadcastChannel (local) y PeerJS (remoto)

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
        this.localChannel = null;
        try {
            this.localChannel = new BroadcastChannel('marcador-sync');
        } catch(e) {}
        this.peer = null;
        this.conn = null;
        this.onMessageCallback = null;
        this.roomId = null;

        // Escuchar mensajes locales
        if (this.localChannel) {
            this.localChannel.onmessage = (event) => {
                if (this.onMessageCallback) {
                    this.onMessageCallback(event.data);
                }
            };
        }
    }

    onMessage(callback) {
        this.onMessageCallback = callback;
    }

    sendMessage(data) {
        // Enviar por local siempre
        if (this.localChannel) {
            this.localChannel.postMessage(data);
        }

        // Enviar por remoto si está conectado
        if (this.conn && this.conn.open) {
            this.conn.send(data);
        }
    }

    // Funciones específicas para Display (Host)
    initHost(roomIdPrefix = 'SALA-') {
        const randomId = Math.floor(1000 + Math.random() * 9000);
        this.roomId = `${roomIdPrefix}${randomId}`;

        this.peer = new Peer(this.roomId, {
            debug: 2
        });

        this.peer.on('open', (id) => {
            console.log('PeerJS Host iniciado con ID:', id);
            this.showRoomIdOnScreen(id);
        });

        this.peer.on('connection', (conn) => {
            console.log('Nueva conexión remota recibida');
            this.conn = conn;
            
            // Enviar el estado actual cuando un cliente se conecta
            setTimeout(() => {
                this.conn.send({ type: 'FULL_STATE', payload: matchState });
            }, 500);

            conn.on('data', (data) => {
                console.log('Datos remotos recibidos:', data);
                if (this.onMessageCallback) {
                    this.onMessageCallback(data);
                }
                // Si somos display, pasamos los datos al control local también
                if (this.localChannel) {
                    this.localChannel.postMessage(data);
                }
            });
            
            conn.on('close', () => {
                console.log('Conexión cerrada');
            });
        });
        
        this.peer.on('error', (err) => {
            console.error('PeerJS Host Error:', err);
        });
    }

    // Funciones específicas para Control (Cliente)
    connectToHost(roomId) {
        if (!this.peer) {
            this.peer = new Peer({ debug: 2 });
            
            this.peer.on('open', () => {
                this._connect(roomId);
            });
            
            this.peer.on('error', (err) => {
                console.error('PeerJS Client Error:', err);
                alert('Error de conexión remota: ' + err.message);
                document.getElementById('remote-status').textContent = '❌ Desconectado';
                document.getElementById('remote-status').className = 'badge bg-red-100 text-red-800';
            });
        } else {
            this._connect(roomId);
        }
    }

    _connect(roomId) {
        console.log('Conectando a:', roomId);
        document.getElementById('remote-status').textContent = '⏳ Conectando...';
        this.conn = this.peer.connect(roomId, { reliable: true });

        this.conn.on('open', () => {
            console.log('Conectado remotamente con éxito a:', roomId);
            const statusEl = document.getElementById('remote-status');
            statusEl.textContent = '✅ Conectado a ' + roomId;
            statusEl.className = 'badge bg-green-100 text-green-800';
            
            this.conn.on('data', (data) => {
                console.log('Datos recibidos del Host:', data);
                if (this.onMessageCallback) {
                    this.onMessageCallback(data);
                }
            });
        });

        this.conn.on('close', () => {
            console.log('Conexión con Host cerrada');
            const statusEl = document.getElementById('remote-status');
            statusEl.textContent = '❌ Desconectado';
            statusEl.className = 'badge bg-red-100 text-red-800';
        });
    }

    showRoomIdOnScreen(id) {
        // Busca si hay un contenedor para mostrar el ID, si no lo crea
        let idContainer = document.getElementById('peer-id-display');
        if (!idContainer) {
            idContainer = document.createElement('div');
            idContainer.id = 'peer-id-display';
            idContainer.style.position = 'absolute';
            idContainer.style.top = '20px';
            idContainer.style.left = '20px';
            idContainer.style.background = 'rgba(0, 0, 0, 0.85)';
            idContainer.style.color = '#fff';
            idContainer.style.padding = '20px';
            idContainer.style.borderRadius = '12px';
            idContainer.style.fontFamily = 'monospace';
            idContainer.style.zIndex = '9999';
            idContainer.style.display = 'flex';
            idContainer.style.flexDirection = 'column';
            idContainer.style.alignItems = 'center';
            idContainer.style.gap = '15px';
            idContainer.style.boxShadow = '0 10px 25px rgba(0,0,0,0.5)';
            idContainer.style.border = '1px solid rgba(255,255,255,0.1)';
            document.body.appendChild(idContainer);
        }
        
        // Generate connection URL
        const controlUrl = new URL(window.location.href);
        controlUrl.pathname = controlUrl.pathname.replace('display.html', 'index.html');
        controlUrl.searchParams.set('room', id);
        
        // API de QRServer
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(controlUrl.toString())}&bgcolor=000000&color=ffffff&margin=0`;

        idContainer.innerHTML = `
            <button onclick="this.parentElement.style.display='none'" style="position:absolute; top:5px; right:10px; background:none; border:none; color:white; font-size:1.5rem; cursor:pointer;">&times;</button>
            <div style="font-size: 1.2rem; font-weight: bold; font-family: 'Lexend', sans-serif;">CONTROL REMOTO</div>
            <img src="${qrUrl}" alt="QR Code" style="width: 150px; height: 150px; border-radius: 4px;">
            <div style="font-size: 1.5rem; letter-spacing: 2px;">
                ID: <strong style="color:#f6ee36">${id}</strong>
            </div>
            <div style="font-size: 0.8rem; color: #aaa; text-align: center; max-width: 150px; line-height: 1.2;">
                Escanea el QR o introduce el ID en el panel de control
            </div>
        `;
        
        // Auto-hide if match starts
        setInterval(() => {
            if (matchState && matchState.fields && matchState.fields[1]) {
                if (matchState.fields[1].timerRunning || matchState.fields[1].timerSeconds > 0 || matchState.fields[1].homeScore > 0 || matchState.fields[1].awayScore > 0) {
                    idContainer.style.display = 'none';
                }
            }
        }, 2000);
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
