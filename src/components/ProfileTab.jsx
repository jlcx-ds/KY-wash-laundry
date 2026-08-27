import { useState } from 'react'

export default function ProfileTab({ currentUser, onUpdate }) {
  const [userId, setUserId] = useState(currentUser.userId)
  const [phone, setPhone] = useState(currentUser.phone)
  const [password, setPassword] = useState(currentUser.password)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)

  async function save() {
    setError(''); setSaved(false)
    if (!/^\d{6}$/.test(userId)) return setError('User ID must be exactly 6 digits.')
    if (!/^\d{10,11}$/.test(phone)) return setError('Phone number must be 10-11 digits.')
    if (!password || password.length < 4) return setError('Password must be at least 4 characters.')
    setBusy(true)
    try {
      await onUpdate({ userId, phone, password })
      setSaved(true)
    } catch (e) {
      setError(e.message || 'Could not update profile.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="card" style={{ maxWidth: 420 }}>
      <div className="section-title"><h2>Edit Profile</h2></div>
      {error && <div className="error-text">{error}</div>}
      {saved && <div className="field-hint" style={{ color: 'var(--teal-700)', marginBottom: 12 }}>Profile updated successfully.</div>}
      <div className="field">
        <label>User ID (6 digits)</label>
        <input value={userId} inputMode="numeric" maxLength={6} onChange={(e) => setUserId(e.target.value.replace(/\D/g, '').slice(0, 6))} />
      </div>
      <div className="field">
        <label>Phone Number</label>
        <input value={phone} inputMode="numeric" maxLength={11} onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))} />
      </div>
      <div className="field">
        <label>Password</label>
        <input value={password} type="password" onChange={(e) => setPassword(e.target.value)} />
      </div>
      <button className="btn btn-primary btn-block" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save Changes'}</button>
    </div>
  )
}
