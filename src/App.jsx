import React, { useEffect, useRef, useState } from 'react'
import { db } from './firebase'
import {
  collection,
  doc,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'

// Fixed image references using public folder asset paths directly
const justinImg = '/founders/founderjustin.jpg'
const jamesImg = '/founders/founderjames.jpg'

// --- Constants & Initial Data Seeds ---
const INITIAL_MACHINES = Array.from({ length: 12 }, (_, i) => {
  const isWasher = i < 6
  return {
    id: `m_${i + 1}`,
    type: isWasher ? 'washer' : 'dryer',
    index: (i % 6) + 1,
    status: 'idle', // 'idle' | 'running' | 'pending_collection' | 'locked'
    startedBy: null,
    startedPhone: null,
    startedAt: null,
    endsAt: null,
    modeName: null,
    isLocked: false,
  }
})

// --- Real-time Firebase Subscriptions & Actions ---

export async function ensureMachinesSeeded() {
  for (const m of INITIAL_MACHINES) {
    const ref = doc(db, 'machines', m.id)
    const snap = await getDoc(ref)
    if (!snap.exists()) {
      await setDoc(ref, m)
    }
  }
}

export function subscribeMachines(cb) {
  return onSnapshot(collection(db, 'machines'), (snapshot) => {
    const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    list.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }))
    cb(list)
  })
}

export function subscribeWaitlist(type, cb) {
  const q = query(collection(db, `${type}Waitlist`), orderBy('timestamp', 'asc'))
  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    cb(list)
  })
}

export function subscribeHistory(cb) {
  const q = query(collection(db, 'history'), orderBy('timestamp', 'desc'))
  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    cb(list)
  })
}

export function subscribeFeedback(cb) {
  const q = query(collection(db, 'feedback'), orderBy('timestamp', 'desc'))
  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    cb(list)
  })
}

export function subscribeIssues(cb) {
  const q = query(collection(db, 'issues'), orderBy('timestamp', 'desc'))
  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    cb(list)
  })
}

export function subscribeChat(cb) {
  const q = query(collection(db, 'chat'), orderBy('timestamp', 'asc'))
  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    cb(list)
  })
}

export async function joinWaitlist({ type, userId }) {
  await addDoc(collection(db, `${type}Waitlist`), {
    userId,
    timestamp: Date.now(),
  })
}

export async function leaveWaitlist(type, entryId) {
  await deleteDoc(doc(db, `${type}Waitlist`, entryId))
}

export async function startMachine({ id, user, mode, minutes }) {
  const now = Date.now()
  const endsAt = now + minutes * 60 * 1000
  const machineRef = doc(db, 'machines', id)

  await updateDoc(machineRef, {
    status: 'running',
    startedBy: user.userId,
    startedPhone: user.phone || 'N/A',
    startedAt: now,
    endsAt,
    modeName: mode.name,
  })

  // Format machine label for history: W1-W6 or D1-D6
  const machineDoc = INITIAL_MACHINES.find(m => m.id === id)
  const codeLabel = machineDoc ? `${machineDoc.type === 'washer' ? 'W' : 'D'}${machineDoc.index}` : id

  await addDoc(collection(db, 'history'), {
    userId: user.userId,
    phone: user.phone || 'N/A',
    machineId: id,
    machineLabel: codeLabel,
    action: 'STARTED',
    mode: mode.name,
    timestamp: now,
  })
}

export async function cancelMachine({ id, userId }) {
  const machineRef = doc(db, 'machines', id)
  const snap = await getDoc(machineRef)
  const mData = snap.data()

  const machineDoc = INITIAL_MACHINES.find(m => m.id === id)
  const codeLabel = machineDoc ? `${machineDoc.type === 'washer' ? 'W' : 'D'}${machineDoc.index}` : id

  await updateDoc(machineRef, {
    status: 'idle',
    startedBy: null,
    startedPhone: null,
    startedAt: null,
    endsAt: null,
    modeName: null,
  })

  await addDoc(collection(db, 'history'), {
    userId,
    machineId: id,
    machineLabel: codeLabel,
    action: 'CANCELLED',
    mode: mData?.modeName || 'N/A',
    timestamp: Date.now(),
  })
}

export async function setOnTheWay({ id, userId }) {
  const machineRef = doc(db, 'machines', id)
  await updateDoc(machineRef, { status: 'pending_collection' })
}

export async function setCollected({ id, userId }) {
  const machineRef = doc(db, 'machines', id)
  const snap = await getDoc(machineRef)
  const mData = snap.data()

  const machineDoc = INITIAL_MACHINES.find(m => m.id === id)
  const codeLabel = machineDoc ? `${machineDoc.type === 'washer' ? 'W' : 'D'}${machineDoc.index}` : id

  await updateDoc(machineRef, {
    status: 'idle',
    startedBy: null,
    startedPhone: null,
    startedAt: null,
    endsAt: null,
    modeName: null,
  })

  await addDoc(collection(db, 'history'), {
    userId,
    machineId: id,
    machineLabel: codeLabel,
    action: 'COLLECTED',
    mode: mData?.modeName || 'N/A',
    timestamp: Date.now(),
  })
}

export async function forceResetMachine({ id }) {
  const machineRef = doc(db, 'machines', id)
  await updateDoc(machineRef, {
    status: 'idle',
    startedBy: null,
    startedPhone: null,
    startedAt: null,
    endsAt: null,
    modeName: null,
  })
}

export async function reportIssue({ userId, machineId, description }) {
  await addDoc(collection(db, 'issues'), {
    userId,
    machineId,
    description,
    resolved: false,
    timestamp: Date.now(),
  })
}

export async function submitFeedback({ userId, message }) {
  await addDoc(collection(db, 'feedback'), {
    userId,
    message,
    timestamp: Date.now(),
  })
}

export async function registerUser({ userId, phone, password }) {
  const userRef = doc(db, 'users', userId)
  const snap = await getDoc(userRef)
  if (snap.exists()) {
    throw new Error('User ID already exists. Please log in.')
  }
  const userData = { userId, phone, password }
  await setDoc(userRef, userData)
  return userData
}

export async function loginUser({ userId, password }) {
  const userRef = doc(db, 'users', userId)
  const snap = await getDoc(userRef)
  if (!snap.exists()) {
    throw new Error('User ID not found.')
  }
  const data = snap.data()
  if (data.password !== password) {
    throw new Error('Invalid password.')
  }
  return data
}

export async function resetPassword({ userId, phone, newPassword }) {
  const userRef = doc(db, 'users', userId)
  const snap = await getDoc(userRef)
  if (!snap.exists()) {
    throw new Error('User ID not found.')
  }
  const data = snap.data()
  if (data.phone !== phone) {
    throw new Error('Phone number does not match this User ID.')
  }
  await updateDoc(userRef, { password: newPassword })
  return { ...data, password: newPassword }
}

export async function updateProfile(oldUserId, { userId, phone, password }) {
  if (oldUserId !== userId) {
    await setDoc(doc(db, 'users', userId), { userId, phone, password })
    await deleteDoc(doc(db, 'users', oldUserId))
  } else {
    await updateDoc(doc(db, 'users', userId), { phone, password })
  }
  return { userId, phone, password }
}

export async function sendChatMessage({ userId, message }) {
  await addDoc(collection(db, 'chat'), {
    userId,
    message,
    timestamp: Date.now(),
  })
}

export async function adminSetLock({ id, locked }) {
  const machineRef = doc(db, 'machines', id)
  await updateDoc(machineRef, {
    isLocked: locked,
    status: locked ? 'locked' : 'idle',
  })
}

export async function resolveIssue(issueId) {
  const issueRef = doc(db, 'issues', issueId)
  await updateDoc(issueRef, { resolved: true })
}

// --- Time & Audio Utilities ---
export function formatMYTime(timestamp) {
  if (!timestamp) return '--:--'
  return new Date(timestamp).toLocaleTimeString('en-GB', {
    timeZone: 'Asia/Kuala_Lumpur',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function formatMYDate(timestamp) {
  if (!timestamp) return ''
  return new Date(timestamp).toLocaleDateString('en-GB', {
    timeZone: 'Asia/Kuala_Lumpur',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function getRemainingSeconds(endsAt) {
  if (!endsAt) return 0
  const diff = Math.ceil((endsAt - Date.now()) / 1000)
  return diff > 0 ? diff : 0
}

export function formatCountdown(totalSeconds) {
  const mins = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export function useTick(interval = 1000) {
  const [, setTick] = useState(0)
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), interval)
    return () => clearInterval(timer)
  }, [interval])
}

// --- Audio Alarm Engine ---
let alarmInterval = null
export function ringForCycleComplete(title) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('KY Wash Cycle Complete', { body: `Your cycle for ${title} is done!` })
  }

  stopAlarm()
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    
    const playBeep = () => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(880, ctx.currentTime)
      gain.gain.setValueAtTime(0.1, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.4)
    }

    playBeep()
    alarmInterval = setInterval(playBeep, 1000)
  } catch (e) {
    console.error('Audio playback issue:', e)
  }
}

export function stopAlarm() {
  if (alarmInterval) {
    clearInterval(alarmInterval)
    alarmInterval = null
  }
}

export function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission()
  }
}

// --- Logo Component ---
function Logo({ size = 48 }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <rect x="8" y="4" width="48" height="56" rx="8" fill="#2563EB" />
        <rect x="14" y="10" width="36" height="8" rx="4" fill="#60A5FA" />
        <circle cx="20" cy="14" r="2" fill="#FFFFFF" />
        <circle cx="26" cy="14" r="2" fill="#FFFFFF" />
        <circle cx="32" cy="14" r="2" fill="#FFFFFF" />
        <circle cx="32" cy="38" r="18" fill="#FFFFFF" />
        <circle cx="32" cy="38" r="14" fill="#93C5FD" />
        <path d="M22 38 Q 27 32, 32 38 T 42 38" stroke="#2563EB" strokeWidth="3" fill="none" />
      </svg>
      <span style={{ fontSize: size * 0.5, fontWeight: 'bold', color: '#1E293B' }}>KY Wash</span>
    </div>
  )
}

// --- Team / Founders Component ---
function FoundersSection() {
  const founders = [
    {
      name: 'Justin Low Chun Xian',
      scholar: '🔰 Yayasan UEM Scholar',
      major: '🎓 Data Science',
      img: justinImg,
    },
    {
      name: 'James Low Weng Kean',
      scholar: '🔰 Khazanah Global Scholar',
      major: '🎓 Artificial Intelligence',
      img: jamesImg,
    },
  ]

  return (
    <div style={{ marginTop: '36px', borderTop: '1px solid #E2E8F0', paddingTop: '24px' }}>
      <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        👥 Meet Our Team - Founders
      </h3>
      <p style={{ color: '#64748B', fontSize: '0.9rem', marginBottom: '20px' }}>
        Get to know the founders of KY Wash who are dedicated to improving our laundry services.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
        {founders.map((f, idx) => (
          <div
            key={idx}
            style={{
              background: '#FFFFFF',
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
              overflow: 'hidden',
              boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
            }}
          >
            <img
              src={f.img}
              alt={f.name}
              style={{ width: '100%', height: '220px', objectFit: 'cover' }}
            />
            <div style={{ padding: '16px' }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', color: '#0F172A' }}>{f.name}</h4>
              <div style={{ color: '#2563EB', fontWeight: '500', fontSize: '0.9rem', marginBottom: '4px' }}>
                {f.scholar}
              </div>
              <div style={{ color: '#475569', fontSize: '0.85rem' }}>{f.major}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// --- Auth Component (Login / Register / Forgot Password) ---
function Auth({ onAuthed }) {
  const [mode, setMode] = useState('login') // 'login' | 'register' | 'forgot'
  const [userId, setUserId] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      if (mode === 'register') {
        if (!/^\d{6}$/.test(userId)) {
          setLoading(false)
          return setError('User ID must be exactly 6 digits.')
        }
        if (!/^\d{10,11}$/.test(phone)) {
          setLoading(false)
          return setError('Phone number must be 10-11 digits.')
        }
        if (!password) {
          setLoading(false)
          return setError('Password is required.')
        }

        const newUser = await registerUser({ userId, phone, password })
        onAuthed(newUser)
      } else if (mode === 'login') {
        const user = await loginUser({ userId, password })
        onAuthed(user)
      } else if (mode === 'forgot') {
        if (!window.confirm(`Are you sure you want to reset the password for User ID ${userId}?`)) {
          setLoading(false)
          return
        }
        const updated = await resetPassword({ userId, phone, newPassword })
        setSuccess('Password successfully reset! You can now log in.')
        setMode('login')
        setPassword('')
        setNewPassword('')
      }
    } catch (err) {
      setError(err.message || 'Authentication operation failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-card">
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <Logo size={56} />
      </div>

      <h3>
        {mode === 'register' && 'Create Account'}
        {mode === 'login' && 'Welcome Back'}
        {mode === 'forgot' && 'Reset Password'}
      </h3>

      {error && <div className="error-msg">{error}</div>}
      {success && <div className="success-msg">{success}</div>}

      <form onSubmit={handleSubmit}>
        <div className="field">
          <label>6-Digit User ID</label>
          <input
            type="text"
            maxLength={6}
            placeholder="e.g. 123456"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            required
          />
        </div>

        {(mode === 'register' || mode === 'forgot') && (
          <div className="field">
            <label>Registered Phone Number</label>
            <input
              type="tel"
              placeholder="e.g. 0123456789"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
        )}

        {mode === 'login' && (
          <div className="field">
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        )}

        {mode === 'register' && (
          <div className="field">
            <label>Password</label>
            <input
              type="password"
              placeholder="Create password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        )}

        {mode === 'forgot' && (
          <div className="field">
            <label>New Password</label>
            <input
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
        )}

        <button type="submit" className="btn btn-primary btn-block" disabled={loading} style={{ marginTop: '12px' }}>
          {loading ? 'Please wait...' : mode === 'register' ? 'Register' : mode === 'login' ? 'Log In' : 'Confirm Password Reset'}
        </button>
      </form>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center', marginTop: 16 }}>
        {mode === 'login' && (
          <>
            <button className="btn-link" onClick={() => setMode('forgot')} style={{ fontSize: '0.85rem' }}>
              Forgot Password?
            </button>
            <button className="btn-link" onClick={() => setMode('register')}>
              Need an account? Create One
            </button>
          </>
        )}
        {mode === 'register' && (
          <button className="btn-link" onClick={() => setMode('login')}>
            Already have an account? Log In
          </button>
        )}
        {mode === 'forgot' && (
          <button className="btn-link" onClick={() => setMode('login')}>
            Back to Log In
          </button>
        )}
      </div>
    </div>
  )
}

// --- Machines Tab Component ---
function MachinesTab({
  machines,
  washerWaitlist,
  dryerWaitlist,
  currentUser,
  onStart,
  onCancel,
  onOnTheWay,
  onCollected,
  onForceReset,
  onJoinWaitlist,
  onLeaveWaitlist,
  onReportIssue,
}) {
  const [reportingId, setReportingId] = useState(null)
  const [issueDesc, setIssueDesc] = useState('')

  const WASHER_MODES = [
    { name: 'Normal', minutes: 30 },
    { name: 'Extra Wash', minutes: 35 },
    { name: 'Extra Rinse', minutes: 42 },
  ]

  const DRYER_MODES = [
    { name: 'Normal', minutes: 30 },
    { name: 'Extra Dry', minutes: 40 },
  ]

  // Check if current user has an active washer or dryer running anywhere
  const userHasActiveWasher = machines.some(m => m.type === 'washer' && m.startedBy === currentUser.userId && m.status === 'running')
  const userHasActiveDryer = machines.some(m => m.type === 'dryer' && m.startedBy === currentUser.userId && m.status === 'running')

  const submitReport = (mId) => {
    if (!issueDesc.trim()) return
    onReportIssue(mId, issueDesc)
    setReportingId(null)
    setIssueDesc('')
  }

  const renderWaitlist = (type, list) => {
    const userEntry = list.find((e) => e.userId === currentUser.userId)
    const isWasher = type === 'washer'

    // Restriction rules:
    // When a user starts a washer, do not allow joining washer waitlist, but allow dryer waitlist.
    // When a user starts a dryer, do not allow joining dryer waitlist, but allow washer waitlist.
    const restricted = (isWasher && userHasActiveWasher) || (!isWasher && userHasActiveDryer)

    return (
      <div className="waitlist-box" style={{ borderLeft: `5px solid ${isWasher ? '#2563EB' : '#D97706'}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h4>{isWasher ? '🧺 Washer' : '💨 Dryer'} Waitlist ({list.length})</h4>
          {userEntry ? (
            <button className="btn btn-sm btn-danger" onClick={() => onLeaveWaitlist(type, userEntry.id)}>
              Leave Waitlist
            </button>
          ) : restricted ? (
            <span style={{ fontSize: '0.8rem', color: '#94A3B8', fontStyle: 'italic' }}>
              Restricted (Active {isWasher ? 'Washer' : 'Dryer'})
            </span>
          ) : (
            <button className={`btn btn-sm ${isWasher ? 'btn-primary' : 'btn-sun'}`} onClick={() => onJoinWaitlist(type)}>
              Join Waitlist
            </button>
          )}
        </div>
        {list.length > 0 ? (
          <ul className="waitlist-tags">
            {list.map((item, idx) => (
              <li key={item.id} className={item.userId === currentUser.userId ? 'mine' : ''}>
                #{idx + 1} User {item.userId}
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty-text">No one in waitlist.</p>
        )}
      </div>
    )
  }

  const renderMachine = (m) => {
    const isMine = m.startedBy === currentUser.userId
    const isWasher = m.type === 'washer'
    const modes = isWasher ? WASHER_MODES : DRYER_MODES
    const remainingSeconds = getRemainingSeconds(m.endsAt)
    const isRunning = m.status === 'running' && remainingSeconds > 0
    const isFinished = m.status === 'running' && remainingSeconds <= 0

    let statusText = 'Available'
    let statusClass = 'status-idle'

    if (m.isLocked) {
      statusText = 'LOCKED (Maintenance)'
      statusClass = 'status-locked'
    } else if (m.status === 'pending_collection') {
      statusText = 'Pending Collection 🏃'
      statusClass = 'status-pending'
    } else if (isRunning) {
      statusText = `In Use (${formatCountdown(remainingSeconds)})`
      statusClass = 'status-running'
    } else if (isFinished) {
      statusText = 'Cycle Finished'
      statusClass = 'status-finished'
    }

    const cardThemeStyle = {
      borderTop: `4px solid ${isWasher ? '#2563EB' : '#D97706'}`,
      background: isWasher ? '#F8FAFC' : '#FFFBEB',
    }

    return (
      <div key={m.id} className={`machine-card ${statusClass}`} style={cardThemeStyle}>
        <div className="machine-header">
          <strong style={{ color: isWasher ? '#1E40AF' : '#92400E' }}>
            {isWasher ? '🧺 Washer' : '💨 Dryer'} #{m.index} ({isWasher ? `W${m.index}` : `D${m.index}`})
          </strong>
          {m.endsAt && (
            <span className="eta-badge">Est. Finish: {formatMYTime(m.endsAt)}</span>
          )}
        </div>

        <div className="machine-body">
          <div className="status-label">{statusText}</div>

          {m.status === 'running' && (
            <div className="timer-display">
              <div>{m.modeName}</div>
              <div style={{ fontSize: '0.85rem', color: '#475569', marginTop: '2px' }}>
                👤 ID: {m.startedBy} | 📞 {m.startedPhone}
              </div>
              {isRunning && (
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', marginTop: '4px', color: isWasher ? '#2563EB' : '#D97706' }}>
                  ⏳ {formatCountdown(remainingSeconds)}
                </div>
              )}
            </div>
          )}

          {m.status === 'pending_collection' && (
            <div className="info-sub">
              User {m.startedBy} ({m.startedPhone}) is on the way!
            </div>
          )}

          <div className="action-row">
            {m.status === 'idle' && !m.isLocked && (
              <div className="mode-btn-group">
                {modes.map((mode) => (
                  <button
                    key={mode.name}
                    className={`btn btn-sm ${isWasher ? 'btn-outline' : 'btn-sun-outline'}`}
                    onClick={() => onStart(m.id, mode)}
                  >
                    {mode.name} ({mode.minutes}m)
                  </button>
                ))}
              </div>
            )}

            {m.status === 'running' && isMine && (
              <>
                <button className="btn btn-sm btn-danger" onClick={() => onCancel(m.id)}>
                  Cancel Cycle
                </button>
                {isFinished && (
                  <div className="finished-actions">
                    <button className="btn btn-sm btn-sun" onClick={() => onOnTheWay(m.id)}>
                      On the Way
                    </button>
                    <button className="btn btn-sm btn-primary" onClick={() => onCollected(m.id)}>
                      Collected
                    </button>
                  </div>
                )}
              </>
            )}

            {/* "Machine Empty" button for other users when cycle is finished and user hasn't retrieved */}
            {m.status === 'running' && isFinished && !isMine && (
              <button
                className="btn btn-sm btn-danger"
                onClick={() => {
                  if (window.confirm(`Are you sure you want to mark ${isWasher ? `W${m.index}` : `D${m.index}`} as empty? This will reset the machine because clothes were left unclaimed.`)) {
                    onForceReset(m.id)
                  }
                }}
              >
                🧹 Machine Empty
              </button>
            )}

            {m.status === 'pending_collection' && isMine && (
              <button className="btn btn-sm btn-primary" onClick={() => onCollected(m.id)}>
                Clothes Collected
              </button>
            )}

            {/* "Machine Empty" button for other users during pending_collection stage */}
            {m.status === 'pending_collection' && !isMine && (
              <button
                className="btn btn-sm btn-danger"
                onClick={() => {
                  if (window.confirm(`Are you sure you want to force empty ${isWasher ? `W${m.index}` : `D${m.index}`}?`)) {
                    onForceReset(m.id)
                  }
                }}
              >
                🧹 Machine Empty
              </button>
            )}

            <button
              className="btn btn-ghost btn-xs"
              style={{ marginTop: 6 }}
              onClick={() => setReportingId(m.id)}
            >
              ⚠️ Report Issue
            </button>
          </div>

          {reportingId === m.id && (
            <div className="report-modal">
              <input
                type="text"
                placeholder="Describe issue..."
                value={issueDesc}
                onChange={(e) => setIssueDesc(e.target.value)}
              />
              <button className="btn btn-sm btn-primary" onClick={() => submitReport(m.id)}>
                Send
              </button>
              <button className="btn btn-sm btn-ghost" onClick={() => setReportingId(null)}>
                X
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="machines-container">
      <div className="waitlists-wrapper">
        {renderWaitlist('washer', washerWaitlist)}
        {renderWaitlist('dryer', dryerWaitlist)}
      </div>

      <h3 style={{ color: '#1E40AF', borderBottom: '2px solid #2563EB', paddingBottom: '6px' }}>🧺 Washers Section (W1 - W6)</h3>
      <div className="grid">
        {machines.filter((m) => m.type === 'washer').map(renderMachine)}
      </div>

      <h3 style={{ color: '#92400E', borderBottom: '2px solid #D97706', paddingBottom: '6px', marginTop: '32px' }}>💨 Dryers Section (D1 - D6)</h3>
      <div className="grid">
        {machines.filter((m) => m.type === 'dryer').map(renderMachine)}
      </div>
    </div>
  )
}

// --- History Tab Component (Filtered strictly to current user only, W1-W6/D1-D6 labels) ---
function HistoryTab({ history, currentUserId }) {
  const myHistory = history.filter((h) => h.userId === currentUserId)

  return (
    <div className="tab-page">
      <h3>My Cycle History</h3>
      {myHistory.length === 0 ? (
        <p className="empty-text">No history records found for your account.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Time (MYT)</th>
              <th>Date</th>
              <th>User ID</th>
              <th>Machine</th>
              <th>Action</th>
              <th>Mode</th>
            </tr>
          </thead>
          <tbody>
            {myHistory.map((h) => (
              <tr key={h.id} className="highlight-row">
                <td>{formatMYTime(h.timestamp)}</td>
                <td>{formatMYDate(h.timestamp)}</td>
                <td>{h.userId}</td>
                <td><strong>{h.machineLabel || h.machineId}</strong></td>
                <td>
                  <span className={`badge badge-${h.action.toLowerCase()}`}>{h.action}</span>
                </td>
                <td>{h.mode}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

// --- Feedback Tab Component (Feedback hidden from users, goes only to admin, founders shown) ---
function FeedbackTab({ currentUserId, onSubmit }) {
  const [msg, setMsg] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!msg.trim()) return
    onSubmit(msg)
    setMsg('')
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 4000)
  }

  return (
    <div className="tab-page">
      <h3>Community Feedback & Suggestions</h3>
      <p style={{ color: '#64748B', fontSize: '0.9rem', marginBottom: '16px' }}>
        Have suggestions or feedback to share? Drop them here. Submissions are sent privately to the administration team.
      </p>

      {submitted && <div className="success-msg" style={{ marginBottom: '16px' }}>Feedback submitted successfully to admins!</div>}

      <form onSubmit={handleSubmit} className="feedback-form">
        <textarea
          rows={3}
          placeholder="Share suggestions or feedback..."
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          required
        />
        <button type="submit" className="btn btn-primary" style={{ marginTop: '10px' }}>
          Submit Feedback
        </button>
      </form>

      <FoundersSection />
    </div>
  )
}

// --- Profile Tab Component ---
function ProfileTab({ currentUser, onUpdate }) {
  const [userId, setUserId] = useState(currentUser.userId)
  const [phone, setPhone] = useState(currentUser.phone)
  const [password, setPassword] = useState(currentUser.password)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const updated = await updateProfile(currentUser.userId, { userId, phone, password })
      onUpdate(updated)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err.message || 'Failed to update profile.')
    }
  }

  return (
    <div className="tab-page auth-card" style={{ maxWidth: 450, margin: '0 auto' }}>
      <h3>Edit Profile</h3>
      {saved && <div className="success-msg">Profile updated successfully!</div>}
      {error && <div className="error-msg">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label>6-Digit User ID</label>
          <input
            type="text"
            maxLength={6}
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label>Phone Number</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary btn-block">
          Save Changes
        </button>
      </form>
    </div>
  )
}

// --- Admin Page Component ---
function AdminPage({ machines, feedback, issues, onLock, onResolveIssue, onExit }) {
  const [adminPass, setAdminPass] = useState('')
  const [authed, setAuthed] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = (e) => {
    e.preventDefault()
    if (adminPass === 'James123#') {
      setAuthed(true)
      setError('')
    } else {
      setError('Incorrect admin password!')
    }
  }

  if (!authed) {
    return (
      <div className="auth-card" style={{ maxWidth: 400, margin: '40px auto' }}>
        <h3>Admin Access</h3>
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleLogin}>
          <div className="field">
            <label>Admin Password</label>
            <input
              type="password"
              placeholder="Enter admin password"
              value={adminPass}
              onChange={(e) => setAdminPass(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary btn-block">
            Login as Admin
          </button>
          <button type="button" className="btn btn-ghost btn-block" onClick={onExit} style={{ marginTop: 8 }}>
            Back to User Area
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="admin-shell">
      <div className="topbar">
        <h2>🛠️ Admin Panel</h2>
        <button className="btn btn-ghost" onClick={onExit}>
          Exit Admin
        </button>
      </div>

      <div className="admin-content">
        <section>
          <h3>Machine Controls (Lock/Unlock)</h3>
          <div className="grid">
            {machines.map((m) => {
              const codeLabel = `${m.type === 'washer' ? 'W' : 'D'}${m.index}`
              return (
                <div key={m.id} className="admin-machine-card">
                  <div>
                    <strong>
                      {m.type.toUpperCase()} #{m.index} ({codeLabel})
                    </strong>
                    <div className="info-sub">Status: {m.status}</div>
                  </div>
                  <button
                    className={`btn btn-sm ${m.isLocked ? 'btn-sun' : 'btn-danger'}`}
                    onClick={() => onLock(m.id, !m.isLocked)}
                  >
                    {m.isLocked ? 'Unlock' : 'Lock'}
                  </button>
                </div>
              )
            })}
          </div>
        </section>

        <section style={{ marginTop: 24 }}>
          <h3>Reported Issues</h3>
          {issues.length === 0 ? (
            <p className="empty-text">No reported issues.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Machine</th>
                  <th>User</th>
                  <th>Description</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {issues.map((i) => (
                  <tr key={i.id}>
                    <td>{formatMYTime(i.timestamp)}</td>
                    <td>{i.machineId}</td>
                    <td>{i.userId}</td>
                    <td>{i.description}</td>
                    <td>
                      {i.resolved ? (
                        <span className="badge badge-resolved">Resolved</span>
                      ) : (
                        <button className="btn btn-xs btn-primary" onClick={() => onResolveIssue(i.id)}>
                          Mark Resolved
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section style={{ marginTop: 24 }}>
          <h3>Private User Feedback (Admin Only)</h3>
          {feedback.length === 0 ? (
            <p className="empty-text">No feedback received yet.</p>
          ) : (
            <div className="feedback-list">
              {feedback.map((f) => (
                <div key={f.id} className="feedback-card">
                  <div className="fb-header">
                    <strong>User {f.userId}</strong>
                    <span>{formatMYTime(f.timestamp)}</span>
                  </div>
                  <p>{f.message}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

// --- Chat Widget Component ---
function ChatWidget({ messages, currentUserId, onSend }) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  const handleSend = (e) => {
    e.preventDefault()
    if (!text.trim()) return
    onSend(text)
    setText('')
  }

  return (
    <div className="chat-widget">
      {!open ? (
        <button className="chat-toggle-btn" onClick={() => setOpen(true)}>
          💬 Community Chat
        </button>
      ) : (
        <div className="chat-window">
          <div className="chat-header">
            <span>💬 Community Chat</span>
            <button className="btn-close" onClick={() => setOpen(false)}>
              ✕
            </button>
          </div>
          <div className="chat-messages">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`chat-bubble ${m.userId === currentUserId ? 'mine' : 'other'}`}
              >
                <div className="chat-author">User {m.userId}</div>
                <div className="chat-text">{m.message}</div>
                <div className="chat-time">{formatMYTime(m.timestamp)}</div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
          <form onSubmit={handleSend} className="chat-input-row">
            <input
              type="text"
              placeholder="Type message..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <button type="submit" className="btn btn-primary btn-sm">
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

// --- Main App Root ---
export default function App() {
  // Auto-login persistence using localStorage
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem('ky_wash_current_user')
    return savedUser ? JSON.parse(savedUser) : null
  })
  
  const [activeTab, setActiveTab] = useState('machines')
  const [showAdmin, setShowAdmin] = useState(false)

  const [machines, setMachines] = useState([])
  const [washerWaitlist, setWasherWaitlist] = useState([])
  const [dryerWaitlist, setDryerWaitlist] = useState([])
  const [history, setHistory] = useState([])
  const [feedback, setFeedback] = useState([])
  const [issues, setIssues] = useState([])
  const [chat, setChat] = useState([])
  const [toast, setToast] = useState(null)
  const [readyMachine, setReadyMachine] = useState(null)

  const ringingIds = useRef(new Set())
  useTick(1000)

  // Wrapper for updating user state & saving to local storage for auto-login retention
  const handleSetUser = (user) => {
    setCurrentUser(user)
    if (user) {
      localStorage.setItem('ky_wash_current_user', JSON.stringify(user))
    } else {
      localStorage.removeItem('ky_wash_current_user')
    }
  }

  useEffect(() => {
    ensureMachinesSeeded().catch((err) => console.error("Seeding error:", err))
    const unsubs = [
      subscribeMachines(setMachines),
      subscribeWaitlist('washer', setWasherWaitlist),
      subscribeWaitlist('dryer', setDryerWaitlist),
      subscribeHistory(setHistory),
      subscribeFeedback(setFeedback),
      subscribeIssues(setIssues),
      subscribeChat(setChat),
    ]
    return () => unsubs.forEach((u) => u())
  }, [])

  useEffect(() => {
    requestNotificationPermission()
  }, [])

  useEffect(() => {
    if (!currentUser) return
    const mine = machines.find(
      (m) => m.startedBy === currentUser.userId && m.status === 'running' && m.endsAt && Date.now() >= m.endsAt
    )
    if (mine && !ringingIds.current.has(mine.id)) {
      ringingIds.current.add(mine.id)
      const label = `${mine.type === 'washer' ? 'W' : 'D'}${mine.index}`
      ringForCycleComplete(`${mine.type === 'washer' ? 'Washer' : 'Dryer'} #${mine.index} (${label})`)
      setReadyMachine(mine)
    }
    if (!mine && readyMachine) {
      stopAlarm()
      setReadyMachine(null)
    }
  }, [machines, currentUser, readyMachine])

  function showToast(message, type = 'success') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3200)
  }

  async function guard(fn) {
    try {
      await fn()
    } catch (e) {
      showToast(e.message || 'Something went wrong.', 'error')
    }
  }

  const handleStart = (id, mode) =>
    guard(async () => {
      await startMachine({ id, user: currentUser, mode, minutes: mode.minutes })
    })

  const handleCancel = (id) =>
    guard(async () => {
      await cancelMachine({ id, userId: currentUser.userId })
    })

  const handleOnTheWay = (id) =>
    guard(async () => {
      await setOnTheWay({ id, userId: currentUser.userId })
    })

  const handleCollected = (id) =>
    guard(async () => {
      await setCollected({ id, userId: currentUser.userId })
      stopAlarm()
      ringingIds.current.delete(id)
      setReadyMachine(null)
    })

  const handleForceReset = (id) =>
    guard(async () => {
      await forceResetMachine({ id })
      showToast('Machine forcibly reset and marked empty.')
    })

  const handleJoinWaitlist = (type) =>
    guard(async () => {
      await joinWaitlist({ type, userId: currentUser.userId })
    })

  const handleLeaveWaitlist = (type, entryId) =>
    guard(async () => {
      await leaveWaitlist(type, entryId)
    })

  const handleReportIssue = (machineId, description) =>
    guard(async () => {
      await reportIssue({ userId: currentUser.userId, machineId, description })
      showToast('Issue reported. Admins have been notified.')
    })

  const handleFeedback = (message) =>
    guard(async () => {
      await submitFeedback({ userId: currentUser.userId, message })
      showToast('Feedback submitted securely to admins!')
    })

  const handleProfileUpdate = async (updatedUser) => {
    handleSetUser(updatedUser)
    showToast('Profile updated!')
  }

  const handleSendChat = (message) =>
    guard(async () => {
      await sendChatMessage({ userId: currentUser.userId, message })
    })

  const handleAdminLock = (id, locked) =>
    guard(async () => {
      await adminSetLock({ id, locked })
    })

  const handleAdminResolve = (issueId) =>
    guard(async () => {
      await resolveIssue(issueId)
    })

  if (showAdmin) {
    return (
      <AdminPage
        machines={machines}
        feedback={feedback}
        issues={issues}
        onLock={handleAdminLock}
        onResolveIssue={handleAdminResolve}
        onExit={() => setShowAdmin(false)}
      />
    )
  }

  if (!currentUser) {
    return (
      <>
        <Auth onAuthed={handleSetUser} />
        <div style={{ textAlign: 'center', paddingBottom: 24, marginTop: -8 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowAdmin(true)}>
            Admin Login →
          </button>
        </div>
      </>
    )
  }

  const TABS = [
    { id: 'machines', label: '🧺 Machines' },
    { id: 'history', label: '📜 History' },
    { id: 'feedback', label: '💬 Feedback' },
    { id: 'profile', label: '👤 Profile' },
  ]

  return (
    <div className="app-shell">
      <div className="topbar">
        <Logo size={32} />
        <div className="topbar-user">
          <span className="clock-my">🇲🇾 {formatMYTime(Date.now())} MYT</span>
          <span className="userchip">👤 User {currentUser.userId}</span>
          <button className="btn btn-ghost btn-sm" onClick={() => handleSetUser(null)}>
            Log Out
          </button>
        </div>
      </div>

      <div className="tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`tab-btn ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
        <button className="tab-btn" onClick={() => setShowAdmin(true)}>
          🛠️ Admin
        </button>
      </div>

      {readyMachine && (
        <div className="notif-banner">
          <span>🔔 Your {readyMachine.type} #{readyMachine.index} ({readyMachine.type === 'washer' ? 'W' : 'D'}{readyMachine.index}) cycle is done!</span>
          <button className="btn btn-sun" onClick={() => handleOnTheWay(readyMachine.id)}>
            On the Way
          </button>
          <button className="btn btn-primary" onClick={() => handleCollected(readyMachine.id)}>
            Clothes Collected
          </button>
        </div>
      )}

      <div className="page">
        {activeTab === 'machines' && (
          <MachinesTab
            machines={machines}
            washerWaitlist={washerWaitlist}
            dryerWaitlist={dryerWaitlist}
            currentUser={currentUser}
            onStart={handleStart}
            onCancel={handleCancel}
            onOnTheWay={handleOnTheWay}
            onCollected={handleCollected}
            onForceReset={handleForceReset}
            onJoinWaitlist={handleJoinWaitlist}
            onLeaveWaitlist={handleLeaveWaitlist}
            onReportIssue={handleReportIssue}
          />
        )}
        {activeTab === 'history' && <HistoryTab history={history} currentUserId={currentUser.userId} />}
        {activeTab === 'feedback' && (
          <FeedbackTab currentUserId={currentUser.userId} onSubmit={handleFeedback} />
        )}
        {activeTab === 'profile' && <ProfileTab currentUser={currentUser} onUpdate={handleProfileUpdate} />}
      </div>

      <ChatWidget messages={chat} currentUserId={currentUser.userId} onSend={handleSendChat} />

      {toast && <div className={`toast ${toast.type}`}>{toast.message}</div>}
    </div>
  )
}