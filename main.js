const API_BASE_URL = 'http://localhost:3000';
let currentUser = JSON.parse(localStorage.getItem('prodevunity_user')) || null;
let authAction = 'login';
let roomEncryptionKeys = JSON.parse(localStorage.getItem('room_encryption_keys')) || {};
let chatPollingInterval = null;

document.addEventListener('DOMContentLoaded', () => {
    updateUserUI();
    setupSmoothNavigation();
    initializePageScripts(window.location.pathname.split('/').pop() || 'index.html');
    window.addEventListener('resize', adjustResponsiveLayout);
});

/* UTILITY PER LA SANIFICAZIONE CONTRO ATTACCHI XSS */
function escapeHTML(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function adjustResponsiveLayout() {
    const mainContainer = document.getElementById('main-container');
    if (!mainContainer) return;

    if (window.innerWidth >= 768) {
        mainContainer.style.paddingLeft = '5rem';
    } else {
        mainContainer.style.paddingLeft = '1rem';
    }
}

/* SPA NAVIGATION ROUTER CON BLOCCO RIGIDO PER NON ISCRITTI */
function setupSmoothNavigation() {
    document.addEventListener('click', async (e) => {
        // Intercetta link del Dock, pulsanti o azioni protette
        const link = e.target.closest('a.dock-item, a[data-smooth], a[href$=".html"]');
        if (!link) return;

        const targetUrl = link.getAttribute('href');
        if (!targetUrl || targetUrl.startsWith('#') || targetUrl.startsWith('http')) return;

        // Se l'utente non è loggato e prova ad accedere a QUALSIASI pagina diversa dalla Landing Page o clicca su sezioni interne
        const isHomePage = targetUrl === 'index.html' || targetUrl === '/';
        if (!currentUser && !isHomePage) {
            e.preventDefault();
            e.stopPropagation();
            openAuthModal();
            return;
        }

        e.preventDefault();

        const currentPath = window.location.pathname.split('/').pop() || 'index.html';
        if (currentPath === targetUrl) return;

        const mainContainer = document.getElementById('main-container');
        if (!mainContainer) return;

        if (chatPollingInterval) {
            clearInterval(chatPollingInterval);
            chatPollingInterval = null;
        }

        mainContainer.classList.add('content-fade-out');

        const loaderTimeout = setTimeout(() => {
            mainContainer.innerHTML = `
                <div class="flex flex-col items-center justify-center py-20 space-y-4">
                    <div class="loader-spinner"></div>
                    <p class="text-xs text-slate-400">Loading, please wait...</p>
                </div>
            `;
            mainContainer.classList.remove('content-fade-out');
        }, 200);

        try {
            const res = await fetch(targetUrl);
            if (!res.ok) throw new Error(`HTTP Error ${res.status}`);

            const htmlText = await res.text();
            clearTimeout(loaderTimeout);

            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlText, 'text/html');
            const newContent = doc.getElementById('main-container').innerHTML;

            setTimeout(() => {
                mainContainer.innerHTML = newContent;
                history.pushState({}, '', targetUrl);

                document.querySelectorAll('.dock-item').forEach(el => el.classList.remove('active'));
                const activeDockItem = document.querySelector(`.dock-item[href="${targetUrl}"]`);
                if (activeDockItem) activeDockItem.classList.add('active');

                mainContainer.classList.remove('content-fade-out');
                adjustResponsiveLayout();
                initializePageScripts(targetUrl);
                updateUserUI();
            }, 150);

        } catch (err) {
            clearTimeout(loaderTimeout);
            setTimeout(() => {
                mainContainer.innerHTML = `
                    <div class="error-state-box space-y-4">
                        <div class="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto text-lg">
                            <i class="fa-solid fa-triangle-exclamation"></i>
                        </div>
                        <div class="space-y-1">
                            <h3 class="text-sm font-bold text-white">Unable to Load Page</h3>
                            <p class="text-xs text-slate-400 leading-relaxed">Check your internet connection or MySQL server status.</p>
                        </div>
                        <button onclick="window.location.reload()" class="flat-btn-primary px-4 py-2 text-xs font-semibold">
                            <i class="fa-solid fa-rotate-right mr-1.5"></i> Retry
                        </button>
                    </div>
                `;
                mainContainer.classList.remove('content-fade-out');
            }, 150);
        }
    });

    window.addEventListener('popstate', () => { window.location.reload(); });
}

function initializePageScripts(pageName) {
    if (pageName.includes('feed') && typeof loadPosts === 'function') loadPosts();
    if (pageName.includes('chat') && typeof loadChannels === 'function') loadChannels();
    if (pageName.includes('directory') && typeof loadAccounts === 'function') loadAccounts();
}

/* AUTHENTICATION MANAGEMENT */
function updateUserUI() {
    const dock = document.getElementById('main-dock');
    if (dock) dock.classList.remove('hidden');

    const userDisplay = document.getElementById('current-username-display');
    const logoutBtn = document.getElementById('logout-btn');
    const loginBtn = document.getElementById('login-btn');

    if (currentUser && currentUser.username) {
        if (userDisplay) userDisplay.innerText = '@' + escapeHTML(currentUser.username);
        if (logoutBtn) logoutBtn.classList.remove('hidden');
        if (loginBtn) loginBtn.classList.add('hidden');
    } else {
        if (userDisplay) userDisplay.innerText = '@guest';
        if (logoutBtn) logoutBtn.classList.add('hidden');
        if (loginBtn) loginBtn.classList.remove('hidden');
    }
    adjustResponsiveLayout();
}

function setAuthMode(mode) {
    authAction = mode;
    document.getElementById('auth-tab-login').className = (mode === 'login') ? "flex-1 py-1.5 rounded-md text-xs font-semibold text-white bg-[#161920] transition" : "flex-1 py-1.5 rounded-md text-xs font-semibold text-slate-400 transition";
    document.getElementById('auth-tab-register').className = (mode === 'register') ? "flex-1 py-1.5 rounded-md text-xs font-semibold text-white bg-[#161920] transition" : "flex-1 py-1.5 rounded-md text-xs font-semibold text-slate-400 transition";
    document.getElementById('auth-role-group').classList.toggle('hidden', mode === 'login');
    document.getElementById('auth-submit-btn').innerText = (mode === 'login') ? "Log In" : "Create Account";
}

async function handleAuth(e) {
    e.preventDefault();
    const username = document.getElementById('auth-username').value.trim();
    const password = document.getElementById('auth-password').value;
    const role = document.getElementById('auth-role')?.value || 'dev';

    try {
        const res = await fetch(`${API_BASE_URL}/api/${authAction}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, role })
        });
        const data = await res.json();
        if (data.ok) {
            currentUser = { id: data.id, username: data.username, token: data.token, role: data.role };
            localStorage.setItem('prodevunity_user', JSON.stringify(currentUser));
            updateUserUI();
            closeAuthModal();
            window.location.href = 'feed.html';
        } else {
            alert('Auth Error: ' + (data.error || 'Failed'));
        }
    } catch (err) {
        alert('Connection error to MySQL server.');
    }
}

function logout() {
    localStorage.removeItem('prodevunity_user');
    currentUser = null;
    if (chatPollingInterval) clearInterval(chatPollingInterval);
    updateUserUI();
    window.location.href = 'index.html';
}

function openAuthModal() { document.getElementById('auth-modal')?.classList.remove('hidden'); }
function closeAuthModal() { document.getElementById('auth-modal')?.classList.add('hidden'); }

/* HELPER PER CHIAMATE API AUTENTICATE */
async function fetchWithAuth(url, options = {}) {
    options.headers = options.headers || {};
    if (currentUser && currentUser.token) {
        options.headers['Authorization'] = `Bearer ${currentUser.token}`;
    }
    return fetch(url, options);
}

/* E2E ENCRYPTION HELPERS FOR PRIVATE CHAT */
function encryptText(plainText, secretKey) {
    if (!secretKey || typeof CryptoJS === 'undefined') return plainText;
    return CryptoJS.AES.encrypt(plainText, secretKey).toString();
}

function decryptText(cipherText, secretKey) {
    if (!secretKey || typeof CryptoJS === 'undefined') return cipherText;
    try {
        const bytes = CryptoJS.AES.decrypt(cipherText, secretKey);
        const originalText = bytes.toString(CryptoJS.enc.Utf8);
        return originalText || '🔒 [Encrypted Message - Key Mismatch]';
    } catch (e) {
        return '🔒 [Encrypted Message - Unable to Decrypt]';
    }
}