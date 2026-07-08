import { useEffect, useState } from 'react'
import { socket } from '../lib/socket'

// ─── React hook ──────────────────────────────────────────────────────────────

export function useRoom(roomCode, playerId) {
  const [room, setRoom] = useState(null)
  const [loading, setLoading] = useState(true)
  const [roomClosed, setRoomClosed] = useState(false)

  useEffect(() => {
    if (!roomCode) return

    function onUpdate(updatedRoom) {
      if (updatedRoom?.code === roomCode) {
        setRoom(updatedRoom)
        setLoading(false)
      }
    }
    function onClosed() { setRoomClosed(true) }

    socket.on('room-update', onUpdate)
    socket.on('room-closed', onClosed)
    socket.emit('rejoin-room', { roomCode, playerId })

    return () => {
      socket.off('room-update', onUpdate)
      socket.off('room-closed', onClosed)
    }
  }, [roomCode])

  return { room, loading, roomClosed }
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

export const awardPot = (roomCode, winnerIds, pot = 0) => {
  const splitPot = winnerIds.length > 1
  const remainder = splitPot ? pot % winnerIds.length : 0
  socket.emit('award-pot', { roomCode, winnerIds, splitPot, remainder })
}

export const increaseBlinds = (roomCode) =>
  socket.emit('increase-blinds', { roomCode })

export const leaveRoom = (roomCode, playerId) =>
  socket.emit('leave-room', { roomCode, playerId })
