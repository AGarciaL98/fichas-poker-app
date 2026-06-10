// Generates a random 5-char room code
export function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

// Unique ID per page load — generated in memory so each tab gets its own identity
// regardless of whether sessionStorage was inherited from a parent tab.
const _TAB_PLAYER_ID = crypto.randomUUID()

export function getOrCreatePlayerId() {
  return _TAB_PLAYER_ID
}

// Returns active (non-out) players sorted by seat
export function activePlayers(players) {
  return Object.values(players || {})
    .filter((p) => p.status !== 'out')
    .sort((a, b) => a.seat - b.seat)
}

// Returns players still in this hand (not folded, not out, not waiting for next hand)
export function inHandPlayers(players) {
  return Object.values(players || {})
    .filter((p) => p.status !== 'out' && p.status !== 'folded' && p.status !== 'waiting')
    .sort((a, b) => a.seat - b.seat)
}

// Next seat index in circular order among active players
export function nextActiveSeat(players, currentSeat) {
  const active = activePlayers(players)
  const idx = active.findIndex((p) => p.seat === currentSeat)
  return active[(idx + 1) % active.length].seat
}

// Next seat that is still in the hand (not folded/out)
export function nextInHandSeat(players, currentSeat) {
  const inHand = inHandPlayers(players)
  if (inHand.length === 0) return currentSeat
  const idx = inHand.findIndex((p) => p.seat === currentSeat)
  return inHand[(idx + 1) % inHand.length].seat
}

// Returns player at a given seat
export function playerAtSeat(players, seat) {
  return Object.values(players || {}).find((p) => p.seat === seat)
}

// Returns { smallBlindSeat, bigBlindSeat, firstToActSeat } for a given dealer seat
export function blindSeats(players, dealerSeat) {
  const active = activePlayers(players)
  if (active.length < 2) return null

  const dealerIdx = active.findIndex((p) => p.seat === dealerSeat)
  const sbIdx = (dealerIdx + 1) % active.length
  const bbIdx = (dealerIdx + 2) % active.length
  const utg = (dealerIdx + 3) % active.length

  return {
    smallBlindSeat: active[sbIdx].seat,
    bigBlindSeat: active[bbIdx].seat,
    firstToActSeat: active.length === 2 ? active[sbIdx].seat : active[utg].seat,
  }
}

// Default blind levels (can be overridden in room config)
export const DEFAULT_BLIND_LEVELS = [
  { small: 25, big: 50 },
  { small: 50, big: 100 },
  { small: 75, big: 150 },
  { small: 100, big: 200 },
  { small: 150, big: 300 },
  { small: 200, big: 400 },
  { small: 300, big: 600 },
  { small: 500, big: 1000 },
]

// Returns current blind level object
export function currentBlinds(room) {
  const level = room.blindLevel ?? 0
  const levels = room.config?.blindLevels ?? DEFAULT_BLIND_LEVELS
  return levels[Math.min(level, levels.length - 1)]
}

// Formats chip amounts (1500 → "1,500" or "1.5K")
export function formatChips(n) {
  if (n === undefined || n === null) return '0'
  if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}K`
  return n.toLocaleString('es')
}
