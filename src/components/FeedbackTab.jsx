import { useState } from 'react'
import { formatMYDateTime } from '../utils/time'

export default function FeedbackTab({ feedback, currentUserId, onSubmit }) {
  const [text, setText] = useState('')
  const [sent, setSent] = useState(false)

  function submit() {
    if (!text.trim()) return
    onSubmit(text.trim())
    setText('')
    setSent(true)
    setTimeout(() => setSent(false), 2500)
  }

  const mine = feedback.filter((f) => f.userId === currentUserId)

  return (
    <div className="grid-2">
      <div className="card">
        <div className="section-title"><h2>Send Feedback</h2></div>
        <div className="field">
          <label>Tell us what's working, what's not, or what you'd love to see.</label>
          <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Your feedback…" />
        </div>
        <button className="btn btn-primary btn-block" onClick={submit}>Submit Feedback</button>
        {sent && <div className="field-hint" style={{ color: 'var(--teal-700)', marginTop: 8 }}>Thanks — your feedback was sent to the admins.</div>}
      </div>

      <div className="card">
        <div className="section-title"><h2>My Past Feedback</h2></div>
        {mine.length === 0 && <div className="empty-note">You haven't submitted any feedback yet.</div>}
        {mine.map((f) => (
          <div className="feed-item" key={f.id}>
            <div className="feed-head"><span>You</span><span>{formatMYDateTime(f.timestamp)}</span></div>
            <div className="feed-body">{f.message}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
