import { useParams } from 'react-router-dom'
import { useState } from 'react'
import {
  useRoom,
  playerAction,
  nextPhase,
  newHand,
  awardPot,
  increaseBlinds,
} from '../hooks/useRoom'
import {
  getOrCreatePlayerId,
  formatChips,
  activePlayers,
  currentBlinds,
  inHandPlayers,
} from '../lib/gameLogic'
import TableMap from '../components/TableMap'
import ActionLog from '../components/ActionLog'
import BlindTimer from '../components/BlindTimer'

const PHASE_LABEL = {
  preflop: 'Pre-flop',
  flop: 'Flop',
  turn: 'Turn',
  river: 'River',
  showdown: 'Showdown',
}

const NEXT_PHASE_LABEL = {
  preflop: '→ Flop',
  flop: '→ Turn',
  turn: '→ River',
  river: 'Showdown',
  showdown: '—',
}

export default function Game() {
  const { roomCode } = useParams()
  const { room, loading } = useRoom(roomCode)
  const playerId = getOrCreatePlayerId()

  const [showRaise, setShowRaise] = useState(false)
  const [raiseInput, setRaiseInput] = useState('')
  const [showWinnerPicker, setShowWinnerPicker] = useState(false)
  const [selectedWinners, setSelectedWinners] = useState([])
  const [showDealerMenu, setShowDealerMenu] = useState(false)

  if (loading || !room) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-gold-400 animate-pulse">Cargando mesa...</p>
      </div>
    )
  }

  const players = room.players || {}
  const hand = room.hand || {}
  const me = players[playerId]
  const isDealer = room.host === playerId
  const isMyTurn = hand.currentTurn === me?.seat && me?.status === 'active'
  const inHand = inHandPlayers(players)
  const myPrevBet = me?.currentBet || 0
  const toCall = Math.max(0, (hand.currentBet || 0) - myPrevBet)
  const canCheck = toCall === 0
  const blinds = currentBlinds(room)
  const raiseMin = (hand.currentBet || 0) + (hand.bigBlind || blinds.big)
  const currentTurnPlayer = Object.values(players).find((p) => p.seat === hand.currentTurn)

  function doAction(action, amount) {
    playerAction(roomCode, playerId, action, amount)
    setShowRaise(false)
    setRaiseInput('')
  }

  function toggleWinner(id) {
    setSelectedWinners((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  function confirmAwardPot() {
    if (selectedWinners.length === 0) return
    awardPot(roomCode, selectedWinners)
    setShowWinnerPicker(false)
    setSelectedWinners([])
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Top bar ── */}
      <div className="flex-shrink-0 flex items-center justify-between px-3 py-2 bg-felt-800 border-b border-felt-600">
        <div className="flex items-center gap-2">
          <span className="text-gold-400 font-casino font-bold text-sm tracking-wider">{roomCode}</span>
          {hand.handNumber > 0 && (
            <span className="text-[10px] text-gray-500 bg-felt-700 rounded px-1.5 py-0.5">
              mano #{hand.handNumber}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 bg-felt-700 px-2 py-1 rounded uppercase">
            {PHASE_LABEL[hand.phase] || '—'}
          </span>
          <BlindTimer room={room} />
        </div>
      </div>

      {/* ── Table map ── */}
      <div className="flex-shrink-0 px-2 pt-1">
        <TableMap players={players} hand={hand} myId={playerId} />
      </div>

      {/* ── Pot ── */}
      <div className="flex-shrink-0 flex justify-center py-1">
        <div className="card-felt px-6 py-1.5 flex items-center gap-3">
          <div className="text-center">
            <p className="label-sm">Bote</p>
            <p className="chip-display text-2xl">{formatChips(hand.pot || 0)}</p>
          </div>
          {hand.currentBet > 0 && (
            <>
              <div className="w-px h-8 bg-felt-600" />
              <div className="text-center">
                <p className="label-sm">Apuesta actual</p>
                <p className="text-gold-400 font-bold">{formatChips(hand.currentBet)}</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Last action ── */}
      <div className="flex-1 overflow-hidden px-4">
        <ActionLog room={room} />
      </div>

      {/* ── My chips ── */}
      {me && (
        <div className="flex-shrink-0 card-felt mx-3 mb-2 px-4 py-2.5 flex justify-between items-center">
          <div>
            <p className="label-sm">Mis fichas</p>
            <p className="chip-display">{formatChips(me.chips)}</p>
          </div>
          <div className="text-right flex flex-col items-end gap-1">
            {myPrevBet > 0 && (
              <div>
                <p className="label-sm">Mi apuesta</p>
                <p className="text-gold-400 font-bold">{formatChips(myPrevBet)}</p>
              </div>
            )}
            {me.status === 'folded' && <span className="text-red-400 font-bold text-sm">FOLD</span>}
            {me.status === 'allin' && <span className="text-yellow-400 font-bold text-sm">ALL-IN</span>}
            {isMyTurn && (
              <span className="text-green-400 text-xs font-bold animate-pulse">← TU TURNO</span>
            )}
          </div>
        </div>
      )}

      {/* ── Raise input ── */}
      {showRaise && isMyTurn && (
        <div className="flex-shrink-0 bg-felt-800 border-t border-felt-600 px-3 py-2 flex items-center gap-2">
          <span className="text-sm text-gray-400 whitespace-nowrap">Subir a</span>
          <input
            type="number"
            className="flex-1 bg-felt-900 border border-felt-600 rounded-lg px-3 py-2 text-white text-lg text-center focus:outline-none focus:border-gold-500"
            value={raiseInput}
            onChange={(e) => setRaiseInput(e.target.value)}
            min={raiseMin}
            max={(me?.chips || 0) + myPrevBet}
            autoFocus
          />
          <button
            className="btn-gold px-4 py-2 text-sm"
            onClick={() => {
              const amt = parseInt(raiseInput)
              if (!isNaN(amt) && amt >= raiseMin) doAction('raise', amt)
            }}
          >
            OK
          </button>
          <button className="text-gray-400 px-2" onClick={() => setShowRaise(false)}>✕</button>
        </div>
      )}

      {/* ── Player actions ── */}
      {me && me.status !== 'folded' && me.status !== 'out' && me.status !== 'allin' && (
        <div className="flex-shrink-0 px-3 pb-1">
          {isMyTurn ? (
            <div className="flex gap-2">
              <button className="btn-action bg-red-800 text-white" onClick={() => doAction('fold')}>
                Fold
              </button>
              {canCheck ? (
                <button className="btn-action bg-blue-800 text-white" onClick={() => doAction('check')}>
                  Check
                </button>
              ) : (
                <button
                  className="btn-action bg-blue-800 text-white flex flex-col items-center leading-tight"
                  onClick={() => doAction('call')}
                  disabled={me.chips === 0}
                >
                  <span>Call</span>
                  <span className="text-xs font-normal opacity-80">{formatChips(Math.min(toCall, me.chips))}</span>
                </button>
              )}
              <button
                className="btn-action bg-gold-500 text-black"
                onClick={() => { setRaiseInput(String(raiseMin)); setShowRaise(true) }}
                disabled={me.chips === 0}
              >
                {canCheck ? 'Bet' : 'Raise'}
              </button>
              {me.chips > 0 && (
                <button className="btn-action bg-purple-800 text-white text-xs" onClick={() => doAction('allin')}>
                  All-in
                </button>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-600 text-sm py-2">
              {currentTurnPlayer ? `${currentTurnPlayer.name} está pensando…` : ''}
            </div>
          )}
        </div>
      )}

      {/* ── Dealer controls ── */}
      {isDealer && (
        <div className="flex-shrink-0 bg-felt-800 border-t border-felt-600 px-3 py-2">

          {/* Winner picker */}
          {showWinnerPicker ? (
            <div>
              <p className="label-sm text-center mb-2">
                {inHand.length > 2 ? 'Toca uno o varios ganadores' : '¿Quién gana?'}
              </p>
              <div className="flex flex-wrap gap-2 justify-center mb-2">
                {inHand.map((p) => (
                  <button
                    key={p.id}
                    className={`px-3 py-2 rounded-xl text-sm font-bold transition-colors ${
                      selectedWinners.includes(p.id)
                        ? 'bg-gold-500 text-black'
                        : 'bg-felt-700 text-white border border-felt-600'
                    }`}
                    onClick={() => toggleWinner(p.id)}
                  >
                    {p.name}
                    {selectedWinners.includes(p.id) && inHand.length > 2 && ' ✓'}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  className="flex-1 btn-gold py-2 text-sm disabled:opacity-40"
                  onClick={confirmAwardPot}
                  disabled={selectedWinners.length === 0}
                >
                  {selectedWinners.length > 1 ? 'Dividir bote' : 'Dar bote'}
                </button>
                <button className="btn-ghost py-2 px-4 text-sm" onClick={() => { setShowWinnerPicker(false); setSelectedWinners([]) }}>
                  Cancelar
                </button>
              </div>
            </div>
          ) : showDealerMenu ? (
            <div>
              <div className="flex justify-between items-center mb-2">
                <p className="label-sm">Opciones dealer</p>
                <button className="text-gray-400 text-sm" onClick={() => setShowDealerMenu(false)}>✕</button>
              </div>
              <div className="flex gap-2 flex-wrap">
                {room.config?.blindIncreaseMinutes === 0 && (
                  <button
                    className="flex-1 btn-ghost py-2 text-xs"
                    onClick={() => { increaseBlinds(roomCode); setShowDealerMenu(false) }}
                  >
                    Subir ciegas ↑
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Main dealer bar */
            <div className="flex gap-2 items-center">
              <button
                className="flex-1 py-2 rounded-xl bg-felt-700 border border-felt-600 text-white text-sm font-semibold active:scale-95 disabled:opacity-40"
                onClick={() => nextPhase(roomCode)}
                disabled={hand.phase === 'showdown'}
              >
                {NEXT_PHASE_LABEL[hand.phase] || '—'}
              </button>
              <button
                className="flex-1 py-2 rounded-xl bg-green-800 text-white text-sm font-bold active:scale-95"
                onClick={() => { setShowWinnerPicker(true); setSelectedWinners([]) }}
              >
                Dar bote 🏆
              </button>
              <button
                className="flex-1 btn-gold py-2 text-sm"
                onClick={() => newHand(roomCode)}
              >
                Nueva mano
              </button>
              <button
                className="w-9 h-9 rounded-xl bg-felt-700 border border-felt-600 text-gray-400 flex items-center justify-center flex-shrink-0 active:bg-felt-600"
                onClick={() => setShowDealerMenu(true)}
              >
                ⋯
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
