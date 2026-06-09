import { createServer } from 'http'
import { Server } from 'socket.io'
import {
  activePlayers,
  blindSeats,
  currentBlinds,
  nextActiveSeat,
  nextInHandSeat,
  playerAtSeat,
  DEFAULT_BLIND_LEVELS,
} from '../src/lib/gameLogic.js'

const httpServer = createServer()
const io = new Server(httpServer, { cors: { origin: '*' } })

const rooms = {}

function broadcast(roomCode) {
  io.to(roomCode).emit('room-update', rooms[roomCode])
}

// ── Auto-advance logic ────────────────────────────────────────────────────────
// Called after every player action. Advances the phase automatically when the
// betting round is over, or moves to showdown when the hand is decided.

function checkStreetEnd(room) {
  const { players, hand } = room
  if (!hand || hand.phase === 'showdown') return

  const notFolded = Object.values(players).filter(
    (p) => p.status !== 'out' && p.status !== 'folded'
  )

  // Only 1 player remaining → they win uncontested
  if (notFolded.length <= 1) {
    hand.phase = 'showdown'
    return
  }

  // All remaining players are all-in → no more betting, run to showdown
  const canBet = notFolded.filter((p) => p.status === 'active' && p.chips > 0)
  if (canBet.length === 0) {
    hand.phase = 'showdown'
    return
  }

  // Normal case: everyone has acted at least once AND everyone has matched the bet
  const needToCall = notFolded.filter(
    (p) => p.status === 'active' && p.chips > 0 && p.currentBet < hand.currentBet
  )
  const allActed = (hand.roundActionCount || 0) >= notFolded.length
  if (!allActed || needToCall.length > 0) return

  // Street is over — advance phase
  const phases = ['preflop', 'flop', 'turn', 'river']
  const idx = phases.indexOf(hand.phase)

  if (idx >= phases.length - 1) {
    // River done → showdown
    hand.phase = 'showdown'
  } else {
    hand.phase = phases[idx + 1]
    hand.currentBet = 0
    hand.roundActionCount = 0
    notFolded.forEach((p) => { p.currentBet = 0 })
    hand.currentTurn = nextInHandSeat(players, hand.dealerSeat)
  }
}

// ── Socket events ─────────────────────────────────────────────────────────────

io.on('connection', (socket) => {

  socket.on('create-room', ({ roomCode, config, player }, cb) => {
    if (rooms[roomCode]) return cb?.({ error: 'Código de sala ya existe' })
    rooms[roomCode] = {
      code: roomCode,
      status: 'waiting',
      createdAt: Date.now(),
      config,
      host: player.id,
      blindLevel: 0,
      nextBlindAt: config.blindIncreaseMinutes > 0
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

  socket.on('join-room', ({ roomCode, player }, cb) => {
    const room = rooms[roomCode]
    if (!room) return cb?.({ error: 'Sala no encontrada' })
    if (room.status === 'playing' && !room.players[player.id])
      return cb?.({ error: 'La partida ya ha comenzado' })

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

  socket.on('rejoin-room', ({ roomCode }) => {
    socket.join(roomCode)
    if (rooms[roomCode]) socket.emit('room-update', rooms[roomCode])
  })

  socket.on('start-game', ({ roomCode }) => {
    const room = rooms[roomCode]
    if (!room) return
    const { players } = room
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
        roundActionCount: 0,
        awaitingNewHand: false,
      }
    }
    broadcast(roomCode)
  })

  socket.on('player-action', ({ roomCode, playerId, action, amount }) => {
    const room = rooms[roomCode]
    if (!room) return
    const { players, hand } = room
    const player = players[playerId]
    if (!player || hand.phase === 'showdown') return

    const prevBet = player.currentBet || 0

    if (action === 'fold') {
      player.status = 'folded'
    } else if (action === 'call') {
      const callAmt = Math.min(hand.currentBet - prevBet, player.chips)
      player.chips -= callAmt
      player.currentBet = prevBet + callAmt
      hand.pot += callAmt
    } else if (action === 'check') {
      // no chips
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
      amount: action === 'raise' || action === 'bet' ? amount
            : action === 'call' ? Math.min(hand.currentBet - prevBet, player.chips + (hand.currentBet - prevBet))
            : 0,
      ts: Date.now(),
    }

    // Track actions this street. A raise resets the counter (everyone must respond again).
    if (action === 'raise' || action === 'bet') {
      hand.roundActionCount = 1
    } else {
      hand.roundActionCount = (hand.roundActionCount || 0) + 1
    }

    hand.currentTurn = nextInHandSeat(players, player.seat)

    // Auto-advance phases or go to showdown
    checkStreetEnd(room)

    broadcast(roomCode)
  })

  socket.on('award-pot', ({ roomCode, winnerIds, splitPot }) => {
    const room = rooms[roomCode]
    if (!room) return
    const pot = room.hand?.pot || 0

    if (splitPot && winnerIds.length > 1) {
      const share = Math.floor(pot / winnerIds.length)
      winnerIds.forEach((id) => { if (room.players[id]) room.players[id].chips += share })
    } else {
      const winner = room.players[winnerIds[0]]
      if (winner) winner.chips += pot
    }

    room.hand.pot = 0
    room.hand.awaitingNewHand = true
    room.hand.lastAction = {
      playerId: winnerIds[0],
      playerName: winnerIds.map((id) => room.players[id]?.name).join(' & '),
      action: 'win',
      amount: pot,
      ts: Date.now(),
    }
    broadcast(roomCode)
  })

  socket.on('new-hand', ({ roomCode }) => {
    const room = rooms[roomCode]
    if (!room) return
    const { players, config } = room
    const active = activePlayers(players)
    if (active.length < 2) return

    const newDealerSeat = nextActiveSeat(players, room.hand?.dealerSeat ?? 0)
    const blinds = currentBlinds(room)
    const seats = blindSeats(players, newDealerSeat)

    Object.values(players).forEach((p) => {
      if (p.chips <= 0 && p.status !== 'out') p.status = 'out'
      else if (p.status !== 'out') {
        p.status = 'active'
        p.currentBet = 0
        p.isDealer = p.seat === newDealerSeat
      }
    })

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
        roundActionCount: 0,
        awaitingNewHand: false,
      }
    }
    broadcast(roomCode)
  })

  socket.on('increase-blinds', ({ roomCode }) => {
    const room = rooms[roomCode]
    if (!room) return
    const levels = room.config?.blindLevels || DEFAULT_BLIND_LEVELS
    room.blindLevel = Math.min((room.blindLevel || 0) + 1, levels.length - 1)
    if (room.config?.blindIncreaseMinutes > 0)
      room.nextBlindAt = Date.now() + room.config.blindIncreaseMinutes * 60000
    broadcast(roomCode)
  })
})

const PORT = 3001
httpServer.listen(PORT, () => {
  console.log(`\x1b[34m[server]\x1b[0m FichasPoker en http://localhost:${PORT}`)
})
