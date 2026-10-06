import { useEffect, useState } from 'react'
import { getCountdownParts } from '../lib/event-time'
import { wedding } from '../config/wedding'

export function Countdown() {
  const [now, setNow] = useState(() => Date.now())
  const parts = getCountdownParts(wedding.eventDateTime, now)
  useEffect(() => {
  if (parts.complete) return
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [parts.complete])
  return <div className="countdown" aria-live="off" aria-label={parts.complete ? 'Today is the day!' : 'Countdown to guest arrival'}>
    {parts.complete ? <p>Today is the day!</p> : <div>{(['days', 'hours', 'minutes', 'seconds'] as const).map((unit) => <span key={unit}><strong>{parts[unit]}</strong><small>{unit}</small></span>)}</div>}
  </div>
}
