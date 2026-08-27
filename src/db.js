// Thin data-access layer over Firestore. Every read here is a realtime
// onSnapshot listener, so every screen, on every device, updates the moment
// anyone else changes something — that's the "global visibility" the app
// needs (shared waitlists, shared machine/timer state, shared chat).
import {
  collection, doc, setDoc, updateDoc, addDoc, deleteDoc, getDoc, getDocs,
  onSnapshot, query, where, orderBy, runTransaction, serverTimestamp,
} from 'firebase/firestore'
import { db } from './firebase'
import { NUM_WASHERS, NUM_DRYERS } from './utils/constants'

// ---------- Users ----------

export async function userExists(userId) {
  const snap = await getDoc(doc(db, 'users', userId))
  return snap.exists()
}

export async function createAccount({ userId, phone, password }) {
  const ref = doc(db, 'users', userId)
  const existing = await getDoc(ref)
  if (existing.exists()) {
    throw new Error('That User ID is already taken. Please choose another.')
  }
  await setDoc(ref, { userId, phone, password, createdAt: Date.now() })
  return { userId, phone }
}

export async function login({ userId, password }) {
  const ref = doc(db, 'users', userId)
  const snap = await getDoc(ref)
  if (!snap.exists()) throw new Error('No account found with that User ID.')
  const data = snap.data()
  if (data.password !== password) throw new Error('Incorrect password.')
  return data
}

export async function updateProfile(oldUserId, { userId, phone, password }) {
  // If the User ID itself is changing, we need to move the document
  // (Firestore doc IDs are immutable) and keep every other collection
  // pointing at the new ID.
  if (userId !== oldUserId) {
    const takenSnap = await getDoc(doc(db, 'users', userId))
    if (takenSnap.exists()) throw new Error('That User ID is already taken.')
    const oldSnap = await getDoc(doc(db, 'users', oldUserId))
    const oldData = oldSnap.exists() ? oldSnap.data() : {}
    await setDoc(doc(db, 'users', userId), { ...oldData, userId, phone, password })
    await deleteDoc(doc(db, 'users', oldUserId))
  } else {
    await updateDoc(doc(db, 'users', oldUserId), { phone, password })
  }
  return { userId, phone, password }
}

// ---------- Machines ----------

export function machineId(type, index) {
  return `${type}-${index}`
}

// Creates the 6 washers + 6 dryers the first time the app runs against a
// fresh Firebase project. Safe to call every load — it skips machines that
// already exist.
export async function ensureMachinesSeeded() {
  const specs = [
    ...Array.from({ length: NUM_WASHERS }, (_, i) => ({ type: 'washer', index: i + 1 })),
    ...Array.from({ length: NUM_DRYERS }, (_, i) => ({ type: 'dryer', index: i + 1 })),
  ]
  for (const { type, index } of specs) {
    const id = machineId(type, index)
    const ref = doc(db, 'machines', id)
    const snap = await getDoc(ref)
    if (!snap.exists()) {
      await setDoc(ref, {
        id, type, index, status: 'idle', mode: null, modeLabel: null,
        cycleMinutes: null, startedBy: null, startedAt: null, endsAt: null,
      })
    }
  }
}

export function subscribeMachines(cb) {
  return onSnapshot(collection(db, 'machines'), (snap) => {
    const list = snap.docs.map((d) => d.data())
    list.sort((a, b) => (a.type === b.type ? a.index - b.index : a.type.localeCompare(b.type)))
    cb(list)
  })
}

// Transaction guarantees only one user can ever win the race to start a
// given idle machine, even if two people tap "Start" at the same instant.
export async function startMachine({ id, userId, mode, minutes }) {
  const ref = doc(db, 'machines', id)
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref)
    const data = snap.data()
    if (!data || data.status !== 'idle') {
      throw new Error('This machine was just taken or locked. Pick another one.')
    }
    const startedAt = Date.now()
    const endsAt = startedAt + minutes * 60 * 1000
    tx.update(ref, {
      status: 'running',
      mode: mode.id,
      modeLabel: mode.label,
      cycleMinutes: minutes,
      startedBy: userId,
      startedAt,
      endsAt,
    })
  })
  await addHistory({ userId, machineId: id, action: 'started', modeLabel: mode.label })
}

export async function cancelMachine({ id, userId }) {
  const ref = doc(db, 'machines', id)
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref)
    const data = snap.data()
    if (!data || data.startedBy !== userId) {
      throw new Error('Only the person who started this machine can cancel it.')
    }
    tx.update(ref, {
      status: 'idle', mode: null, modeLabel: null, cycleMinutes: null,
      startedBy: null, startedAt: null, endsAt: null,
    })
  })
  await addHistory({ userId, machineId: id, action: 'cancelled' })
}

export async function setOnTheWay({ id, userId }) {
  await updateDoc(doc(db, 'machines', id), { status: 'on_the_way' })
  await addHistory({ userId, machineId: id, action: 'on_the_way' })
}

export async function setCollected({ id, userId }) {
  await updateDoc(doc(db, 'machines', id), {
    status: 'idle', mode: null, modeLabel: null, cycleMinutes: null,
    startedBy: null, startedAt: null, endsAt: null,
  })
  await addHistory({ userId, machineId: id, action: 'collected' })
}

// Admin controls
export async function adminSetLock({ id, locked }) {
  if (locked) {
    await updateDoc(doc(db, 'machines', id), { status: 'locked', preLockStatus: null })
  } else {
    await updateDoc(doc(db, 'machines', id), {
      status: 'idle', mode: null, modeLabel: null, cycleMinutes: null,
      startedBy: null, startedAt: null, endsAt: null,
    })
  }
}

// ---------- Waitlist ----------

export function subscribeWaitlist(type, cb) {
  const q = query(collection(db, 'waitlist'), where('type', '==', type), orderBy('joinedAt', 'asc'))
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))))
}

export async function joinWaitlist({ type, userId }) {
  await addDoc(collection(db, 'waitlist'), { type, userId, joinedAt: Date.now() })
}

export async function leaveWaitlist(entryId) {
  await deleteDoc(doc(db, 'waitlist', entryId))
}

// ---------- History ----------

export async function addHistory({ userId, machineId, action, modeLabel }) {
  await addDoc(collection(db, 'history'), {
    userId, machineId, action, modeLabel: modeLabel || null, timestamp: Date.now(),
  })
}

export function subscribeHistory(cb) {
  const q = query(collection(db, 'history'), orderBy('timestamp', 'desc'))
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))))
}

// ---------- Feedback ----------

export async function submitFeedback({ userId, message }) {
  await addDoc(collection(db, 'feedback'), { userId, message, timestamp: Date.now() })
}

export function subscribeFeedback(cb) {
  const q = query(collection(db, 'feedback'), orderBy('timestamp', 'desc'))
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))))
}

// ---------- Issues ----------

export async function reportIssue({ userId, machineId, description }) {
  await addDoc(collection(db, 'issues'), {
    userId, machineId, description, status: 'open', timestamp: Date.now(),
  })
}

export function subscribeIssues(cb) {
  const q = query(collection(db, 'issues'), orderBy('timestamp', 'desc'))
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))))
}

export async function resolveIssue(issueId) {
  await updateDoc(doc(db, 'issues', issueId), { status: 'resolved' })
}

// ---------- Community chat ----------

export async function sendChatMessage({ userId, message }) {
  await addDoc(collection(db, 'chat'), { userId, message, timestamp: Date.now() })
}

export function subscribeChat(cb) {
  const q = query(collection(db, 'chat'), orderBy('timestamp', 'asc'))
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))))
}
