import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyAH-CradwtabU6ICDIMPpQBqjW10G9GB24",
  authDomain: "ky-wash-d07c8.firebaseapp.com",
  projectId: "ky-wash-d07c8",
  storageBucket: "ky-wash-d07c8.firebasestorage.app",
  messagingSenderId: "145909463731",
  appId: "1:145909463731:web:70099288cf1f7f2410cec6",
}

export const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)