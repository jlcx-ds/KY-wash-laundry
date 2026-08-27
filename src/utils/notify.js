// Rings the user's device when their own cycle finishes: a repeating audio
// alarm (works even if the tab is in the background), a browser
// Notification if permission was granted, and a vibration pattern on phones
// that support it. Call stopAlarm() from the UI once the user taps a button.

let audioCtx = null
let alarmInterval = null

function beep() {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)()
    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    osc.type = 'sine'
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.3, audioCtx.currentTime + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5)
    osc.connect(gain)
    gain.connect(audioCtx.destination)
    osc.start()
    osc.stop(audioCtx.currentTime + 0.5)
  } catch (e) {
    // Audio can fail silently (e.g. autoplay policy) — notification/vibration still fire.
  }
}

export async function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    try { await Notification.requestPermission() } catch (e) { /* ignore */ }
  }
}

export function ringForCycleComplete(machineLabel) {
  if (alarmInterval) return // already ringing
  beep()
  alarmInterval = setInterval(beep, 1200)

  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification('KY Wash — Cycle complete', {
        body: `${machineLabel} is done. Please collect your clothes.`,
        icon: '/favicon.svg',
      })
    } catch (e) { /* ignore */ }
  }
  if ('vibrate' in navigator) {
    try { navigator.vibrate([400, 200, 400, 200, 400]) } catch (e) { /* ignore */ }
  }
}

export function stopAlarm() {
  if (alarmInterval) {
    clearInterval(alarmInterval)
    alarmInterval = null
  }
}
