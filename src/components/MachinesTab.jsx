import { useState } from 'react'
import MachineCard from './MachineCard'
import Modal from './Modal'
import { WASHER_MODES, DRYER_MODES } from '../utils/constants'

function WaitlistBox({ title, entries, currentUserId, onJoin, onLeave }) {
  const myEntry = entries.find((e) => e.userId === currentUserId)
  return (
    <div className="card">
      <div className="section-title">
        <h2>{title}</h2>
        {myEntry ? (
          <button className="btn btn-outline btn-sm" onClick={() => onLeave(myEntry.id)}>Leave Waitlist</button>
        ) : (
          <button className="btn btn-primary btn-sm" onClick={onJoin}>Join Waitlist</button>
        )}
      </div>
      {entries.length === 0 && <div className="empty-note">No one is waiting right now.</div>}
      {entries.map((e, i) => (
        <div className="waitlist-row" key={e.id}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="waitlist-pos">{i + 1}</span>
            <span>User {e.userId}</span>
          </div>
          {e.userId === currentUserId && <span className="you-tag">YOU</span>}
        </div>
      ))}
    </div>
  )
}

export default function MachinesTab({
  machines, washerWaitlist, dryerWaitlist, currentUserId,
  onStart, onCancel, onOnTheWay, onCollected, onJoinWaitlist, onLeaveWaitlist, onReportIssue,
}) {
  const [issueTarget, setIssueTarget] = useState(null)
  const [issueText, setIssueText] = useState('')

  const washers = machines.filter((m) => m.type === 'washer')
  const dryers = machines.filter((m) => m.type === 'dryer')

  function submitIssue() {
    if (!issueText.trim()) return
    onReportIssue(issueTarget, issueText.trim())
    setIssueTarget(null)
    setIssueText('')
  }

  return (
    <div>
      <div className="grid-2" style={{ marginBottom: 20 }}>
        <WaitlistBox
          title="🧺 Washer Waitlist" entries={washerWaitlist} currentUserId={currentUserId}
          onJoin={() => onJoinWaitlist('washer')} onLeave={onLeaveWaitlist}
        />
        <WaitlistBox
          title="🌬️ Dryer Waitlist" entries={dryerWaitlist} currentUserId={currentUserId}
          onJoin={() => onJoinWaitlist('dryer')} onLeave={onLeaveWaitlist}
        />
      </div>

      <div className="section-title"><h2>Washers</h2></div>
      <div className="grid-machines" style={{ marginBottom: 24 }}>
        {washers.map((m) => (
          <MachineCard
            key={m.id} machine={m} modes={WASHER_MODES} currentUserId={currentUserId}
            onStart={onStart} onCancel={onCancel} onOnTheWay={onOnTheWay} onCollected={onCollected}
            onReportIssue={(id) => setIssueTarget(id)}
          />
        ))}
      </div>

      <div className="section-title"><h2>Dryers</h2></div>
      <div className="grid-machines">
        {dryers.map((m) => (
          <MachineCard
            key={m.id} machine={m} modes={DRYER_MODES} currentUserId={currentUserId}
            onStart={onStart} onCancel={onCancel} onOnTheWay={onOnTheWay} onCollected={onCollected}
            onReportIssue={(id) => setIssueTarget(id)}
          />
        ))}
      </div>

      {issueTarget && (
        <Modal title={`Report Issue — ${issueTarget}`} onClose={() => setIssueTarget(null)}>
          <div className="field">
            <label>What's wrong with this machine?</label>
            <textarea
              value={issueText} onChange={(e) => setIssueText(e.target.value)}
              placeholder="e.g. Door won't lock, makes a loud noise, doesn't drain…"
            />
          </div>
          <button className="btn btn-primary btn-block" onClick={submitIssue}>Submit Report</button>
        </Modal>
      )}
    </div>
  )
}
