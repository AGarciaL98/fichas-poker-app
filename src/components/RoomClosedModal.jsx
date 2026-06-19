export default function RoomClosedModal({ onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-6">
      <div className="card-felt px-6 py-8 w-full max-w-sm text-center space-y-4">
        <span className="text-4xl">🔒</span>
        <h2 className="text-lg font-bold text-white">Mesa cerrada</h2>
        <p className="text-gray-400 text-sm leading-relaxed">
          El host ha abandonado la sala y la mesa ha sido cerrada.
        </p>
        <button className="btn-gold w-full text-base" onClick={onConfirm}>
          Volver al inicio
        </button>
      </div>
    </div>
  )
}
