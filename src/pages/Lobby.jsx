import { useParams, useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { useEffect, useState } from 'react'
import { useRoom, startGame } from '../hooks/useRoom'
import { getOrCreatePlayerId, formatChips, currentBlinds } from '../lib/gameLogic'
import { copyToClipboard } from '../lib/clipboard'
import ConfirmModal from '../components/ConfirmModal'

export default function Lobby() {
  const { roomCode } = useParams()
  const navigate = useNavigate()
  const { room, loading } = useRoom(roomCode)
  const playerId = getOrCreatePlayerId()
  const [showQR, setShowQR] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)

  function copyCode() {
    copyToClipboard(roomCode).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const isHost = room?.host === playerId
  const players = Object.values(room?.players || {}).sort((a, b) => a.seat - b.seat)
  const joinUrl = `${window.location.origin}/?join=${roomCode}`

  useEffect(() => {
    if (room?.status === 'playing') {
      navigate(`/game/${roomCode}`, { replace: true })
    }
  }, [room?.status])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-gold-400 animate-pulse">Conectando...</p>
      </div>
    )
  }

  if (!room) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-6">
        <p className="text-red-400">Sala no encontrada</p>
        <button className="btn-ghost" onClick={() => navigate('/')}>Volver</button>
      </div>
    )
  }

  const blinds = currentBlinds(room)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 text-center px-4 pt-5 pb-3 bg-felt-900">
        <p className="label-sm">Código de sala</p>
        <div className="flex items-center justify-center gap-3 mt-1">
          <h1 className="text-5xl font-casino font-bold text-gold-400 tracking-[0.35em]">
            {roomCode}
          </h1>
          <button
            onClick={copyCode}
            className="flex flex-col items-center gap-0.5 active:scale-95 transition-transform"
            title="Copiar código"
          >
            <span className="text-2xl">{copied ? '✅' : '📋'}</span>
            <span className={`text-[10px] font-semibold ${copied ? 'text-green-400' : 'text-gray-500'}`}>
              {copied ? '¡Copiado!' : 'Copiar'}
            </span>
          </button>
        </div>
        <p className="text-gray-500 text-xs mt-1">{players.length} jugador{players.length !== 1 ? 'es' : ''}</p>
      </div>

      {/* QR toggle */}
      <div className="flex-shrink-0 flex justify-center pb-3">
        <button
          className="flex items-center gap-2 text-sm text-gold-500 border border-gold-700 rounded-xl px-4 py-2"
          onClick={() => setShowQR((v) => !v)}
        >
          {showQR ? 'Ocultar QR' : 'Mostrar QR para escanear'}
        </button>
      </div>

      {showQR && (
        <div className="flex-shrink-0 flex justify-center pb-3">
          <div className="bg-white rounded-2xl p-3">
            <QRCodeSVG value={joinUrl} size={180} />
          </div>
        </div>
      )}

      {/* Config summary */}
      <div className="flex-shrink-0 card-felt mx-4 mb-3 px-4 py-3">
        <div className="flex justify-around text-center">
          <Stat label="Fichas" value={formatChips(room.config?.startingChips)} />
          <div className="w-px bg-felt-600" />
          <Stat
            label="Nivel 1"
            value={`${blinds.small}/${blinds.big}`}
          />
          <div className="w-px bg-felt-600" />
          <Stat
            label="Ciegas"
            value={room.config?.blindIncreaseMinutes === 0 ? 'Manual' : `${room.config?.blindIncreaseMinutes}min`}
          />
        </div>
        <div className="mt-2 border-t border-felt-600 pt-2">
          <p className="label-sm mb-1">Estructura de ciegas</p>
          <div className="flex gap-1 flex-wrap">
            {(room.config?.blindLevels || []).map((l, i) => (
              <span key={i} className="text-xs bg-felt-700 text-gray-300 rounded px-1.5 py-0.5">
                {l.small}/{l.big}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Players list */}
      <div className="flex-1 overflow-y-auto px-4 space-y-2">
        {players.map((p, i) => (
          <div key={p.id} className="card-felt px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-felt-600 flex items-center justify-center text-gold-400 font-bold text-sm">
                {i + 1}
              </div>
              <span className="font-semibold">{p.name}</span>
              {p.id === room.host && (
                <span className="text-[10px] text-gold-500 border border-gold-700 rounded px-1 py-0.5">dealer</span>
              )}
              {p.id === playerId && <span className="text-[10px] text-gray-500">(tú)</span>}
            </div>
            <span className="text-gold-400 font-semibold">{formatChips(p.chips)}</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 px-4 pb-6 pt-3 bg-felt-900 border-t border-felt-600 space-y-3">
        {isHost ? (
          <>
            {players.length < 2 && (
              <p className="text-center text-gray-500 text-sm">
                Necesitas al menos 2 jugadores para iniciar
              </p>
            )}
            <button
              className="btn-gold w-full text-lg py-4 disabled:opacity-40"
              onClick={() => startGame(roomCode)}
              disabled={players.length < 2}
            >
              ¡Iniciar partida!
            </button>
          </>
        ) : (
          <p className="text-center text-gray-400 text-sm py-2">
            Esperando a que el dealer inicie la partida…
          </p>
        )}
        <button
          className="w-full py-2 text-sm text-red-800 border border-red-900 rounded-xl active:bg-red-950 transition-colors"
          onClick={() => setShowLeaveConfirm(true)}
        >
          Abandonar partida
        </button>
      </div>

      <ConfirmModal
        isOpen={showLeaveConfirm}
        title="¿Abandonar la partida?"
        message={
          isHost
            ? 'Eres el dealer de esta sala. Si abandonas, la sala quedará sin host y el resto de jugadores no podrán continuar.'
            : '¿Seguro que quieres abandonar? Podrás volver a unirte mientras la sala siga activa.'
        }
        confirmLabel="Abandonar"
        onConfirm={() => navigate('/')}
        onCancel={() => setShowLeaveConfirm(false)}
      />
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div>
      <p className="chip-display text-base">{value}</p>
      <p className="label-sm">{label}</p>
    </div>
  )
}
