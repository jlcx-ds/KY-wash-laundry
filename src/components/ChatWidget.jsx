import { useEffect, useRef, useState } from 'react'
import { formatMYTime } from '../utils/time'

export default function ChatWidget({ messages, currentUserId, onSend }) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [unread, setUnread] = useState(0)
  const bottomRef = useRef(null)
  const lastCountRef = useRef(messages.length)

  useEffect(() => {
    if (messages.length > lastCountRef.current && !open) {
      setUnread((u) => u + (messages.length - lastCountRef.current))
    }
    lastCountRef.current = messages.length
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  function send() {
    if (!text.trim()) return
    onSend(text.trim())
    setText('')
  }

  return (
    <>
      {open && (
        <div className="chat-panel">
          <div className="chat-header">
            <span>💬 Community Chat</span>
            <button className="btn btn-ghost btn-sm" style={{ color: 'white' }} onClick={() => setOpen(false)}>✕</button>
          </div>
          <div className="chat-messages">
            {messages.length === 0 && <div className="empty-note">Say hi to your laundry-room neighbours 👋</div>}
            {messages.map((m) => (
              <div key={m.id} className={`chat-bubble ${m.userId === currentUserId ? 'mine' : ''}`}>
                <div className="chat-meta">{m.userId === currentUserId ? 'You' : `User ${m.userId}`} · {formatMYTime(m.timestamp)}</div>
                {m.message}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
          <div className="chat-input-row">
            <input
              value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message…"
              onKeyDown={(e) => e.key === 'Enter' && send()}
            />
            <button className="chat-send" onClick={send}>➤</button>
          </div>
        </div>
      )}
      <button
        className="chat-fab"
        onClick={() => { setOpen((o) => !o); setUnread(0) }}
        title="Community Chat"
      >
        💬
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: -2, right: -2, background: 'var(--coral)', color: 'white',
            fontSize: 10, fontWeight: 700, borderRadius: '50%', width: 18, height: 18,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>{unread}</span>
        )}
      </button>
    </>
  )
}
