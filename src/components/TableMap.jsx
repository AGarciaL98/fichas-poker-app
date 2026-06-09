import { formatChips } from '../lib/gameLogic'

const SEAT_POSITIONS = [
  { x: 50, y: 90 },
  { x: 18, y: 75 },
  { x: 8,  y: 50 },
  { x: 18, y: 25 },
  { x: 50, y: 10 },
  { x: 82, y: 25 },
  { x: 92, y: 50 },
  { x: 82, y: 75 },
  { x: 65, y: 88 },
]

const STATUS_COLOR = {
  active:  'border-gray-600',
  folded:  'border-red-800 opacity-40',
  allin:   'border-yellow-400',
  out:     'border-gray-800 opacity-20',
  waiting: 'border-gray-600',
}

const PHASE_SHORT = {
  preflop:  'Pre-flop',
  flop:     'Flop',
  turn:     'Turn',
  river:    'River',
  showdown: 'Showdown',
}

export default function TableMap({ players, hand, myId }) {
  const playerList = Object.values(players || {}).sort((a, b) => a.seat - b.seat)
  const pot = hand?.pot || 0
  const currentBet = hand?.currentBet || 0
  const phase = hand?.phase

  return (
    <div className="relative w-full" style={{ paddingBottom: '55%' }}>
      {/* Felt oval */}
      <div
        className="absolute inset-0 bg-felt-700 border-4 border-felt-600 shadow-inner mx-4 my-1"
        style={{ borderRadius: '50%' }}
      />

      {/* ── Center info pill ── */}
      {(pot > 0 || phase) && (
        <div
          className="absolute top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2
                     bg-black/90 border border-gray-700 rounded-xl px-3 py-1.5 text-center
                     pointer-events-none"
        >
          {pot > 0 && (
            <p className="text-gold-400 font-bold text-base leading-tight font-casino">
              {formatChips(pot)}
            </p>
          )}
          {currentBet > 0 && pot > 0 && (
            <p className="text-gray-500 text-[9px] leading-tight">
              apuesta {formatChips(currentBet)}
            </p>
          )}
          {phase && (
            <p className={`text-[9px] leading-tight mt-0.5 ${
              phase === 'showdown' ? 'text-gold-500 font-semibold' : 'text-gray-500'
            }`}>
              {PHASE_SHORT[phase] || phase}
            </p>
          )}
        </div>
      )}

      {/* Players */}
      {playerList.map((player) => {
        const pos = SEAT_POSITIONS[player.seat % SEAT_POSITIONS.length]
        const isMe = player.id === myId
        const isDealer = hand?.dealerSeat === player.seat
        const isTurn = hand?.currentTurn === player.seat
        const statusColor = STATUS_COLOR[player.status] || 'border-gray-600'

        return (
          <div
            key={player.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
            style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
          >
            {isTurn && (
              <div className="absolute -inset-1 rounded-full border-2 border-gold-400 animate-pulse" />
            )}
            <div
              className={`w-9 h-9 rounded-full border-2 flex items-center justify-center text-xs font-bold
                ${isMe ? 'bg-gold-600 text-black' : 'bg-felt-800 text-white'}
                ${statusColor}`}
            >
              {player.name.slice(0, 2).toUpperCase()}
            </div>
            <div className={`text-center mt-0.5 ${isMe ? 'text-gold-400' : 'text-gray-300'}`}>
              <p className="text-[9px] leading-tight font-semibold">{player.name}</p>
              <p className="text-[9px] text-gold-500">{formatChips(player.chips)}</p>
            </div>
            {isDealer && (
              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-white text-black text-[8px] font-black flex items-center justify-center">
                D
              </div>
            )}
            {player.currentBet > 0 && player.status !== 'out' && (
              <div className="absolute -bottom-4 bg-red-700 text-white text-[8px] rounded-full px-1.5 py-0.5 font-bold whitespace-nowrap">
                {formatChips(player.currentBet)}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
