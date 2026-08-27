# KY Wash 🧺

A shared, real-time laundry-room tracker for your dorm/college — washer & dryer
waitlists, live timers, global visibility of every machine, community chat,
and an admin panel. Built with React + Vite, backed by Firebase (Cloud
Firestore) for realtime sync, and ready to deploy on Vercel.

## 1. Create a Firebase project

1. Go to https://console.firebase.google.com and create a new project (free "Spark" plan is enough).
2. In the project, go to **Build → Firestore Database → Create database**. Start in **test mode** for now (or paste `firestore.rules.example` into the Rules tab).
3. Go to **Project settings → General → Your apps**, click the **`</>`** (Web) icon, register an app, and copy the `firebaseConfig` values.

## 2. Configure the app

```bash
cp .env.example .env
```

Paste your Firebase values into `.env`:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

## 3. Run locally

```bash
npm install
npm run dev
```

Open the printed local URL. The first time it loads, it auto-creates the 6
washer + 6 dryer documents in Firestore (`ensureMachinesSeeded`).

## 4. Deploy to Vercel

1. Push this folder to a GitHub repo.
2. In Vercel, **Add New → Project**, import the repo (framework preset: **Vite**).
3. Under **Environment Variables**, add the same six `VITE_FIREBASE_*` values from your `.env`.
4. Deploy. Vercel builds with `npm run build` and serves the `dist/` folder automatically.

## How it works

- **Accounts**: `users/{userId}` documents store a 6-digit User ID, phone number, and password (see `firestore.rules.example` for a note on hardening this with real Firebase Auth later).
- **Machines**: `machines/{id}` documents (`washer-1`…`washer-6`, `dryer-1`…`dryer-6`) hold `status`, `mode`, `startedBy`, `startedAt`, `endsAt`. Every screen subscribes with `onSnapshot`, so **every user sees the same live state** — this is the "global visibility" requirement.
- **Timers**: never counted down in JS state. Each card recomputes `endsAt - Date.now()` every second (see `src/utils/useTick.js` + `src/utils/time.js`), so timers can't drift, get stuck, or "stop" — refreshing the page or losing focus never breaks them.
- **Race safety**: starting a machine uses a Firestore `runTransaction`, so two people tapping "Start" on the same idle machine at the same instant can't both win.
- **Malaysia time**: all clocks/timestamps are formatted with `Intl.DateTimeFormat(..., { timeZone: 'Asia/Kuala_Lumpur' })`, regardless of the visiting device's own timezone.
- **Notifications**: when a user's own cycle timer hits zero, the app plays a repeating alarm tone, fires a browser Notification (if permission was granted), and vibrates supported phones, until they tap "On the Way" / "Clothes Collected".
- **Admin**: `/` shows an "Admin Login →" link on the auth screen. Password is `James123#` (change it in `src/utils/constants.js` before you ship this for real). Admins can lock/unlock any machine (instantly reflected on every user's Machines tab) and see all feedback + reported issues.
- **Chat**: `chat/{id}` documents ordered by timestamp, subscribed in realtime — a simple, durable community chat.

## Project structure

```
src/
  App.jsx                 # top-level state + realtime subscriptions
  db.js                   # all Firestore reads/writes live here
  firebase.js             # Firebase init from env vars
  components/
    Auth.jsx               # create account / log in + founders section
    MachinesTab.jsx         # waitlists + washer/dryer grids
    MachineCard.jsx          # single machine: ring timer, actions
    HistoryTab.jsx
    FeedbackTab.jsx
    ProfileTab.jsx
    AdminPage.jsx
    ChatWidget.jsx
    Logo.jsx
    Modal.jsx
  utils/
    time.js                # Malaysia-time formatting + countdown math
    useTick.js              # 1s re-render heartbeat for live timers
    notify.js               # alarm sound / Notification API / vibration
    constants.js            # machine modes, counts, admin password
public/
  founders/                # founder photos shown on the auth screen
```

## Customizing

- Change machine counts/modes in `src/utils/constants.js`.
- Change the admin password in the same file.
- Swap founder photos/names in `src/components/Auth.jsx`.
- Colors/fonts are all CSS variables at the top of `src/index.css`.
