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
// GESTIONE TEMA CHIARO / SCURO (LIGHT / DARK)
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
