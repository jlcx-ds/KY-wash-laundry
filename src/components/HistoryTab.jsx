import { useState } from 'react'
import { formatMYDateTime } from '../utils/time'

export default function HistoryTab({ history, currentUserId }) {
  const [onlyMine, setOnlyMine] = useState(true)
  const rows = onlyMine ? history.filter((h) => h.userId === currentUserId) : history

  return (
    <div className="card">
      <div className="section-title">
        <h2>Cycle History</h2>
        <div className="auth-toggle" style={{ margin: 0, width: 220 }}>
          <button className={onlyMine ? 'active' : ''} onClick={() => setOnlyMine(true)}>My History</button>
          <button className={!onlyMine ? 'active' : ''} onClick={() => setOnlyMine(false)}>Everyone</button>
        </div>
      </div>
      <div className="table-wrap">
        <table className="ky-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Machine</th>
              <th>Mode</th>
              <th>Action</th>
              <th>Time (MY)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((h) => (
              <tr key={h.id}>
                <td>{h.userId}</td>
                <td>{h.machineId}</td>
                <td>{h.modeLabel || '—'}</td>
                <td><span className={`action-tag action-${h.action}`}>{h.action.replace('_', ' ')}</span></td>
                <td>{formatMYDateTime(h.timestamp)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <div className="empty-state">No history yet.</div>}
      </div>
    </div>
  )
}
