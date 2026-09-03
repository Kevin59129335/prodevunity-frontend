// ==========================================
// CONFIGURAZIONE API & BASE URL
// ==========================================
const API_BASE_URL = 'https://prodevunity-backend.onrender.com';

// Stato globale dell'utente
let currentUser = JSON.parse(localStorage.getItem('prodevunity_user')) || null;

// ==========================================
// INIZIALIZZAZIONE AL CARICAMENTO DELLA PAGINA
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    applySavedTheme();
    updateUIAuth();
    checkAuthSession();
});

// ==========================================
// GESTIONE AUTENTICAZIONE E SESSIONE
// ==========================================

// Verifica la sessione lato server con il cookie JWT
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
            // Sessione scaduta o non valida
            currentUser = null;
            localStorage.removeItem('prodevunity_user');
        }
    } catch (err) {
        console.error("Errore nel recupero della sessione:", err);
    }
    updateUIAuth();
}

// Aggiorna gli elementi grafici dell'interfaccia in base al login
function updateUIAuth() {
    const userDisplay = document.getElementById('current-username-display');
    const logoutBtn = document.getElementById('logout-btn');

    if (userDisplay) {
        userDisplay.textContent = currentUser ? `@${currentUser.username}` : '@guest';
    }

    if (logoutBtn) {
        logoutBtn.style.display = currentUser ? 'block' : 'none';
    }
}

// Gestione Login
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
        alert('Errore di connessione con il backend.');
    }
}

// Gestione Registrazione
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
            window.location.href = 'index.html';
        } else {
            alert(data.error || 'Errore durante la registrazione');
        }
    } catch (err) {
        console.error(err);
        alert('Errore durante la comunicazione con il server.');
    }
}

// Gestione Logout
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
