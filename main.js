const API_BASE_URL = 'https://prodevunity-backend.onrender.com';

let currentUser = JSON.parse(localStorage.getItem('prodevunity_user')) || null;
let authMode = 'login';

// ==========================================
// SOSTITUZIONE POPUP NATIVI (NO ALERT NETLIFY)
// ==========================================
window.alert = function (message) {
    let toast = document.getElementById('custom-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'custom-toast';
        toast.className = 'fixed bottom-5 right-5 z-[100] max-w-sm bg-[#13151b] text-slate-100 border border-[#232733] px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-3 transition-all duration-300 transform translate-y-10 opacity-0 pointer-events-none';
        document.body.appendChild(toast);
    }
    
    toast.innerHTML = `
        <div class="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-xs flex-shrink-0">
            <i class="fa-solid fa-circle-info"></i>
        </div>
        <p class="text-xs text-slate-200 flex-1 leading-snug">${escapeHTML(message)}</p>
    `;
    
    // Mostra la notifica
    setTimeout(() => {
        toast.classList.remove('translate-y-10', 'opacity-0', 'pointer-events-none');
    }, 10);

    // Nascondi la notifica dopo 3.5 secondi
    clearTimeout(window.toastTimer);
    window.toastTimer = setTimeout(() => {
        toast.classList.add('translate-y-10', 'opacity-0', 'pointer-events-none');
    }, 3500);
};

document.addEventListener('DOMContentLoaded', () => {
    applySavedTheme();
    updateUIAuth();
    checkAuthSession();
});

function escapeHTML(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

async function fetchWithAuth(url, options = {}) {
    options.credentials = 'include';
    options.headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {})
    };
    return await fetch(url, options);
}

// ==========================================
// MODALE AUTENTICAZIONE
// ==========================================

function openAuthModal(mode = 'login') {
    authMode = mode;
    const modal = document.getElementById('auth-modal');
    const title = document.getElementById('modal-title');
    const submitBtn = document.getElementById('auth-submit-btn');
    const toggleText = document.getElementById('auth-toggle-text');
    const roleGroup = document.getElementById('role-select-group');

    if (!modal) return;

    if (mode === 'register') {
        if (title) title.textContent = 'Crea il tuo Account';
        if (submitBtn) submitBtn.textContent = 'Registrati Ora';
        if (toggleText) toggleText.innerHTML = 'Hai già un account? <a href="#" onclick="openAuthModal(\'login\')" class="text-blue-400 font-bold">Accedi</a>';
        if (roleGroup) roleGroup.classList.remove('hidden');
    } else {
        if (title) title.textContent = 'Accedi a ProDevUnity';
        if (submitBtn) submitBtn.textContent = 'Accedi';
        if (toggleText) toggleText.innerHTML = 'Non hai un account? <a href="#" onclick="openAuthModal(\'register\')" class="text-blue-400 font-bold">Registrati</a>';
        if (roleGroup) roleGroup.classList.add('hidden');
    }

    modal.classList.remove('hidden');
}

function closeAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) modal.classList.add('hidden');
}

async function handleAuthSubmit(e) {
    e.preventDefault();
    const usernameInput = document.getElementById('auth-username');
    const passwordInput = document.getElementById('auth-password');
    const roleInput = document.getElementById('auth-role');

    const username = usernameInput ? usernameInput.value.trim() : '';
    const password = passwordInput ? passwordInput.value.trim() : '';
    const role = roleInput ? roleInput.value : 'dev';

    if (!username || !password) {
        alert('Compila tutti i campi obbligatori.');
        return;
    }

    const endpoint = authMode === 'register' ? '/api/auth/register' : '/api/auth/login';

    try {
        const res = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ username, password, role })
        });

        const data = await res.json();

        if (res.ok) {
            if (authMode === 'register') {
                alert('Registrazione completata! Ora effettua il login.');
                openAuthModal('login');
            } else {
                currentUser = data.user;
                localStorage.setItem('prodevunity_user', JSON.stringify(currentUser));
                closeAuthModal();
                window.location.href = 'feed.html';
            }
        } else {
            alert(data.error || 'Errore durante la richiesta.');
        }
    } catch (err) {
        alert('Impossibile contattare il server.');
    }
}

// ==========================================
// SESSIONE & LOGOUT
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
        console.error("Errore sessione:", err);
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
    if (logoutBtn) logoutBtn.style.display = currentUser ? 'block' : 'none';
    if (loginBtn) loginBtn.style.display = currentUser ? 'none' : 'block';
}

async function logout() {
    try {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
            method: 'POST',
            credentials: 'include'
        });
    } catch (err) {
        console.error("Errore logout:", err);
    } finally {
        currentUser = null;
        localStorage.removeItem('prodevunity_user');
        window.location.href = 'index.html';
    }
}

// ==========================================
// TEMA CHIARO / SCURO
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
