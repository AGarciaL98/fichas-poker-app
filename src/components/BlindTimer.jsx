import { useEffect, useState } from 'react'
import { formatChips, currentBlinds } from '../lib/gameLogic'

export default function BlindTimer({ room }) {
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    if (!room.nextBlindAt) return
    const tick = () => {
      const diff = room.nextBlindAt - Date.now()
      if (diff <= 0) { setTimeLeft('↑'); return }
      const m = Math.floor(diff / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setTimeLeft(`${m}:${s.toString().padStart(2, '0')}`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [room.nextBlindAt])

  const blinds = currentBlinds(room)

  return (
    <div className="flex items-center gap-1 text-xs bg-felt-700 px-2 py-1 rounded">
      <span className="text-gray-300">{blinds.small}/{blinds.big}</span>
      {timeLeft && <span className="text-gold-400">⏱{timeLeft}</span>}
    </div>
  )
}
