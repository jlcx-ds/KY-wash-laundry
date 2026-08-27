import { useState } from 'react'
import { remainingMs, msToClock, formatMYTime } from '../utils/time'
import useTick from '../utils/useTick'

const STATUS_LABEL = {
  idle: 'Free',
  running: 'Running',
  awaiting_collection: 'Cycle Done',
  on_the_way: 'Pending Collection',
  locked: 'Locked',
}

export default function MachineCard({
  machine, modes, currentUserId, onStart, onCancel, onOnTheWay, onCollected, onReportIssue,
}) {
  useTick(1000) // re-render every second so the countdown & ring stay live
  const [picking, setPicking] = useState(false)

  const { id, type, index, status, mode, modeLabel, cycleMinutes, startedBy, startedAt, endsAt } = machine
  const isMine = startedBy === currentUserId
  const totalMs = cycleMinutes ? cycleMinutes * 60 * 1000 : 0
  const remaining = remainingMs(endsAt)
  const elapsed = totalMs - remaining
  const pct = totalMs ? Math.min(1, Math.max(0, elapsed / totalMs)) : 0

  // A running cycle whose time has fully elapsed becomes "awaiting collection"
  // purely from the derived clock — no separate write is needed to flip it.
  const effectiveStatus = status === 'running' && remaining <= 0 ? 'awaiting_collection' : status

  const R = 24
  const CIRC = 2 * Math.PI * R

  return (
    <div className={`machine-card status-${effectiveStatus}`}>
      {(effectiveStatus === 'running' || effectiveStatus === 'on_the_way') && endsAt && (
        <div className="eta-pill">ETA {formatMYTime(endsAt)}</div>
      )}

      <div className="machine-head">
        <div>
          <div className="machine-title">{type === 'washer' ? 'Washer' : 'Dryer'} #{index}</div>
          {modeLabel && <div className="machine-meta">{modeLabel} · {cycleMinutes} min</div>}
        </div>
        <span className={`machine-badge badge-${effectiveStatus}`}>{STATUS_LABEL[effectiveStatus]}</span>
      </div>

      {(effectiveStatus === 'running') && (
        <div className="porthole">
          <div className="ring-wrap">
            <svg width="56" height="56">
              <circle className="ring-track" cx="28" cy="28" r={R} strokeWidth="5" fill="none" />
              <circle
                className="ring-progress" cx="28" cy="28" r={R} strokeWidth="5" fill="none"
                strokeDasharray={CIRC} strokeDashoffset={CIRC * (1 - pct)} strokeLinecap="round"
              />
            </svg>
          </div>
          <div>
            <div className="timer-clock">{msToClock(remaining)}</div>
            <div className="timer-label">time remaining</div>
          </div>
        </div>
      )}

      {effectiveStatus === 'awaiting_collection' && (
        <div className="machine-meta">
          {isMine ? 'Your cycle is done — please collect your clothes.' : `Started by user ${startedBy}. Waiting for collection.`}
        </div>
      )}
      {effectiveStatus === 'on_the_way' && (
        <div className="machine-meta">
          {isMine ? "You're on the way to collect." : `User ${startedBy} is on the way to collect.`}
        </div>
      )}
      {effectiveStatus === 'locked' && <div className="machine-meta">This machine has been locked by an admin.</div>}
      {effectiveStatus === 'idle' && <div className="machine-meta">Available now.</div>}

      {/* ---- Actions ---- */}
      {effectiveStatus === 'idle' && !picking && (
        <div className="machine-actions">
          <button className="btn btn-primary btn-sm" onClick={() => setPicking(true)}>Start Cycle</button>
        </div>
      )}

      {effectiveStatus === 'idle' && picking && (
        <div className="mode-picker">
          {modes.map((m) => (
            <div key={m.id} className="mode-option" onClick={() => { onStart(id, m); setPicking(false) }}>
              <b>{m.label}</b>
              <span>{m.minutes} min</span>
            </div>
          ))}
          <button className="btn btn-ghost btn-sm" onClick={() => setPicking(false)}>Cancel</button>
        </div>
      )}

      {(effectiveStatus === 'running') && isMine && (
        <div className="machine-actions">
          <button className="btn btn-danger btn-sm" onClick={() => onCancel(id)}>Cancel Cycle</button>
        </div>
      )}

      {effectiveStatus === 'awaiting_collection' && isMine && (
        <div className="machine-actions">
          <button className="btn btn-sun btn-sm" onClick={() => onOnTheWay(id)}>On the Way</button>
          <button className="btn btn-primary btn-sm" onClick={() => onCollected(id)}>Clothes Collected</button>
        </div>
      )}

      {effectiveStatus === 'on_the_way' && isMine && (
        <div className="machine-actions">
          <button className="btn btn-primary btn-sm" onClick={() => onCollected(id)}>Clothes Collected</button>
        </div>
      )}

      {effectiveStatus !== 'idle' && effectiveStatus !== 'locked' && (
        <button className="btn btn-outline btn-sm" onClick={() => onReportIssue(id)}>Report Issue</button>
      )}
      {effectiveStatus === 'idle' && (
        <button className="btn btn-outline btn-sm" onClick={() => onReportIssue(id)}>Report Issue</button>
      )}
    </div>
  )
}
