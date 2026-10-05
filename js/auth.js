// ============================================================
// CASCIA' CLUB - AUTH
// Login / Registrazione / Gestione Sessione
// ============================================================

let isLoginMode = true;


// ============================================================
// MOSTRA / NASCONDI PASSWORD
// ============================================================

window.togglePasswordVisibility = function (inputId, btn) {
    const input = document.getElementById(inputId);

    if (!input || !btn) {
        return;
    }

    const icon = btn.querySelector("i");

    if (!icon) {
        return;
    }

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


// ============================================================
// CONTROLLO PASSWORD
// Minimo:
// - 8 caratteri
// - 1 minuscola
// - 1 maiuscola
// - 1 numero
// - 1 simbolo
// ============================================================

function isPasswordStrong(password) {
    const strongPasswordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

    return strongPasswordRegex.test(password);
}


// ============================================================
// ESCAPE HTML
// Evita di inserire direttamente testo utente nell'HTML.
// ============================================================

function escapeHtml(value) {
    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// ============================================================
// DOM READY
// ============================================================

document.addEventListener("DOMContentLoaded", async () => {

    // --------------------------------------------------------
    // Controllo presenza Supabase
    // --------------------------------------------------------

    if (!window.supabaseClient) {
        console.error("supabaseClient non disponibile.");

        showAuthError(
            "Errore di configurazione. Supabase non è disponibile."
        );

        return;
    }


    // --------------------------------------------------------
    // Pulsante Login / Registrazione
    // --------------------------------------------------------

    document.addEventListener("click", (e) => {

        const toggleButton =
            e.target.closest("#btn-toggle-auth");

        if (!toggleButton) {
            return;
        }

        e.preventDefault();

        isLoginMode = !isLoginMode;

        renderAuthForm();
    });


    // --------------------------------------------------------
    // Form autenticazione
    // --------------------------------------------------------

    const authForm =
        document.getElementById("auth-form");

    if (authForm) {
        authForm.addEventListener(
            "submit",
            handleAuthSubmit
        );
    }


    // --------------------------------------------------------
    // Render iniziale
    // --------------------------------------------------------

    renderAuthForm();


    // --------------------------------------------------------
    // Controllo sessione esistente
    // --------------------------------------------------------

    await checkExistingSession();
});


// ============================================================
// CONTROLLO SESSIONE ESISTENTE
// ============================================================

async function checkExistingSession() {

    try {

        const {
            data,
            error
        } = await window.supabaseClient.auth.getSession();

        if (error) {
            console.error(
                "Errore recupero sessione:",
                error
            );

            return;
        }

        const session = data?.session;

        if (!session?.user) {
            return;
        }


        // ----------------------------------------------------
        // Recupera il profilo
        // ----------------------------------------------------

        const {
            data: profile,
            error: profileError
        } = await window.supabaseClient
            .from("profiles")
            .select("is_admin")
            .eq("id", session.user.id)
            .maybeSingle();


        if (profileError) {

            console.error(
                "Errore recupero profilo:",
                profileError
            );

            return;
        }


        redirectUser(
            profile?.is_admin === true
        );

    } catch (error) {

        console.error(
            "Errore durante il controllo della sessione:",
            error
        );
    }
}


// ============================================================
// RENDER FORM LOGIN / REGISTRAZIONE
// ============================================================

function renderAuthForm() {

    const headerTitle =
        document.getElementById("form-header-title");

    const subtitle =
        document.getElementById("auth-subtitle");

    const submitBtn =
        document.getElementById("auth-submit-btn");

    const switchText =
        document.getElementById("auth-switch-text");

    const container =
        document.getElementById("form-fields-container");

    const errorContainer =
        document.getElementById("login-error-container");


    if (!container) {
        return;
    }


    // Pulisce eventuali messaggi precedenti

    if (errorContainer) {
        errorContainer.innerHTML = "";
    }


    // ========================================================
    // LOGIN
    // ========================================================

    if (isLoginMode) {

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
                <button
                    type="button"
                    id="btn-toggle-auth"
                    class="text-brand-azzurro font-bold hover:underline ml-1"
                >
                    Registrati
                </button>
            `;
        }


        container.innerHTML = `
            <div>
                <label
                    class="block text-xs font-bold text-gray-400 uppercase mb-1"
                >
                    Email
                </label>

                <input
                    type="email"
                    id="auth-email"
                    autocomplete="email"
                    required
                    class="w-full px-4 py-3 bg-brand-dark border border-brand-border rounded-xl text-white text-sm focus:outline-none focus:border-brand-azzurro"
                >
            </div>


            <div>
                <label
                    class="block text-xs font-bold text-gray-400 uppercase mb-1"
                >
                    Password
                </label>

                <div class="relative">

                    <input
                        type="password"
                        id="auth-password"
                        autocomplete="current-password"
                        required
                        class="w-full px-4 py-3 bg-brand-dark border border-brand-border rounded-xl text-white text-sm focus:outline-none focus:border-brand-azzurro pr-10"
                    >

                    <button
                        type="button"
                        onclick="togglePasswordVisibility('auth-password', this)"
                        class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition"
                        aria-label="Mostra password"
                    >
                        <i class="fa-solid fa-eye"></i>
                    </button>

                </div>
            </div>
        `;

        return;
    }


    // ========================================================
    // REGISTRAZIONE
    // ========================================================

    if (headerTitle) {
        headerTitle.innerText =
            "Iscrizione al Club";
    }

    if (subtitle) {
        subtitle.innerText =
            "Iscriviti a CASCIA' CLUB e presenta la tua auto";
    }

    if (submitBtn) {
        submitBtn.innerText =
            "Completa Iscrizione";
    }

    if (switchText) {

        switchText.innerHTML = `
            Hai già un account?
            <button
                type="button"
                id="btn-toggle-auth"
                class="text-brand-azzurro font-bold hover:underline ml-1"
            >
                Accedi
            </button>
        `;
    }


    container.innerHTML = `

        <!-- NOME / COGNOME -->

        <div class="grid grid-cols-2 gap-3">

            <div>
                <label
                    class="block text-xs font-bold text-gray-400 uppercase mb-1"
                >
                    Nome
                </label>

                <input
                    type="text"
                    id="signup-nome"
                    autocomplete="given-name"
                    required
                    class="w-full px-3 py-2 bg-brand-dark border border-brand-border rounded-xl text-white text-sm focus:outline-none focus:border-brand-azzurro"
                >
            </div>


            <div>
                <label
                    class="block text-xs font-bold text-gray-400 uppercase mb-1"
                >
                    Cognome
                </label>

                <input
                    type="text"
                    id="signup-cognome"
                    autocomplete="family-name"
                    required
                    class="w-full px-3 py-2 bg-brand-dark border border-brand-border rounded-xl text-white text-sm focus:outline-none focus:border-brand-azzurro"
                >
            </div>

        </div>


        <!-- DATA NASCITA / TELEFONO -->

        <div class="grid grid-cols-2 gap-3">

            <div>
                <label
                    class="block text-xs font-bold text-gray-400 uppercase mb-1"
                >
                    Data di Nascita
                </label>

                <input
                    type="date"
                    id="signup-data-nascita"
                    autocomplete="bday"
                    required
                    class="w-full px-4 py-2.5 bg-brand-dark border border-brand-border rounded-xl text-white text-sm focus:outline-none focus:border-brand-azzurro"
                >
            </div>


            <div>
                <label
                    class="block text-xs font-bold text-gray-400 uppercase mb-1"
                >
                    Telefono
                </label>

                <input
                    type="tel"
                    id="signup-telefono"
                    autocomplete="tel"
                    required
                    placeholder="333 0000000"
                    class="w-full px-4 py-2.5 bg-brand-dark border border-brand-border rounded-xl text-white text-sm focus:outline-none focus:border-brand-azzurro"
                >
            </div>

        </div>


        <!-- EMAIL -->

        <div>

            <label
                class="block text-xs font-bold text-gray-400 uppercase mb-1"
            >
                Email
            </label>

            <input
                type="email"
                id="auth-email"
                autocomplete="email"
                required
                class="w-full px-4 py-2.5 bg-brand-dark border border-brand-border rounded-xl text-white text-sm focus:outline-none focus:border-brand-azzurro"
            >

        </div>


        <!-- AUTO -->

        <div class="pt-2 border-t border-brand-border">

            <p
                class="text-[11px] font-black text-brand-azzurro uppercase mb-2"
            >
                <i class="fa-solid fa-car-side mr-1"></i>
                La tua auto
            </p>


            <div class="grid grid-cols-2 gap-3 mb-3">

                <div>

                    <label
                        class="block text-xs font-bold text-gray-400 uppercase mb-1"
                    >
                        Marca
                    </label>

                    <input
                        type="text"
                        id="signup-car-brand"
                        placeholder="Es. Land Rover"
                        class="w-full px-3 py-2 bg-brand-dark border border-brand-border rounded-xl text-white text-sm focus:outline-none focus:border-brand-azzurro"
                    >

                </div>


                <div>

                    <label
                        class="block text-xs font-bold text-gray-400 uppercase mb-1"
                    >
                        Modello
                    </label>

                    <input
                        type="text"
                        id="signup-car-model"
                        placeholder="Es. Defender 90"
                        class="w-full px-3 py-2 bg-brand-dark border border-brand-border rounded-xl text-white text-sm focus:outline-none focus:border-brand-azzurro"
                    >

                </div>

            </div>


            <div class="grid grid-cols-2 gap-3">

                <div>

                    <label
                        class="block text-xs font-bold text-gray-400 uppercase mb-1"
                    >
                        Anno
                    </label>

                    <input
                        type="number"
                        id="signup-car-year"
                        min="1900"
                        max="2100"
                        placeholder="Es. 1988"
                        class="w-full px-3 py-2 bg-brand-dark border border-brand-border rounded-xl text-white text-sm focus:outline-none focus:border-brand-azzurro"
                    >

                </div>


                <div>

                    <label
                        class="block text-xs font-bold text-gray-400 uppercase mb-1"
                    >
                        Categoria
                    </label>

                    <select
                        id="signup-car-category"
                        class="w-full px-3 py-2.5 bg-brand-dark border border-brand-border rounded-xl text-white text-sm focus:outline-none focus:border-brand-azzurro"
                    >
                        <option value="fuoristrada">
                            Fuoristrada
                        </option>

                        <option value="epoca">
                            Auto d'Epoca
                        </option>

                        <option value="sportiva">
                            Auto Sportiva
                        </option>
                    </select>

                </div>

            </div>


            <p class="text-[10px] text-gray-500 mt-2">

                <i class="fa-solid fa-circle-info mr-1"></i>

                Potrai caricare la foto della tua auto
                subito dopo l'iscrizione, dalla tua area personale.

            </p>

        </div>


        <!-- PASSWORD -->

        <div class="space-y-3 pt-2 border-t border-brand-border">

            <div>

                <label
                    class="block text-xs font-bold text-gray-400 uppercase mb-1"
                >
                    Password
                </label>

                <div class="relative">

                    <input
                        type="password"
                        id="auth-password"
                        autocomplete="new-password"
                        required
                        class="w-full px-3 py-2 bg-brand-dark border border-brand-border rounded-xl text-white text-sm focus:outline-none focus:border-brand-azzurro pr-10"
                    >

                    <button
                        type="button"
                        onclick="togglePasswordVisibility('auth-password', this)"
                        class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition"
                        aria-label="Mostra password"
                    >
                        <i class="fa-solid fa-eye"></i>
                    </button>

                </div>

            </div>


            <!-- CONFERMA PASSWORD -->

            <div>

                <label
                    class="block text-xs font-bold text-gray-400 uppercase mb-1"
                >
                    Conferma Password
                </label>

                <div class="relative">

                    <input
                        type="password"
                        id="signup-confirm-password"
                        autocomplete="new-password"
                        required
                        class="w-full px-3 py-2 bg-brand-dark border border-brand-border rounded-xl text-white text-sm focus:outline-none focus:border-brand-azzurro pr-10"
                    >

                    <button
                        type="button"
                        onclick="togglePasswordVisibility('signup-confirm-password', this)"
                        class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition"
                        aria-label="Mostra password"
                    >
                        <i class="fa-solid fa-eye"></i>
                    </button>

                </div>

            </div>


            <p class="text-[10px] text-gray-400">

                <i class="fa-solid fa-shield-halved text-brand-azzurro mr-1"></i>

                Min. 8 caratteri:
                1 maiuscola,
                1 minuscola,
                1 numero e
                1 simbolo.

            </p>

        </div>
    `;
}


// ============================================================
// SUBMIT FORM
// ============================================================

async function handleAuthSubmit(e) {

    e.preventDefault();

    clearAuthMessage();

    const submitBtn =
        document.getElementById("auth-submit-btn");


    // Evita doppi click

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.classList.add("opacity-60");
    }


    try {

        if (isLoginMode) {
            await handleLogin();
        } else {
            await handleSignup();
        }

    } catch (error) {

        console.error(
            "Errore autenticazione:",
            error
        );

        showAuthError(
            "Si è verificato un errore inatteso. Riprova."
        );

    } finally {

        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.classList.remove("opacity-60");
        }
    }
}


// ============================================================
// LOGIN
// ============================================================

async function handleLogin() {

    const emailInput =
        document.getElementById("auth-email");

    const passwordInput =
        document.getElementById("auth-password");


    if (!emailInput || !passwordInput) {
        return;
    }


    const email =
        emailInput.value.trim();

    const password =
        passwordInput.value;


    if (!email || !password) {

        showAuthError(
            "Inserisci email e password."
        );

        return;
    }


    // --------------------------------------------------------
    // LOGIN SUPABASE
    // --------------------------------------------------------

    const {
        data,
        error
    } = await window.supabaseClient.auth
        .signInWithPassword({
            email,
            password
        });


    if (error) {

        console.error(
            "Errore Login Supabase:",
            error
        );


        // Email non confermata

        if (
            error.message === "Email not confirmed" ||
            error.code === "email_not_confirmed"
        ) {

            showAuthError(`
                La tua email non è ancora stata confermata.
                Controlla la tua casella di posta e clicca
                sul link di conferma.
            `);

            return;
        }


        // Credenziali errate

        showAuthError(
            "Email o password non corrette."
        );

        return;
    }


    if (!data?.user) {

        showAuthError(
            "Impossibile completare l'accesso."
        );

        return;
    }


    // --------------------------------------------------------
    // RECUPERA PROFILO
    // --------------------------------------------------------

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
            "Accesso effettuato, ma non è stato possibile recuperare il profilo."
        );

        return;
    }


    // --------------------------------------------------------
    // REDIRECT
    // --------------------------------------------------------

    redirectUser(
        profile?.is_admin === true
    );
}


// ============================================================
// REGISTRAZIONE
// ============================================================

async function handleSignup() {

    // --------------------------------------------------------
    // RECUPERA CAMPI
    // --------------------------------------------------------

    const email =
        document.getElementById("auth-email")
            ?.value.trim();

    const password =
        document.getElementById("auth-password")
            ?.value;

    const confirmPassword =
        document.getElementById("signup-confirm-password")
            ?.value;

    const nome =
        document.getElementById("signup-nome")
            ?.value.trim();

    const cognome =
        document.getElementById("signup-cognome")
            ?.value.trim();

    const dataNascita =
        document.getElementById("signup-data-nascita")
            ?.value;

    const telefono =
        document.getElementById("signup-telefono")
            ?.value.trim();

    const carBrand =
        document.getElementById("signup-car-brand")
            ?.value.trim();

    const carModel =
        document.getElementById("signup-car-model")
            ?.value.trim();

    const carYear =
        document.getElementById("signup-car-year")
            ?.value;

    const carCategory =
        document.getElementById("signup-car-category")
            ?.value;


    // --------------------------------------------------------
    // VALIDAZIONE CAMPI OBBLIGATORI
    // --------------------------------------------------------

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


    // --------------------------------------------------------
    // CONFERMA PASSWORD
    // --------------------------------------------------------

    if (password !== confirmPassword) {

        showAuthError(
            "Le password non coincidono."
        );

        return;
    }


    // --------------------------------------------------------
    // SICUREZZA PASSWORD
    // --------------------------------------------------------

    if (!isPasswordStrong(password)) {

        showAuthError(
            "La password deve contenere almeno 8 caratteri, " +
            "una lettera maiuscola, una minuscola, " +
            "un numero e un simbolo."
        );

        return;
    }


    // --------------------------------------------------------
    // ANNO AUTO
    // --------------------------------------------------------

    let parsedCarYear = null;

    if (carYear) {

        parsedCarYear =
            parseInt(carYear, 10);

        const currentYear =
            new Date().getFullYear();


        if (
            Number.isNaN(parsedCarYear) ||
            parsedCarYear < 1900 ||
            parsedCarYear > currentYear
        ) {

            showAuthError(
                `L'anno dell'auto deve essere compreso ` +
                `tra 1900 e ${currentYear}.`
            );

            return;
        }
    }


    // --------------------------------------------------------
    // REGISTRAZIONE SUPABASE
    // --------------------------------------------------------

    const {
        data: authData,
        error: authError
    } = await window.supabaseClient.auth.signUp({

        email: email,

        password: password,

        options: {

            data: {

                nome: nome,

                cognome: cognome,

                data_nascita:
                    dataNascita,

                telefono:
                    telefono,

                car_brand:
                    carBrand || null,

                car_model:
                    carModel || null,

                car_year:
                    parsedCarYear,

                car_category:
                    carCategory || null
            }
        }
    });


    // --------------------------------------------------------
    // ERRORE REGISTRAZIONE
    // --------------------------------------------------------

    if (authError) {

        console.error(
            "Errore registrazione Supabase:",
            authError
        );


        if (
            authError.message
                ?.toLowerCase()
                .includes("already registered")
        ) {

            showAuthError(
                "Questa email è già registrata. " +
                "Prova ad effettuare il login."
            );

            return;
        }


        showAuthError(
            authError.message ||
            "Errore durante la registrazione."
        );

        return;
    }


    // --------------------------------------------------------
    // UTENTE NON CREATO
    // --------------------------------------------------------

    if (!authData?.user) {

        showAuthError(
            "Errore durante la creazione dell'account."
        );

        return;
    }


    // --------------------------------------------------------
    // CONFERMA EMAIL ATTIVA
    // --------------------------------------------------------
    //
    // Se Supabase richiede la conferma email,
    // authData.session sarà null.
    //
    // Il trigger database avrà comunque creato
    // il record in public.profiles.
    //
    // --------------------------------------------------------

    if (!authData.session) {

        showAuthSuccess(`
            <strong>Registrazione completata!</strong>
            <br><br>

            Abbiamo inviato un'email di conferma a
            <strong>${escapeHtml(email)}</strong>.

            <br><br>

            Controlla la tua casella di posta
            e clicca sul link di conferma.

            <br><br>

            Dopo aver confermato l'email,
            potrai effettuare il login.
        `);


        // Torna alla schermata login

        isLoginMode = true;

        renderAuthForm();

        return;
    }


    // --------------------------------------------------------
    // SE LA CONFERMA EMAIL È DISABILITATA
    // --------------------------------------------------------
    //
    // In questo caso Supabase restituisce direttamente
    // una sessione.
    //
    // Il trigger avrà già creato il profilo.
    //
    // --------------------------------------------------------

    redirectUser(false);
}


// ============================================================
// REDIRECT UTENTE
// ============================================================

function redirectUser(isAdmin) {

    if (isAdmin) {

        window.location.href =
            "pages/dashboard-admin.html";

    } else {

        window.location.href =
            "pages/dashboard-socio.html";
    }
}


// ============================================================
// MESSAGGIO ERRORE
// ============================================================

function showAuthError(message) {

    const errorContainer =
        document.getElementById(
            "login-error-container"
        );


    if (!errorContainer) {
        return;
    }


    errorContainer.innerHTML = `
        <div
            class="p-3 mb-4 text-xs font-bold text-white
                   bg-red-500/20 border border-red-500/50
                   rounded-xl flex items-start gap-2"
        >

            <i
                class="fa-solid fa-circle-exclamation
                       text-red-400 mt-0.5"
            ></i>

            <span>
                ${escapeHtml(message)}
            </span>

        </div>
    `;
}


// ============================================================
// MESSAGGIO SUCCESSO
// ============================================================

function showAuthSuccess(message) {

    const errorContainer =
        document.getElementById(
            "login-error-container"
        );


    if (!errorContainer) {
        return;
    }


    errorContainer.innerHTML = `
        <div
            class="p-3 mb-4 text-xs font-bold text-white
                   bg-green-500/20 border border-green-500/50
                   rounded-xl flex items-start gap-2"
        >

            <i
                class="fa-solid fa-circle-check
                       text-green-400 mt-0.5"
            ></i>

            <span>
                ${message}
            </span>

        </div>
    `;
}


// ============================================================
// PULISCE MESSAGGI
// ============================================================

function clearAuthMessage() {

    const errorContainer =
        document.getElementById(
            "login-error-container"
        );


    if (errorContainer) {
        errorContainer.innerHTML = "";
    }
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
