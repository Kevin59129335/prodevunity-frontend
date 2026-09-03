const API_BASE_URL = 'https://prodevunity-backend.onrender.com';

let currentUser = JSON.parse(localStorage.getItem('prodevunity_user')) || null;
let authMode = 'login';

// ==========================================
// CUSTOM TOAST NOTIFICATIONS
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
    
    setTimeout(() => {
        toast.classList.remove('translate-y-10', 'opacity-0', 'pointer-events-none');
    }, 10);

    clearTimeout(window.toastTimer);
    window.toastTimer = setTimeout(() => {
        toast.classList.add('translate-y-10', 'opacity-0', 'pointer-events-none');
    }, 3500);
};

// ==========================================
// INITIALIZATION & UTILITIES
// ==========================================
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
// AUTHENTICATION MODAL
// ==========================================
function openAuthModal(mode = 'login') {
    authMode = mode;
    const modal = document.getElementById('auth-modal');
    const title = document.getElementById('modal-title');
    const submitBtn = document.getElementById('auth-submit-btn');
    const toggleText = document.getElementById('auth-toggle-text');
    const roleGroup = document.getElementById('role-select-group');
    
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');

    if (!modal) return;

    if (mode === 'register') {
        if (title) title.textContent = 'Create Your Account';
        if (submitBtn) submitBtn.textContent = 'Register Now';
        if (toggleText) toggleText.innerHTML = 'Already have an account? <a href="#" onclick="openAuthModal(\'login\')" class="text-blue-400 font-bold">Sign In</a>';
        if (roleGroup) roleGroup.classList.remove('hidden');
        
        if (tabRegister) {
            tabRegister.classList.add('bg-[#1c1f28]', 'text-white', 'shadow');
            tabRegister.classList.remove('text-slate-400');
        }
        if (tabLogin) {
            tabLogin.classList.remove('bg-[#1c1f28]', 'text-white', 'shadow');
            tabLogin.classList.add('text-slate-400');
        }

    } else {
        if (title) title.textContent = 'Sign In to ProDevUnity';
        if (submitBtn) submitBtn.textContent = 'Sign In';
        if (toggleText) toggleText.innerHTML = 'Don\'t have an account? <a href="#" onclick="openAuthModal(\'register\')" class="text-blue-400 font-bold">Register</a>';
        if (roleGroup) roleGroup.classList.add('hidden');
        
        if (tabLogin) {
            tabLogin.classList.add('bg-[#1c1f28]', 'text-white', 'shadow');
            tabLogin.classList.remove('text-slate-400');
        }
        if (tabRegister) {
            tabRegister.classList.remove('bg-[#1c1f28]', 'text-white', 'shadow');
            tabRegister.classList.add('text-slate-400');
        }
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
        alert('Please fill in all required fields.');
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
                alert('Registration successful! Please sign in.');
                openAuthModal('login');
            } else {
                currentUser = data.user;
                localStorage.setItem('prodevunity_user', JSON.stringify(currentUser));
                closeAuthModal();
                window.location.href = 'feed.html';
            }
        } else {
            alert(data.error || 'Request error occurred.');
        }
    } catch (err) {
        alert('Unable to connect to the server.');
    }
}

// ==========================================
// SESSION & USER INTERFACE
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
        console.error("Session verification error:", err);
    }
    updateUIAuth();
}

function updateUIAuth() {
    const userDisplay = document.getElementById('current-username-display');
    const logoutBtn = document.getElementById('logout-btn');
    const loginBtn = document.getElementById('login-btn');
    const adminBtn = document.getElementById('admin-nav-btn');

    if (userDisplay) {
        userDisplay.textContent = currentUser ? `@${currentUser.username}` : '@guest';
    }
    if (logoutBtn) logoutBtn.style.display = currentUser ? 'block' : 'none';
    if (loginBtn) loginBtn.style.display = currentUser ? 'none' : 'block';

    if (adminBtn) {
        if (currentUser && currentUser.role === 'admin') {
            adminBtn.classList.remove('hidden');
        } else {
            adminBtn.classList.add('hidden');
        }
    }
}

async function logout() {
    try {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
            method: 'POST',
            credentials: 'include'
        });
    } catch (err) {
        console.error("Error during logout:", err);
    } finally {
        currentUser = null;
        localStorage.removeItem('prodevunity_user');
        window.location.href = 'index.html';
    }
}

// ==========================================
// THEME SWITCHER
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
