import { useEffect, useState } from 'react'
import { socket } from '../lib/socket'

// ─── React hook ──────────────────────────────────────────────────────────────

export function useRoom(roomCode) {
  const [room, setRoom] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!roomCode) return

    function onUpdate(updatedRoom) {
      if (updatedRoom?.code === roomCode) {
        setRoom(updatedRoom)
        setLoading(false)
      }
    }

    socket.on('room-update', onUpdate)
    // Rejoin socket room on mount / page refresh
    socket.emit('rejoin-room', { roomCode })

    return () => socket.off('room-update', onUpdate)
  }, [roomCode])

  return { room, loading }
}

// ─── Actions (all synchronous — server broadcasts updates) ───────────────────

export function createRoom(roomCode, config, player) {
  return new Promise((resolve, reject) => {
    socket.emit('create-room', { roomCode, config, player }, (res) => {
      if (res?.error) reject(new Error(res.error))
      else resolve()
    })
  })
}

export function joinRoom(roomCode, player) {
  return new Promise((resolve, reject) => {
    socket.emit('join-room', { roomCode, player }, (res) => {
      if (res?.error) reject(new Error(res.error))
      else resolve()
    })
  })
}

export const startGame = (roomCode) =>
  socket.emit('start-game', { roomCode })

export const playerAction = (roomCode, playerId, action, amount = 0) =>
  socket.emit('player-action', { roomCode, playerId, action, amount })

export const nextPhase = (roomCode) =>
  socket.emit('next-phase', { roomCode })

export const newHand = (roomCode) =>
  socket.emit('new-hand', { roomCode })

export const awardPot = (roomCode, winnerIds) =>
  socket.emit('award-pot', { roomCode, winnerIds, splitPot: winnerIds.length > 1 })

export const increaseBlinds = (roomCode) =>
  socket.emit('increase-blinds', { roomCode })
