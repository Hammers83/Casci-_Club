let isLoginMode = true;

/**
 * Mostra / nasconde la password al click sull'icona dell'occhio.
 */
window.togglePasswordVisibility = function (inputId, btn) {
    const input = document.getElementById(inputId);
    const icon = btn?.querySelector("i");

    if (!input || !icon) return;

    if (input.type === "password") {
        input.type = "text";
        icon.classList.remove("fa-eye");
        icon.classList.add("fa-eye-slash");
    } else {
        input.type = "password";
        icon.classList.remove("fa-eye-slash");
        icon.classList.add("fa-eye");
    }
};

/**
 * Controlla i requisiti di sicurezza della password.
 *
 * Requisiti:
 * - almeno 8 caratteri
 * - almeno una lettera minuscola
 * - almeno una lettera maiuscola
 * - almeno un numero
 * - almeno un simbolo
 */
function isPasswordStrong(password) {
    const strongPasswordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

    return strongPasswordRegex.test(password);
}

/**
 * Inizializzazione pagina.
 */
document.addEventListener("DOMContentLoaded", async () => {
    const authForm = document.getElementById("auth-form");

    // Gestione cambio Login / Registrazione
    document.addEventListener("click", (e) => {
        const toggleButton = e.target.closest("#btn-toggle-auth");

        if (!toggleButton) return;

        e.preventDefault();

        isLoginMode = !isLoginMode;
        renderAuthForm();
    });

    // Submit form
    if (authForm) {
        authForm.addEventListener("submit", handleAuthSubmit);
    }

    // Render iniziale
    renderAuthForm();

    // Controllo sessione già esistente
    try {
        if (
            window.supabaseClient &&
            window.supabaseClient.auth
        ) {
            const {
                data: { session },
                error
            } = await window.supabaseClient.auth.getSession();

            if (error) {
                console.error(
                    "Errore durante il recupero della sessione:",
                    error
                );
                return;
            }

            if (session) {
                const { data: profile, error: profileError } =
                    await window.supabaseClient
                        .from("profiles")
                        .select("is_admin")
                        .eq("id", session.user.id)
                        .maybeSingle();

                if (profileError) {
                    console.error(
                        "Errore durante il recupero del profilo:",
                        profileError
                    );
                    return;
                }

                if (profile) {
                    redirectAfterLogin(profile.is_admin);
                }
            }
        }
    } catch (err) {
        console.error(
            "Errore durante il controllo della sessione:",
            err
        );
    }
});

/**
 * Renderizza il form Login / Registrazione.
 */
function renderAuthForm() {
    const headerTitle = document.getElementById("form-header-title");
    const subtitle = document.getElementById("auth-subtitle");
    const submitBtn = document.getElementById("auth-submit-btn");
    const switchText = document.getElementById("auth-switch-text");
    const container = document.getElementById("form-fields-container");
    const errorContainer = document.getElementById(
        "login-error-container"
    );

    if (!container) return;

    if (errorContainer) {
        errorContainer.innerHTML = "";
    }

    if (isLoginMode) {
        // =========================
        // LOGIN
        // =========================

        if (headerTitle) {
            headerTitle.innerText = "Accedi";
        }

        if (subtitle) {
            subtitle.innerText =
                "Inserisci le tue credenziali per accedere";
        }

        if (submitBtn) {
            submitBtn.innerText = "Entra";
        }

        if (switchText) {
            switchText.innerHTML = `
                Non hai un account?
                <button type="button" id="btn-toggle-auth" class="auth-switch-btn">
                    Registrati
                </button>
            `;
        }

        container.innerHTML = `
            <div class="form-group">
                <label for="auth-email">Email</label>
                <input
                    type="email"
                    id="auth-email"
                    name="email"
                    autocomplete="email"
                    placeholder="La tua email"
                    required
                >
            </div>

            <div class="form-group">
                <label for="auth-password">Password</label>

                <div class="password-wrapper">
                    <input
                        type="password"
                        id="auth-password"
                        name="password"
                        autocomplete="current-password"
                        placeholder="La tua password"
                        required
                    >

                    <button
                        type="button"
                        class="password-toggle"
                        onclick="togglePasswordVisibility('auth-password', this)"
                        aria-label="Mostra password"
                    >
                        <i class="fa-solid fa-eye"></i>
                    </button>
                </div>
            </div>
        `;
    } else {
        // =========================
        // REGISTRAZIONE
        // =========================

        if (headerTitle) {
            headerTitle.innerText = "Iscrizione al Club";
        }

        if (subtitle) {
            subtitle.innerText =
                "Iscriviti a CASCIA' CLUB e presenta la tua auto";
        }

        if (submitBtn) {
            submitBtn.innerText = "Completa Iscrizione";
        }

        if (switchText) {
            switchText.innerHTML = `
                Hai già un account?
                <button type="button" id="btn-toggle-auth" class="auth-switch-btn">
                    Accedi
                </button>
            `;
        }

        container.innerHTML = `
            <!-- DATI PERSONALI -->
            <div class="form-section">
                <h3>Dati personali</h3>

                <div class="form-group">
                    <label for="signup-nome">Nome</label>
                    <input
                        type="text"
                        id="signup-nome"
                        name="nome"
                        autocomplete="given-name"
                        placeholder="Il tuo nome"
                        required
                    >
                </div>

                <div class="form-group">
                    <label for="signup-cognome">Cognome</label>
                    <input
                        type="text"
                        id="signup-cognome"
                        name="cognome"
                        autocomplete="family-name"
                        placeholder="Il tuo cognome"
                        required
                    >
                </div>

                <div class="form-group">
                    <label for="signup-data-nascita">
                        Data di nascita
                    </label>

                    <input
                        type="date"
                        id="signup-data-nascita"
                        name="data_nascita"
                        autocomplete="bday"
                        required
                    >
                </div>

                <div class="form-group">
                    <label for="signup-telefono">Telefono</label>

                    <input
                        type="tel"
                        id="signup-telefono"
                        name="telefono"
                        autocomplete="tel"
                        placeholder="Il tuo numero di telefono"
                        required
                    >
                </div>

                <div class="form-group">
                    <label for="auth-email">Email</label>

                    <input
                        type="email"
                        id="auth-email"
                        name="email"
                        autocomplete="email"
                        placeholder="La tua email"
                        required
                    >
                </div>
            </div>

            <!-- AUTO -->
            <div class="form-section">
                <h3>La tua auto</h3>

                <div class="form-group">
                    <label for="signup-car-brand">Marca</label>

                    <input
                        type="text"
                        id="signup-car-brand"
                        name="car_brand"
                        placeholder="Es. BMW, Ferrari, Porsche..."
                    >
                </div>

                <div class="form-group">
                    <label for="signup-car-model">Modello</label>

                    <input
                        type="text"
                        id="signup-car-model"
                        name="car_model"
                        placeholder="Es. M3, 911, Giulia..."
                    >
                </div>

                <div class="form-group">
                    <label for="signup-car-year">Anno</label>

                    <input
                        type="number"
                        id="signup-car-year"
                        name="car_year"
                        min="1900"
                        max="${new Date().getFullYear()}"
                        placeholder="Es. 2020"
                    >
                </div>

                <div class="form-group">
                    <label for="signup-car-category">
                        Categoria
                    </label>

                    <select
                        id="signup-car-category"
                        name="car_category"
                    >
                        <option value="">
                            Seleziona una categoria
                        </option>

                        <option value="fuoristrada">
                            Fuoristrada
                        </option>

                        <option value="auto_epoca">
                            Auto d'Epoca
                        </option>

                        <option value="auto_sportiva">
                            Auto Sportiva
                        </option>

                        <option value="altro">
                            Altro
                        </option>
                    </select>
                </div>
            </div>

            <!-- PASSWORD -->
            <div class="form-section">
                <h3>Sicurezza</h3>

                <div class="form-group">
                    <label for="auth-password">Password</label>

                    <div class="password-wrapper">
                        <input
                            type="password"
                            id="auth-password"
                            name="password"
                            autocomplete="new-password"
                            placeholder="Crea una password"
                            required
                        >

                        <button
                            type="button"
                            class="password-toggle"
                            onclick="togglePasswordVisibility('auth-password', this)"
                            aria-label="Mostra password"
                        >
                            <i class="fa-solid fa-eye"></i>
                        </button>
                    </div>
                </div>

                <div class="form-group">
                    <label for="signup-confirm-password">
                        Conferma Password
                    </label>

                    <div class="password-wrapper">
                        <input
                            type="password"
                            id="signup-confirm-password"
                            name="confirm_password"
                            autocomplete="new-password"
                            placeholder="Ripeti la password"
                            required
                        >

                        <button
                            type="button"
                            class="password-toggle"
                            onclick="togglePasswordVisibility('signup-confirm-password', this)"
                            aria-label="Mostra password"
                        >
                            <i class="fa-solid fa-eye"></i>
                        </button>
                    </div>
                </div>

                <p class="password-hint">
                    Min. 8 caratteri: 1 maiuscola, 1 minuscola,
                    1 numero e 1 simbolo.
                </p>
            </div>
        `;
    }
}

/**
 * Gestione submit del form.
 */
async function handleAuthSubmit(e) {
    e.preventDefault();

    clearAuthError();

    if (isLoginMode) {
        await handleLogin();
    } else {
        await handleSignup();
    }
}

/**
 * Effettua il login.
 */
async function handleLogin() {
    const emailInput = document.getElementById("auth-email");
    const passwordInput = document.getElementById("auth-password");

    if (!emailInput || !passwordInput) {
        showAuthError("Impossibile trovare i campi di accesso.");
        return;
    }

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
        showAuthError("Inserisci email e password.");
        return;
    }

    if (!window.supabaseClient?.auth) {
        showAuthError(
            "Il sistema di autenticazione non è disponibile."
        );
        return;
    }

    try {
        const {
            data,
            error
        } = await window.supabaseClient.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            console.error("Errore Login Supabase:", error);

            showAuthError(
                "Email o password non corretti."
            );

            return;
        }

        if (!data?.user) {
            showAuthError(
                "Impossibile recuperare i dati dell'utente."
            );

            return;
        }

        // Recupero profilo
        const {
            data: profile,
            error: profileError
        } = await window.supabaseClient
            .from("profiles")
            .select("is_admin")
            .eq("id", data.user.id)
            .maybeSingle();

        if (profileError) {
            console.error(
                "Errore recupero profilo:",
                profileError
            );

            showAuthError(
                "Accesso effettuato, ma si è verificato un errore nel recupero del profilo."
            );

            return;
        }

        redirectAfterLogin(profile?.is_admin === true);
    } catch (err) {
        console.error("Errore durante il login:", err);

        showAuthError(
            "Si è verificato un errore durante l'accesso."
        );
    }
}

/**
 * Effettua la registrazione.
 */
async function handleSignup() {
    try {
        const email = getInputValue("auth-email");
        const password = getInputValue("auth-password");
        const confirmPassword = getInputValue(
            "signup-confirm-password"
        );

        const nome = getInputValue("signup-nome");
        const cognome = getInputValue("signup-cognome");
        const dataNascita = getInputValue("signup-data-nascita");
        const telefono = getInputValue("signup-telefono");

        const carBrand = getInputValue("signup-car-brand");
        const carModel = getInputValue("signup-car-model");
        const carYear = getInputValue("signup-car-year");
        const carCategory = getInputValue(
            "signup-car-category"
        );

        // =========================
        // VALIDAZIONE
        // =========================

        if (
            !email ||
            !password ||
            !confirmPassword ||
            !nome ||
            !cognome ||
            !dataNascita ||
            !telefono
        ) {
            showAuthError(
                "Compila tutti i campi obbligatori."
            );

            return;
        }

        if (password !== confirmPassword) {
            showAuthError(
                "Le password non coincidono."
            );

            return;
        }

        if (!isPasswordStrong(password)) {
            showAuthError(
                "La password non soddisfa i requisiti di sicurezza. " +
                "Deve contenere almeno 8 caratteri, una lettera maiuscola, " +
                "una minuscola, un numero e un simbolo."
            );

            return;
        }

        // Validazione anno auto
        let parsedCarYear = null;

        if (carYear) {
            parsedCarYear = parseInt(carYear, 10);

            const currentYear = new Date().getFullYear();

            if (
                Number.isNaN(parsedCarYear) ||
                parsedCarYear < 1900 ||
                parsedCarYear > currentYear
            ) {
                showAuthError(
                    `L'anno dell'auto deve essere compreso tra 1900 e ${currentYear}.`
                );

                return;
            }
        }

        if (!window.supabaseClient?.auth) {
            showAuthError(
                "Il sistema di autenticazione non è disponibile."
            );

            return;
        }

        // =========================
        // CREAZIONE ACCOUNT
        // =========================

        const {
            data: authData,
            error: authError
        } = await window.supabaseClient.auth.signUp({
            email,
            password,

            options: {
                data: {
                    nome,
                    cognome,
                    data_nascita: dataNascita,
                    telefono,

                    car_brand: carBrand || null,
                    car_model: carModel || null,
                    car_year: parsedCarYear,
                    car_category: carCategory || null
                }
            }
        });

        if (authError) {
            console.error(
                "Errore registrazione Supabase:",
                authError
            );

            showAuthError(
                getSupabaseAuthErrorMessage(authError)
            );

            return;
        }

        if (!authData?.user) {
            showAuthError(
                "Errore durante la creazione dell'account."
            );

            return;
        }

        // =========================
        // CREAZIONE PROFILO
        // =========================
        //
        // Se la conferma email è disabilitata,
        // Supabase restituisce subito una sessione.
        //
        // Se la conferma email è obbligatoria,
        // il profilo può essere creato tramite trigger
        // oppure tramite una Edge Function/backend.

        if (authData.session) {
            const {
                error: profileError
            } = await window.supabaseClient
                .from("profiles")
                .upsert(
                    [
                        {
                            id: authData.user.id,

                            nome,
                            cognome,
                            data_nascita: dataNascita,
                            telefono,
                            email,

                            is_admin: false,

                            car_brand: carBrand || null,
                            car_model: carModel || null,
                            car_year: parsedCarYear,
                            car_category: carCategory || null
                        }
                    ],
                    {
                        onConflict: "id"
                    }
                );

            if (profileError) {
                console.error(
                    "Errore creazione profilo:",
                    profileError
                );

                showAuthError(
                    "Account creato, ma si è verificato un errore nella creazione del profilo."
                );

                return;
            }

            alert(
                "Iscrizione completata con successo! " +
                "Benvenuto/a in CASCIA' CLUB."
            );

            window.location.href =
                "pages/dashboard-socio.html";

            return;
        }

        // =========================
        // CONFERMA EMAIL
        // =========================

        alert(
            "Registrazione completata! " +
            "Controlla la tua email per confermare l'account."
        );

        isLoginMode = true;
        renderAuthForm();

    } catch (err) {
        console.error(
            "Errore durante la registrazione:",
            err
        );

        showAuthError(
            "Si è verificato un errore durante la registrazione."
        );
    }
}

/**
 * Recupera in sicurezza il valore di un input.
 */
function getInputValue(id) {
    const element = document.getElementById(id);

    return element
        ? element.value.trim()
        : "";
}

/**
 * Reindirizza l'utente alla dashboard corretta.
 */
function redirectAfterLogin(isAdmin) {
    if (isAdmin) {
        window.location.href =
            "pages/dashboard-admin.html";
    } else {
        window.location.href =
            "pages/dashboard-socio.html";
    }
}

/**
 * Mostra un errore nel form.
 */
function showAuthError(msg) {
    const errorContainer = document.getElementById(
        "login-error-container"
    );

    if (!errorContainer) return;

    errorContainer.innerHTML = `
        <div class="auth-error" role="alert">
            <i class="fa-solid fa-circle-exclamation"></i>
            <span>${escapeHtml(msg)}</span>
        </div>
    `;
}

/**
 * Cancella gli errori precedenti.
 */
function clearAuthError() {
    const errorContainer = document.getElementById(
        "login-error-container"
    );

    if (errorContainer) {
        errorContainer.innerHTML = "";
    }
}

/**
 * Converte eventuali caratteri HTML per evitare
 * l'inserimento diretto di contenuto non sicuro nel DOM.
 */
function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/**
 * Traduce alcuni errori comuni di Supabase
 * in messaggi più comprensibili.
 */
function getSupabaseAuthErrorMessage(error) {
    const message = error?.message || "";

    if (
        message.toLowerCase().includes("already registered") ||
        message.toLowerCase().includes("already been registered") ||
        message.toLowerCase().includes("user already registered")
    ) {
        return "Esiste già un account con questa email.";
    }

    if (
        message.toLowerCase().includes("password") &&
        message.toLowerCase().includes("weak")
    ) {
        return "La password scelta è troppo debole.";
    }

    if (
        message.toLowerCase().includes("invalid email")
    ) {
        return "Inserisci un indirizzo email valido.";
    }

    return message ||
        "Si è verificato un errore durante la registrazione.";
}


/*let isLoginMode = true;

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
}*/
