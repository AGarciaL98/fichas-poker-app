import { useState, useEffect, useRef } from 'react'
import { formatChips } from '../lib/gameLogic'

const PLAYER_COLORS = [
  '#ef4444', '#3b82f6', '#a855f7', '#f97316',
  '#14b8a6', '#ec4899', '#eab308', '#22c55e', '#06b6d4',
]

function playerColor(players, playerName) {
  const p = Object.values(players || {}).find((pl) => pl.name === playerName)
  return p ? PLAYER_COLORS[p.seat % PLAYER_COLORS.length] : '#9ca3af'
}

const ACTION_LABEL = {
  fold:  (a, sb) => 'se retira',
  call:  (a, sb) => `iguala ${formatChips(a.amount, sb)}`,
  check: (a, sb) => 'pasa',
  raise: (a, sb) => `sube a ${formatChips(a.amount, sb)}`,
  bet:   (a, sb) => `apuesta ${formatChips(a.amount, sb)}`,
  allin: (a, sb) => 'va ALL-IN',
  win:   (a, sb) => `gana ${formatChips(a.amount, sb)}`,
}

const OPACITIES = [0.08, 0.25, 0.55, 1.0]

export default function ActionFeed({ lastAction, handNumber, players, smallBlind }) {
  const [entries, setEntries] = useState([])
  const prevTs = useRef(null)

  // Clear feed on new hand
  useEffect(() => {
    setEntries([])
    prevTs.current = null
  }, [handNumber])

  // Append new action to feed
  useEffect(() => {
    if (!lastAction || lastAction.ts === prevTs.current) return
    prevTs.current = lastAction.ts
    setEntries((prev) => [...prev, { ...lastAction, key: lastAction.ts }].slice(-4))
  }, [lastAction?.ts])

  if (entries.length === 0) return null

  return (
    <div
      className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
      style={{
        top: '52%',
        width: '65%',
        zIndex: 5,
        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 55%)',
        maskImage: 'linear-gradient(to bottom, transparent 0%, black 55%)',
      }}
    >
      {entries.map((entry, idx) => {
        const isNewest = idx === entries.length - 1
        const opacityIdx = entries.length - 1 - idx
        const opacity = OPACITIES[Math.min(opacityIdx, OPACITIES.length - 1)]
        const label = (ACTION_LABEL[entry.action] || (() => entry.action))(entry, smallBlind)
        const color = playerColor(players, entry.playerName)

        return (
          <div
            key={entry.key}
            className={isNewest ? 'action-entry-new' : ''}
            style={{
              opacity,
              textAlign: 'center',
              lineHeight: '1.6',
              fontSize: '11px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            <span style={{ color, fontWeight: 700 }}>{entry.playerName}</span>
            <span style={{ color: '#e5e7eb', fontWeight: 400 }}> {label}</span>
          </div>
        )
      })}
    </div>
  )
}
