import { formatChips } from '../lib/gameLogic'

// Pantalla de fin de partida: se muestra a todos cuando queda un solo jugador con fichas.
export default function WinnerModal({ winner, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 px-6">
      <div className="card-felt px-6 py-8 w-full max-w-sm text-center space-y-4">
        <span className="text-5xl">🏆</span>
        <p className="label-sm">Fin de la partida</p>
        <h2 className="text-2xl font-casino font-bold text-gold-400 break-words leading-tight">
          {winner?.name ? `¡Gana ${winner.name}!` : '¡Partida terminada!'}
        </h2>
        {winner?.chips != null && (
          <p className="text-gray-300 text-sm">
            Se lleva todas las fichas: <span className="text-gold-400 font-bold">{formatChips(winner.chips)}</span>
          </p>
        )}
        <button className="btn-gold w-full text-base" onClick={onConfirm}>
          Volver al inicio
        </button>
      </div>
    </div>
  )
}
