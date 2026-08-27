import { useState } from 'react'
import Logo from './Logo'
import { ADMIN_PASSWORD } from '../utils/constants'
import { formatMYDateTime } from '../utils/time'

export default function AdminPage({ machines, feedback, issues, onLock, onResolveIssue, onExit }) {
  const [authed, setAuthed] = useState(false)
  const [pw, setPw] = useState('')
  const [error, setError] = useState('')

  if (!authed) {
    return (
      <div className="admin-login-wrap">
        <div className="auth-card" style={{ background: 'white' }}>
          <div className="auth-hero">
            <Logo size={44} />
            <span className="admin-badge">ADMIN</span>
          </div>
          {error && <div className="error-text">{error}</div>}
          <div className="field">
            <label>Admin Password</label>
            <input
              type="password" value={pw} onChange={(e) => setPw(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && checkPw()}
              placeholder="Enter admin password"
            />
          </div>
          <button className="btn btn-primary btn-block" onClick={checkPw}>Enter Admin Panel</button>
          <button className="btn btn-ghost btn-block" style={{ marginTop: 8 }} onClick={onExit}>← Back to app</button>
        </div>
      </div>
    )
  }

  function checkPw() {
    if (pw === ADMIN_PASSWORD) { setAuthed(true); setError('') }
    else setError('Incorrect admin password.')
  }

  const openIssues = issues.filter((i) => i.status === 'open')
  const resolvedIssues = issues.filter((i) => i.status === 'resolved')

  return (
    <div className="page">
      <div className="section-title">
        <Logo size={34} />
        <button className="btn btn-outline btn-sm" onClick={onExit}>← Back to app</button>
      </div>
      <h2 style={{ marginBottom: 16 }}>Admin Panel</h2>

      <div className="section-title"><h2>Machine Controls</h2></div>
      <div className="grid-machines" style={{ marginBottom: 26 }}>
        {machines.map((m) => (
          <div key={m.id} className={`machine-card status-${m.status}`}>
            <div className="machine-head">
              <div className="machine-title">{m.type === 'washer' ? 'Washer' : 'Dryer'} #{m.index}</div>
              <span className={`machine-badge badge-${m.status}`}>{m.status.replace('_', ' ')}</span>
            </div>
            {m.startedBy && <div className="machine-meta">Started by user <b>{m.startedBy}</b></div>}
            {m.status === 'locked' ? (
              <button className="btn btn-primary btn-sm" onClick={() => onLock(m.id, false)}>Unlock Machine</button>
            ) : (
              <button className="btn btn-danger btn-sm" onClick={() => onLock(m.id, true)}>Lock Machine</button>
            )}
          </div>
        ))}
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="section-title"><h2>Reported Issues ({openIssues.length} open)</h2></div>
          {issues.length === 0 && <div className="empty-note">No issues reported.</div>}
          {[...openIssues, ...resolvedIssues].map((i) => (
            <div className="feed-item" key={i.id}>
              <div className="feed-head">
                <span>User {i.userId} · {i.machineId}</span>
                <span>{formatMYDateTime(i.timestamp)}</span>
              </div>
              <div className="feed-body">{i.description}</div>
              <div style={{ marginTop: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className={i.status === 'open' ? 'status-open' : 'status-resolved'}>{i.status}</span>
                {i.status === 'open' && (
                  <button className="btn btn-outline btn-sm" onClick={() => onResolveIssue(i.id)}>Mark Resolved</button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="section-title"><h2>User Feedback ({feedback.length})</h2></div>
          {feedback.length === 0 && <div className="empty-note">No feedback yet.</div>}
          {feedback.map((f) => (
            <div className="feed-item" key={f.id}>
              <div className="feed-head"><span>User {f.userId}</span><span>{formatMYDateTime(f.timestamp)}</span></div>
              <div className="feed-body">{f.message}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
