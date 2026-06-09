import { formatChips } from '../lib/gameLogic'

// Positions for up to 9 players around an oval table
const SEAT_POSITIONS = [
  { x: 50, y: 90 },  // bottom center (seat 0 = host/dealer usually)
  { x: 18, y: 75 },  // bottom left
  { x: 8,  y: 50 },  // left
  { x: 18, y: 25 },  // top left
  { x: 50, y: 10 },  // top center
  { x: 82, y: 25 },  // top right
  { x: 92, y: 50 },  // right
  { x: 82, y: 75 },  // bottom right
  { x: 65, y: 88 },  // bottom right-center
]

const STATUS_COLOR = {
  active: 'border-gray-600',
  folded: 'border-red-800 opacity-40',
  allin: 'border-yellow-400',
  out: 'border-gray-800 opacity-20',
  waiting: 'border-gray-600',
}

export default function TableMap({ players, hand, myId }) {
  const playerList = Object.values(players || {}).sort((a, b) => a.seat - b.seat)

  return (
    <div className="relative w-full" style={{ paddingBottom: '55%' }}>
      {/* Felt oval */}
      <div
        className="absolute inset-0 rounded-[50%] bg-felt-700 border-4 border-felt-600 shadow-inner mx-4 my-1"
        style={{ borderRadius: '50%' }}
      />

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
            className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
            style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
          >
            {/* Turn indicator */}
            {isTurn && (
              <div className="absolute -inset-1 rounded-full border-2 border-gold-400 animate-pulse" />
            )}
            {/* Avatar circle */}
            <div
              className={`w-9 h-9 rounded-full border-2 flex items-center justify-center text-xs font-bold
                ${isMe ? 'bg-gold-600 text-black' : 'bg-felt-800 text-white'}
                ${statusColor}`}
            >
              {player.name.slice(0, 2).toUpperCase()}
            </div>
            {/* Name + chips */}
            <div className={`text-center mt-0.5 ${isMe ? 'text-gold-400' : 'text-gray-300'}`}>
              <p className="text-[9px] leading-tight font-semibold">{player.name}</p>
              <p className="text-[9px] text-gold-500">{formatChips(player.chips)}</p>
            </div>
            {/* Dealer button */}
            {isDealer && (
              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-white text-black text-[8px] font-black flex items-center justify-center">
                D
              </div>
            )}
            {/* Current bet chip */}
            {player.currentBet > 0 && player.status !== 'out' && (
              <div className="absolute -bottom-4 bg-chip-red text-white text-[8px] rounded-full px-1.5 py-0.5 font-bold">
                {formatChips(player.currentBet)}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
