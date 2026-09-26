# CASCIA' CLUB — Web App

Web app per la gestione del club **CASCIA' CLUB** (fuoristrada, auto d'epoca, auto sportive): iscrizione soci con dati e foto auto, partecipazione a eventi e riunioni, galleria raduni con foto, chat interna. Basata su Supabase (database, autenticazione, storage foto) e Google Drive (album fotografici completi dei raduni).

## Struttura del progetto

```
index.html                 -> login / registrazione
manifest.json               -> PWA (installabile su telefono)
css/style.css                -> stili e palette bianco/nero/azzurro
js/config.js                  -> connessione Supabase + utility comuni
js/auth.js                     -> login e iscrizione (con dati auto)
js/socio.js                     -> area personale del socio
js/admin.js                      -> pannello Direttivo
js/chat.js                        -> chat community e privata
js/pwa.js                          -> installazione come app
pages/dashboard-socio.html          -> dashboard socio
pages/dashboard-admin.html           -> dashboard Direttivo
assets/img/                          -> loghi del club
database/schema.sql                   -> script SQL per Supabase
```

## 1. Configurare Supabase (gratuito)

1. Crea un progetto su [supabase.com](https://supabase.com) (piano Free).
2. Vai su **SQL Editor** e incolla il contenuto di `database/schema.sql`, quindi eseguilo. Crea tutte le tabelle (soci, eventi, partecipazioni, raduni, foto, chat, notifiche) e le policy di sicurezza (RLS).
3. Vai su **Storage** e crea 3 bucket pubblici in lettura:
   - `car-photos` (foto auto dei soci)
   - `raduni` (foto caricate nella galleria raduni)
   - `avatars` (opzionale, avatar profilo)
   Per ognuno imposta una policy che permetta **insert** agli utenti autenticati e **select** pubblico.
4. Vai su **Project Settings -> API** e copia `Project URL` e `anon public key`.
5. Apri `js/config.js` e sostituisci:
   ```js
   const SUPABASE_URL = "https://TUO-PROGETTO.supabase.co";
   const SUPABASE_ANON_KEY = "TUA_CHIAVE_ANON_PUBBLICA";
   ```
6. Registra il primo utente dall'app (diventerà socio normale), poi in **SQL Editor** esegui:
   ```sql
   update public.profiles set is_admin = true where email = 'la-tua-email@esempio.it';
   ```
   Questo utente diventa il/la responsabile del Direttivo con accesso al pannello admin.

## 2. Google Drive per gli album dei raduni

Per restare gratuita e semplice da gestire, l'app usa un approccio ibrido:
- le **foto caricate dai soci** nella sezione Raduni vanno automaticamente su Supabase Storage (bucket `raduni`) e sono visibili subito nella galleria in-app;
- per gli **album fotografici completi** (alta risoluzione, tante foto), il Direttivo può creare una cartella condivisa su Google Drive e incollarne il link nel campo "Link Cartella Google Drive" quando crea un raduno. Il link comparirà come pulsante "Album Completo" sia nella dashboard soci che in quella admin.

Questo evita di dover configurare l'autenticazione OAuth di Google (necessaria per caricare file direttamente su Drive da una semplice pagina web) mantenendo comunque Google Drive come archivio delle foto in alta qualità. Se in futuro vuoi l'upload diretto su Drive dall'app, serve creare un progetto su Google Cloud Console, abilitare la Google Drive API e integrare Google Identity Services: puoi chiedermi di implementarlo come passo successivo.

## 3. Pubblicare l'app

Puoi caricare tutti questi file su un hosting statico gratuito, ad esempio:
- **GitHub Pages**
- **Netlify** / **Vercel**
- Anche direttamente come **PWA installabile** dal telefono (manifest già incluso)

Non serve un server: sono file HTML/CSS/JS statici che comunicano direttamente con Supabase.

## Funzionalità incluse

**Area Socio**
- Iscrizione con nome, cognome, data di nascita, telefono, email
- Dati e foto della propria auto (marca, modello, anno, categoria: fuoristrada / auto d'epoca / auto sportiva)
- Elenco eventi e riunioni con possibilità di dare/annullare la propria partecipazione
- Galleria Raduni: visualizza foto pubblicate e carica le proprie
- Chat di gruppo e messaggi privati al Direttivo
- Notifiche in tempo reale

**Pannello Direttivo**
- Creazione/modifica di eventi e riunioni, con elenco partecipanti
- Anagrafica soci con contatti e dati/foto auto
- Creazione raduni, con link opzionale a cartella Google Drive, e galleria foto caricate dai soci
- Chat community e messaggi privati
- Grafici: partecipazione per evento, distribuzione soci per categoria auto

## Cosa è stato rimosso rispetto al progetto di partenza

- Tutta la parte "lezioni" (corsi, prenotazioni orari, capienza lezioni fitness) è stata sostituita con "Eventi & Riunioni"
- Il certificato medico (upload, scadenza, avvisi, grafico stato certificati) è stato rimosso completamente
