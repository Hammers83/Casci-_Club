-- ============================================================
-- SCHEMA SUPABASE — CASCIA' CLUB
-- Esegui questo script nell'SQL Editor del tuo progetto Supabase.
-- ============================================================

-- 1. PROFILI SOCI (estende auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text,
  cognome text,
  data_nascita date,
  telefono text,
  email text,
  is_admin boolean default false,
  avatar_url text,
  car_brand text,
  car_model text,
  car_year int,
  car_category text check (car_category in ('fuoristrada', 'epoca', 'sportiva')),
  car_photo_url text,
  created_at timestamptz default now()
);

-- 2. EVENTI & RIUNIONI
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  type text default 'evento' check (type in ('evento', 'riunione')),
  title text not null,
  location text,
  description text,
  datetime timestamptz not null,
  capacity int default 0,
  created_at timestamptz default now()
);

-- 3. PARTECIPAZIONE EVENTI (un socio per evento)
create table if not exists public.event_participants (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique (event_id, user_id)
);

-- 4. RADUNI
create table if not exists public.raduni (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  event_date date not null,
  drive_link text,
  created_at timestamptz default now()
);

-- 5. FOTO DEI RADUNI
create table if not exists public.raduno_photos (
  id uuid primary key default gen_random_uuid(),
  raduno_id uuid references public.raduni(id) on delete cascade,
  uploaded_by uuid references public.profiles(id) on delete set null,
  photo_url text not null,
  created_at timestamptz default now()
);

-- 6. CHAT (gruppo e privata)
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid references public.profiles(id) on delete cascade,
  recipient_id uuid references public.profiles(id) on delete cascade,
  content text not null,
  is_private boolean default false,
  created_at timestamptz default now()
);

-- 7. NOTIFICHE
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  title text not null,
  message text not null,
  type text default 'info',
  is_read boolean default false,
  created_at timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.event_participants enable row level security;
alter table public.raduni enable row level security;
alter table public.raduno_photos enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;

-- PROFILES: ognuno vede tutti i profili (bacheca soci), ma modifica solo il proprio
create policy "profiles_select_all" on public.profiles for select using (true);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- EVENTS: tutti i soci autenticati vedono gli eventi; solo l'admin crea/modifica
create policy "events_select_all" on public.events for select using (auth.role() = 'authenticated');
create policy "events_admin_write" on public.events for all using (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);

-- EVENT_PARTICIPANTS: ognuno gestisce la propria partecipazione, l'admin vede tutto
create policy "participants_select" on public.event_participants for select using (auth.role() = 'authenticated');
create policy "participants_insert_own" on public.event_participants for insert with check (auth.uid() = user_id);
create policy "participants_delete_own" on public.event_participants for delete using (
  auth.uid() = user_id or exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);

-- RADUNI: lettura per tutti gli autenticati, scrittura solo admin
create policy "raduni_select_all" on public.raduni for select using (auth.role() = 'authenticated');
create policy "raduni_admin_write" on public.raduni for all using (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);

-- RADUNO_PHOTOS: lettura per tutti, upload per qualsiasi socio autenticato
create policy "raduno_photos_select" on public.raduno_photos for select using (auth.role() = 'authenticated');
create policy "raduno_photos_insert" on public.raduno_photos for insert with check (auth.uid() = uploaded_by);
create policy "raduno_photos_delete_admin" on public.raduno_photos for delete using (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);

-- MESSAGES
create policy "messages_select" on public.messages for select using (auth.role() = 'authenticated');
create policy "messages_insert_own" on public.messages for insert with check (auth.uid() = sender_id);

-- NOTIFICATIONS
create policy "notifications_select_own" on public.notifications for select using (auth.uid() = user_id);
create policy "notifications_insert_all" on public.notifications for insert with check (auth.role() = 'authenticated');
create policy "notifications_update_own" on public.notifications for update using (auth.uid() = user_id);

-- ============================================================
-- STORAGE BUCKET (crea questi bucket da Supabase -> Storage, tutti PUBLIC in lettura)
--   car-photos   -> foto delle auto dei soci
--   raduni       -> foto caricate nella galleria dei raduni
--   avatars      -> avatar profilo (opzionale)
-- Dopo averli creati, aggiungi policy di storage che permettano:
--   - upload (insert) agli utenti autenticati sulla propria cartella (path che inizia con auth.uid())
--   - lettura pubblica (select) a chiunque
-- ============================================================

-- ============================================================
-- PRIMO ADMIN: dopo la registrazione del primo socio (il/la responsabile
-- del club), esegui questa query sostituendo l'email per promuoverlo a
-- membro del Direttivo (is_admin = true):
-- ============================================================
-- update public.profiles set is_admin = true where email = 'direttivo@casciaclub.it';
