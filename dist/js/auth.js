/* ============================================================
   AUTH — Authentication (Supabase or Demo Mode)
   ============================================================ */
let currentUser = null;
let isDemoMode = false;

async function initAuth() {
    const demoSession = sessionStorage.getItem('marcador-demo-mode');
    if (demoSession === 'true') {
        isDemoMode = true;
        currentUser = { email: 'demo@local', role: 'admin' };
        showApp();
        return;
    }
    if (SUPABASE_URL && SUPABASE_KEY && window._supabaseClient) {
        const { data: { session } } = await window._supabaseClient.auth.getSession();
        if (session) { currentUser = session.user; showApp(); return; }
    }
    showAuthScreen();
}

function enterDemoMode() {
    isDemoMode = true;
    currentUser = { email: 'demo@local', role: 'admin' };
    sessionStorage.setItem('marcador-demo-mode', 'true');
    showApp();
}

const APP_PASSWORD = 'azagresa2024'; // Contraseña por defecto si no hay Supabase

async function login(email, password) {
    // Si hay Supabase configurado, usamos Supabase
    if (typeof SUPABASE_URL !== 'undefined' && SUPABASE_URL && window._supabaseClient) {
        try {
            const { data, error } = await window._supabaseClient.auth.signInWithPassword({ email, password });
            if (error) throw error;
            currentUser = data.user;
            showApp();
        } catch(e) {
            showAuthError(e.message || 'Error de autenticación');
        }
        return;
    }

    // Fallback: Simple password check
    if (password === APP_PASSWORD) {
        enterDemoMode();
    } else {
        showAuthError('Contraseña incorrecta');
    }
}

async function logout() {
    if (window._supabaseClient) await window._supabaseClient.auth.signOut();
    currentUser = null; isDemoMode = false;
    sessionStorage.removeItem('marcador-demo-mode');
    showAuthScreen();
}

function showAuthScreen() {
    document.getElementById('auth-screen').style.display = 'flex';
    document.getElementById('app').style.display = 'none';
}

function showApp() {
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('app').style.display = 'block';
    if (typeof initControlPanel === 'function') initControlPanel();
}

function showAuthError(msg) {
    const el = document.getElementById('auth-error');
    if (el) { el.textContent = msg; el.style.display = 'block'; setTimeout(() => el.style.display = 'none', 4000); }
}

document.addEventListener('DOMContentLoaded', () => {
    const f = document.getElementById('login-form');
    if (f) f.addEventListener('submit', e => {
        e.preventDefault();
        login(document.getElementById('auth-email').value, document.getElementById('auth-password').value);
    });
    initAuth();
});
