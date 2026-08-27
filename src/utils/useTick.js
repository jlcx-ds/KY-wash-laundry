import { useEffect, useState } from 'react'

// Forces a re-render every `intervalMs`. Countdown values themselves are
// always recomputed from a fixed `endsAt` timestamp (see utils/time.js),
// so this tick is only ever used to trigger a redraw — it can never make a
// timer drift, get stuck, or "stop" on its own.
export default function useTick(intervalMs = 1000) {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return tick
}
