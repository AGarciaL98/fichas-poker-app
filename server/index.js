import { createServer } from 'http'
import { Server } from 'socket.io'
import {
  activePlayers,
  inHandPlayers,
  blindSeats,
  currentBlinds,
  nextActiveSeat,
  nextInHandSeat,
  playerAtSeat,
  DEFAULT_BLIND_LEVELS,
} from '../src/lib/gameLogic.js'

const httpServer = createServer()
const io = new Server(httpServer, { cors: { origin: '*' } })

// In-memory game state: { [roomCode]: room }
const rooms = {}

function broadcast(roomCode) {
  io.to(roomCode).emit('room-update', rooms[roomCode])
}

io.on('connection', (socket) => {
  // ── Create room ──────────────────────────────────────────────────────────
  socket.on('create-room', ({ roomCode, config, player }, cb) => {
    if (rooms[roomCode]) {
      return cb?.({ error: 'Código de sala ya existe' })
    }
    rooms[roomCode] = {
      code: roomCode,
      status: 'waiting',
      createdAt: Date.now(),
      config,
      host: player.id,
      blindLevel: 0,
      nextBlindAt:
        config.blindIncreaseMinutes > 0
          ? Date.now() + config.blindIncreaseMinutes * 60000
          : null,
      hand: null,
      players: {
        [player.id]: {
          id: player.id,
          name: player.name,
          chips: config.startingChips,
          seat: 0,
          status: 'waiting',
          currentBet: 0,
          isDealer: false,
        },
      },
    }
    socket.join(roomCode)
    cb?.({ ok: true })
    socket.emit('room-update', rooms[roomCode])
  })

  // ── Join room ─────────────────────────────────────────────────────────────
  socket.on('join-room', ({ roomCode, player }, cb) => {
    const room = rooms[roomCode]
    if (!room) return cb?.({ error: 'Sala no encontrada' })
    if (room.status === 'playing' && !room.players[player.id]) {
      return cb?.({ error: 'La partida ya ha comenzado' })
    }
    if (!room.players[player.id]) {
      const seat = Object.keys(room.players).length
      room.players[player.id] = {
        id: player.id,
        name: player.name,
        chips: room.config.startingChips,
        seat,
        status: 'waiting',
        currentBet: 0,
        isDealer: false,
      }
    }
    socket.join(roomCode)
    cb?.({ ok: true })
    broadcast(roomCode)
  })

  // ── Rejoin (page refresh) ────────────────────────────────────────────────
  socket.on('rejoin-room', ({ roomCode }) => {
    const room = rooms[roomCode]
    socket.join(roomCode)
    if (room) socket.emit('room-update', room)
  })

  // ── Start game ───────────────────────────────────────────────────────────
  socket.on('start-game', ({ roomCode }) => {
    const room = rooms[roomCode]
    if (!room) return
    const players = room.players
    const dealerSeat = 0
    const blinds = currentBlinds(room)
    const seats = blindSeats(players, dealerSeat)

    room.status = 'playing'
    Object.values(players).forEach((p) => {
      p.status = 'active'
      p.currentBet = 0
      p.isDealer = p.seat === dealerSeat
    })

    if (seats) {
      const sb = playerAtSeat(players, seats.smallBlindSeat)
      const bb = playerAtSeat(players, seats.bigBlindSeat)
      if (sb) { sb.chips -= blinds.small; sb.currentBet = blinds.small }
      if (bb) { bb.chips -= blinds.big;   bb.currentBet = blinds.big   }
      room.hand = {
        pot: blinds.small + blinds.big,
        dealerSeat,
        currentTurn: seats.firstToActSeat,
        phase: 'preflop',
        currentBet: blinds.big,
        smallBlind: blinds.small,
        bigBlind: blinds.big,
        lastAction: null,
        handNumber: 1,
      }
    }
    broadcast(roomCode)
  })

  // ── Player action ────────────────────────────────────────────────────────
  socket.on('player-action', ({ roomCode, playerId, action, amount }) => {
    const room = rooms[roomCode]
    if (!room) return
    const { players, hand } = room
    const player = players[playerId]
    if (!player) return

    const prevBet = player.currentBet || 0

    if (action === 'fold') {
      player.status = 'folded'
    } else if (action === 'call') {
      const callAmt = Math.min(hand.currentBet - prevBet, player.chips)
      player.chips -= callAmt
      player.currentBet = prevBet + callAmt
      hand.pot += callAmt
    } else if (action === 'check') {
      // no chips move
    } else if (action === 'raise' || action === 'bet') {
      const extra = amount - prevBet
      player.chips -= extra
      player.currentBet = amount
      hand.currentBet = amount
      hand.pot += extra
    } else if (action === 'allin') {
      const allInTotal = prevBet + player.chips
      hand.pot += player.chips
      player.currentBet = allInTotal
      player.chips = 0
      player.status = 'allin'
      if (allInTotal > hand.currentBet) hand.currentBet = allInTotal
    }

    hand.lastAction = {
      playerId,
      playerName: player.name,
      action,
      amount:
        action === 'raise' || action === 'bet'
          ? amount
          : action === 'call'
          ? hand.currentBet - prevBet
          : 0,
      ts: Date.now(),
    }

    hand.currentTurn = nextInHandSeat(players, player.seat)
    broadcast(roomCode)
  })

  // ── Next phase (dealer) ──────────────────────────────────────────────────
  socket.on('next-phase', ({ roomCode }) => {
    const room = rooms[roomCode]
    if (!room) return
    const phases = ['preflop', 'flop', 'turn', 'river']
    const idx = phases.indexOf(room.hand.phase)
    room.hand.phase = phases[idx + 1] || 'showdown'
    room.hand.currentBet = 0
    Object.values(room.players).forEach((p) => {
      if (p.status !== 'out' && p.status !== 'folded') p.currentBet = 0
    })
    room.hand.currentTurn = nextInHandSeat(room.players, room.hand.dealerSeat)
    broadcast(roomCode)
  })

  // ── New hand (dealer) ────────────────────────────────────────────────────
  socket.on('new-hand', ({ roomCode }) => {
    const room = rooms[roomCode]
    if (!room) return
    const { players, config } = room
    const active = activePlayers(players)
    if (active.length < 2) return

    const newDealerSeat = nextActiveSeat(players, room.hand?.dealerSeat ?? 0)
    const blinds = currentBlinds(room)
    const seats = blindSeats(players, newDealerSeat)

    // Bust players with 0 chips; reset others
    Object.values(players).forEach((p) => {
      if (p.chips <= 0 && p.status !== 'out') p.status = 'out'
      else if (p.status !== 'out') {
        p.status = 'active'
        p.currentBet = 0
        p.isDealer = p.seat === newDealerSeat
      }
    })

    // Auto blind level increase
    if (config.blindIncreaseMinutes > 0 && room.nextBlindAt && Date.now() >= room.nextBlindAt) {
      const levels = config.blindLevels || DEFAULT_BLIND_LEVELS
      room.blindLevel = Math.min((room.blindLevel || 0) + 1, levels.length - 1)
      room.nextBlindAt = Date.now() + config.blindIncreaseMinutes * 60000
    }

    if (seats) {
      const sb = playerAtSeat(players, seats.smallBlindSeat)
      const bb = playerAtSeat(players, seats.bigBlindSeat)
      if (sb && sb.chips > 0) { sb.chips -= blinds.small; sb.currentBet = blinds.small }
      if (bb && bb.chips > 0) { bb.chips -= blinds.big;   bb.currentBet = blinds.big   }
      room.hand = {
        pot: blinds.small + blinds.big,
        dealerSeat: newDealerSeat,
        currentTurn: seats.firstToActSeat,
        phase: 'preflop',
        currentBet: blinds.big,
        smallBlind: blinds.small,
        bigBlind: blinds.big,
        lastAction: null,
        handNumber: (room.hand?.handNumber || 0) + 1,
      }
    }
    broadcast(roomCode)
  })

  // ── Award pot (dealer picks winner) ──────────────────────────────────────
  socket.on('award-pot', ({ roomCode, winnerIds, splitPot }) => {
    const room = rooms[roomCode]
    if (!room) return
    const pot = room.hand?.pot || 0

    if (splitPot && winnerIds.length > 1) {
      const share = Math.floor(pot / winnerIds.length)
      winnerIds.forEach((id) => {
        if (room.players[id]) room.players[id].chips += share
      })
    } else {
      const winner = room.players[winnerIds[0]]
      if (winner) winner.chips += pot
    }

    room.hand.pot = 0
    room.hand.lastAction = {
      playerId: winnerIds[0],
      playerName: winnerIds.map((id) => room.players[id]?.name).join(' & '),
      action: 'win',
      amount: pot,
      ts: Date.now(),
    }
    broadcast(roomCode)
  })

  // ── Increase blinds manually (dealer) ────────────────────────────────────
  socket.on('increase-blinds', ({ roomCode }) => {
    const room = rooms[roomCode]
    if (!room) return
    const levels = room.config?.blindLevels || DEFAULT_BLIND_LEVELS
    room.blindLevel = Math.min((room.blindLevel || 0) + 1, levels.length - 1)
    if (room.config?.blindIncreaseMinutes > 0) {
      room.nextBlindAt = Date.now() + room.config.blindIncreaseMinutes * 60000
    }
    broadcast(roomCode)
  })
})

const PORT = 3001
httpServer.listen(PORT, () => {
  console.log(`\x1b[34m[server]\x1b[0m FichasPoker en http://localhost:${PORT}`)
})
