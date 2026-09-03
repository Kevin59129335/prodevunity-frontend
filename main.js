// ==========================================
// CONFIGURAZIONE API & BASE URL
// ==========================================
const API_BASE_URL = 'https://prodevunity-backend.onrender.com';[cite: 10]

// Stato globale dell'utente
let currentUser = JSON.parse(localStorage.getItem('prodevunity_user')) || null;[cite: 10]
let authMode = 'login';

// ==========================================
// INIZIALIZZAZIONE AL CARICAMENTO DELLA PAGINA
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    applySavedTheme();[cite: 10]
    updateUIAuth();[cite: 10]
    checkAuthSession();[cite: 10]
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
        const res = await fetch(`${API_BASE_URL}/api/auth/me`, {[cite: 10]
            method: 'GET',
            credentials: 'include'[cite: 10]
        });
        if (res.ok) {[cite: 10]
            const data = await res.json();[cite: 10]
            currentUser = data.user;[cite: 10]
            localStorage.setItem('prodevunity_user', JSON.stringify(currentUser));[cite: 10]
        } else {
            currentUser = null;[cite: 10]
            localStorage.removeItem('prodevunity_user');[cite: 10]
        }
    } catch (err) {
        console.error("Errore nel recupero della sessione:", err);[cite: 10]
    }
    updateUIAuth();[cite: 10]
}

function updateUIAuth() {
    const userDisplay = document.getElementById('current-username-display');[cite: 10]
    const logoutBtn = document.getElementById('logout-btn');[cite: 10]
    const loginBtn = document.getElementById('login-btn');

    if (userDisplay) {
        userDisplay.textContent = currentUser ? `@${currentUser.username}` : '@guest';[cite: 10]
    }

    if (logoutBtn) {
        logoutBtn.style.display = currentUser ? 'block' : 'none';[cite: 10]
    }

    if (loginBtn) {
        loginBtn.style.display = currentUser ? 'none' : 'block';
    }
}

// Handler form modale (Login / Register)
async function handleAuth(e) {
    e.preventDefault();[cite: 8]
    const username = document.getElementById('auth-username').value;[cite: 8]
    const password = document.getElementById('auth-password').value;[cite: 8]

    if (authMode === 'login') {
        await login(username, password);
    } else {
        const email = document.getElementById('auth-email').value;[cite: 8]
        const role = document.getElementById('auth-role').value;[cite: 8]
        await register(username, email, password, role);
    }
}

async function login(username, password) {
    try {
        const res = await fetch(`${API_BASE_URL}/api/auth/login`, {[cite: 10]
            method: 'POST',[cite: 10]
            headers: { 'Content-Type': 'application/json' },[cite: 10]
            credentials: 'include',[cite: 10]
            body: JSON.stringify({ username, password })[cite: 10]
        });

        const data = await res.json();[cite: 10]
        if (res.ok) {[cite: 10]
            currentUser = data.user;[cite: 10]
            localStorage.setItem('prodevunity_user', JSON.stringify(currentUser));[cite: 10]
            window.location.href = 'feed.html';[cite: 10]
        } else {
            alert(data.error || 'Credenziali non valide');[cite: 10]
        }
    } catch (err) {
        console.error(err);[cite: 10]
        alert('Errore di connessione con il backend Render.');
    }
}

async function register(username, email, password, role = 'dev') {
    try {
        const res = await fetch(`${API_BASE_URL}/api/auth/register`, {[cite: 10]
            method: 'POST',[cite: 10]
            headers: { 'Content-Type': 'application/json' },[cite: 10]
            credentials: 'include',[cite: 10]
            body: JSON.stringify({ username, email, password, role })[cite: 10]
        });

        const data = await res.json();[cite: 10]
        if (res.ok) {[cite: 10]
            alert('Registrazione completata! Ora puoi effettuare il login.');[cite: 10]
            setAuthMode('login');
        } else {
            alert(data.error || 'Errore durante la registrazione');[cite: 10]
        }
    } catch (err) {
        console.error(err);[cite: 10]
        alert('Errore durante la comunicazione con il server.');[cite: 10]
    }
}

async function logout() {
    try {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {[cite: 10]
            method: 'POST',[cite: 10]
            credentials: 'include'[cite: 10]
        });
    } catch (err) {
        console.error("Errore durante il logout dal server:", err);[cite: 10]
    } finally {
        currentUser = null;[cite: 10]
        localStorage.removeItem('prodevunity_user');[cite: 10]
        window.location.href = 'index.html';[cite: 10]
    }
}

// ==========================================
// CONTROLLI MODALE DI AUTENTICAZIONE
// ==========================================
function openAuthModal(mode = 'login') {
    const modal = document.getElementById('auth-modal');[cite: 8]
    if (modal) {
        modal.classList.remove('hidden');
        setAuthMode(mode);
    }
}

function closeAuthModal() {
    const modal = document.getElementById('auth-modal');[cite: 8]
    if (modal) modal.classList.add('hidden');
}

function setAuthMode(mode) {
    authMode = mode;
    const emailGroup = document.getElementById('auth-email-group');[cite: 8]
    const roleGroup = document.getElementById('auth-role-group');[cite: 8]
    const termsGroup = document.getElementById('auth-terms-group');[cite: 8]
    const submitBtn = document.getElementById('auth-submit-btn');[cite: 8]
    const tabLogin = document.getElementById('auth-tab-login');[cite: 8]
    const tabRegister = document.getElementById('auth-tab-register');[cite: 8]

    if (mode === 'register') {
        if (emailGroup) emailGroup.classList.remove('hidden');
        if (roleGroup) roleGroup.classList.remove('hidden');
        if (termsGroup) termsGroup.classList.remove('hidden');
        if (submitBtn) submitBtn.textContent = 'Create Account';
        if (tabRegister) {
            tabRegister.className = 'flex-1 py-1.5 rounded-md text-xs font-semibold text-white bg-[#161920] transition';[cite: 8]
        }
        if (tabLogin) {
            tabLogin.className = 'flex-1 py-1.5 rounded-md text-xs font-semibold text-slate-400 transition';[cite: 8]
        }
    } else {
        if (emailGroup) emailGroup.classList.add('hidden');
        if (roleGroup) roleGroup.classList.add('hidden');
        if (termsGroup) termsGroup.classList.add('hidden');
        if (submitBtn) submitBtn.textContent = 'Log In';
        if (tabLogin) {
            tabLogin.className = 'flex-1 py-1.5 rounded-md text-xs font-semibold text-white bg-[#161920] transition';[cite: 8]
        }
        if (tabRegister) {
            tabRegister.className = 'flex-1 py-1.5 rounded-md text-xs font-semibold text-slate-400 transition';[cite: 8]
        }
    }
}

// ==========================================
// GESTIONE TEMA CHIARO / SCURO
// ==========================================
function toggleTheme() {
    const currentTheme = localStorage.getItem('prodevunity_theme') || 'dark';[cite: 10]
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';[cite: 10]
    localStorage.setItem('prodevunity_theme', newTheme);[cite: 10]
    applySavedTheme();[cite: 10]
}

function applySavedTheme() {
    const savedTheme = localStorage.getItem('prodevunity_theme') || 'dark';[cite: 10]
    if (savedTheme === 'light') {
        document.documentElement.classList.add('light-theme');[cite: 10]
    } else {
        document.documentElement.classList.remove('light-theme');[cite: 10]
    }
}
