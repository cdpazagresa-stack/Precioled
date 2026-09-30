/* ============================================================
   CONTROL.JS — Panel de Control Logic
   ============================================================ */

let activeField = 1;
let pendingGoalTeam = null;

function hapticFeedback(pattern = 20) {
    if (navigator.vibrate) {
        navigator.vibrate(pattern);
    }
}

function initControlPanel() {
    loadState();
    updateControlUI();
    loadSavedRosters();
    initCDPAPlayersUI();
    
    // Listen for state changes from display
    if (window.syncManager) {
        window.syncManager.onMessage((data) => {
            if (data.type === 'FULL_STATE') {
                matchState = data.payload;
                updateControlUI();
                matchTimer.syncFromState();
                updateTimerUI();
            } else if (data.type === 'state-update') {
                matchState = data.state;
                updateControlUI();
                matchTimer.syncFromState();
                updateTimerUI();
            }
        });
    }
    
    // Timer tick
    matchTimer.onTick(() => updateTimerUI());
    matchTimer.onAlarm((fieldNum) => {
        if (document.getElementById('alarm-toggle').checked) {
            playAlarm();
        }
        showToast('⏰ ¡Tiempo finalizado!', 'success');
    });
    matchTimer.syncFromState();
    
    // Inicializar patrocinadores representativos si la lista está vacía
    if (!matchState.sponsorLogos || matchState.sponsorLogos.length === 0) {
        matchState.sponsorLogos = [
            { id: '1', name: 'CAJA RURAL DE NAVARRA', logoUrl: '' },
            { id: '2', name: 'CONSERVAS AZAGRA', logoUrl: '' },
            { id: '3', name: 'BODEGAS MANZANOS', logoUrl: '' },
            { id: '4', name: 'AYUNTAMIENTO DE AZAGRA', logoUrl: '' }
        ];
    }
    renderSponsorLogosList();
    
    // Close team search on outside click
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.team-selector')) {
            document.querySelectorAll('.team-results').forEach(el => el.classList.remove('visible'));
        }
    });

    // Auto-connect if room parameter is present in URL query
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('room');
    if (roomParam) {
        const peerInput = document.getElementById('peer-id-input');
        if (peerInput) {
            peerInput.value = roomParam;
        }
        setTimeout(() => {
            connectRemote();
        }, 1000);
    }
}

// ── PeerJS Conexión ──────────────────────────────────────────
function connectRemote() {
    const roomId = document.getElementById('peer-id-input').value.trim();
    if (roomId) {
        syncManager.connectToHost(roomId);
    } else {
        alert("Introduce un código de sala válido");
    }
}

// ── Field accessor ──────────────────────────────────────────
function F() { return matchState.fields[activeField]; }

// ── Mode ────────────────────────────────────────────────────
function setMode(mode) {
    matchState.mode = mode;
    document.getElementById('mode-single').classList.toggle('active', mode === 'single');
    document.getElementById('mode-dual').classList.toggle('active', mode === 'dual');
    document.getElementById('field-tabs-container').style.display = mode === 'dual' ? 'block' : 'none';
    
    const tournamentBtn = document.getElementById('mode-tournament');
    if (tournamentBtn) {
        tournamentBtn.style.display = 'inline-flex';
    }
    
    broadcastState();
}

function startTournamentCountdown() {
    matchState.showTournamentCountdown = true;
    broadcastState();
    showToast('Iniciando cuenta regresiva de Torneo', 'success');
    
    // Auto-hide after 6.5 seconds (allowing 5s countdown + animation)
    setTimeout(() => {
        matchState.showTournamentCountdown = false;
        broadcastState();
    }, 6500);

    // Iniciar temporizador automáticamente a los 5 segundos (cuando la cuenta atrás llegue a 0 / "GO!")
    setTimeout(() => {
        const field = matchState.fields[activeField];
        if (field && !field.timerRunning) {
            matchTimer.start(activeField);
            updateTimerUI();
        }
    }, 5000);
}

function switchField(num) {
    activeField = num;
    document.querySelectorAll('[data-field]').forEach(t => t.classList.toggle('active', t.dataset.field == num));
    updateControlUI();
}

// ── Score ────────────────────────────────────────────────────
function changeScore(team, delta) {
    const f = F();
    const key = team === 'home' ? 'homeScore' : 'awayScore';
    
    if (delta > 0) {
        // Open modal to select player
        openGoalModal(team);
    } else {
        // Simplificado y corregido para restar gol correctamente
        f[key] = Math.max(0, f[key] + delta);
        hapticFeedback(20);
        broadcastState();
        updateControlUI();
    }
}

// ── Timer ────────────────────────────────────────────────────
function toggleTimer() {
    matchTimer.toggle(activeField);
    hapticFeedback(30);
    updateTimerUI();
}

function resetClockToZero() {
    matchTimer.reset(activeField);
    hapticFeedback(20);
    updateTimerUI();
    broadcastState();
    showToast('Tiempo restablecido a 00:00', 'info');
}

function resetTimer() {
    if (!confirm('¿Reiniciar tiempo y borrar la lista de goleadores?')) return;
    matchTimer.reset(activeField);
    const f = F();
    f.homeScorers = [];
    f.awayScorers = [];
    hapticFeedback([20, 20, 20]);
    broadcastState();
    updateTimerUI();
    renderScorers();
    showToast('Tiempo y goleadores reiniciados', 'success');
}

function updateTimerDuration() {
    const mins = parseInt(document.getElementById('timer-duration').value) || 40;
    matchTimer.setDuration(mins, activeField);
    showToast(`Duración de parte fijada a ${mins} min`, 'info');
}

function adjustTime(seconds) {
    matchTimer.adjust(seconds, activeField);
    hapticFeedback(20);
    updateTimerUI();
}

function setManualTime() {
    const mins = parseInt(document.getElementById('manual-min').value) || 0;
    const secs = parseInt(document.getElementById('manual-sec').value) || 0;
    const totalSeconds = (mins * 60) + secs;
    matchTimer.setManualTime(totalSeconds, activeField);
    hapticFeedback(20);
    updateTimerUI();
    showToast(`Tiempo manual fijado a ${matchTimer.format(totalSeconds)}`, 'info');
}

function updateTimerUI() {
    const elapsed = matchTimer.getElapsed(activeField);
    const formatted = matchTimer.format(elapsed);
    const timerEl = document.getElementById('ctrl-timer');
    if (timerEl) timerEl.textContent = formatted;
    
    const btn = document.getElementById('timer-play-btn');
    if (btn) {
        const running = F().timerRunning;
        btn.innerHTML = running ? '⏸ Pausar' : '▶️ Iniciar';
        btn.classList.toggle('btn-success', !running);
        btn.classList.toggle('btn-danger', running);
    }
    
    // Chequear disparo automático de patrocinadores con el tiempo de juego
    if (F().timerRunning) {
        checkSponsorAutoTrigger(elapsed);
    }
}

function setPeriod(el) {
    const period = el.dataset.period;
    const f = F();
    f.period = period;
    document.querySelectorAll('.period-btn').forEach(b => b.classList.toggle('active', b.dataset.period === period));
    
    const maxSec = f.timerMaxSeconds || 2400;
    // Period accumulation via matchTimer API (soporte 4 partes F7/F8 y 2 partes F11)
    if (period === '1ª PARTE') {
        matchTimer.setBaseForPeriod(0, activeField);
    } else if (period === '2ª PARTE') {
        matchTimer.setBaseForPeriod(maxSec, activeField);
    } else if (period === '3ª PARTE') {
        matchTimer.setBaseForPeriod(maxSec * 2, activeField);
    } else if (period === '4ª PARTE') {
        matchTimer.setBaseForPeriod(maxSec * 3, activeField);
    }

    if (period === 'DESCANSO' || period === 'FINAL') {
        matchTimer.pause(activeField);
        f.status = period === 'FINAL' ? 'finished' : 'halftime';
        
        // Auto-salto de patrocinador a pantalla completa en descanso / final
        if (matchState.sponsorConfig?.autoHalftime !== false && matchState.sponsorConfig?.autoSync) {
            setTimeout(() => {
                triggerNextSponsorFullscreen();
            }, 800);
        }
    } else {
        f.status = f.timerRunning ? 'live' : 'pre_match';
    }
    
    hapticFeedback(25);
    broadcastState();
    updateStatusBadge();
    updateTimerUI();
}

function setTimerDirection(direction) {
    const f = F();
    // Detener el cronómetro si está corriendo antes de cambiar dirección
    if (f.timerRunning) {
        matchTimer.pause(activeField);
    }
    f.timerDirection = direction;
    // Resetear segundos acumulados para evitar estados residuales del modo anterior
    f.timerSeconds = 0;
    f.timerStartTimestamp = null;
    hapticFeedback(20);
    broadcastState();
    updateTimerUI();
    updateControlUI();
}

function setAddedTime(minutes) {
    const f = F();
    const val = parseInt(minutes) || 0;
    f.addedTimeMinutes = val;
    f.addedTime = val; // Sync both fields for display compatibility
    broadcastState();
}

function toggleAddedTime() {
    const f = F();
    f.showAddedTime = !f.showAddedTime;
    // If hiding, also clear the added time value
    if (!f.showAddedTime) {
        f.addedTime = 0;
        f.addedTimeMinutes = 0;
    }
    hapticFeedback(30);
    broadcastState();
    updateControlUI();
}

function updateStatusBadge() {
    const badge = document.getElementById('match-status-badge');
    if (!badge) return;
    const s = F().status;
    const map = { pre_match: 'Pre-Partido', live: '🔴 EN VIVO', halftime: 'Descanso', finished: 'Finalizado' };
    badge.textContent = map[s] || s;
}

// ── Scorers ─────────────────────────────────────────────────
function addScorer(team) {
    const nameInput = document.getElementById(`${team}-scorer-name`);
    const minInput = document.getElementById(`${team}-scorer-min`);
    const name = nameInput.value.trim();
    const minute = parseInt(minInput.value) || Math.floor(matchTimer.getElapsed(activeField) / 60) || 1;
    
    if (!name) { showToast('Introduce el nombre del jugador', 'error'); return; }
    
    const key = team === 'home' ? 'homeScorers' : 'awayScorers';
    F()[key].push({ name, minute });
    F()[key].sort((a, b) => a.minute - b.minute);
    
    // Log event if not already logged (e.g. if just adding manually)
    logMatchEvent('GOAL_DETAIL', { team, player: name, minute });
    
    nameInput.value = '';
    minInput.value = '';
    hapticFeedback(40);
    broadcastState();
    renderScorers();
}

function removeScorer(team, index) {
    const key = team === 'home' ? 'homeScorers' : 'awayScorers';
    F()[key].splice(index, 1);
    broadcastState();
    renderScorers();
}

function renderScorers() {
    ['home', 'away'].forEach(team => {
        const key = team === 'home' ? 'homeScorers' : 'awayScorers';
        const list = document.getElementById(`${team}-scorer-list`);
        if (!list) return;
        list.innerHTML = F()[key].map((s, i) => `
            <div class="scorer-item">
                <span>⚽ ${s.minute}' — ${s.name}</span>
                <button class="scorer-remove" onclick="removeScorer('${team}', ${i})">✕</button>
            </div>
        `).join('');
    });
}

// ── Cards ───────────────────────────────────────────────────
function changeCard(team, color, delta) {
    const key = `${team}${color === 'yellow' ? 'Yellows' : 'Reds'}`;
    F()[key] = Math.max(0, F()[key] + delta);
    
    if (delta > 0) {
        logMatchEvent('CARD', { team, color });
    }
    
    hapticFeedback(delta > 0 ? 30 : 15);
    broadcastState();
    updateControlUI();
}

// ── Teams ───────────────────────────────────────────────────
function searchTeam(side, query) {
    const results = searchTeams(query);
    const container = document.getElementById(`${side}-team-results`);
    if (!container) return;
    
    if (results.length === 0 && query.length >= 2) {
        container.innerHTML = `
            <div class="team-result-item" onclick="selectCustomTeam('${side}', '${query.replace(/'/g, "\\'")}')">
                <span style="font-size:0.75rem; color:var(--text-muted)">Usar: <strong>${query}</strong></span>
            </div>`;
        container.classList.add('visible');
        return;
    }
    
    container.innerHTML = results.map(t => `
        <div class="team-result-item" onclick="selectTeam('${side}', ${t.id}, '${t.name.replace(/'/g, "\\'")}', '${t.badgeUrl.replace(/'/g, "\\'")}')">
            <img src="${t.badgeUrl}" alt="" onerror="this.src='${getDefaultBadgeSVG(t.short)}'">
            <span>${t.name}</span>
        </div>
    `).join('');
    container.classList.add('visible');
}

function showTeamResults(side) {
    const input = document.getElementById(`${side}-team-search`);
    if (input && input.value.length >= 2) searchTeam(side, input.value);
}

function selectTeam(side, id, name, badgeUrl) {
    const f = F();
    if (side === 'home') {
        f.homeName = name; f.homeBadge = badgeUrl;
    } else {
        f.awayName = name; f.awayBadge = badgeUrl;
    }
    document.getElementById(`${side}-team-results`).classList.remove('visible');
    document.getElementById(`${side}-team-search`).value = '';
    broadcastState();
    updateTeamDisplay(side, name, badgeUrl);
}

function selectCustomTeam(side, name) {
    const team = createCustomTeam(name);
    selectTeam(side, null, team.name, team.badgeUrl);
}

function clearTeam(side) {
    const f = F();
    if (side === 'home') { f.homeName = 'EQUIPO LOCAL'; f.homeBadge = ''; }
    else { f.awayName = 'EQUIPO VISITANTE'; f.awayBadge = ''; }
    document.getElementById(`${side}-team-selected`).style.display = 'none';
    broadcastState();
    updateControlUI();
}

function updateTeamDisplay(side, name, badgeUrl) {
    const sel = document.getElementById(`${side}-team-selected`);
    const badge = document.getElementById(`ctrl-${side}-badge`);
    const nameEl = document.getElementById(`ctrl-${side}-name`);
    if (sel && badge && nameEl) {
        badge.src = badgeUrl || getDefaultBadgeSVG(name);
        badge.onerror = function() { this.src = getDefaultBadgeSVG(name); };
        nameEl.textContent = name;
        sel.style.display = 'flex';
    }
}

// ── Coaches & Refs ──────────────────────────────────────────
function updateCoach(side, value) {
    const f = F();
    if (side === 'home') f.homeCoach = value;
    else f.awayCoach = value;
    broadcastState();
}

function updateReferees() {
    F().referees = {
        main: document.getElementById('ref-main').value,
        as1: document.getElementById('ref-as1').value,
        as2: document.getElementById('ref-as2').value
    };
    broadcastState();
}

function changeFoul(side, delta) {
    const key = side === 'home' ? 'homeFouls' : 'awayFouls';
    F()[key] = Math.max(0, F()[key] + delta);
    hapticFeedback(delta > 0 ? 30 : 15);
    broadcastState();
    updateControlUI();
}

// ── Sponsors ────────────────────────────────────────────────
function addSponsorEntry() {
    const list = document.getElementById('sponsor-list');
    const div = document.createElement('div');
    div.className = 'sponsor-entry';
    div.innerHTML = `
        <select class="form-input" style="flex:0 0 120px; padding:0.5rem">
            <option>Patrocina</option><option>Colabora</option><option>Con el apoyo de</option>
        </select>
        <input type="text" class="form-input sponsor-name-input" placeholder="Nombre del patrocinador">
        <button class="btn btn-danger" style="padding:0.4rem 0.6rem" onclick="removeSponsor(this)">✕</button>`;
    list.appendChild(div);
}

function removeSponsor(btn) { btn.closest('.sponsor-entry').remove(); }

function updateSponsors() {
    const entries = document.querySelectorAll('.sponsor-entry');
    matchState.sponsors = Array.from(entries).map(e => ({
        prefix: e.querySelector('select').value,
        name: e.querySelector('.sponsor-name-input').value
    })).filter(s => s.name.trim());
    broadcastState();
    showToast('Patrocinadores actualizados', 'success');
}

// ── Messages ────────────────────────────────────────────────
function sendMessage() {
    const msg = document.getElementById('extra-msg-input').value.trim();
    F().extraMessage = msg;
    broadcastState();
    if (msg) showToast('Mensaje enviado a pantalla', 'success');
}

function clearMessage() {
    F().extraMessage = '';
    document.getElementById('extra-msg-input').value = '';
    broadcastState();
}

// ── Goal Modal Logic ────────────────────────────────────────
function openGoalModal(team) {
    pendingGoalTeam = team;
    const f = F();
    const roster = team === 'home' ? f.homeRoster : f.awayRoster;
    const list = document.getElementById('modal-player-list');
    const modal = document.getElementById('goal-modal');
    if (!list || !modal) return;

    let html = '';
    if (roster && roster.length > 0) {
        html += `<div class="col-span-full text-xs text-cdpa-yellow font-black uppercase tracking-wider mb-1">Alineación Convocada:</div>`;
        html += roster.map(p => `
            <div class="player-btn" onclick="confirmGoalScorer('${p.name.replace(/'/g, "\\'")}')">
                <span class="player-num">${p.number}</span>
                <span class="player-name">${p.name}</span>
            </div>
        `).join('');
    } else {
        html += `
            <div class="col-span-full p-2 text-center text-white/60 italic text-xs">
                No hay plantilla asignada a este equipo. Selecciona abajo o introduce un nombre:
            </div>
        `;
    }

    // Direct search in CDPA Database (368 players) + Manual
    html += `
        <div class="col-span-full pt-3 mt-2 border-t border-white/10 space-y-2">
            <div class="text-[11px] text-cdpa-yellow font-black uppercase">🔍 Buscar en Base de Datos del Club (368 jugadores):</div>
            <div class="relative">
                <input type="text" id="modal-cdpa-search" class="form-input text-xs w-full py-1.5 pl-2.5 pr-8 bg-black/60 text-white rounded-lg border border-white/10" placeholder="Escribe el nombre del goleador..." oninput="filterModalCDPAPlayers()">
                <span class="absolute right-2 top-1.5 text-xs opacity-50">🔍</span>
            </div>
            <div id="modal-cdpa-results" class="max-h-28 overflow-y-auto space-y-1"></div>
            
            <div class="pt-2 border-t border-white/5 flex gap-2">
                <input type="text" id="manual-scorer-name" class="form-input text-xs flex-1" placeholder="O escribir nombre a mano...">
                <button class="btn btn-primary text-xs px-3 py-1 font-bold" onclick="confirmManualGoalScorer()">Fijar</button>
            </div>
        </div>
    `;

    list.innerHTML = html;
    modal.style.display = 'flex';
}

function filterModalCDPAPlayers() {
    const input = document.getElementById('modal-cdpa-search');
    const res = document.getElementById('modal-cdpa-results');
    if (!input || !res) return;
    const q = input.value.trim().toLowerCase();
    if (!q || q.length < 2) {
        res.innerHTML = '';
        return;
    }
    const players = typeof window.findCDPAPlayers === 'function' ? window.findCDPAPlayers(q) : [];
    if (players.length === 0) {
        res.innerHTML = '<div class="text-[10px] text-gray-400 italic p-1">No se encontró ningún jugador en la BD</div>';
        return;
    }
    res.innerHTML = players.slice(0, 10).map(p => `
        <div class="flex items-center justify-between p-1.5 bg-black/40 hover:bg-cdpa-yellow/20 rounded cursor-pointer text-xs" onclick="confirmGoalScorer('${p.fullName.replace(/'/g, "\\'")}')">
            <span class="font-bold text-white">${p.fullName}</span>
            <span class="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-cdpa-yellow">${p.category || ''}</span>
        </div>
    `).join('');
}

function closeGoalModal() {
    document.getElementById('goal-modal').style.display = 'none';
    pendingGoalTeam = null;
}

function confirmGoalScorer(playerName) {
    const team = pendingGoalTeam;
    if (!team) return;
    
    const f = F();
    const roster = team === 'home' ? f.homeRoster : f.awayRoster;
    const player = roster && roster.find(p => p.name === playerName);
    const photo = player ? player.photo : '';

    const key = team === 'home' ? 'homeScore' : 'awayScore';
    f[key]++;
    
    const minute = Math.floor(matchTimer.getElapsed(activeField) / 60) || 1;
    const scorersKey = team === 'home' ? 'homeScorers' : 'awayScorers';
    f[scorersKey].push({ name: playerName, minute });
    f[scorersKey].sort((a, b) => a.minute - b.minute);
    
    // Trigger animation
    f.showGoalAnimation = true;
    f.goalTeam = team;
    f.goalScorerName = playerName;
    f.goalScorerPhoto = photo;
    
    logMatchEvent('GOAL_DETAIL', { team, player: playerName, minute });
    
    hapticFeedback([30, 50, 30]);
    broadcastState();
    updateControlUI();
    closeGoalModal();
    
    setTimeout(() => { 
        F().showGoalAnimation = false; 
        broadcastState(); 
    }, 4000);
}

function confirmManualGoalScorer() {
    const name = document.getElementById('manual-scorer-name').value.trim();
    if (!name) { showToast('Introduce un nombre', 'error'); return; }
    confirmGoalScorer(name);
}

function confirmGoalWithoutPlayer() {
    const team = pendingGoalTeam;
    if (!team) return;
    
    const f = F();
    const key = team === 'home' ? 'homeScore' : 'awayScore';
    f[key]++;
    
    // Trigger animation without name
    f.showGoalAnimation = true;
    f.goalTeam = team;
    f.goalScorerName = '';
    f.goalScorerPhoto = '';
    
    logMatchEvent('GOAL', { team });
    
    hapticFeedback([30, 50, 30]);
    broadcastState();
    updateControlUI();
    closeGoalModal();
    
    setTimeout(() => { 
        F().showGoalAnimation = false; 
        broadcastState(); 
    }, 4000);
}

// ── Goal Animation ──────────────────────────────────────────
function triggerGoalAnimation(team) {
    F().showGoalAnimation = true;
    F().goalTeam = team;
    F().goalScorerName = '';
    F().goalScorerPhoto = '';
    broadcastState();
    setTimeout(() => { F().showGoalAnimation = false; broadcastState(); }, 3500);
}

// ── Reset Match ─────────────────────────────────────────────
function resetMatch() {
    if (!confirm('¿Resetear todo el partido? Se perderán los datos actuales.')) return;
    const f = F();
    f.homeScore = 0; f.awayScore = 0;
    f.homeYellows = 0; f.homeReds = 0;
    f.awayYellows = 0; f.awayReds = 0;
    f.homeFouls = 0; f.awayFouls = 0;
    f.homeScorers = []; f.awayScorers = [];
    f.homeRoster = []; f.awayRoster = [];
    f.matchEvents = [];
    f.period = '1ª PARTE'; f.status = 'pre_match';
    f.extraMessage = '';
    matchTimer.reset(activeField);
    
    // Clear UI inputs
    ['home','away'].forEach(s => {
        const ci = document.getElementById(`${s}-coach-input`);
        if (ci) ci.value = '';
    });
    
    broadcastState();
    updateControlUI();
    showToast('Partido reseteado', 'success');
}

// ── Display Window ──────────────────────────────────────────
function openDisplay() {
    window.open('display.html', 'marcador-led-display', 'width=1280,height=720');
}

// ── Roster Management ───────────────────────────────────────
let currentRoster = [];

function addRosterPlayer() {
    const dorsal = document.getElementById('roster-dorsal').value;
    const name = document.getElementById('roster-player-name').value.trim();
    const photo = document.getElementById('roster-player-photo').value.trim();
    if (!name) { showToast('Introduce el nombre', 'error'); return; }
    currentRoster.push({ number: dorsal || '-', name, photo });
    document.getElementById('roster-dorsal').value = '';
    document.getElementById('roster-player-name').value = '';
    document.getElementById('roster-player-photo').value = '';
    renderRosterPlayers();
}

function removeRosterPlayer(i) { currentRoster.splice(i, 1); renderRosterPlayers(); }

function renderRosterPlayers() {
    const grid = document.getElementById('roster-players');
    if (!grid) return;
    grid.innerHTML = currentRoster.map((p, i) => `
        <div class="roster-player flex items-center gap-2">
            <span class="player-number">${p.number}</span>
            ${p.photo ? `<img src="${p.photo}" class="w-6 h-6 object-cover rounded-full" alt="foto">` : ''}
            <span style="flex:1">${p.name}</span>
            <button class="scorer-remove" onclick="removeRosterPlayer(${i})">✕</button>
        </div>
    `).join('');
}

function importRosterFromFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            
            const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            if (json.length === 0) {
                showToast('El archivo está vacío', 'error');
                return;
            }

            const newPlayers = [];
            let coachName = '';
            
            // Identify column mapping
            let nameCol = -1;
            let numCol = -1;
            let photoCol = -1;
            let startRow = 0;

            // Try to find header row in the first 5 rows
            for (let i = 0; i < Math.min(5, json.length); i++) {
                const row = json[i];
                if (!row) continue;
                
                row.forEach((cell, idx) => {
                    if (!cell) return;
                    const val = cell.toString().toLowerCase();
                    if (val.includes('nombre') || val.includes('jugador') || val.includes('player')) nameCol = idx;
                    if (val.includes('dorsal') || val.includes('nº') || val.includes('number') || val.includes('#')) numCol = idx;
                    if (val.includes('foto') || val.includes('photo') || val.includes('imagen')) photoCol = idx;
                });

                if (nameCol !== -1) {
                    startRow = i + 1;
                    break;
                }
            }

            // Fallback if no headers found
            if (nameCol === -1) {
                nameCol = 1; // Assume 2nd column
                numCol = 0;  // Assume 1st column
                photoCol = 2; // Assume 3rd column
                startRow = 0;
            }

            json.slice(startRow).forEach((row) => {
                if (!row || row.length === 0) return;

                const rowStr = row.join(' ').toLowerCase();
                
                // Try to find coach if not already found
                if (!coachName && (rowStr.includes('entrenador') || rowStr.includes('coach'))) {
                    coachName = row[nameCol] || row[1] || row[0].split(':')[1]?.trim() || '';
                    return;
                }

                let name = row[nameCol] || '';
                let dorsal = row[numCol] !== undefined ? row[numCol] : '-';
                let foto = photoCol !== -1 && row[photoCol] ? row[photoCol] : '';

                // Data cleaning
                name = name.toString().trim();
                dorsal = dorsal.toString().trim();
                foto = foto.toString().trim();

                if (name && name !== '') {
                    // Avoid exact duplicates
                    const exists = currentRoster.some(p => p.name === name && p.number === dorsal);
                    if (!exists) {
                        newPlayers.push({
                            number: dorsal || '-',
                            name: name,
                            photo: foto
                        });
                    }
                }
            });

            if (newPlayers.length > 0) {
                currentRoster = [...currentRoster, ...newPlayers];
                if (coachName) {
                    const coachInput = document.getElementById('roster-coach-name');
                    if (coachInput) coachInput.value = coachName;
                }
                renderRosterPlayers();
                showToast(`Se han importado ${newPlayers.length} jugadores`, 'success');
            } else {
                showToast('No se encontraron nuevos jugadores válidos', 'warning');
            }
        } catch (err) {
            console.error('Import Error:', err);
            showToast('Error al procesar el archivo', 'error');
        }
        event.target.value = '';
    };
    reader.readAsArrayBuffer(file);
}

function saveRoster() {
    const name = document.getElementById('roster-team-name').value.trim();
    const coach = document.getElementById('roster-coach-name').value.trim();
    if (!name) { showToast('Introduce un nombre para la plantilla', 'error'); return; }
    if (currentRoster.length === 0) { showToast('Añade jugadores primero', 'error'); return; }
    
    saveRosterToStorage(name, currentRoster, coach);
    showToast(`Plantilla "${name}" guardada (${currentRoster.length} jugadores)`, 'success');
    loadSavedRosters();
}

function saveRosterToStorage(name, players, coach = '') {
    const rosters = loadRostersFromStorage();
    rosters[name] = { players, coach };
    localStorage.setItem('marcador-led-rosters', JSON.stringify(rosters));
}

function loadRoster(name) {
    const rosters = loadRostersFromStorage();
    if (!rosters[name]) return;
    const data = rosters[name];
    currentRoster = [...data.players];
    document.getElementById('roster-team-name').value = name;
    document.getElementById('roster-coach-name').value = data.coach || '';
    renderRosterPlayers();
    
    const homeList = document.getElementById('home-roster-list');
    const awayList = document.getElementById('away-roster-list');
    const opts = currentRoster.map(p => `<option value="${p.name}">`).join('');
    if (homeList) homeList.innerHTML = opts;
    if (awayList) awayList.innerHTML = opts;
    
    switchRosterTab('manage', document.querySelector('.tab.active'));
    showToast(`Plantilla "${name}" cargada`, 'success');

    const badge = document.getElementById('lineup-info-badge');
    if (badge) {
        badge.textContent = `Plantilla: ${name}`;
        badge.classList.remove('bg-cdpa-yellow/10', 'text-cdpa-yellow', 'border-cdpa-yellow/20');
        badge.classList.add('bg-green-500/20', 'text-green-500', 'border-green-500/40');
    }
}

function clearRosterEditor() {
    currentRoster = [];
    document.getElementById('roster-team-name').value = '';
    document.getElementById('roster-coach-name').value = '';
    renderRosterPlayers();
    showToast('Editor limpiado', 'info');
}

function assignRosterToSide(side) {
    if (currentRoster.length === 0) {
        showToast('No hay jugadores en el editor', 'error');
        return;
    }
    const f = F();
    const teamName = document.getElementById('roster-team-name').value || 'Sin nombre';
    const coachName = document.getElementById('roster-coach-name').value || '';
    
    if (side === 'home') {
        f.homeRoster = [...currentRoster];
        if (coachName) f.homeCoach = coachName;
        f.homeName = teamName;
    } else {
        f.awayRoster = [...currentRoster];
        if (coachName) f.awayCoach = coachName;
        f.awayName = teamName;
    }
    
    broadcastState();
    updateControlUI();
    showToast(`Plantilla asignada a ${side === 'home' ? 'LOCAL' : 'VISITANTE'}`, 'success');
    
    // Update datalists for scorers
    const list = document.getElementById(`${side}-roster-list`);
    if (list) {
        list.innerHTML = currentRoster.map(p => `<option value="${p.number}. ${p.name}">`).join('');
    }
}

function deleteRoster(name) {
    if (!confirm(`¿Eliminar plantilla "${name}"?`)) return;
    const rosters = loadRostersFromStorage();
    delete rosters[name];
    localStorage.setItem('marcador-led-rosters', JSON.stringify(rosters));
    loadSavedRosters();
    showToast('Plantilla eliminada', 'success');
}

function loadSavedRosters() {
    const rosters = loadRostersFromStorage();
    const list = document.getElementById('saved-rosters-list');
    if (!list) return;
    const keys = Object.keys(rosters);
    if (keys.length === 0) {
        list.innerHTML = '<div class="text-muted text-center py-4">No hay plantillas guardadas</div>';
        return;
    }
    list.innerHTML = keys.map(name => `
        <div class="saved-roster-item">
            <div style="flex:1">
                <div style="font-weight:600">${name}</div>
                <div style="font-size:0.7rem; color:var(--text-muted)">${rosters[name].players.length} jugadores</div>
            </div>
            <div style="display:flex; gap:0.5rem">
                <button class="btn btn-primary" style="padding:0.3rem 0.6rem; font-size:0.75rem" onclick="loadRoster('${name}')">Cargar</button>
                <button class="btn btn-danger" style="padding:0.3rem 0.6rem; font-size:0.75rem" onclick="deleteRoster('${name}')">✕</button>
            </div>
        </div>
    `).join('');
}

function loadRostersFromStorage() {
    try {
        const saved = localStorage.getItem('marcador-led-rosters');
        return saved ? JSON.parse(saved) : {};
    } catch(e) { return {}; }
}

function switchRosterTab(tab, el) {
    document.querySelectorAll('#roster-manage, #roster-load, #roster-cdpa').forEach(t => {
        t.classList.remove('active');
        t.classList.add('hidden');
    });
    const target = document.getElementById(`roster-${tab}`);
    if (target) {
        target.classList.add('active');
        target.classList.remove('hidden');
    }
    if (el) {
        el.closest('.tabs').querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        el.classList.add('active');
    }
    if (tab === 'cdpa') {
        initCDPAPlayersUI();
    }
}

// ── CDPA Database Management (368 Jugadores del Club) ────────
let cdpaCategoryFilter = 'TODOS';
let cdpaSearchQuery = '';

function initCDPAPlayersUI() {
    const catSelect = document.getElementById('cdpa-category-filter');
    if (catSelect && catSelect.options.length <= 1) {
        const categories = typeof window.getCDPACategories === 'function' ? window.getCDPACategories() : [];
        categories.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat;
            opt.textContent = `${cat}`;
            catSelect.appendChild(opt);
        });
    }
    filterCDPAPlayersUI();
}

function filterCDPAPlayersUI() {
    const catSelect = document.getElementById('cdpa-category-filter');
    const searchInput = document.getElementById('cdpa-search-input');
    const countBadge = document.getElementById('cdpa-count-badge');
    const listEl = document.getElementById('cdpa-players-list');
    
    if (catSelect) cdpaCategoryFilter = catSelect.value;
    if (searchInput) cdpaSearchQuery = searchInput.value;
    
    const players = typeof window.findCDPAPlayers === 'function' 
        ? window.findCDPAPlayers(cdpaSearchQuery, cdpaCategoryFilter) 
        : [];
        
    if (countBadge) {
        countBadge.textContent = `${players.length} de ${window.CDPA_DATABASE ? window.CDPA_DATABASE.length : 0} jugadores`;
    }
    
    if (!listEl) return;
    
    if (players.length === 0) {
        listEl.innerHTML = '<div class="text-gray-400 text-center py-4 text-xs italic">No se encontraron jugadores</div>';
        return;
    }
    
    listEl.innerHTML = players.map(p => {
        return `
            <div class="flex items-center justify-between p-1.5 rounded-lg bg-black/40 border border-white/5 hover:border-cdpa-yellow/30 text-xs">
                <div class="flex items-center gap-2 overflow-hidden flex-1 mr-2">
                    <span class="w-6 h-6 flex items-center justify-center rounded-full bg-white/10 text-[10px] font-bold text-cdpa-yellow shrink-0">
                        ${p.dorsal || '•'}
                    </span>
                    <div class="truncate">
                        <div class="font-bold text-white truncate text-[11px]">${p.fullName}</div>
                        <div class="text-[9px] text-gray-400 flex items-center gap-1.5">
                            <span class="px-1 rounded bg-white/5 text-cdpa-yellow">${p.category}</span>
                            <span>${p.birthYear ? p.birthYear : ''}</span>
                            ${p.dni ? `<span class="opacity-60">${p.dni}</span>` : ''}
                        </div>
                    </div>
                </div>
                <div class="flex items-center gap-1 shrink-0">
                    <button class="px-1.5 py-1 rounded bg-white/10 hover:bg-white/20 text-white text-[9px] font-bold" onclick="addCDPAPlayerToEditor('${p.id}')" title="Añadir a lista del Editor">
                        + Edit
                    </button>
                    <button class="px-1.5 py-1 rounded bg-cdpa-red/40 hover:bg-cdpa-red/60 text-red-200 text-[9px] font-bold" onclick="addCDPAPlayerDirect('${p.id}', 'home')" title="Añadir directo a Local">
                        + Loc
                    </button>
                    <button class="px-1.5 py-1 rounded bg-blue-500/20 hover:bg-blue-500/40 text-blue-200 text-[9px] font-bold" onclick="addCDPAPlayerDirect('${p.id}', 'away')" title="Añadir directo a Visitante">
                        + Vis
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function addCDPAPlayerToEditor(playerId) {
    if (!window.CDPA_DATABASE) return;
    const p = window.CDPA_DATABASE.find(x => x.id === playerId);
    if (!p) return;
    
    // Check if already in currentRoster
    if (currentRoster.some(r => r.name.toLowerCase() === p.fullName.toLowerCase())) {
        showToast(`${p.fullName} ya está en la lista`, 'warning');
        return;
    }
    
    currentRoster.push({
        number: p.dorsal || currentRoster.length + 1,
        name: p.fullName,
        photo: ''
    });
    
    renderRosterPlayers();
    showToast(`Añadido: ${p.fullName}`, 'success');
}

function addCDPAPlayerDirect(playerId, side) {
    if (!window.CDPA_DATABASE) return;
    const p = window.CDPA_DATABASE.find(x => x.id === playerId);
    if (!p) return;
    
    const f = F();
    const rosterKey = side === 'home' ? 'homeRoster' : 'awayRoster';
    if (!f[rosterKey]) f[rosterKey] = [];
    
    if (f[rosterKey].some(r => r.name.toLowerCase() === p.fullName.toLowerCase())) {
        showToast(`${p.fullName} ya está en ${side === 'home' ? 'Local' : 'Visitante'}`, 'warning');
        return;
    }
    
    f[rosterKey].push({
        number: p.dorsal || f[rosterKey].length + 1,
        name: p.fullName,
        photo: ''
    });
    
    broadcastState();
    updateControlUI();
    showToast(`${p.fullName} añadido a ${side === 'home' ? 'Local' : 'Visitante'}`, 'success');
}

function loadCDPACategoryToEditor() {
    const players = typeof window.findCDPAPlayers === 'function' 
        ? window.findCDPAPlayers(cdpaSearchQuery, cdpaCategoryFilter) 
        : [];
        
    if (players.length === 0) {
        showToast('No hay jugadores seleccionados', 'warning');
        return;
    }
    
    const teamInput = document.getElementById('roster-team-name');
    if (teamInput && (!teamInput.value || teamInput.value.includes('C.D. Peña Azagresa'))) {
        teamInput.value = cdpaCategoryFilter === 'TODOS' 
            ? 'C.D. Peña Azagresa' 
            : `C.D. Peña Azagresa (${cdpaCategoryFilter})`;
    }
    
    let addedCount = 0;
    players.forEach(p => {
        if (!currentRoster.some(r => r.name.toLowerCase() === p.fullName.toLowerCase())) {
            currentRoster.push({
                number: p.dorsal || currentRoster.length + 1,
                name: p.fullName,
                photo: ''
            });
            addedCount++;
        }
    });
    
    renderRosterPlayers();
    switchRosterTab('manage', document.querySelector('.tab:first-child'));
    showToast(`Se han cargado ${addedCount} jugadores al Editor`, 'success');
}

function assignCDPACategoryToSide(side) {
    const players = typeof window.findCDPAPlayers === 'function' 
        ? window.findCDPAPlayers(cdpaSearchQuery, cdpaCategoryFilter) 
        : [];
        
    if (players.length === 0) {
        showToast('No hay jugadores en la categoría seleccionada', 'warning');
        return;
    }
    
    const f = F();
    const rosterKey = side === 'home' ? 'homeRoster' : 'awayRoster';
    const nameKey = side === 'home' ? 'homeName' : 'awayName';
    
    f[rosterKey] = players.map((p, idx) => ({
        number: p.dorsal || (idx + 1),
        name: p.fullName,
        photo: ''
    }));
    
    f[nameKey] = cdpaCategoryFilter === 'TODOS'
        ? 'C.D. PEÑA AZAGRESA'
        : `PEÑA AZAGRESA ${cdpaCategoryFilter.toUpperCase()}`;
        
    // Also assign Peña Azagresa shield if available
    const badgeKey = side === 'home' ? 'homeBadge' : 'awayBadge';
    const peñaShield = window.findEscudo ? window.findEscudo('PEÑA AZAGRESA') : null;
    if (peñaShield && peñaShield.badgeUrl) {
        f[badgeKey] = peñaShield.badgeUrl;
    }
    
    broadcastState();
    updateControlUI();
    showToast(`Plantilla ${cdpaCategoryFilter} asignada a ${side === 'home' ? 'LOCAL' : 'VISITANTE'} (${players.length} jugadores)`, 'success');
}


// ── Especial Graphics ─────────────────────────────────────────
function triggerGraphic(type, side) {
    const data = {};
    if (type === 'referees') {
        data.main = document.getElementById('ref-main').value || 'Árbitro Principal';
        data.as1 = document.getElementById('ref-as1').value || 'Asistente 1';
        data.as2 = document.getElementById('ref-as2').value || 'Asistente 2';
    } else if (type === 'lineup') {
        const teamName = side === 'home' ? F().homeName : F().awayName;
        data.team = teamName || (side === 'home' ? 'LOCAL' : 'VISITANTE');
        data.side = side;
        data.badge = side === 'home' ? F().homeBadge : F().awayBadge;
        
        if (currentRoster.length === 0) {
            showToast('Carga o crea una plantilla antes de lanzar la alineación', 'warning');
            return;
        }

        data.players = currentRoster;
        data.coach = document.getElementById('roster-coach-name').value.trim() || 'No asignado';
    } else if (type === 'coach') {
        data.side = side;
        data.name = side === 'home' ? F().homeCoach : F().awayCoach;
        data.team = side === 'home' ? F().homeName : F().awayName;
        data.badge = side === 'home' ? F().homeBadge : F().awayBadge;
        if (!data.name) {
            showToast('Asigna un entrenador antes de lanzar el gráfico', 'warning');
            return;
        }
    } else if (type === 'substitution') {
        data.side = side;
        data.team = side === 'home' ? F().homeName : F().awayName;
        data.badge = side === 'home' ? F().homeBadge : F().awayBadge;
        data.subOut = document.getElementById('sub-out-name').value || 'Sale';
        data.subIn = document.getElementById('sub-in-name').value || 'Entra';
        
        const roster = side === 'home' ? F().homeRoster : F().awayRoster;
        const getPhoto = (val) => {
            if (!val) return '';
            const p = roster.find(p => val.includes(p.name) || (p.name && p.name.includes(val)));
            return p ? p.photo : '';
        };
        data.subOutPhoto = getPhoto(data.subOut);
        data.subInPhoto = getPhoto(data.subIn);
    } else if (type === 'card') {
        data.side = side;
        data.team = side === 'home' ? F().homeName : F().awayName;
        data.badge = side === 'home' ? F().homeBadge : F().awayBadge;
        data.player = document.getElementById('card-player-name').value || 'Jugador';
        data.color = document.getElementById('card-color').value || 'yellow';
        
        const roster = side === 'home' ? F().homeRoster : F().awayRoster;
        const pCard = roster.find(p => data.player.includes(p.name) || (p.name && p.name.includes(data.player)));
        data.playerPhoto = pCard ? pCard.photo : '';
    } else if (type === 'summary') {
        // Summary uses matchState directly
    }

    matchState.activeGraphic = type;
    matchState.graphicData = data;
    hapticFeedback([40, 20, 40]);
    broadcastState();
    
    // Auto-hide most graphics after some time
    const timeout = (type === 'lineup' || type === 'summary') ? 15000 : 10000;
    
    if (window.graphicTimeout) clearTimeout(window.graphicTimeout);
    window.graphicTimeout = setTimeout(() => {
        if (matchState.activeGraphic === type) {
            hideAllGraphics();
        }
    }, timeout);
}

function hideAllGraphics() {
    matchState.activeGraphic = null;
    matchState.graphicData = {};
    broadcastState();
}

// ── Match Events ────────────────────────────────────────────
function logMatchEvent(type, data) {
    const f = F();
    const event = {
        id: Date.now(),
        type,
        minute: Math.floor(matchTimer.getElapsed(activeField) / 60) || 1,
        ...data
    };
    f.matchEvents.unshift(event); // Newest first
    broadcastState();
    renderEvents();
}

function renderEvents() {
    const container = document.getElementById('match-events-feed');
    if (!container) return;
    const events = F().matchEvents;
    if (events.length === 0) {
        container.innerHTML = '<p class="text-center text-cdpa-muted text-xs py-6 opacity-50 italic">Esperando sucesos...</p>';
        return;
    }
    
    container.innerHTML = events.map(e => {
        let icon = '📝';
        let text = '';
        const team = e.team === 'home' ? (F().homeName || 'LOC') : (F().awayName || 'VIS');
        
        switch(e.type) {
            case 'GOAL': icon = '⚽'; text = `¡GOL de ${team}!`; break;
            case 'GOAL_DETAIL': icon = '⚽'; text = `Gol: ${e.player} (${team})`; break;
            case 'CARD': 
                icon = e.color === 'yellow' ? '🟨' : '🟥'; 
                text = `Tarjeta ${e.color === 'yellow' ? 'Amarilla' : 'Roja'} (${team})`; 
                break;
            case 'SUB': icon = '🔄'; text = `Cambio en ${team}: ${e.subIn} por ${e.subOut}`; break;
            default: text = e.type;
        }
        
        return `
            <div class="flex items-center gap-3 p-2 bg-white/5 rounded-lg border border-white/5 text-xs">
                <span class="font-bold text-cdpa-yellow w-8 text-right">${e.minute}'</span>
                <span class="text-lg">${icon}</span>
                <span class="flex-1">${text}</span>
                <button class="opacity-30 hover:opacity-100 text-red-500" onclick="removeEvent(${e.id})">✕</button>
            </div>
        `;
    }).join('');
}

function removeEvent(id) {
    const f = F();
    f.matchEvents = f.matchEvents.filter(e => e.id !== id);
    broadcastState();
    renderEvents();
}

function clearEvents() {
    if (!confirm('¿Limpiar todos los sucesos?')) return;
    F().matchEvents = [];
    broadcastState();
    renderEvents();
}


// ── UI Update ───────────────────────────────────────────────
function updateControlUI() {
    const f = F();
    // Scores
    const hs = document.getElementById('ctrl-home-score');
    const as = document.getElementById('ctrl-away-score');
    if (hs) hs.textContent = f.homeScore;
    if (as) as.textContent = f.awayScore;
    
    // Labels
    ['score-home-label','scorers-home-label','cards-home-label'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = f.homeName || 'LOCAL';
    });
    ['score-away-label','scorers-away-label','cards-away-label'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = f.awayName || 'VISITANTE';
    });
    
    // Cards
    const hy = document.getElementById('ctrl-home-yellows');
    const hr = document.getElementById('ctrl-home-reds');
    const ay = document.getElementById('ctrl-away-yellows');
    const ar = document.getElementById('ctrl-away-reds');
    if (hy) hy.textContent = f.homeYellows;
    if (hr) hr.textContent = f.homeReds;
    if (ay) ay.textContent = f.awayYellows;
    if (ar) ar.textContent = f.awayReds;
    
    // Fails
    const hf = document.getElementById('ctrl-home-fouls');
    const af = document.getElementById('ctrl-away-fouls');
    if (hf) hf.textContent = f.homeFouls;
    if (af) af.textContent = f.awayFouls;
    
    // Team badges
    const homeSearchContainer = document.getElementById('home-team-search-container');
    if (f.homeName && f.homeName !== 'EQUIPO LOCAL') {
        updateTeamDisplay('home', f.homeName, f.homeBadge);
        if (homeSearchContainer) homeSearchContainer.style.display = 'none';
    } else {
        const sel = document.getElementById('home-team-selected');
        if (sel) sel.style.display = 'none';
        if (homeSearchContainer) homeSearchContainer.style.display = 'block';
    }
    
    const awaySearchContainer = document.getElementById('away-team-search-container');
    if (f.awayName && f.awayName !== 'EQUIPO VISITANTE') {
        updateTeamDisplay('away', f.awayName, f.awayBadge);
        if (awaySearchContainer) awaySearchContainer.style.display = 'none';
    } else {
        const sel = document.getElementById('away-team-selected');
        if (sel) sel.style.display = 'none';
        if (awaySearchContainer) awaySearchContainer.style.display = 'block';
    }
    
    // Coaches
    const hc = document.getElementById('home-coach-input');
    const ac = document.getElementById('away-coach-input');
    if (hc) hc.value = f.homeCoach || '';
    if (ac) ac.value = f.awayCoach || '';

    // Badges for assigned rosters
    const hb = document.getElementById('home-roster-assigned-badge');
    const ab = document.getElementById('away-roster-assigned-badge');
    if (hb) hb.classList.toggle('hidden', f.homeRoster.length === 0);
    if (ab) ab.classList.toggle('hidden', f.awayRoster.length === 0);

    // Active field indicators for dual mode
    ['teams-card-field-indicator', 'score-card-field-indicator', 'squads-card-field-indicator'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            if (matchState.mode === 'dual') {
                el.textContent = `Campo ${activeField}`;
                el.classList.remove('hidden');
            } else {
                el.classList.add('hidden');
            }
        }
    });

    // Scorers
    renderScorers();
    renderEvents();
    updateTimerUI();
    updateStatusBadge();
    
    // Config fields
    const tn = document.getElementById('tournament-name-input');
    if (tn) tn.value = matchState.tournamentName || '';
    const tnAdv = document.getElementById('adv-tournament-name-input');
    if (tnAdv) tnAdv.value = matchState.tournamentName || '';

    // Sync active period buttons
    document.querySelectorAll('.period-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.period === f.period);
    });
    
    const ht = document.getElementById('halftime-team-input');
    if (ht) ht.value = matchState.halftimeTeamName || '';
    
    const si = document.getElementById('sponsor-interval-input');
    if (si) si.value = matchState.sponsorRotationInterval || 8;

    const td = document.getElementById('timer-duration');
    if (td && f.timerMaxSeconds) {
        td.value = Math.floor(f.timerMaxSeconds / 60);
    }
    
    renderSponsorLogosList();
    updateSponsorConfigUI();
    updateLiveBroadcastUI();
}

// ── Toast ───────────────────────────────────────────────────
function showToast(msg, type = '') {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.className = `toast visible ${type}`;
    setTimeout(() => t.classList.remove('visible'), 3000);
}

// ── Alarm ───────────────────────────────────────────────────
function playAlarm() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = 880;
        osc.type = 'square';
        gain.gain.value = 0.3;
        osc.start(); osc.stop(ctx.currentTime + 1.5);
    } catch(e) {}
}

// ── Tournament & Halftime Config ────────────────────────────
function updateTournamentName(val) {
    const el1 = document.getElementById('tournament-name-input');
    const el2 = document.getElementById('adv-tournament-name-input');
    let value = '';
    if (val !== undefined && val !== null) {
        value = val;
    } else if (el1 && el1.value) {
        value = el1.value;
    } else if (el2 && el2.value) {
        value = el2.value;
    }
    if (el1 && el1.value !== value) el1.value = value;
    if (el2 && el2.value !== value) el2.value = value;
    matchState.tournamentName = value;
    broadcastState();
}

function updateHalftimeTeamName() {
    const el = document.getElementById('halftime-team-input');
    if (!el) return;
    matchState.halftimeTeamName = el.value;
    broadcastState();
}

// ── Sponsor Logos & Fullscreen Management ───────────────────
function checkSponsorAutoTrigger(elapsed) {
    if (!matchState.sponsorConfig || !matchState.sponsorConfig.autoSync) return;
    const logos = matchState.sponsorLogos || [];
    if (logos.length === 0) return;
    
    const intervalMins = matchState.sponsorConfig.intervalMinutes || 5;
    const intervalSecs = intervalMins * 60;
    const currentBlock = Math.floor(elapsed / intervalSecs);
    
    // Disparar cada intervalSecs cuando el cronómetro esté corriendo
    if (elapsed >= 60 && currentBlock > 0 && currentBlock !== matchState.sponsorConfig.lastBlock) {
        matchState.sponsorConfig.lastBlock = currentBlock;
        triggerNextSponsorFullscreen();
    }
}

function toggleSponsorAutoSync() {
    if (!matchState.sponsorConfig) {
        matchState.sponsorConfig = { autoSync: false, intervalMinutes: 5, exposureSeconds: 6, currentIndex: 0, lastBlock: 0 };
    }
    matchState.sponsorConfig.autoSync = !matchState.sponsorConfig.autoSync;
    updateSponsorConfigUI();
    broadcastState();
    showToast(matchState.sponsorConfig.autoSync ? '🟢 Auto-patrocinadores activado' : '⚪ Auto-patrocinadores desactivado', 'info');
}

function updateSponsorConfig() {
    if (!matchState.sponsorConfig) {
        matchState.sponsorConfig = { autoSync: false, intervalMinutes: 5, exposureSeconds: 6, currentIndex: 0, lastBlock: 0, autoHalftime: true };
    }
    const intInput = document.getElementById('sponsor-interval-mins');
    const durInput = document.getElementById('sponsor-duration-secs');
    const halfToggle = document.getElementById('sponsor-halftime-toggle');

    if (intInput) matchState.sponsorConfig.intervalMinutes = Math.max(1, parseInt(intInput.value) || 5);
    if (durInput) matchState.sponsorConfig.exposureSeconds = Math.max(2, parseInt(durInput.value) || 6);
    if (halfToggle) matchState.sponsorConfig.autoHalftime = halfToggle.checked;
    broadcastState();
}

function updateSponsorConfigUI() {
    const btn = document.getElementById('sponsor-sync-btn');
    const autoSync = matchState.sponsorConfig && matchState.sponsorConfig.autoSync;
    if (btn) {
        btn.textContent = autoSync ? '🟢 Auto: Activo' : '⚪ Auto: Inactivo';
        btn.className = autoSync 
            ? 'px-2.5 py-1 text-[10px] font-bold rounded-full border border-green-500/40 bg-green-500/20 text-green-400'
            : 'px-2.5 py-1 text-[10px] font-bold rounded-full border border-white/10 bg-white/5 text-gray-400';
    }
    const intInput = document.getElementById('sponsor-interval-mins');
    const durInput = document.getElementById('sponsor-duration-secs');
    const halfToggle = document.getElementById('sponsor-halftime-toggle');

    if (intInput && matchState.sponsorConfig?.intervalMinutes) intInput.value = matchState.sponsorConfig.intervalMinutes;
    if (durInput && matchState.sponsorConfig?.exposureSeconds) durInput.value = matchState.sponsorConfig.exposureSeconds;
    if (halfToggle && matchState.sponsorConfig?.autoHalftime !== undefined) halfToggle.checked = matchState.sponsorConfig.autoHalftime;
}

function triggerNextSponsorFullscreen(sponsorId = null) {
    const logos = matchState.sponsorLogos || [];
    if (logos.length === 0) {
        showToast('Añade al menos un patrocinador a la lista', 'warning');
        return;
    }
    
    let sponsor = null;
    if (sponsorId) {
        sponsor = logos.find(s => s.id === sponsorId);
    }
    if (!sponsor) {
        if (!matchState.sponsorConfig) matchState.sponsorConfig = { currentIndex: 0 };
        const idx = (matchState.sponsorConfig.currentIndex || 0) % logos.length;
        sponsor = logos[idx];
        matchState.sponsorConfig.currentIndex = (idx + 1) % logos.length;
    }
    
    const duration = matchState.sponsorConfig?.exposureSeconds || 6;
    const isVideo = sponsor.mediaType === 'video' || (sponsor.logoUrl && /\.(mp4|webm|ogg)($|\?)/i.test(sponsor.logoUrl));
    
    matchState.sponsorFullscreen = {
        active: true,
        name: sponsor.name,
        logoUrl: sponsor.logoUrl,
        mediaType: isVideo ? 'video' : 'image',
        duration: duration,
        timestamp: Date.now()
    };
    
    broadcastState();
    showToast(`Mostrando patrocinador: ${sponsor.name} (${isVideo ? 'Vídeo' : 'Foto'}, ${duration}s)`, 'success');
    
    clearTimeout(window._sponsorTimerTimeout);
    window._sponsorTimerTimeout = setTimeout(() => {
        hideSponsorFullscreen();
    }, duration * 1000);
}

function hideSponsorFullscreen() {
    clearTimeout(window._sponsorTimerTimeout);
    if (!matchState.sponsorFullscreen) matchState.sponsorFullscreen = {};
    matchState.sponsorFullscreen.active = false;
    broadcastState();
}

function addSponsorLogo() {
    const nameInput = document.getElementById('sponsor-name-input');
    const logoInput = document.getElementById('sponsor-logo-input');
    const typeSelect = document.getElementById('sponsor-type-select');
    
    const name = nameInput.value.trim();
    const logoUrl = logoInput.value.trim();
    const mediaType = typeSelect ? typeSelect.value : 'image';
    
    if (!name && !logoUrl) return;
    
    if (!matchState.sponsorLogos) matchState.sponsorLogos = [];
    
    matchState.sponsorLogos.push({
        id: Date.now().toString(),
        name: name || (mediaType === 'video' ? 'Vídeo Anuncio' : 'Patrocinador'),
        logoUrl: logoUrl,
        mediaType: mediaType
    });
    
    nameInput.value = '';
    logoInput.value = '';
    
    broadcastState();
    renderSponsorLogosList();
    showToast(`Patrocinador añadido (${mediaType === 'video' ? '🎬 Vídeo' : '📷 Foto'})`, 'info');
}

function removeSponsorLogo(id) {
    if (!matchState.sponsorLogos) return;
    matchState.sponsorLogos = matchState.sponsorLogos.filter(s => s.id !== id);
    broadcastState();
    renderSponsorLogosList();
}

function renderSponsorLogosList() {
    const container = document.getElementById('sponsor-logos-list');
    if (!container) return;
    
    const logos = matchState.sponsorLogos || [];
    if (logos.length === 0) {
        container.innerHTML = '<p class="text-[10px] text-gray-500 text-center italic py-2">No hay patrocinadores configurados.</p>';
        return;
    }
    
    container.innerHTML = logos.map(s => {
        const isVideo = s.mediaType === 'video' || (s.logoUrl && /\.(mp4|webm|ogg)($|\?)/i.test(s.logoUrl));
        return `
        <div class="flex items-center justify-between bg-black/40 p-2 rounded border border-white/5 mb-1">
            <div class="flex items-center gap-2 overflow-hidden flex-1 cursor-pointer" onclick="triggerNextSponsorFullscreen('${s.id}')" title="Clic para proyectar a pantalla completa">
                ${s.logoUrl && !isVideo ? `<img src="${s.logoUrl}" class="w-6 h-6 object-contain rounded bg-white/10" onerror="this.style.display='none'">` : `<div class="w-6 h-6 rounded bg-cdpa-yellow/20 flex items-center justify-center text-[10px] font-bold text-cdpa-yellow">${isVideo ? '🎬' : (s.name || '?').charAt(0)}</div>`}
                <div class="flex items-center gap-1.5 overflow-hidden">
                    <span class="text-xs text-white truncate font-medium">${s.name || 'Logo sin nombre'}</span>
                    <span class="text-[9px] px-1 rounded ${isVideo ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300'}">${isVideo ? 'Vídeo' : 'Foto'}</span>
                </div>
            </div>
            <div class="flex items-center gap-1">
                <button class="text-yellow-400 hover:bg-yellow-400/20 px-2 py-1 rounded text-[10px] font-bold" onclick="triggerNextSponsorFullscreen('${s.id}')" title="Proyectar a pantalla completa">
                    ▶️
                </button>
                <button class="text-red-500 hover:bg-red-500/20 p-1 rounded" onclick="removeSponsorLogo('${s.id}')" title="Eliminar">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
            </div>
        </div>
        `;
    }).join('');
}

// ── Control del Panel de Funciones Avanzadas ───────────────────
function toggleAdvancedPanel() {
    const content = document.getElementById('advanced-panel-content');
    const chevron = document.getElementById('advanced-chevron');
    if (!content) return;
    const isHidden = content.classList.contains('hidden');
    content.classList.toggle('hidden', !isHidden);
    if (chevron) {
        chevron.textContent = isHidden ? '▲ Plegar' : '▼ Desplegar';
    }
}

function switchAdvancedTab(tabId, btn) {
    document.querySelectorAll('.adv-tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.adv-tab-content').forEach(c => c.classList.add('hidden'));
    
    if (btn) btn.classList.add('active');
    const target = document.getElementById('adv-tab-' + tabId);
    if (target) target.classList.remove('hidden');
}

// ── Live Broadcast Management (Pinchar Directo con Ticker) ───
function startLiveBroadcast() {
    const urlInput = document.getElementById('live-url-input');
    const url = urlInput ? urlInput.value.trim() : '';
    if (!url) {
        showToast('Introduce la URL de emisión en directo', 'error');
        return;
    }
    const showTicker = document.getElementById('live-ticker-toggle')?.checked ?? true;
    
    matchState.liveBroadcast = {
        active: true,
        url: url,
        showTicker: showTicker
    };
    
    broadcastState();
    updateLiveBroadcastUI();
    showToast('🔴 Emisión en directo proyectada en el marcador', 'success');
}

function stopLiveBroadcast() {
    if (!matchState.liveBroadcast) matchState.liveBroadcast = {};
    matchState.liveBroadcast.active = false;
    broadcastState();
    updateLiveBroadcastUI();
    showToast('Emisión en directo detenida', 'info');
}

function toggleLiveTicker() {
    if (!matchState.liveBroadcast) return;
    matchState.liveBroadcast.showTicker = document.getElementById('live-ticker-toggle')?.checked ?? true;
    broadcastState();
}

function updateLiveBroadcastUI() {
    const badge = document.getElementById('live-status-badge');
    const urlInput = document.getElementById('live-url-input');
    const tickerToggle = document.getElementById('live-ticker-toggle');
    const isLive = !!(matchState.liveBroadcast && matchState.liveBroadcast.active);
    
    if (badge) {
        badge.textContent = isLive ? '🔴 EN DIRECTO' : 'Inactivo';
        badge.className = isLive 
            ? 'px-2 py-0.5 text-[9px] font-bold rounded-full bg-red-600 text-white animate-pulse'
            : 'px-2 py-0.5 text-[9px] font-bold rounded-full bg-black/40 text-gray-400 border border-white/5';
    }
    if (urlInput && matchState.liveBroadcast?.url && !urlInput.value) {
        urlInput.value = matchState.liveBroadcast.url;
    }
    if (tickerToggle && matchState.liveBroadcast) {
        tickerToggle.checked = matchState.liveBroadcast.showTicker !== false;
    }
}
