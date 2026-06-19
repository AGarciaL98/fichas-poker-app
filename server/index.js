import { createServer } from 'http'
import { Server } from 'socket.io'
import { initializeApp } from 'firebase/app'
import { getDatabase, ref, set, get, remove } from 'firebase/database'
import {
  activePlayers,
  blindSeats,
  currentBlinds,
  nextActiveSeat,
  nextInHandSeat,
  playerAtSeat,
  DEFAULT_BLIND_LEVELS,
} from '../src/lib/gameLogic.js'

// ─── Firebase setup ───────────────────────────────────────────────────────────

const FIREBASE_DATABASE_URL = process.env.FIREBASE_DATABASE_URL
let db = null

if (FIREBASE_DATABASE_URL) {
  const firebaseApp = initializeApp({ databaseURL: FIREBASE_DATABASE_URL })
  db = getDatabase(firebaseApp)
  console.log('[firebase] Realtime Database conectada')
} else {
  console.warn('[firebase] FIREBASE_DATABASE_URL no configurada — usando solo memoria')
}

const dbRef = (path) => ref(db, path)

async function loadRooms() {
  if (!db) return
  try {
    const snapshot = await get(dbRef('rooms'))
    if (snapshot.exists()) {
      Object.assign(rooms, snapshot.val())
      console.log(`[firebase] ${Object.keys(rooms).length} sala(s) recuperada(s)`)
    }
  } catch (e) {
    console.error('[firebase] Error al cargar salas:', e.message)
  }
}

function persist(roomCode) {
  if (!db || !rooms[roomCode]) return
  rooms[roomCode].lastActivity = Date.now()
  set(dbRef(`rooms/${roomCode}`), rooms[roomCode]).catch((e) =>
    console.error('[firebase] Error al persistir sala:', e.message)
  )
}

function deleteRoom(roomCode) {
  delete rooms[roomCode]
  if (!db) return
  remove(dbRef(`rooms/${roomCode}`)).catch((e) =>
    console.error('[firebase] Error al eliminar sala:', e.message)
  )
}

// Elimina salas sin actividad en más de 12 horas
const TWELVE_HOURS = 12 * 60 * 60 * 1000
setInterval(() => {
  const now = Date.now()
  for (const [code, room] of Object.entries(rooms)) {
    const lastActive = room.lastActivity || room.createdAt || 0
    if (now - lastActive > TWELVE_HOURS) {
      console.log(`[firebase] Sala ${code} expirada — eliminando`)
      deleteRoom(code)
    }
  }
}, 60 * 60 * 1000)

// ─── Socket.io ────────────────────────────────────────────────────────────────

const httpServer = createServer()
const io = new Server(httpServer, { cors: { origin: '*' } })
const rooms = {}

// socketId → { roomCode, playerId } — para detectar desconexiones
const socketPlayers = {}

function broadcast(roomCode) {
  io.to(roomCode).emit('room-update', rooms[roomCode])
  persist(roomCode)
}

// Lógica compartida entre leave-room y disconnect
function handlePlayerLeave(roomCode, playerId) {
  const room = rooms[roomCode]
  if (!room) return

  if (room.status === 'playing') {
    // Durante partida: auto-fold si estaba activo; no eliminar de la sala
    const player = room.players[playerId]
    if (player && player.status === 'active') {
      player.status = 'folded'
      if (room.hand?.currentTurn === player.seat) {
        room.hand.currentTurn = nextInHandSeat(room.players, player.seat)
      }
      if (!room.hand.acted) room.hand.acted = []
      if (!room.hand.acted.includes(playerId)) room.hand.acted.push(playerId)
      checkStreetEnd(room)
      broadcast(roomCode)
    }
    return
  }

  // En Lobby: eliminar al jugador
  delete room.players[playerId]

  if (Object.keys(room.players).length === 0) {
    deleteRoom(roomCode)
    return
  }

  if (room.host === playerId) {
    // Host se fue con jugadores dentro — cerrar sala para todos
    io.to(roomCode).emit('room-closed')
    deleteRoom(roomCode)
  } else {
    broadcast(roomCode)
  }
}

// ─── Street-end detection ─────────────────────────────────────────────────────
//
// `hand.acted` = array of playerIds who have voluntarily acted since the last
// aggressive action (bet / raise / allin-raise). A street ends when:
//   1. Every player who can still bet (status=active, chips>0) is in `acted`, AND
//   2. No one owes chips (currentBet < hand.currentBet)
//
// Special cases handled first:
//   • Only 1 player not folded → auto-win, go to showdown
//   • All remaining players are all-in → no more betting, go to showdown

function checkStreetEnd(room) {
  const { players, hand } = room
  if (!hand || hand.phase === 'showdown') return

  const notFolded = Object.values(players).filter(
    (p) => p.status !== 'out' && p.status !== 'folded' && p.status !== 'waiting'
  )

  // Last player standing — auto-award pot, no showdown needed
  if (notFolded.length <= 1) {
    hand.phase = 'showdown'
    if (notFolded.length === 1) {
      const winner = notFolded[0]
      winner.chips += hand.pot
      hand.lastAction = {
        playerId: winner.id,
        playerName: winner.name,
        action: 'win',
        amount: hand.pot,
        ts: Date.now(),
      }
      hand.pot = 0
      hand.awaitingNewHand = true
    }
    return
  }

  // Everyone still in is all-in → run the board, no more betting
  const canBet = notFolded.filter((p) => p.status === 'active' && p.chips > 0)
  if (canBet.length === 0) {
    hand.phase = 'showdown'
    return
  }

  // Normal case: every active (non-allin) player must have acted AND matched the bet
  const acted = hand.acted || []
  const allActed = canBet.every((p) => acted.includes(p.id))
  const needToCall = canBet.filter((p) => p.currentBet < hand.currentBet)

  if (!allActed || needToCall.length > 0) return

  // ── Street is over ────────────────────────────────────────────────────────
  const phases = ['preflop', 'flop', 'turn', 'river']
  const idx = phases.indexOf(hand.phase)

  if (idx >= phases.length - 1) {
    hand.phase = 'showdown'
  } else {
    hand.phase = phases[idx + 1]
    hand.currentBet = 0
    hand.acted = []
    hand.aggressorName = null   // new street: no bet yet
    notFolded.forEach((p) => { p.currentBet = 0 })
    hand.currentTurn = nextInHandSeat(players, hand.dealerSeat)
  }
}

// ─── Socket events ────────────────────────────────────────────────────────────

io.on('connection', (socket) => {

  socket.on('create-room', ({ roomCode, config, player }, cb) => {
    if (rooms[roomCode]) return cb?.({ error: 'Código de sala ya existe' })
    rooms[roomCode] = {
      code: roomCode,
      status: 'waiting',
      createdAt: Date.now(),
      lastActivity: Date.now(),
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
    socketPlayers[socket.id] = { roomCode, playerId: player.id }
    cb?.({ ok: true })
    socket.emit('room-update', rooms[roomCode])
    persist(roomCode)
  })

  socket.on('join-room', ({ roomCode, player }, cb) => {
    const room = rooms[roomCode]
    if (!room) return cb?.({ error: 'Sala no encontrada' })
    if (!room.players[player.id]) {
      const usedSeats = new Set(Object.values(room.players).map((p) => p.seat))
      let seat = 0
      while (usedSeats.has(seat)) seat++
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
    socketPlayers[socket.id] = { roomCode, playerId: player.id }
    cb?.({ ok: true })
    broadcast(roomCode)
  })

  socket.on('rejoin-room', ({ roomCode, playerId }) => {
    socket.join(roomCode)
    if (playerId) socketPlayers[socket.id] = { roomCode, playerId }
    if (rooms[roomCode]) socket.emit('room-update', rooms[roomCode])
  })

  socket.on('leave-room', ({ roomCode, playerId }) => {
    delete socketPlayers[socket.id]
    handlePlayerLeave(roomCode, playerId)
  })

  socket.on('disconnect', () => {
    const info = socketPlayers[socket.id]
    delete socketPlayers[socket.id]
    if (!info) return
    const room = rooms[info.roomCode]
    // Solo actuar en Lobby — en partida activa se necesita gracia de reconexión
    if (!room || room.status !== 'waiting') return
    handlePlayerLeave(info.roomCode, info.playerId)
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
        acted: [],
        aggressorName: bb?.name || null,  // BB sets the initial bet
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
    if (!player || hand.phase === 'showdown' || player.status === 'waiting') return

    const prevBet = player.currentBet || 0
    const prevHandBet = hand.currentBet

    // ── Apply the action ────────────────────────────────────────────────────
    if (action === 'fold') {
      player.status = 'folded'

    } else if (action === 'call') {
      const callAmt = Math.min(hand.currentBet - prevBet, player.chips)
      player.chips -= callAmt
      player.currentBet = prevBet + callAmt
      hand.pot += callAmt

    } else if (action === 'check') {
      // no chip movement

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
      amount: (action === 'raise' || action === 'bet') ? amount
            : action === 'call' ? Math.min(prevHandBet - prevBet, player.chips + prevHandBet - prevBet)
            : action === 'allin' ? prevBet + (player.chips + (hand.pot - (rooms[roomCode]?.hand?.pot ?? hand.pot)))
            : 0,
      ts: Date.now(),
    }

    // ── Update `acted` set ──────────────────────────────────────────────────
    // An aggressive action (bet / raise / allin-raise) resets the set so that
    // every other player must respond. Passive actions just add to the set.
    const isAggressive =
      action === 'raise' ||
      action === 'bet' ||
      (action === 'allin' && player.currentBet > prevHandBet)

    if (isAggressive) {
      hand.acted = [playerId]
      hand.aggressorName = player.name   // track who you need to call
    } else {
      if (!hand.acted) hand.acted = []
      if (!hand.acted.includes(playerId)) hand.acted.push(playerId)
    }

    // ── Advance turn ────────────────────────────────────────────────────────
    hand.currentTurn = nextInHandSeat(players, player.seat)

    // ── Auto-advance phase ──────────────────────────────────────────────────
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
        acted: [],
        aggressorName: bb?.name || null,
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

// ─── Start ────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3001
loadRooms().then(() => {
  httpServer.listen(PORT, () => {
    console.log(`\x1b[34m[server]\x1b[0m FichasPoker en http://localhost:${PORT}`)
  })
})
