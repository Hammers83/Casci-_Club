let currentSessionData = null;

document.addEventListener('DOMContentLoaded', async () => {
    const authData = await checkAuthAndRedirect('socio');
    if (!authData) return;

    currentSessionData = authData;

    if (typeof renderNavbar === 'function') {
        renderNavbar(authData.profile);
    }

    renderMemberProfile(authData.profile);
    initCarUpdateForm(authData.user, authData.profile);

    await initNotifications(authData.user.id);

    await loadAvailableEvents(authData.user.id);
    await loadRaduni(authData.user.id);

    if (typeof initChat === 'function') {
        await initChat(authData.profile);
    }
});

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/* ==========================================================================
   PROFILO SOCIO & DATI AUTO
   ========================================================================== */

function renderMemberProfile(profile) {
    const welcomeEl = document.getElementById('member-welcome');
    const avatarEl = document.getElementById('member-avatar-img');

    if (welcomeEl) welcomeEl.innerText = `Ciao, ${profile.nome || 'Socio'}!`;

    if (avatarEl) {
        const initial = profile.nome ? profile.nome.charAt(0).toUpperCase() : 'C';
        avatarEl.src = profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(initial)}&background=1EA7E1&color=fff`;
    }

    const carPhotoImg = document.getElementById('car-photo-preview');
    const carPhotoPlaceholder = document.getElementById('car-photo-placeholder');
    const carDataText = document.getElementById('car-data-text');

    if (profile.car_photo_url && carPhotoImg) {
        carPhotoImg.src = profile.car_photo_url;
        carPhotoImg.classList.remove('hidden');
        if (carPhotoPlaceholder) carPhotoPlaceholder.classList.add('hidden');
    }

    if (carDataText) {
        if (profile.car_brand || profile.car_model) {
            const cat = carCategoryLabel(profile.car_category);
            carDataText.innerHTML = `${escapeHtml(profile.car_brand || '')} ${escapeHtml(profile.car_model || '')} ${profile.car_year ? '(' + profile.car_year + ')' : ''}<br><span class="text-brand-azzurro text-xs">${escapeHtml(cat)}</span>`;
        }
    }

    // Precompila il form di aggiornamento
    const brandInput = document.getElementById('car-brand-input');
    const modelInput = document.getElementById('car-model-input');
    const yearInput = document.getElementById('car-year-input');
    const catInput = document.getElementById('car-category-input');
    if (brandInput) brandInput.value = profile.car_brand || '';
    if (modelInput) modelInput.value = profile.car_model || '';
    if (yearInput) yearInput.value = profile.car_year || '';
    if (catInput) catInput.value = profile.car_category || 'fuoristrada';
}

function initCarUpdateForm(user, profile) {
    const form = document.getElementById('form-update-car');
    if (!form) return;

    form.onsubmit = async (e) => {
        e.preventDefault();
        const sb = window.supabaseClient;
        const btn = document.getElementById('btn-save-car');

        const carBrand = document.getElementById('car-brand-input').value.trim();
        const carModel = document.getElementById('car-model-input').value.trim();
        const carYear = document.getElementById('car-year-input').value;
        const carCategory = document.getElementById('car-category-input').value;
        const fileInput = document.getElementById('car-photo-input');

        btn.disabled = true;
        btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Salvataggio in corso...`;

        try {
            const updatePayload = {
                car_brand: carBrand || null,
                car_model: carModel || null,
                car_year: carYear ? parseInt(carYear, 10) : null,
                car_category: carCategory || null
            };

            if (fileInput.files && fileInput.files[0]) {
                const file = fileInput.files[0];
                const fileExt = file.name.split('.').pop();
                const filePath = `${user.id}/auto_${Date.now()}.${fileExt}`;

                const { error: uploadErr } = await sb.storage
                    .from('car-photos')
                    .upload(filePath, file, { upsert: true });

                if (uploadErr) throw uploadErr;

                const { data: urlData } = sb.storage.from('car-photos').getPublicUrl(filePath);
                updatePayload.car_photo_url = urlData.publicUrl;
            }

            const { error: updateErr } = await sb.from('profiles').update(updatePayload).eq('id', user.id);
            if (updateErr) throw updateErr;

            alert("Dati auto aggiornati con successo!");
            location.reload();
        } catch (err) {
            console.error("Errore aggiornamento auto:", err);
            alert("Errore durante il salvataggio: " + err.message);
        } finally {
            btn.disabled = false;
            btn.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Salva Dati Auto`;
        }
    };
}

/* ==========================================================================
   EVENTI & RIUNIONI
   ========================================================================== */

async function loadAvailableEvents(userId) {
    const sb = window.supabaseClient;
    const container = document.getElementById('member-events-list');
    if (!container) return;

    const { data: events, error } = await sb
        .from('events')
        .select('*, event_participants(user_id)')
        .order('datetime', { ascending: true });

    if (error) {
        console.error("Errore recupero eventi:", error);
        container.innerHTML = `<p class="text-xs text-red-400">Errore nel caricamento degli eventi: ${escapeHtml(error.message)}</p>`;
        return;
    }

    if (!events || events.length === 0) {
        container.innerHTML = `<p class="text-xs text-gray-400">Nessun evento o riunione in programma.</p>`;
        return;
    }

    container.innerHTML = events.map(ev => {
        const participants = ev.event_participants || [];
        const isJoined = participants.some(p => p.user_id === userId);
        const joinedCount = participants.length;
        const capacity = ev.capacity || 0;
        const isFull = capacity > 0 && joinedCount >= capacity;

        const date = new Date(ev.datetime);
        const formattedDate = date.toLocaleDateString('it-IT', { weekday: 'short', day: '2-digit', month: 'short' });
        const formattedTime = date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
        const typeLabel = ev.type === 'riunione' ? 'Riunione' : 'Evento';

        let buttonHtml = '';
        if (isJoined) {
            buttonHtml = `
                <button onclick="toggleParticipation('${ev.id}', '${userId}', true)" class="w-full py-2.5 bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/40 text-xs font-bold rounded-xl transition">
                    <i class="fa-solid fa-xmark mr-1"></i> Annulla Partecipazione
                </button>`;
        } else if (isFull) {
            buttonHtml = `
                <button disabled class="w-full py-2.5 bg-gray-700 text-gray-400 text-xs uppercase rounded-xl cursor-not-allowed">Posti Esauriti</button>`;
        } else {
            buttonHtml = `
                <button onclick="toggleParticipation('${ev.id}', '${userId}', false)" class="w-full py-2.5 btn-gradient text-white font-black text-xs uppercase rounded-xl transition">
                    <i class="fa-solid fa-check mr-1"></i> Partecipa
                </button>`;
        }

        return `
            <div class="bg-brand-dark p-5 rounded-2xl border border-brand-border flex flex-col justify-between space-y-4">
                <div>
                    <div class="flex justify-between items-center mb-2">
                        <span class="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-brand-azzurro/20 text-brand-azzurro border border-brand-azzurro/40">${typeLabel}</span>
                        ${capacity > 0 ? `<span class="text-[10px] px-2 py-0.5 rounded-full font-bold ${isFull ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-white/10 text-white border border-white/20'}">${joinedCount}/${capacity}</span>` : ''}
                    </div>
                    <h4 class="text-base font-black text-white">${escapeHtml(ev.title)}</h4>
                    <p class="text-xs text-gray-400 mt-1"><i class="fa-solid fa-calendar-day mr-1"></i>${formattedDate} - ${formattedTime}</p>
                    ${ev.location ? `<p class="text-xs text-gray-400"><i class="fa-solid fa-location-dot mr-1"></i>${escapeHtml(ev.location)}</p>` : ''}
                    ${ev.description ? `<p class="text-xs text-gray-500 mt-2">${escapeHtml(ev.description)}</p>` : ''}
                </div>
                <div>${buttonHtml}</div>
            </div>
        `;
    }).join('');
}

window.toggleParticipation = async function(eventId, userId, isJoined) {
    const sb = window.supabaseClient;
    try {
        if (isJoined) {
            const { error } = await sb.from('event_participants').delete().eq('event_id', eventId).eq('user_id', userId);
            if (error) throw error;
            await createNotification(userId, 'Partecipazione Annullata', 'Hai annullato la tua partecipazione all\'evento.', 'warning');
        } else {
            const { error } = await sb.from('event_participants').insert([{ event_id: eventId, user_id: userId }]);
            if (error) throw error;
            await createNotification(userId, 'Partecipazione Confermata!', 'La tua partecipazione è stata registrata con successo.', 'success');
        }

        await loadAvailableEvents(userId);
        await loadNotifications(userId);
    } catch (err) {
        console.error("Errore partecipazione:", err);
        alert("Impossibile completare l'operazione: " + (err.message || err));
    }
};

/* ==========================================================================
   RADUNI (GALLERIA FOTO)
   ========================================================================== */

async function loadRaduni(userId) {
    const sb = window.supabaseClient;
    const container = document.getElementById('member-raduni-list');
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
        container.innerHTML = `<p class="text-xs text-gray-400">Nessun raduno pubblicato al momento.</p>`;
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
                    ${r.drive_link ? `<a href="${escapeHtml(r.drive_link)}" target="_blank" rel="noopener noreferrer" class="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition flex items-center gap-1"><i class="fa-brands fa-google-drive text-brand-azzurro"></i> Album Completo</a>` : ''}
                </div>

                <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    ${photos.map(p => `<img src="${escapeHtml(p.photo_url)}" class="w-full h-20 object-cover rounded-lg border border-brand-border">`).join('')}
                </div>

                <form class="raduno-upload-form flex gap-2 pt-2 border-t border-brand-border" data-raduno-id="${r.id}">
                    <input type="file" accept="image/*" required class="flex-grow text-xs text-white file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-brand-azzurro file:text-black">
                    <button type="submit" class="px-4 py-2 btn-gradient text-white text-xs font-black rounded-xl uppercase">
                        <i class="fa-solid fa-cloud-arrow-up"></i> Carica
                    </button>
                </form>
            </div>
        `;
    }).join('');

    document.querySelectorAll('.raduno-upload-form').forEach(form => {
        form.onsubmit = async (e) => {
            e.preventDefault();
            const radunoId = form.dataset.radunoId;
            const fileInput = form.querySelector('input[type="file"]');
            const file = fileInput.files[0];
            if (!file) return;

            const sb = window.supabaseClient;
            const submitBtn = form.querySelector('button');
            submitBtn.disabled = true;
            submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i>`;

            try {
                const fileExt = file.name.split('.').pop();
                const filePath = `${radunoId}/${Date.now()}_${userId}.${fileExt}`;

                const { error: uploadErr } = await sb.storage.from('raduni').upload(filePath, file);
                if (uploadErr) throw uploadErr;

                const { data: urlData } = sb.storage.from('raduni').getPublicUrl(filePath);

                const { error: insertErr } = await sb.from('raduno_photos').insert([{
                    raduno_id: radunoId,
                    uploaded_by: userId,
                    photo_url: urlData.publicUrl
                }]);
                if (insertErr) throw insertErr;

                await loadRaduni(userId);
            } catch (err) {
                console.error("Errore caricamento foto raduno:", err);
                alert("Errore durante il caricamento della foto: " + err.message);
                submitBtn.disabled = false;
                submitBtn.innerHTML = `<i class="fa-solid fa-cloud-arrow-up"></i> Carica`;
            }
        };
    });
}

/* ==========================================================================
   SISTEMA DI NOTIFICHE
   ========================================================================== */

async function initNotifications(userId) {
    const btn = document.getElementById('btn-notifications');
    const dropdown = document.getElementById('notif-dropdown');

    if (btn && dropdown) {
        btn.onclick = () => dropdown.classList.toggle('hidden');
        document.addEventListener('click', (e) => {
            if (!btn.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.classList.add('hidden');
            }
        });
    }

    await loadNotifications(userId);
    subscribeToRealtimeNotifications(userId);
}

async function loadNotifications(userId) {
    const sb = window.supabaseClient;
    const container = document.getElementById('notif-list-container');
    const badge = document.getElementById('notif-badge');
    if (!container) return;

    const { data: list, error } = await sb
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(15);

    if (error || !list || list.length === 0) {
        container.innerHTML = `<p class="text-xs text-gray-500 text-center py-4">Nessuna notifica presente.</p>`;
        if (badge) badge.classList.add('hidden');
        return;
    }

    const unreadCount = list.filter(n => !n.is_read).length;
    if (badge) {
        if (unreadCount > 0) {
            badge.innerText = unreadCount;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }

    container.innerHTML = list.map(n => {
        let iconClass = 'fa-circle-info text-brand-azzurro';
        if (n.type === 'warning') iconClass = 'fa-triangle-exclamation text-yellow-400';
        if (n.type === 'success') iconClass = 'fa-circle-check text-brand-azzurro';
        if (n.type === 'chat') iconClass = 'fa-comment text-white';

        const time = new Date(n.created_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
        const date = new Date(n.created_at).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });

        return `
            <div class="p-3 rounded-xl border ${n.is_read ? 'bg-brand-card/40 border-brand-border/40' : 'bg-brand-card border-brand-azzurro/40'} flex gap-3 items-start transition">
                <i class="fa-solid ${iconClass} mt-0.5 text-sm"></i>
                <div class="flex-grow space-y-0.5">
                    <div class="flex justify-between items-center">
                        <h5 class="text-xs font-bold text-white">${escapeHtml(n.title)}</h5>
                        <span class="text-[9px] text-gray-400">${date} ${time}</span>
                    </div>
                    <p class="text-[11px] text-gray-300 leading-snug">${escapeHtml(n.message)}</p>
                </div>
            </div>
        `;
    }).join('');
}

async function createNotification(userId, title, message, type = 'info') {
    const sb = window.supabaseClient;
    await sb.from('notifications').insert([{ user_id: userId, title, message, type }]);
}

window.markAllNotificationsAsRead = async function() {
    if (!currentSessionData) return;
    const sb = window.supabaseClient;
    await sb.from('notifications').update({ is_read: true }).eq('user_id', currentSessionData.user.id);
    await loadNotifications(currentSessionData.user.id);
};

function subscribeToRealtimeNotifications(userId) {
    const sb = window.supabaseClient;
    sb.removeAllChannels();
    sb.channel(`user-notifications-${userId}`)
        .on('postgres_changes', {
            event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}`
        }, () => loadNotifications(userId))
        .subscribe();
}
