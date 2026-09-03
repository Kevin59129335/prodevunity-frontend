// ==========================================
// CONFIGURAZIONE API & BASE URL
// ==========================================
const API_BASE_URL = 'https://prodevunity-backend.onrender.com';

// Stato globale dell'utente
let currentUser = JSON.parse(localStorage.getItem('prodevunity_user')) || null;
let authMode = 'login';

// ==========================================
// INIZIALIZZAZIONE AL CARICAMENTO DELLA PAGINA
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    applySavedTheme();
    updateUIAuth();
    checkAuthSession();
});

// Helper per escape HTML sicuro
function escapeHTML(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Wrapper Fetch con credenziali e gestione sessione
async function fetchWithAuth(url, options = {}) {
    options.credentials = 'include';
    options.headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {})
    };
    return await fetch(url, options);
}

// ==========================================
// GESTIONE AUTENTICAZIONE E SESSIONE
// ==========================================

async function checkAuthSession() {
    try {
        const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
            method: 'GET',
            credentials: 'include'
        });
        if (res.ok) {
            const data = await res.json();
            currentUser = data.user;
            localStorage.setItem('prodevunity_user', JSON.stringify(currentUser));
        } else {
            currentUser = null;
            localStorage.removeItem('prodevunity_user');
        }
    } catch (err) {
        console.error("Errore nel recupero della sessione:", err);
    }
    updateUIAuth();
}

function updateUIAuth() {
    const userDisplay = document.getElementById('current-username-display');
    const logoutBtn = document.getElementById('logout-btn');
    const loginBtn = document.getElementById('login-btn');

    if (userDisplay) {
        userDisplay.textContent = currentUser ? `@${currentUser.username}` : '@guest';
    }

    if (logoutBtn) {
        logoutBtn.style.display = currentUser ? 'block' : 'none';
    }

    if (loginBtn) {
        loginBtn.style.display = currentUser ? 'none' : 'block';
    }
}

// Handler form modale (Login / Register)
async function handleAuth(e) {
    e.preventDefault();
    const username = document.getElementById('auth-username').value;
    const password = document.getElementById('auth-password').value;

    if (authMode === 'login') {
        await login(username, password);
    } else {
        const email = document.getElementById('auth-email').value;
        const role = document.getElementById('auth-role').value;
        await register(username, email, password, role);
    }
}

async function login(username, password) {
    try {
        const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ username, password })
        });

        const data = await res.json();
        if (res.ok) {
            currentUser = data.user;
            localStorage.setItem('prodevunity_user', JSON.stringify(currentUser));
            window.location.href = 'feed.html';
        } else {
            alert(data.error || 'Credenziali non valide');
        }
    } catch (err) {
        console.error(err);
        alert('Errore di connessione con il backend Render.');
    }
}

async function register(username, email, password, role = 'dev') {
    try {
        const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ username, email, password, role })
        });

        const data = await res.json();
        if (res.ok) {
            alert('Registrazione completata! Ora puoi effettuare il login.');
            setAuthMode('login');
        } else {
            alert(data.error || 'Errore durante la registrazione');
        }
    } catch (err) {
        console.error(err);
        alert('Errore durante la comunicazione con il server.');
    }
}

async function logout() {
    try {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
            method: 'POST',
            credentials: 'include'
        });
    } catch (err) {
        console.error("Errore durante il logout dal server:", err);
    } finally {
        currentUser = null;
        localStorage.removeItem('prodevunity_user');
        window.location.href = 'index.html';
    }
}

// ==========================================
// CONTROLLI MODALE DI AUTENTICAZIONE
// ==========================================
function openAuthModal(mode = 'login') {
    const modal = document.getElementById('auth-modal');
    if (modal) {
        modal.classList.remove('hidden');
        setAuthMode(mode);
    }
}

function closeAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) modal.classList.add('hidden');
}

function setAuthMode(mode) {
    authMode = mode;
    const emailGroup = document.getElementById('auth-email-group');
    const roleGroup = document.getElementById('auth-role-group');
    const termsGroup = document.getElementById('auth-terms-group');
    const submitBtn = document.getElementById('auth-submit-btn');
    const tabLogin = document.getElementById('auth-tab-login');
    const tabRegister = document.getElementById('auth-tab-register');

    if (mode === 'register') {
        if (emailGroup) emailGroup.classList.remove('hidden');
        if (roleGroup) roleGroup.classList.remove('hidden');
        if (termsGroup) termsGroup.classList.remove('hidden');
        if (submitBtn) submitBtn.textContent = 'Create Account';
        if (tabRegister) {
            tabRegister.className = 'flex-1 py-1.5 rounded-md text-xs font-semibold text-white bg-[#161920] transition';
        }
        if (tabLogin) {
            tabLogin.className = 'flex-1 py-1.5 rounded-md text-xs font-semibold text-slate-400 transition';
        }
    } else {
        if (emailGroup) emailGroup.classList.add('hidden');
        if (roleGroup) roleGroup.classList.add('hidden');
        if (termsGroup) termsGroup.classList.add('hidden');
        if (submitBtn) submitBtn.textContent = 'Log In';
        if (tabLogin) {
            tabLogin.className = 'flex-1 py-1.5 rounded-md text-xs font-semibold text-white bg-[#161920] transition';
        }
        if (tabRegister) {
            tabRegister.className = 'flex-1 py-1.5 rounded-md text-xs font-semibold text-slate-400 transition';
        }
    }
}

// ==========================================
// GESTIONE TEMA CHIARO / SCURO
// ==========================================
function toggleTheme() {
    const currentTheme = localStorage.getItem('prodevunity_theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('prodevunity_theme', newTheme);
    applySavedTheme();
}

function applySavedTheme() {
    const savedTheme = localStorage.getItem('prodevunity_theme') || 'dark';
    if (savedTheme === 'light') {
        document.documentElement.classList.add('light-theme');
    } else {
        document.documentElement.classList.remove('light-theme');
    }
}
