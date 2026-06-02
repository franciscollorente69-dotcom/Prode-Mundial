import { useEffect, useState } from 'react'
import { getDeadline } from '../utils/scoring'

const pad = (n) => String(n).padStart(2, '0')

export default function CountdownTimer({ matchDate }) {
  const [timeLeft, setTimeLeft] = useState(null)

  useEffect(() => {
    const deadline = getDeadline(matchDate)

    const tick = () => {
      const diff = deadline - new Date()
      if (diff <= 0) {
        setTimeLeft(null)
        return
      }
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setTimeLeft({ h, m, s, diff })
    }

    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [matchDate])

  if (!timeLeft) return null

  const isUrgent = timeLeft.diff < 30 * 60 * 1000

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-mono font-semibold px-2 py-0.5 rounded-full ${
      isUrgent
        ? 'bg-red-500/20 text-red-400 animate-pulse'
        : 'bg-green-500/10 text-green-400'
    }`}>
      ⏱ {timeLeft.h > 0 && `${pad(timeLeft.h)}:`}{pad(timeLeft.m)}:{pad(timeLeft.s)}
    </span>
  )
}
