// ============================================================
// CONFIGURAZIONE SUPABASE — CASCIA' CLUB
// ============================================================

// URL del progetto Supabase
const SUPABASE_URL =
    "https://evzrfzcimrxauldwfzbo.supabase.co";

// Chiave pubblica Supabase
// È corretto utilizzarla nel frontend.
// NON utilizzare mai qui una service_role / secret key.
const SUPABASE_ANON_KEY =
    "sb_publishable_h33DimihNlpZHBAp9CB0zQ_uWZBUWm8";


// ============================================================
// INIZIALIZZAZIONE SUPABASE
// ============================================================

if (
    typeof supabase === "undefined"
) {

    console.error(
        "Supabase SDK non caricato."
    );

} else {

    window.supabaseClient =
        supabase.createClient(
            SUPABASE_URL,
            SUPABASE_ANON_KEY
        );
}


// ============================================================
// CONTROLLO AUTENTICAZIONE E RUOLO
// ============================================================

async function checkAuthAndRedirect(
    requiredRole = null
) {

    try {

        // ----------------------------------------------------
        // Controlla sessione
        // ----------------------------------------------------

        const {
            data,
            error
        } = await window.supabaseClient.auth.getSession();


        if (error) {

            console.error(
                "Errore recupero sessione:",
                error
            );

            redirectToLogin();

            return null;
        }


        const session = data?.session;


        // ----------------------------------------------------
        // Nessuna sessione
        // ----------------------------------------------------

        if (!session) {

            redirectToLogin();

            return null;
        }


        // ----------------------------------------------------
        // Recupera profilo
        // ----------------------------------------------------

        const {
            data: profile,
            error: profileError
        } = await window.supabaseClient
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .maybeSingle();


        // ----------------------------------------------------
        // Profilo non trovato
        // ----------------------------------------------------

        if (profileError) {

            console.error(
                "Errore recupero profilo:",
                profileError
            );

            return {
                user: session.user,
                profile: null
            };
        }


        if (!profile) {

            console.warn(
                "Profilo non ancora disponibile per:",
                session.user.id
            );

            return {
                user: session.user,
                profile: null
            };
        }


        // ----------------------------------------------------
        // Controllo ruolo ADMIN
        // ----------------------------------------------------

        if (
            requiredRole === "admin" &&
            profile.is_admin !== true
        ) {

            window.location.href =
                "dashboard-socio.html";

            return null;
        }


        // ----------------------------------------------------
        // Controllo ruolo SOCIO
        // ----------------------------------------------------

        if (
            requiredRole === "socio" &&
            profile.is_admin === true
        ) {

            window.location.href =
                "dashboard-admin.html";

            return null;
        }


        // ----------------------------------------------------
        // Tutto OK
        // ----------------------------------------------------

        return {
            user: session.user,
            profile
        };

    } catch (error) {

        console.error(
            "Errore checkAuthAndRedirect:",
            error
        );

        redirectToLogin();

        return null;
    }
}


// ============================================================
// REDIRECT LOGIN
// ============================================================

function redirectToLogin() {

    const path =
        window.location.pathname;

    const isRoot =
        path === "/" ||
        path.endsWith("/index.html");

    if (!isRoot) {

        // Le pagine dentro /pages/ devono tornare
        // alla pagina principale.

        window.location.href =
            "../index.html";
    }
}


// ============================================================
// LOGOUT
// ============================================================

async function logout() {

    try {

        const {
            error
        } = await window.supabaseClient.auth.signOut();


        if (error) {

            console.error(
                "Errore logout:",
                error
            );

            return;
        }


        // Se logout riuscito

        const path =
            window.location.pathname;

        const isInsidePages =
            path.includes("/pages/");


        window.location.href =
            isInsidePages
                ? "../index.html"
                : "index.html";

    } catch (error) {

        console.error(
            "Errore durante il logout:",
            error
        );
    }
}


// ============================================================
// NAVBAR DINAMICA
// ============================================================

function renderNavbar(profile) {

    const navContainer =
        document.getElementById(
            "nav-links"
        );


    if (!navContainer || !profile) {
        return;
    }


    const roleBadge =
        profile.is_admin === true

            ? `
                <span
                    class="text-brand-azzurro
                           text-[10px]
                           font-extrabold
                           uppercase
                           bg-brand-azzurro/20
                           px-2
                           py-0.5
                           rounded-full
                           border
                           border-brand-azzurro/30"
                >
                    Direttivo
                </span>
            `

            : "";


    // Escape del nome prima di inserirlo nell'HTML

    const safeName =
        escapeConfigHtml(
            profile.nome || "Socio"
        );


    navContainer.innerHTML = `

        <div class="flex items-center gap-2">

            <span
                class="text-xs
                       font-bold
                       uppercase
                       tracking-wider
                       text-gray-300"
            >
                Ciao, ${safeName}
            </span>

            ${roleBadge}

        </div>


        <button
            type="button"
            onclick="logout()"
            class="bg-white/10
                   hover:bg-white/20
                   text-white
                   border
                   border-white/20
                   text-xs
                   font-bold
                   py-1.5
                   px-4
                   rounded-xl
                   transition"
        >
            Esci
        </button>
    `;
}


// ============================================================
// ESCAPE HTML
// ============================================================

function escapeConfigHtml(value) {

    if (
        value === null ||
        value === undefined
    ) {
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
// CATEGORIE AUTO
// ============================================================

const CAR_CATEGORY_LABELS = {

    fuoristrada:
        "Fuoristrada",

    epoca:
        "Auto d'Epoca",

    sportiva:
        "Auto Sportiva"
};


// ============================================================
// NOME LEGGIBILE CATEGORIA
// ============================================================

function carCategoryLabel(value) {

    return (
        CAR_CATEGORY_LABELS[value] ||
        value ||
        "Non specificata"
    );
}


/*// ============================================================
// CONFIGURAZIONE SUPABASE — CASCIA' CLUB
// Sostituisci questi due valori con quelli del tuo progetto Supabase
// (Project Settings -> API). Vedi database/schema.sql per creare le tabelle.
// ============================================================
const SUPABASE_URL = "https://evzrfzcimrxauldwfzbo.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_h33DimihNlpZHBAp9CB0zQ_uWZBUWm8";

// Inizializzazione globale del client
window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// VERIFICA AUTENTICAZIONE E RUOLI
async function checkAuthAndRedirect(requiredRole = null) {
    const { data: { session } } = await window.supabaseClient.auth.getSession();

    if (!session) {
        if (!window.location.pathname.endsWith('index.html') && window.location.pathname !== '/') {
            window.location.href = '../index.html';
        }
        return null;
    }

    const { data: profile, error } = await window.supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

    if (error || !profile) {
        await window.supabaseClient.auth.signOut();
        window.location.href = '../index.html';
        return null;
    }

    if (requiredRole === 'admin' && !profile.is_admin) {
        window.location.href = 'dashboard-socio.html';
    } else if (requiredRole === 'socio' && profile.is_admin) {
        window.location.href = 'dashboard-admin.html';
    }

    return { user: session.user, profile };
}

// LOGOUT
async function logout() {
    await window.supabaseClient.auth.signOut();
    window.location.href = '../index.html';
}

// NAVBAR DINAMICA
function renderNavbar(profile) {
    const navContainer = document.getElementById('nav-links');
    if (!navContainer) return;

    const roleBadge = profile.is_admin
        ? '<span class="text-brand-azzurro text-[10px] font-extrabold uppercase bg-brand-azzurro/20 px-2 py-0.5 rounded-full border border-brand-azzurro/30">Direttivo</span>'
        : '';

    navContainer.innerHTML = `
        <div class="flex items-center gap-2">
            <span class="text-xs font-bold uppercase tracking-wider text-gray-300">Ciao, ${profile.nome || 'Socio'}</span>
            ${roleBadge}
        </div>
        <button onclick="logout()" class="bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold py-1.5 px-4 rounded-xl transition">
            Esci
        </button>
    `;
}

// Etichette leggibili per la categoria auto
const CAR_CATEGORY_LABELS = {
    fuoristrada: 'Fuoristrada',
    epoca: "Auto d'Epoca",
    sportiva: 'Auto Sportiva'
};

function carCategoryLabel(value) {
    return CAR_CATEGORY_LABELS[value] || value || 'Non specificata';
}*/
