let isLoginMode = true;

// Mostra / nascondi password al click sull'occhio
window.togglePasswordVisibility = function(inputId, btn) {
    const input = document.getElementById(inputId);
    const icon = btn.querySelector('i');
    if (!input || !icon) return;

    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
};

// Controllo requisiti di sicurezza della password
function isPasswordStrong(password) {
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
    return strongPasswordRegex.test(password);
}

document.addEventListener('DOMContentLoaded', async () => {
    document.addEventListener('click', (e) => {
        if (e.target && e.target.id === 'btn-toggle-auth') {
            e.preventDefault();
            isLoginMode = !isLoginMode;
            renderAuthForm();
        }
    });

    const authForm = document.getElementById('auth-form');
    if (authForm) authForm.addEventListener('submit', handleAuthSubmit);

    renderAuthForm();

    try {
        if (window.supabaseClient && window.supabaseClient.auth) {
            const { data: { session } } = await window.supabaseClient.auth.getSession();
            if (session) {
                const { data: profile } = await window.supabaseClient
                    .from('profiles')
                    .select('is_admin')
                    .eq('id', session.user.id)
                    .single();

                if (profile) {
                    window.location.href = profile.is_admin ? 'pages/dashboard-admin.html' : 'pages/dashboard-socio.html';
                }
            }
        }
    } catch (err) {
        console.error("Errore durante il controllo della sessione:", err);
    }
});

function renderAuthForm() {
    const headerTitle = document.getElementById('form-header-title');
    const subtitle = document.getElementById('auth-subtitle');
    const submitBtn = document.getElementById('auth-submit-btn');
    const switchText = document.getElementById('auth-switch-text');
    const container = document.getElementById('form-fields-container');
    const errorContainer = document.getElementById('login-error-container');

    if (!container) return;
    if (errorContainer) errorContainer.innerHTML = '';

    if (isLoginMode) {
        if (headerTitle) headerTitle.innerText = "Accedi";
        if (subtitle) subtitle.innerText = "Inserisci le tue credenziali per accedere";
        if (submitBtn) submitBtn.innerText = "Entra";
        if (switchText) {
            switchText.innerHTML = `Non hai un account? <button type="button" id="btn-toggle-auth" class="text-brand-azzurro font-bold hover:underline ml-1">Registrati</button>`;
        }

        container.innerHTML = `
            <div>
                <label class="block text-xs font-bold text-gray-400 uppercase mb-1">Email</label>
                <input type="email" id="auth-email" required class="w-full px-4 py-3 bg-brand-dark border border-brand-border rounded-xl text-white text-sm focus:outline-none focus:border-brand-azzurro">
            </div>
            <div>
                <label class="block text-xs font-bold text-gray-400 uppercase mb-1">Password</label>
                <div class="relative">
                    <input type="password" id="auth-password" required class="w-full px-4 py-3 bg-brand-dark border border-brand-border rounded-xl text-white text-sm focus:outline-none focus:border-brand-azzurro pr-10">
                    <button type="button" onclick="togglePasswordVisibility('auth-password', this)" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition">
                        <i class="fa-solid fa-eye"></i>
                    </button>
                </div>
            </div>
        `;
    } else {
        if (headerTitle) headerTitle.innerText = "Iscrizione al Club";
        if (subtitle) subtitle.innerText = "Iscriviti a CASCIA' CLUB e presenta la tua auto";
        if (submitBtn) submitBtn.innerText = "Completa Iscrizione";
        if (switchText) {
            switchText.innerHTML = `Hai già un account? <button type="button" id="btn-toggle-auth" class="text-brand-azzurro font-bold hover:underline ml-1">Accedi</button>`;
        }

        container.innerHTML = `
            <div class="grid grid-cols-2 gap-3">
                <div>
                    <label class="block text-xs font-bold text-gray-400 uppercase mb-1">Nome</label>
                    <input type="text" id="signup-nome" required class="w-full px-3 py-2 bg-brand-dark border border-brand-border rounded-xl text-white text-sm focus:outline-none focus:border-brand-azzurro">
                </div>
                <div>
                    <label class="block text-xs font-bold text-gray-400 uppercase mb-1">Cognome</label>
                    <input type="text" id="signup-cognome" required class="w-full px-3 py-2 bg-brand-dark border border-brand-border rounded-xl text-white text-sm focus:outline-none focus:border-brand-azzurro">
                </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
                <div>
                    <label class="block text-xs font-bold text-gray-400 uppercase mb-1">Data di Nascita</label>
                    <input type="date" id="signup-data-nascita" required class="w-full px-4 py-2.5 bg-brand-dark border border-brand-border rounded-xl text-white text-sm focus:outline-none focus:border-brand-azzurro">
                </div>
                <div>
                    <label class="block text-xs font-bold text-gray-400 uppercase mb-1">Telefono</label>
                    <input type="tel" id="signup-telefono" required placeholder="333 0000000" class="w-full px-4 py-2.5 bg-brand-dark border border-brand-border rounded-xl text-white text-sm focus:outline-none focus:border-brand-azzurro">
                </div>
            </div>

            <div>
                <label class="block text-xs font-bold text-gray-400 uppercase mb-1">Email</label>
                <input type="email" id="auth-email" required class="w-full px-4 py-2.5 bg-brand-dark border border-brand-border rounded-xl text-white text-sm focus:outline-none focus:border-brand-azzurro">
            </div>

            <div class="pt-2 border-t border-brand-border">
                <p class="text-[11px] font-black text-brand-azzurro uppercase mb-2"><i class="fa-solid fa-car-side mr-1"></i> La tua auto</p>
                <div class="grid grid-cols-2 gap-3 mb-3">
                    <div>
                        <label class="block text-xs font-bold text-gray-400 uppercase mb-1">Marca</label>
                        <input type="text" id="signup-car-brand" placeholder="Es. Land Rover" class="w-full px-3 py-2 bg-brand-dark border border-brand-border rounded-xl text-white text-sm focus:outline-none focus:border-brand-azzurro">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-gray-400 uppercase mb-1">Modello</label>
                        <input type="text" id="signup-car-model" placeholder="Es. Defender 90" class="w-full px-3 py-2 bg-brand-dark border border-brand-border rounded-xl text-white text-sm focus:outline-none focus:border-brand-azzurro">
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="block text-xs font-bold text-gray-400 uppercase mb-1">Anno</label>
                        <input type="number" id="signup-car-year" min="1900" max="2100" placeholder="Es. 1988" class="w-full px-3 py-2 bg-brand-dark border border-brand-border rounded-xl text-white text-sm focus:outline-none focus:border-brand-azzurro">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-gray-400 uppercase mb-1">Categoria</label>
                        <select id="signup-car-category" class="w-full px-3 py-2.5 bg-brand-dark border border-brand-border rounded-xl text-white text-sm focus:outline-none focus:border-brand-azzurro">
                            <option value="fuoristrada">Fuoristrada</option>
                            <option value="epoca">Auto d'Epoca</option>
                            <option value="sportiva">Auto Sportiva</option>
                        </select>
                    </div>
                </div>
                <p class="text-[10px] text-gray-500 mt-2"><i class="fa-solid fa-circle-info mr-1"></i>Potrai caricare la foto della tua auto subito dopo l'iscrizione, dalla tua area personale.</p>
            </div>

            <div class="space-y-3 pt-2 border-t border-brand-border">
                <div>
                    <label class="block text-xs font-bold text-gray-400 uppercase mb-1">Password</label>
                    <div class="relative">
                        <input type="password" id="auth-password" required class="w-full px-3 py-2 bg-brand-dark border border-brand-border rounded-xl text-white text-sm focus:outline-none focus:border-brand-azzurro pr-10">
                        <button type="button" onclick="togglePasswordVisibility('auth-password', this)" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition">
                            <i class="fa-solid fa-eye"></i>
                        </button>
                    </div>
                </div>
                <div>
                    <label class="block text-xs font-bold text-gray-400 uppercase mb-1">Conferma Password</label>
                    <div class="relative">
                        <input type="password" id="signup-confirm-password" required class="w-full px-3 py-2 bg-brand-dark border border-brand-border rounded-xl text-white text-sm focus:outline-none focus:border-brand-azzurro pr-10">
                        <button type="button" onclick="togglePasswordVisibility('signup-confirm-password', this)" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition">
                            <i class="fa-solid fa-eye"></i>
                        </button>
                    </div>
                </div>
                <p class="text-[10px] text-gray-400">
                    <i class="fa-solid fa-shield-halved text-brand-azzurro mr-1"></i> Min. 8 caratteri: 1 maiuscola, 1 minuscola, 1 numero e 1 simbolo.
                </p>
            </div>
        `;
    }
}

async function handleAuthSubmit(e) {
    e.preventDefault();
    if (isLoginMode) {
        await handleLogin();
    } else {
        await handleSignup();
    }
}

async function handleLogin() {
    const email = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value;

    const { data, error } = await window.supabaseClient.auth.signInWithPassword({ email, password });
    if (error) {
        return showAuthError("Credenziali non valide o utente non trovato.");
    }

    const { data: profile } = await window.supabaseClient
        .from('profiles')
        .select('is_admin')
        .eq('id', data.user.id)
        .single();

    if (profile) {
        window.location.href = profile.is_admin ? 'pages/dashboard-admin.html' : 'pages/dashboard-socio.html';
    } else {
        window.location.href = 'pages/dashboard-socio.html';
    }
}

async function handleSignup() {
    const email = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value;
    const confirmPassword = document.getElementById('signup-confirm-password').value;

    if (password !== confirmPassword) {
        showAuthError("Le password non coincidono.");
        return;
    }

    if (!isPasswordStrong(password)) {
        showAuthError("La password non soddisfa i requisiti di sicurezza! Deve contenere almeno 8 caratteri, una lettera maiuscola, una minuscola, un numero e un simbolo.");
        return;
    }

    const nome = document.getElementById('signup-nome').value.trim();
    const cognome = document.getElementById('signup-cognome').value.trim();
    const dataNascita = document.getElementById('signup-data-nascita').value;
    const telefono = document.getElementById('signup-telefono').value.trim();
    const carBrand = document.getElementById('signup-car-brand').value.trim();
    const carModel = document.getElementById('signup-car-model').value.trim();
    const carYear = document.getElementById('signup-car-year').value;
    const carCategory = document.getElementById('signup-car-category').value;

    const { data: authData, error: authError } = await window.supabaseClient.auth.signUp({
        email: email,
        password: password,
        options: {
            data: { nome: nome, cognome: cognome }
        }
    });

    if (authError) {
        return showAuthError(authError.message);
    }

    if (!authData.user) {
        return showAuthError("Errore durante la creazione dell'account.");
    }

    const { error: profileError } = await window.supabaseClient
        .from('profiles')
        .upsert([{
            id: authData.user.id,
            nome: nome,
            cognome: cognome,
            data_nascita: dataNascita,
            telefono: telefono,
            email: email,
            is_admin: false,
            car_brand: carBrand || null,
            car_model: carModel || null,
            car_year: carYear ? parseInt(carYear, 10) : null,
            car_category: carCategory || null
        }]);

    if (profileError) {
        showAuthError("Account creato, ma errore nel profilo: " + profileError.message);
        return;
    }

    alert("Iscrizione completata con successo! Benvenuto/a in CASCIA' CLUB.");
    window.location.href = 'pages/dashboard-socio.html';
}

function showAuthError(msg) {
    const errorContainer = document.getElementById('login-error-container');
    if (errorContainer) {
        errorContainer.innerHTML = `
            <div class="p-3 mb-4 text-xs font-bold text-white bg-red-500/20 border border-red-500/50 rounded-xl flex items-center gap-2">
                <i class="fa-solid fa-circle-exclamation text-red-400"></i> ${msg}
            </div>
        `;
    }
}
