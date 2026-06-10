import { formatChips } from '../lib/gameLogic'
import ActionFeed from './ActionFeed'

// Distributes n players evenly around the oval, me always at 6 o'clock (bottom center).
// Goes clockwise: 6 → 9 → 12 → 3 for n=4, etc.
function computePosition(visualIndex, n) {
  if (n === 0) return { x: 50, y: 50 }
  const angle = Math.PI + (2 * Math.PI * visualIndex) / n
  return {
    x: 50 + 42 * Math.sin(angle),
    y: 50 - 40 * Math.cos(angle),
  }
}

const STATUS_COLOR = {
  active:  'border-gray-500',
  folded:  'border-red-800 opacity-40',
  allin:   'border-yellow-400',
  out:     'border-gray-800 opacity-20',
  waiting: 'border-gray-500',
}

// One distinct color per seat — vivid enough to read on dark felt
const PLAYER_COLORS = [
  '#ef4444', // red
  '#3b82f6', // blue
  '#a855f7', // purple
  '#f97316', // orange
  '#14b8a6', // teal
  '#ec4899', // pink
  '#eab308', // yellow
  '#22c55e', // green
  '#06b6d4', // cyan
]

function playerColor(seat) {
  return PLAYER_COLORS[seat % PLAYER_COLORS.length]
}

export default function TableMap({ players, hand, myId, handNumber }) {
  const playerList = Object.values(players || {}).sort((a, b) => a.seat - b.seat)
  const mySeat = playerList.find((p) => p.id === myId)?.seat ?? 0
  const n = playerList.length
  const pot = hand?.pot || 0
  const currentBet = hand?.currentBet || 0
  const aggressorName = hand?.aggressorName || null

  // Find aggressor's color so the name in the pill matches their avatar
  const aggressorPlayer = aggressorName
    ? Object.values(players || {}).find((p) => p.name === aggressorName)
    : null
  const aggressorColor = aggressorPlayer
    ? playerColor(aggressorPlayer.seat)
    : '#fbbf24'

  return (
    <div className="relative w-full h-full">
      {/* Felt oval */}
      <div
        className="absolute inset-0 bg-felt-700 border-4 border-felt-600 shadow-inner mx-4 my-1"
        style={{ borderRadius: '50%' }}
      />

      {/* ── Center info pill ── */}
      {(pot > 0 || currentBet > 0) && (
        <div
          className="absolute left-1/2 z-10 -translate-x-1/2 -translate-y-1/2
                     bg-black/95 border border-gray-600 rounded-2xl
                     pointer-events-none flex items-stretch overflow-hidden"
          style={{ minWidth: '58%', top: '44%' }}
        >
          {/* Left — Pot */}
          <div className="flex flex-col items-center justify-center px-3 py-1.5 flex-1">
            <span className="text-white text-[9px] font-bold uppercase tracking-wider leading-none mb-0.5">bote</span>
            <span className="text-gold-400 font-casino font-bold leading-none" style={{ fontSize: '1rem' }}>
              {formatChips(pot)}
            </span>
          </div>

          {/* Gold vertical divider */}
          <div className="w-px bg-gold-500 self-stretch" />

          {/* Right — Current bet + aggressor */}
          <div className="flex flex-col items-center justify-center px-3 py-1.5 flex-1">
            <span className="text-white text-[9px] font-bold uppercase tracking-wider leading-none mb-0.5">apuesta</span>
            <span className="text-gray-200 font-bold leading-none" style={{ fontSize: '1rem' }}>
              {currentBet > 0 ? formatChips(currentBet) : '—'}
            </span>
            {aggressorName && currentBet > 0 && (
              <span
                className="text-[8px] font-bold leading-none mt-0.5 truncate max-w-[60px]"
                style={{ color: aggressorColor }}
              >
                {aggressorName}
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── Action feed ── */}
      <ActionFeed
        lastAction={hand?.lastAction}
        handNumber={hand?.handNumber}
        players={players}
      />

      {/* Players — "me" always at visual index 0 (bottom center) */}
      {playerList.map((player) => {
        const visualIndex = (player.seat - mySeat + n) % n
        const pos = computePosition(visualIndex, n)
        const isMe = player.id === myId
        const isDealer = hand?.dealerSeat === player.seat
        const isTurn = hand?.currentTurn === player.seat
        const statusColor = STATUS_COLOR[player.status] || 'border-gray-500'
        const color = playerColor(player.seat)

        return (
          <div
            key={player.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
            style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
          >
            {isTurn && (
              <div className={`absolute rounded-full border-2 border-gold-400 animate-pulse
                ${isMe ? '-inset-2' : '-inset-1'}`} />
            )}

            {/* Avatar */}
            <div
              className={`rounded-full flex items-center justify-center font-bold text-white
                ${isMe ? 'w-12 h-12 text-sm border-[3px]' : 'w-9 h-9 text-xs border-2'}
                ${statusColor}`}
              style={{
                backgroundColor: color,
                ...(isMe && { outline: '2px solid white', outlineOffset: '2px' }),
              }}
            >
              {player.name.slice(0, 2).toUpperCase()}
            </div>

            {/* Name + chips */}
            <div className="text-center mt-0.5">
              <p
                className={`leading-tight font-semibold ${isMe ? 'text-[10px]' : 'text-[9px]'}`}
                style={{ color }}
              >
                {player.name}
              </p>
              <p className={`font-bold text-gold-400 ${isMe ? 'text-[12px]' : 'text-[9px]'}`}>
                {formatChips(player.chips)}
              </p>
            </div>

            {isDealer && (
              <div className={`absolute -top-1 -right-1 rounded-full bg-white text-black font-black flex items-center justify-center
                ${isMe ? 'w-5 h-5 text-[9px]' : 'w-4 h-4 text-[8px]'}`}>
                D
              </div>
            )}
            {player.currentBet > 0 && player.status !== 'out' && (
              <div
                className="absolute -bottom-4 text-white text-[8px] rounded-full px-1.5 py-0.5 font-bold whitespace-nowrap"
                style={{ backgroundColor: color }}
              >
                {formatChips(player.currentBet)}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
