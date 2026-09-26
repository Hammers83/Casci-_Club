let currentSessionData = null;
let chartPartecipazioneInstance = null;
let chartCategorieInstance = null;
let eventsData = [];

const getSupabase = () => window.supabaseClient || window.supabase;

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function formatISOWithTimezone(datetimeLocalValue) {
    if (!datetimeLocalValue) return null;
    const date = new Date(datetimeLocalValue);
    return date.toISOString();
}

function formatDatetimeLocal(isoString) {
    if (!isoString) return '';
    const d = new Date(isoString);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

document.addEventListener('DOMContentLoaded', async () => {
    currentSessionData = await checkAuthAndRedirect('admin');
    if (!currentSessionData) return;

    setAdminName(currentSessionData.profile);

    if (typeof renderNavbar === 'function') {
        renderNavbar(currentSessionData.profile);
    }

    await loadAdminDashboard();

    if (typeof initChat === 'function') {
        await initChat(currentSessionData.profile);
    }

    setupModalEvents();
});

function setAdminName(profile) {
    const titleEl = document.getElementById('admin-welcome-title');
    if (titleEl && profile) {
        const nome = `${profile.nome || ''} ${profile.cognome || ''}`.trim();
        titleEl.textContent = nome ? `Pannello Direttivo — ${nome}` : 'Pannello Direttivo';
    }
}

function setupModalEvents() {
    // Modale creazione evento
    const modalCreate = document.getElementById('modal-create-event');
    const openCreateBtn = document.getElementById('btn-open-create-modal');
    const closeCreateBtn = document.getElementById('btn-close-modal');
    const cancelCreateBtn = document.getElementById('btn-cancel-modal');
    const createForm = document.getElementById('form-create-event');

    if (openCreateBtn) openCreateBtn.addEventListener('click', () => modalCreate?.classList.remove('hidden'));
    if (closeCreateBtn) closeCreateBtn.addEventListener('click', () => modalCreate?.classList.add('hidden'));
    if (cancelCreateBtn) cancelCreateBtn.addEventListener('click', () => modalCreate?.classList.add('hidden'));

    if (createForm) {
        createForm.addEventListener('submit', async (e) => {
            await handleCreateEvent(e);
            modalCreate?.classList.add('hidden');
        });
    }

    // Modale modifica evento
    const modalEdit = document.getElementById('modal-edit-event');
    const closeEditBtn = document.getElementById('btn-close-edit-modal');
    const cancelEditBtn = document.getElementById('btn-cancel-edit-modal');
    const editForm = document.getElementById('form-edit-event');

    if (closeEditBtn) closeEditBtn.addEventListener('click', () => modalEdit?.classList.add('hidden'));
    if (cancelEditBtn) cancelEditBtn.addEventListener('click', () => modalEdit?.classList.add('hidden'));

    if (editForm) {
        editForm.addEventListener('submit', async (e) => {
            await handleUpdateEvent(e);
            modalEdit?.classList.add('hidden');
        });
    }

    // Modale nuovo raduno
    const modalRaduno = document.getElementById('modal-create-raduno');
    const openRadunoBtn = document.getElementById('btn-open-create-raduno-modal');
    const closeRadunoBtn = document.getElementById('btn-close-raduno-modal');
    const cancelRadunoBtn = document.getElementById('btn-cancel-raduno-modal');
    const radunoForm = document.getElementById('form-create-raduno');

    if (openRadunoBtn) openRadunoBtn.addEventListener('click', () => modalRaduno?.classList.remove('hidden'));
    if (closeRadunoBtn) closeRadunoBtn.addEventListener('click', () => modalRaduno?.classList.add('hidden'));
    if (cancelRadunoBtn) cancelRadunoBtn.addEventListener('click', () => modalRaduno?.classList.add('hidden'));

    if (radunoForm) {
        radunoForm.addEventListener('submit', async (e) => {
            await handleCreateRaduno(e);
            modalRaduno?.classList.add('hidden');
        });
    }
}

async function loadAdminDashboard() {
    await loadMembersTable();
    await loadAdminEvents();
    await loadAdminRaduni();
    await renderAnalytics();
}

/* ==========================================================================
   ANAGRAFICA SOCI
   ========================================================================== */

async function loadMembersTable() {
    const sb = getSupabase();
    const { data: profiles, error } = await sb
        .from('profiles')
        .select('*')
        .eq('is_admin', false)
        .order('nome', { ascending: true });

    const tbody = document.getElementById('table-members-body');
    if (!tbody) return;

    if (error) {
        tbody.innerHTML = `<tr><td colspan="5" class="py-4 text-center text-red-400">Errore nel caricamento dei dati.</td></tr>`;
        return;
    }

    if (!profiles || profiles.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="py-4 text-center text-gray-500">Nessun socio registrato.</td></tr>`;
        return;
    }

    tbody.innerHTML = profiles.map(p => {
        const avatar = p.avatar_url ? escapeHtml(p.avatar_url) : `https://ui-avatars.com/api/?name=${encodeURIComponent(p.nome || 'S')}&background=1EA7E1&color=fff`;

        const carLabel = (p.car_brand || p.car_model)
            ? `${escapeHtml(p.car_brand || '')} ${escapeHtml(p.car_model || '')} ${p.car_year ? '(' + p.car_year + ')' : ''}<br><span class="text-brand-azzurro text-[10px] uppercase font-bold">${escapeHtml(carCategoryLabel(p.car_category))}</span>`
            : `<span class="text-gray-500">Nessun dato</span>`;

        const carPhotoHtml = p.car_photo_url
            ? `<a href="${escapeHtml(p.car_photo_url)}" target="_blank" rel="noopener noreferrer"><img src="${escapeHtml(p.car_photo_url)}" class="w-14 h-14 object-cover rounded-xl border border-brand-border hover:border-brand-azzurro transition"></a>`
            : `<span class="text-xs text-gray-500">Nessuna foto</span>`;

        return `
            <tr class="hover:bg-white/5 transition">
                <td class="py-3 px-2"><img src="${avatar}" class="w-9 h-9 rounded-xl object-cover border border-brand-border" alt="Avatar"></td>
                <td class="py-3 px-2 font-bold text-white">${escapeHtml(p.nome)} ${escapeHtml(p.cognome)}</td>
                <td class="py-3 px-2 text-xs text-gray-400">${escapeHtml(p.email || '-')}<br><span class="text-gray-500">${escapeHtml(p.telefono || '')}</span></td>
                <td class="py-3 px-2 text-xs text-white">${carLabel}</td>
                <td class="py-3 px-2">${carPhotoHtml}</td>
            </tr>
        `;
    }).join('');
}

/* ==========================================================================
   EVENTI & RIUNIONI
   ========================================================================== */

async function loadAdminEvents() {
    const sb = getSupabase();
    const container = document.getElementById('admin-events-container');
    if (!container) return;

    const { data: events, error } = await sb
        .from('events')
        .select('*, event_participants(user_id, profiles(nome, cognome, telefono, email))')
        .order('datetime', { ascending: true });

    if (error) {
        container.innerHTML = `<p class="text-xs text-red-400">Errore nel caricamento eventi: ${escapeHtml(error.message)}</p>`;
        return;
    }

    eventsData = events || [];

    if (eventsData.length === 0) {
        container.innerHTML = `<p class="text-xs text-gray-400">Nessun evento programmato. Creane uno con il pulsante "Nuovo Evento".</p>`;
        return;
    }

    container.innerHTML = eventsData.map(ev => {
        const date = new Date(ev.datetime);
        const formattedDate = date.toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
        const formattedTime = date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
        const partecipanti = (ev.event_participants || []).map(p => p.profiles).filter(Boolean);
        const typeLabel = ev.type === 'riunione' ? 'Riunione' : 'Evento';

        return `
            <div class="bg-brand-dark p-5 rounded-2xl border border-brand-border space-y-3 relative">
                <div class="flex justify-between items-start border-b border-brand-border pb-2">
                    <div>
                        <span class="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-brand-azzurro/20 text-brand-azzurro border border-brand-azzurro/40">${typeLabel}</span>
                        <h4 class="text-base font-black text-white mt-1">${escapeHtml(ev.title)}</h4>
                        <span class="text-xs text-brand-azzurro font-bold">${formattedDate} - ${formattedTime}</span>
                        ${ev.location ? `<p class="text-xs text-gray-400"><i class="fa-solid fa-location-dot mr-1"></i>${escapeHtml(ev.location)}</p>` : ''}
                    </div>
                    <div class="flex items-center gap-2">
                        <button onclick="openEditEventModal('${ev.id}')" class="px-2.5 py-1 bg-brand-card hover:bg-brand-azzurro hover:text-black text-brand-azzurro border border-brand-azzurro/40 text-xs font-bold rounded-lg transition flex items-center gap-1">
                            <i class="fa-solid fa-pen"></i> Modifica
                        </button>
                        <span class="text-xs bg-brand-card px-2.5 py-1 rounded-lg text-white font-bold border border-brand-border">
                            ${partecipanti.length}${ev.capacity ? ' / ' + ev.capacity : ''}
                        </span>
                    </div>
                </div>

                <div>
                    <p class="text-xs font-bold text-gray-400 uppercase mb-2">Partecipanti:</p>
                    ${partecipanti.length > 0 ? `
                        <ul class="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                            ${partecipanti.map(m => `
                                <li class="text-xs bg-brand-card p-2 rounded-xl flex justify-between items-center border border-brand-border/50">
                                    <span class="font-bold text-white"><i class="fa-solid fa-user text-brand-azzurro mr-1.5"></i>${escapeHtml(m.nome)} ${escapeHtml(m.cognome)}</span>
                                    <span class="text-[10px] text-gray-400">${escapeHtml(m.telefono || m.email || '')}</span>
                                </li>
                            `).join('')}
                        </ul>
                    ` : `<p class="text-xs italic text-gray-500">Nessuna partecipazione registrata.</p>`}
                </div>
            </div>
        `;
    }).join('');
}

window.openEditEventModal = function(eventId) {
    const ev = eventsData.find(e => e.id === eventId);
    if (!ev) return;

    document.getElementById('edit-event-id').value = ev.id;
    document.getElementById('edit-event-type').value = ev.type || 'evento';
    document.getElementById('edit-event-title').value = ev.title;
    document.getElementById('edit-event-location').value = ev.location || '';
    document.getElementById('edit-event-datetime').value = formatDatetimeLocal(ev.datetime);
    document.getElementById('edit-event-capacity').value = ev.capacity || 0;
    document.getElementById('edit-event-description').value = ev.description || '';

    document.getElementById('modal-edit-event')?.classList.remove('hidden');
};

async function handleCreateEvent(e) {
    e.preventDefault();
    const sb = getSupabase();

    const type = document.getElementById('event-type').value;
    const title = document.getElementById('event-title').value.trim();
    const location = document.getElementById('event-location').value.trim();
    const datetime = formatISOWithTimezone(document.getElementById('event-datetime').value);
    const capacity = parseInt(document.getElementById('event-capacity').value, 10) || 0;
    const description = document.getElementById('event-description').value.trim();

    if (!title || !datetime) {
        alert("Compila tutti i campi obbligatori.");
        return;
    }

    const { error } = await sb.from('events').insert([{ type, title, location, datetime, capacity, description }]);

    if (error) {
        alert("Errore durante la creazione dell'evento: " + error.message);
    } else {
        alert("Evento pubblicato con successo!");
        document.getElementById('form-create-event').reset();
        await loadAdminEvents();
        await renderAnalytics();
    }
}

async function handleUpdateEvent(e) {
    e.preventDefault();
    const sb = getSupabase();

    const eventId = document.getElementById('edit-event-id').value;
    const type = document.getElementById('edit-event-type').value;
    const title = document.getElementById('edit-event-title').value.trim();
    const location = document.getElementById('edit-event-location').value.trim();
    const datetime = formatISOWithTimezone(document.getElementById('edit-event-datetime').value);
    const capacity = parseInt(document.getElementById('edit-event-capacity').value, 10) || 0;
    const description = document.getElementById('edit-event-description').value.trim();

    if (!eventId || !title || !datetime) {
        alert("Compila tutti i campi obbligatori.");
        return;
    }

    const { error } = await sb.from('events').update({ type, title, location, datetime, capacity, description }).eq('id', eventId);

    if (error) {
        alert("Errore durante l'aggiornamento dell'evento: " + error.message);
    } else {
        alert("Evento aggiornato con successo!");
        await loadAdminEvents();
        await renderAnalytics();
    }
}

/* ==========================================================================
   RADUNI
   ========================================================================== */

async function loadAdminRaduni() {
    const sb = getSupabase();
    const container = document.getElementById('admin-raduni-container');
    if (!container) return;

    const { data: raduni, error } = await sb
        .from('raduni')
        .select('*, raduno_photos(id, photo_url)')
        .order('event_date', { ascending: false });

    if (error) {
        container.innerHTML = `<p class="text-xs text-red-400">Errore nel caricamento dei raduni: ${escapeHtml(error.message)}</p>`;
        return;
    }

    if (!raduni || raduni.length === 0) {
        container.innerHTML = `<p class="text-xs text-gray-400">Nessun raduno pubblicato. Creane uno con il pulsante "Nuovo Raduno".</p>`;
        return;
    }

    container.innerHTML = raduni.map(r => {
        const photos = r.raduno_photos || [];
        const formattedDate = r.event_date ? new Date(r.event_date).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' }) : '';

        return `
            <div class="bg-brand-dark p-5 rounded-2xl border border-brand-border space-y-3">
                <div class="flex justify-between items-start flex-wrap gap-2">
                    <div>
                        <h4 class="text-base font-black text-white">${escapeHtml(r.title)}</h4>
                        <p class="text-xs text-brand-azzurro font-bold">${formattedDate}</p>
                        ${r.description ? `<p class="text-xs text-gray-400 mt-1">${escapeHtml(r.description)}</p>` : ''}
                    </div>
                    <div class="flex items-center gap-2">
                        ${r.drive_link ? `<a href="${escapeHtml(r.drive_link)}" target="_blank" rel="noopener noreferrer" class="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition flex items-center gap-1"><i class="fa-brands fa-google-drive text-brand-azzurro"></i> Drive</a>` : ''}
                        <button onclick="deleteRaduno('${r.id}')" class="px-3 py-1.5 bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/40 text-xs font-bold rounded-xl transition">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    ${photos.length > 0 ? photos.map(p => `<img src="${escapeHtml(p.photo_url)}" class="w-full h-20 object-cover rounded-lg border border-brand-border">`).join('') : `<p class="text-xs text-gray-500 col-span-full">Nessuna foto caricata dai soci ancora.</p>`}
                </div>
            </div>
        `;
    }).join('');
}

async function handleCreateRaduno(e) {
    e.preventDefault();
    const sb = getSupabase();

    const title = document.getElementById('raduno-title').value.trim();
    const eventDate = document.getElementById('raduno-date').value;
    const description = document.getElementById('raduno-description').value.trim();
    const driveLink = document.getElementById('raduno-drive-link').value.trim();

    if (!title || !eventDate) {
        alert("Compila titolo e data del raduno.");
        return;
    }

    const { error } = await sb.from('raduni').insert([{
        title, event_date: eventDate, description: description || null, drive_link: driveLink || null
    }]);

    if (error) {
        alert("Errore durante la creazione del raduno: " + error.message);
    } else {
        alert("Raduno creato con successo!");
        document.getElementById('form-create-raduno').reset();
        await loadAdminRaduni();
    }
}

window.deleteRaduno = async function(radunoId) {
    if (!confirm("Eliminare questo raduno e tutte le foto associate?")) return;
    const sb = getSupabase();
    const { error } = await sb.from('raduni').delete().eq('id', radunoId);
    if (error) {
        alert("Errore durante l'eliminazione: " + error.message);
    } else {
        await loadAdminRaduni();
    }
};

/* ==========================================================================
   ANALYTICS
   ========================================================================== */

async function renderAnalytics() {
    if (typeof Chart === 'undefined') return;

    const sb = getSupabase();
    const { data: profiles } = await sb.from('profiles').select('car_category').eq('is_admin', false);
    const { data: events } = await sb.from('events').select('title, event_participants(count)');

    const counts = { fuoristrada: 0, epoca: 0, sportiva: 0, altro: 0 };
    (profiles || []).forEach(p => {
        if (p.car_category && counts.hasOwnProperty(p.car_category)) {
            counts[p.car_category]++;
        } else if (p.car_category) {
            counts.altro++;
        }
    });

    const chartCatEl = document.getElementById('chart-categorie-auto');
    if (chartCatEl) {
        if (chartCategorieInstance) chartCategorieInstance.destroy();
        chartCategorieInstance = new Chart(chartCatEl.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['Fuoristrada', "Auto d'Epoca", 'Sportive', 'Altro/Non specificato'],
                datasets: [{ data: [counts.fuoristrada, counts.epoca, counts.sportiva, counts.altro], backgroundColor: ['#1EA7E1', '#ffffff', '#0C7FB0', '#3a3a42'], borderWidth: 0 }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#fff' } } } }
        });
    }

    const labels = events ? events.map(e => e.title || 'Evento') : [];
    const partCounts = events ? events.map(e => (e.event_participants && e.event_participants[0]) ? e.event_participants[0].count : 0) : [];

    const chartPartEl = document.getElementById('chart-partecipazione');
    if (chartPartEl) {
        if (chartPartecipazioneInstance) chartPartecipazioneInstance.destroy();
        chartPartecipazioneInstance = new Chart(chartPartEl.getContext('2d'), {
            type: 'bar',
            data: { labels, datasets: [{ label: 'Partecipanti', data: partCounts, backgroundColor: '#1EA7E1', borderRadius: 8 }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#fff' } } }, scales: { x: { ticks: { color: '#aaa' } }, y: { ticks: { color: '#aaa' } } } }
        });
    }
}
