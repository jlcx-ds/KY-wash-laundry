// Firebase initialization.
// Fill in your own project's config in a `.env` file at the project root
// (copy `.env.example` to `.env` and paste your values from the Firebase console:
// Project settings -> General -> Your apps -> SDK setup and configuration).
//
// This app uses Cloud Firestore for all data (users, machines, waitlists,
// history, feedback, issues, chat) with onSnapshot() realtime listeners,
// which is what gives every user "global visibility" — every phone/laptop
// sees the same machine state, waitlist, and timers at the same time.

import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
