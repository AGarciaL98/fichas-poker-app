import { useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import {
  useRoom,
  playerAction,
  newHand,
  awardPot,
  increaseBlinds,
} from '../hooks/useRoom'
import {
  getOrCreatePlayerId,
  formatChips,
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

  // All hooks before any early return
  const [sliderValue, setSliderValue] = useState(null)
  const [showWinnerPicker, setShowWinnerPicker] = useState(false)
  const [selectedWinners, setSelectedWinners] = useState([])
  const [showDealerMenu, setShowDealerMenu] = useState(false)

  // Derived values (safe with optional chaining when room is null)
  const players = room?.players || {}
  const hand = room?.hand || {}
  const me = players[playerId]
  const blinds = room ? currentBlinds(room) : { small: 0, big: 0 }
  const myPrevBet = me?.currentBet || 0
  const raiseMin = (hand.currentBet || 0) + (hand.bigBlind || blinds.big)
  const maxBet = (me?.chips || 0) + myPrevBet
  const isMyTurn = hand.currentTurn === me?.seat && me?.status === 'active'

  // Reset slider to raiseMin each time it becomes our turn or a new hand starts
  useEffect(() => {
    if (isMyTurn) setSliderValue(raiseMin)
  }, [isMyTurn, hand.handNumber])

  if (loading || !room) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-gold-400 animate-pulse">Cargando mesa...</p>
      </div>
    )
  }

  const inHand = inHandPlayers(players)
  const isDealer = room.host === playerId
  const toCall = Math.max(0, (hand.currentBet || 0) - myPrevBet)
  const canCheck = toCall === 0
  const currentTurnPlayer = Object.values(players).find((p) => p.seat === hand.currentTurn)

  // Slider state
  const canRaise = me?.chips > 0 && maxBet > myPrevBet
  const step = Math.max(1, hand.bigBlind || blinds.big || 1)
  const clampedSlider = Math.max(raiseMin, Math.min(sliderValue ?? raiseMin, maxBet))
  const isAllIn = clampedSlider >= maxBet
  const sliderProgress =
    maxBet > raiseMin
      ? ((clampedSlider - raiseMin) / (maxBet - raiseMin)) * 100
      : 100

  function doAction(action, amount) {
    playerAction(roomCode, playerId, action, amount)
  }

  function handleRaiseOrAllIn() {
    if (isAllIn) {
      doAction('allin')
    } else {
      doAction('raise', clampedSlider)
    }
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

      {/* ── Player actions ── */}
      {me && me.status !== 'folded' && me.status !== 'out' && me.status !== 'allin' && (
        <div className="flex-shrink-0 px-3 pb-1 space-y-2">
          {isMyTurn ? (
            <>
              {/* Slider — only if player has chips to raise */}
              {canRaise && (
                <div className="card-felt px-4 py-3 space-y-2">
                  {/* Amount label */}
                  <div className="flex justify-between items-baseline">
                    <span className={`text-sm font-semibold ${isAllIn ? 'text-purple-400' : 'text-gold-400'}`}>
                      {isAllIn ? 'ALL IN' : (canCheck ? 'Apostar' : 'Subir a')}
                    </span>
                    <span className={`text-xl font-bold font-casino ${isAllIn ? 'text-purple-300' : 'text-gold-300'}`}>
                      {formatChips(clampedSlider)}
                    </span>
                  </div>

                  {/* Slider */}
                  <div className="relative">
                    <input
                      type="range"
                      className="bet-slider w-full"
                      min={raiseMin}
                      max={maxBet}
                      step={step}
                      value={clampedSlider}
                      onChange={(e) => setSliderValue(Number(e.target.value))}
                      style={{ '--progress': `${sliderProgress}%`, '--is-allin': isAllIn ? '1' : '0' }}
                    />
                  </div>

                  {/* Range labels */}
                  <div className="flex justify-between text-[10px] text-gray-500">
                    <span>mín {formatChips(raiseMin)}</span>
                    <span className={isAllIn ? 'text-purple-400 font-semibold' : ''}>
                      all-in {formatChips(maxBet)}
                    </span>
                  </div>

                  {/* Quick bet buttons */}
                  <div className="flex gap-1.5 pt-0.5">
                    {[
                      { label: '½ pot', value: Math.floor((hand.pot || 0) / 2) },
                      { label: 'pot', value: hand.pot || 0 },
                      { label: '2× pot', value: (hand.pot || 0) * 2 },
                    ]
                      .filter((b) => b.value >= raiseMin && b.value < maxBet)
                      .map((b) => (
                        <button
                          key={b.label}
                          className="flex-1 py-1 rounded-lg bg-felt-700 text-gray-300 text-xs active:bg-felt-600 border border-felt-600"
                          onClick={() => setSliderValue(b.value)}
                        >
                          {b.label}
                        </button>
                      ))}
                    <button
                      className="flex-1 py-1 rounded-lg bg-purple-900 text-purple-300 text-xs active:bg-purple-800 border border-purple-800"
                      onClick={() => setSliderValue(maxBet)}
                    >
                      all-in
                    </button>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-2">
                <button
                  className="btn-action bg-red-900 text-white border border-red-800"
                  onClick={() => doAction('fold')}
                >
                  Fold
                </button>

                {canCheck ? (
                  <button
                    className="btn-action bg-blue-900 text-white border border-blue-800"
                    onClick={() => doAction('check')}
                  >
                    Check
                  </button>
                ) : (
                  <button
                    className="btn-action bg-blue-900 text-white border border-blue-800 flex flex-col items-center leading-tight"
                    onClick={() => doAction('call')}
                    disabled={me.chips === 0}
                  >
                    <span>Call</span>
                    <span className="text-xs font-normal opacity-75">
                      {formatChips(Math.min(toCall, me.chips))}
                    </span>
                  </button>
                )}

                {canRaise && (
                  <button
                    className={`btn-action font-bold transition-colors ${
                      isAllIn
                        ? 'bg-purple-700 text-white border border-purple-600'
                        : 'bg-gold-500 text-black'
                    }`}
                    onClick={handleRaiseOrAllIn}
                  >
                    {isAllIn ? 'All-in' : canCheck ? 'Bet' : 'Raise'}
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="text-center text-gray-600 text-sm py-2">
              {currentTurnPlayer ? `${currentTurnPlayer.name} está pensando…` : ''}
            </div>
          )}
        </div>
      )}

      {/* ── Dealer controls — solo aparecen cuando la mano termina ── */}
      {isDealer && hand.phase === 'showdown' && (
        <div className="flex-shrink-0 bg-felt-800 border-t border-felt-600 px-3 py-2">

          {/* Tras dar el bote: botón de nueva mano */}
          {hand.awaitingNewHand ? (
            <div className="flex gap-2 items-center">
              <button
                className="flex-1 btn-gold py-3 text-base"
                onClick={() => newHand(roomCode)}
              >
                Nueva mano →
              </button>
              {room.config?.blindIncreaseMinutes === 0 && (
                <button
                  className="btn-ghost py-3 px-4 text-sm"
                  onClick={() => { increaseBlinds(roomCode) }}
                >
                  Subir ciegas ↑
                </button>
              )}
            </div>

          ) : showWinnerPicker ? (
            /* Picker de ganador */
            <div>
              <p className="label-sm text-center mb-2">
                {inHand.length > 2 ? 'Toca uno o varios ganadores' : '¿Quién gana el bote?'}
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
                  {selectedWinners.length > 1 ? 'Dividir bote' : 'Dar bote 🏆'}
                </button>
                <button
                  className="btn-ghost py-2 px-4 text-sm"
                  onClick={() => { setShowWinnerPicker(false); setSelectedWinners([]) }}
                >
                  Cancelar
                </button>
              </div>
            </div>

          ) : (
            /* Botón principal: dar bote */
            <button
              className="w-full py-3 rounded-xl bg-green-900 border border-green-700 text-white text-base font-bold active:scale-95"
              onClick={() => { setShowWinnerPicker(true); setSelectedWinners([]) }}
            >
              ¿Quién gana el bote? 🏆
            </button>
          )}
        </div>
      )}
    </div>
  )
}
