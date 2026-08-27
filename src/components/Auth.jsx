import { useState } from 'react'
import Logo from './Logo'
import { createAccount, login } from '../db'

const FOUNDERS = [
  {
    name: 'Justin Low Chun Xian',
    role: 'Yayasan UEM Scholar',
    major: 'Data Science',
    photo: '/founders/justin.jpg',
  },
  {
    name: 'James Low Weng Kean',
    role: 'Khazanah Global Scholar',
    major: 'Artificial Intelligence',
    photo: '/founders/james.jpg',
  },
]

export default function Auth({ onAuthed }) {
  const [mode, setMode] = useState('login') // 'login' | 'create'
  const [userId, setUserId] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  function validate() {
    if (!/^\d{6}$/.test(userId)) return 'User ID must be exactly 6 digits.'
    if (mode === 'create' && !/^\d{10,11}$/.test(phone)) return 'Phone number must be 10-11 digits.'
    if (!password || password.length < 4) return 'Password must be at least 4 characters.'
    return ''
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const v = validate()
    if (v) { setError(v); return }
    setBusy(true)
    try {
      if (mode === 'create') {
        const user = await createAccount({ userId, phone, password })
        onAuthed(user)
      } else {
        const user = await login({ userId, password })
        onAuthed(user)
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-hero">
          <Logo size={46} />
          <div className="auth-tagline">Your campus's shared washer &amp; dryer tracker</div>
        </div>

        <div className="auth-toggle">
          <button className={mode === 'login' ? 'active' : ''} onClick={() => { setMode('login'); setError('') }} type="button">Log In</button>
          <button className={mode === 'create' ? 'active' : ''} onClick={() => { setMode('create'); setError('') }} type="button">Create Account</button>
        </div>

        {error && <div className="error-text">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>User ID (6 digits)</label>
            <input
              inputMode="numeric" maxLength={6} placeholder="e.g. 240581" value={userId}
              onChange={(e) => setUserId(e.target.value.replace(/\D/g, '').slice(0, 6))}
            />
          </div>

          {mode === 'create' && (
            <div className="field">
              <label>Phone Number (10-11 digits)</label>
              <input
                inputMode="numeric" maxLength={11} placeholder="e.g. 0123456789" value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
              />
            </div>
          )}

          <div className="field">
            <label>Password</label>
            <input
              type="password" placeholder="Enter your password" value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <div className="field-hint">
              {mode === 'login' ? 'Log in with the User ID and password you created.' : 'Minimum 4 characters. You can change this later in Profile.'}
            </div>
          </div>

          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy ? 'Please wait…' : mode === 'login' ? 'Log In' : 'Create Account'}
          </button>
        </form>

        <div className="founders">
          <h4>Meet Our Team — Founders</h4>
          <div className="founder-grid">
            {FOUNDERS.map((f) => (
              <div className="founder-card" key={f.name}>
                <img className="founder-photo" src={f.photo} alt={f.name} />
                <div className="founder-name">{f.name}</div>
                <div className="founder-role">🎓 {f.role}</div>
                <div className="founder-major">{f.major}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
