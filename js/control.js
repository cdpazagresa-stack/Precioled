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
    
    // Close team search on outside click
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.team-selector')) {
            document.querySelectorAll('.team-results').forEach(el => el.classList.remove('visible'));
        }
    });
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
    broadcastState();
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
        f[key] = Math.max(0, f[key] - delta); // Wait, delta is -1 here
        // Correct logic for delta < 0
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

function resetTimer() {
    matchTimer.reset(activeField);
    hapticFeedback([20, 20, 20]);
    updateTimerUI();
}

function updateTimerDuration() {
    const mins = parseInt(document.getElementById('timer-duration').value) || 40;
    matchTimer.setDuration(mins, activeField);
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
}

function setPeriod(el) {
    const period = el.dataset.period;
    F().period = period;
    document.querySelectorAll('.period-btn').forEach(b => b.classList.toggle('active', b.dataset.period === period));
    
    if (period === 'DESCANSO' || period === 'FINAL') {
        matchTimer.pause(activeField);
        F().status = period === 'FINAL' ? 'finished' : 'halftime';
    } else {
        F().status = F().timerRunning ? 'live' : 'pre_match';
    }
    hapticFeedback(25);
    broadcastState();
    updateStatusBadge();
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

    if (!roster || roster.length === 0) {
        // If no roster, just ask for name or skip
        list.innerHTML = `
            <div class="p-4 text-center text-white/60 italic">
                No hay plantilla asignada a este equipo.<br>
                Usa el botón "SIN NOMBRE" o introduce uno manual.
            </div>
            <div class="px-4 pb-4">
                <input type="text" id="manual-scorer-name" class="form-input w-full" placeholder="Nombre del goleador...">
                <button class="btn btn-primary w-full mt-2" onclick="confirmManualGoalScorer()">CONFIRMAR NOMBRE</button>
            </div>
        `;
    } else {
        list.innerHTML = roster.map(p => `
            <div class="player-btn" onclick="confirmGoalScorer('${p.name}')">
                <span class="player-num">${p.number}</span>
                <span class="player-name">${p.name}</span>
            </div>
        `).join('');
    }
    
    modal.style.display = 'flex';
}

function closeGoalModal() {
    document.getElementById('goal-modal').style.display = 'none';
    pendingGoalTeam = null;
}

function confirmGoalScorer(playerName) {
    const team = pendingGoalTeam;
    if (!team) return;
    
    const f = F();
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
    if (!name) { showToast('Introduce el nombre', 'error'); return; }
    currentRoster.push({ number: dorsal || '-', name });
    document.getElementById('roster-dorsal').value = '';
    document.getElementById('roster-player-name').value = '';
    renderRosterPlayers();
}

function removeRosterPlayer(i) { currentRoster.splice(i, 1); renderRosterPlayers(); }

function renderRosterPlayers() {
    const grid = document.getElementById('roster-players');
    if (!grid) return;
    grid.innerHTML = currentRoster.map((p, i) => `
        <div class="roster-player">
            <span class="player-number">${p.number}</span>
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
            
            // Convert to JSON
            const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            if (json.length === 0) {
                showToast('El archivo está vacío', 'error');
                return;
            }

            const newPlayers = [];
            let coachName = '';

            json.forEach((row, index) => {
                // Ignore headers if they look like headers (e.g. contains "nombre", "dorsal", etc.)
                const rowStr = row.join(' ').toLowerCase();
                if (index === 0 && (rowStr.includes('nombre') || rowStr.includes('jugador') || rowStr.includes('dorsal'))) {
                    return;
                }

                // Try to find coach
                if (rowStr.includes('entrenador') || rowStr.includes('coach')) {
                    coachName = row[1] || row[0].split(':')[1]?.trim() || '';
                    return;
                }

                // Player logic: [Dorsal, Nombre] or just [Nombre]
                let dorsal = '-';
                let name = '';

                if (row.length >= 2) {
                    dorsal = row[0];
                    name = row[1];
                } else if (row.length === 1) {
                    name = row[0];
                }

                if (name && name.toString().trim()) {
                    newPlayers.push({
                        number: dorsal.toString().trim(),
                        name: name.toString().trim()
                    });
                }
            });

            if (newPlayers.length > 0) {
                currentRoster = [...currentRoster, ...newPlayers];
                if (coachName) {
                    document.getElementById('roster-coach-name').value = coachName;
                }
                renderRosterPlayers();
                showToast(`Se han importado ${newPlayers.length} jugadores`, 'success');
            } else {
                showToast('No se encontraron jugadores válidos', 'warning');
            }
        } catch (err) {
            console.error(err);
            showToast('Error al procesar el archivo', 'error');
        }
        // Reset input
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
    document.querySelectorAll('#roster-manage, #roster-load').forEach(t => t.classList.remove('active'));
    const target = document.getElementById(`roster-${tab}`);
    if (target) target.classList.add('active');
    if (el) {
        el.closest('.tabs').querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        el.classList.add('active');
    }
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
    } else if (type === 'card') {
        data.side = side;
        data.team = side === 'home' ? F().homeName : F().awayName;
        data.badge = side === 'home' ? F().homeBadge : F().awayBadge;
        data.player = document.getElementById('card-player-name').value || 'Jugador';
        data.color = document.getElementById('card-color').value || 'yellow';
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
    if (f.homeBadge) updateTeamDisplay('home', f.homeName, f.homeBadge);
    if (f.awayBadge) updateTeamDisplay('away', f.awayName, f.awayBadge);
    
    // Coaches
    const hc = document.getElementById('home-coach-input');
    const ac = document.getElementById('away-coach-input');
    if (hc && f.homeCoach) hc.value = f.homeCoach;
    if (ac && f.awayCoach) ac.value = f.awayCoach;

    // Badges for assigned rosters
    const hb = document.getElementById('home-roster-assigned-badge');
    const ab = document.getElementById('away-roster-assigned-badge');
    if (hb) hb.classList.toggle('hidden', f.homeRoster.length === 0);
    if (ab) ab.classList.toggle('hidden', f.awayRoster.length === 0);

    // Scorers
    renderScorers();
    renderEvents();
    updateTimerUI();
    updateStatusBadge();
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
