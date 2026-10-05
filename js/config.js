// ============================================================
// CONFIGURAZIONE SUPABASE — CASCIA' CLUB
// Sostituisci questi due valori con quelli del tuo progetto Supabase
// (Project Settings -> API). Vedi database/schema.sql per creare le tabelle.
// ============================================================
const SUPABASE_URL = "https://evzrfzcimrxauldwfzbo.supabase.co/";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2enJmemNpbXJ4YXVsZHdmemJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTExODY4MTgsImV4cCI6MjEwNjc2MjgxOH0.zogAru6bZuFAuGJjUK-Ftm-spEBDNv-DeyB8CkkjCPk";

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
}
