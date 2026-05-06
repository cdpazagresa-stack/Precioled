/* ============================================================
   DISPLAY.JS — LED Screen Rendering Logic
   ============================================================ */

let displayInitialized = false;

function initDisplay() {
    if (displayInitialized) return;
    displayInitialized = true;
    
    loadState();
    
    // Listen for state updates from control panel (local or remote)
    if (window.syncManager) {
        window.syncManager.onMessage((data) => {
            if (data.type === 'FULL_STATE') {
                matchState = data.payload;
                matchTimer.syncFromState();
                renderDisplay();
            } else if (data.type === 'state-update') {
                const prevGoal1 = matchState.fields[1].showGoalAnimation;
                const prevGoal2 = matchState.fields[2].showGoalAnimation;
                matchState = data.state;
                matchTimer.syncFromState();
                renderDisplay();
                // Check for new goal animations
                if (!prevGoal1 && matchState.fields[1].showGoalAnimation) showGoalOverlay(1);
                if (!prevGoal2 && matchState.fields[2].showGoalAnimation) showGoalOverlay(2);
            }
        });
        
        // Inicializar Host de PeerJS para permitir control remoto
        window.syncManager.initHost('AZAGRESA-');
    }
    
    // Also poll localStorage for fallback
    setInterval(() => {
        try {
            const saved = localStorage.getItem('marcador-led-state');
            if (saved) {
                const parsed = JSON.parse(saved);
                
                const prevGoal1 = matchState.fields[1].showGoalAnimation;
                const prevGoal2 = matchState.fields[2].showGoalAnimation;
                
                matchState = parsed;
                matchTimer.syncFromState();
                renderDisplay();
                
                // Check for new goal animations on both fields
                if (!prevGoal1 && parsed.fields[1].showGoalAnimation) showGoalOverlay(1);
                if (!prevGoal2 && parsed.fields[2].showGoalAnimation) showGoalOverlay(2);
            }
        } catch(e) {}
    }, 500);
    
    // Timer tick updates
    matchTimer.onTick(() => renderTimers());
    matchTimer.onAlarm((fieldNum) => {
        // Flash the timer when time is up
        const timerId = fieldNum === 1 ? 'timer-display' : `f${fieldNum}-timer`;
        const el = document.getElementById(timerId);
        if (el) el.classList.add('paused');
    });
    
    renderDisplay();
}

// ── Main Render ─────────────────────────────────────────────
function renderDisplay() {
    const isSingle = matchState.mode === 'single';
    
    document.getElementById('single-match').style.display = isSingle ? 'flex' : 'none';
    document.getElementById('dual-match').style.display = isSingle ? 'none' : 'flex';
    
    if (isSingle) {
        renderSingleMatch();
    } else {
        renderDualMatch();
    }
    
    renderSponsors();
    renderGraphics();
}

// ── Single Match Render ─────────────────────────────────────
function renderSingleMatch() {
    const f = matchState.fields[1];
    
    // Team names
    setText('home-name', f.homeName || 'EQUIPO LOCAL');
    setText('away-name', f.awayName || 'EQUIPO VISITANTE');
    
    // Badges
    setBadge('home-badge', f.homeBadge, f.homeName);
    setBadge('away-badge', f.awayBadge, f.awayName);
    
    // Scores
    setText('home-score', f.homeScore);
    setText('away-score', f.awayScore);
    
    // Period
    setText('period-badge', f.period || '1ª PARTE');
    
    // Cards
    renderCards('home', f.homeYellows, f.homeReds);
    renderCards('away', f.awayYellows, f.awayReds);
    
    // Scorers
    renderMainScorers('home-scorers', f.homeScorers, 'right');
    renderMainScorers('away-scorers', f.awayScorers, 'left');
    
    // Extra message
    const msgEl = document.getElementById('extra-message');
    const msgText = document.getElementById('extra-text');
    if (msgEl && msgText) {
        if (f.extraMessage) {
            msgText.textContent = f.extraMessage;
            msgEl.style.display = 'block';
        } else {
            msgEl.style.display = 'none';
        }
    }

    // Fouls
    renderFouls(1);
}

// ── Dual Match Render ───────────────────────────────────────
function renderDualMatch() {
    [1, 2].forEach(fn => {
        const f = matchState.fields[fn];
        const p = `f${fn}`;
        
        setText(`${p}-home-name`, f.homeName || 'LOCAL');
        setText(`${p}-away-name`, f.awayName || 'VISITANTE');
        setBadge(`${p}-home-badge`, f.homeBadge, f.homeName);
        setBadge(`${p}-away-badge`, f.awayBadge, f.awayName);
        setText(`${p}-home-score`, f.homeScore);
        setText(`${p}-away-score`, f.awayScore);
        
        const elapsed = matchTimer.getElapsed(fn);
        setText(`${p}-timer`, `${matchTimer.format(elapsed)} — ${f.period || '1ª PARTE'}`);
        
        renderMainScorers(`${p}-home-scorers`, f.homeScorers, 'right');
        renderMainScorers(`${p}-away-scorers`, f.awayScorers, 'left');
        
        renderFouls(fn);
    });
}

// ── Timer Render ────────────────────────────────────────────
function renderTimers() {
    if (matchState.mode === 'single') {
        const elapsed = matchTimer.getElapsed(1);
        const el = document.getElementById('timer-display');
        if (el) {
            el.textContent = matchTimer.format(elapsed);
            el.classList.toggle('running', matchState.fields[1].timerRunning);
            el.classList.toggle('paused', !matchState.fields[1].timerRunning && elapsed > 0);
        }
    } else {
        [1, 2].forEach(fn => {
            const elapsed = matchTimer.getElapsed(fn);
            const f = matchState.fields[fn];
            setText(`f${fn}-timer`, `${matchTimer.format(elapsed)} — ${f.period || '1ª PARTE'}`);
        });
    }
}

// ── Scorers Render (Main Board) ──────────────────────────────
function renderMainScorers(containerId, scorers, align) {
    const el = document.getElementById(containerId);
    if (!el) return;
    
    el.innerHTML = (scorers || []).map(s => `
        <div class="scorer-entry" style="justify-content:${align === 'right' ? 'flex-end' : 'flex-start'}">
            <span class="scorer-icon">⚽</span>
            <span class="scorer-minute">${s.minute}'</span>
            <span>${s.name}</span>
        </div>
    `).join('');
}

// ── Cards Render ────────────────────────────────────────────
function renderCards(team, yellows, reds) {
    const yEl = document.getElementById(`${team}-yellows`);
    const rEl = document.getElementById(`${team}-reds`);
    if (yEl) {
        yEl.style.display = yellows > 0 ? 'flex' : 'none';
        yEl.querySelector('.card-count').textContent = yellows;
    }
    if (rEl) {
        rEl.style.display = reds > 0 ? 'flex' : 'none';
        rEl.querySelector('.card-count').textContent = reds;
    }
}

// ── Fouls Render ────────────────────────────────────────────
function renderFouls(fieldNum) {
    const f = matchState.fields[fieldNum];
    if (matchState.mode === 'single') {
        const hCont = document.getElementById('home-fouls-container');
        const aCont = document.getElementById('away-fouls-container');
        if (hCont) {
            hCont.style.display = f.homeFouls > 0 ? 'flex' : 'none';
            setText('home-fouls', f.homeFouls);
        }
        if (aCont) {
            aCont.style.display = f.awayFouls > 0 ? 'flex' : 'none';
            setText('away-fouls', f.awayFouls);
        }
    } else {
        setText(`f${fieldNum}-home-fouls`, f.homeFouls);
        setText(`f${fieldNum}-away-fouls`, f.awayFouls);
    }
}

// ── Sponsors Render ─────────────────────────────────────────
function renderSponsors() {
    const sponsors = matchState.sponsors || [];
    if (sponsors.length === 0 || sponsors.every(s => !s.name)) return;
    
    const tracks = document.querySelectorAll('[id^="sponsor-track"]');
    tracks.forEach(track => {
        // Duplicate for seamless scroll
        const items = sponsors.filter(s => s.name).map(s => `
            <div class="sponsor-item">
                <span class="sponsor-prefix">${s.prefix}:</span>
                <span class="sponsor-name">${s.name}</span>
            </div>
            <div class="sponsor-separator">◆</div>
        `).join('');
        track.innerHTML = items + items; // Duplicate for seamless loop
    });
}

// ── Goal Overlay ────────────────────────────────────────────
function showGoalOverlay(fieldNum) {
    const overlay = document.getElementById('goal-overlay');
    const scorerEl = document.getElementById('goal-scorer-name');
    if (!overlay) return;
    
    const f = matchState.fields[fieldNum];
    if (scorerEl && f.goalScorerName) {
        scorerEl.textContent = f.goalScorerName;
    }
    
    overlay.classList.add('active');
    
    // Score flash animation
    const team = f.goalTeam;
    if (team) {
        const scoreId = matchState.mode === 'single' 
            ? `${team}-score` 
            : `f${fieldNum}-${team}-score`;
        const scoreEl = document.getElementById(scoreId);
        if (scoreEl) scoreEl.classList.add('goal-flash');
        setTimeout(() => { if (scoreEl) scoreEl.classList.remove('goal-flash'); }, 1000);
    }
    
    setTimeout(() => overlay.classList.remove('active'), 3200);
}

// ── Special Graphics ────────────────────────────────────────
function renderGraphics() {
    const overlays = ['referees', 'lineup', 'substitution', 'card', 'summary', 'coach'];
    overlays.forEach(id => {
        const el = document.getElementById(`graphic-overlay-${id}`);
        if (el) el.classList.remove('active');
    });

    const active = matchState.activeGraphic;
    if (!active) return;
    
    const data = matchState.graphicData || {};
    const overlay = document.getElementById(`graphic-overlay-${active}`);
    if (!overlay) return;

    // Add active class to trigger CSS transition
    overlay.classList.add('active');
    
    if (active === 'referees') {
        setText('graphic-ref-main', data.main || 'Árbitro Principal');
        setText('graphic-ref-as1', data.as1 || 'Asistente 1');
        setText('graphic-ref-as2', data.as2 || 'Asistente 2');
    } 
    else if (active === 'lineup') {
        setText('graphic-lineup-team', data.team);
        const f = matchState.fields[1];
        const badgeUrl = data.side === 'home' ? f.homeBadge : f.awayBadge;
        setBadge('graphic-lineup-badge', badgeUrl, data.team);
        
        const playersContainer = document.getElementById('graphic-lineup-players');
        if (playersContainer && data.players) {
            // Updated with new classes and staggered animation delays
            playersContainer.innerHTML = data.players.map((p, index) => `
                <div class="lineup-player" style="animation-delay: ${index * 0.08}s">
                    <span class="lineup-num">${p.number}</span>
                    <span class="lineup-name">${p.name}</span>
                </div>
            `).join('');
            
        }
    }
    else if (active === 'substitution') {
        setText('graphic-sub-out', data.subOut);
        setText('graphic-sub-in', data.subIn);
        setBadge('graphic-sub-badge', data.badge, data.team);
    }
    else if (active === 'card') {
        setText('graphic-card-type', data.color === 'yellow' ? 'TARJETA AMARILLA' : 'TARJETA ROJA');
        setText('graphic-card-player', data.player);
        setBadge('graphic-card-badge', data.badge, data.team);
        
        const cardBg = document.getElementById('graphic-card-bg');
        if (cardBg) {
            cardBg.classList.toggle('card-yellow-bg', data.color === 'yellow');
            cardBg.classList.toggle('card-red-bg', data.color === 'red');
        }
    }
    else if (active === 'coach') {
        setText('graphic-coach-team', data.team);
        setText('graphic-coach-name', data.name);
        setBadge('graphic-coach-badge', data.badge, data.team);
    }
    else if (active === 'summary') {
        const f = matchState.fields[1];
        setText('summary-home-name', f.homeName);
        setText('summary-away-name', f.awayName);
        setText('summary-home-score', f.homeScore);
        setText('summary-away-score', f.awayScore);
        setBadge('summary-home-badge', f.homeBadge, f.homeName);
        setBadge('summary-away-badge', f.awayBadge, f.awayName);
        renderSummaryScorers('summary-home-scorers', f.homeScorers, 'right');
        renderSummaryScorers('summary-away-scorers', f.awayScorers, 'left');
    }
}

function renderSummaryScorers(id, scorers, align) {
    const el = document.getElementById(id);
    if (!el) return;
    
    // Add team class for animation direction
    el.classList.add(align === 'right' ? 'team-a' : 'team-b');
    
    if (!scorers || scorers.length === 0) {
        el.innerHTML = '';
        return;
    }
    el.innerHTML = scorers.map(s => `
        <div class="summary-scorer-row" style="justify-content: ${align === 'right' ? 'flex-end' : 'flex-start'}">
            <span class="summary-scorer-name">${s.name}</span>
            <span class="summary-scorer-time">${s.minute}'</span>
        </div>
    `).join('');
}

// ── Helpers ─────────────────────────────────────────────────
function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

function setBadge(id, url, name) {
    const el = document.getElementById(id);
    if (!el) return;
    if (url) {
        el.src = url;
        el.onerror = function() { this.src = getDefaultBadgeSVG(name || '?'); };
    } else {
        el.src = getDefaultBadgeSVG(name || '?');
    }
}

function getDefaultBadgeSVG(name) {
    const initial = name.charAt(0).toUpperCase();
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
            <rect width="100" height="100" fill="#333" />
            <text x="50" y="65" font-family="Arial" font-size="50" fill="white" text-anchor="middle">${initial}</text>
        </svg>
    `)}`;
}

// ── Init on Load ────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', initDisplay);
