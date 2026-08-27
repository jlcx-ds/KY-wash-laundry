// All time in KY Wash is displayed in Malaysia time (Asia/Kuala_Lumpur, UTC+8),
// regardless of the device's local timezone. Timers are always computed from
// fixed millisecond timestamps (startedAt + durationMs = endsAt) rather than
// counted down in state, so they never drift, never reset on refresh, and
// never "stop" on their own — a tick just re-reads Date.now() every second.

const MY_TZ = 'Asia/Kuala_Lumpur'

export function formatMYTime(ms) {
  if (!ms) return '--:--'
  return new Intl.DateTimeFormat('en-MY', {
    timeZone: MY_TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(ms))
}

export function formatMYDateTime(ms) {
  if (!ms) return '—'
  return new Intl.DateTimeFormat('en-MY', {
    timeZone: MY_TZ,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(ms))
}

// Returns remaining ms until `endsAt`, floored at 0. Never negative, never NaN.
export function remainingMs(endsAt) {
  if (!endsAt) return 0
  const rem = endsAt - Date.now()
  return rem > 0 ? rem : 0
}

export function msToClock(ms) {
  const totalSec = Math.max(0, Math.round(ms / 1000))
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function isDone(endsAt) {
  return !!endsAt && Date.now() >= endsAt
}
