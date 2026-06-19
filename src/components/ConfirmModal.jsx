export default function ConfirmModal({ isOpen, title, message, confirmLabel = 'Confirmar', onConfirm, onCancel }) {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 px-0 pb-0">
      <div className="bg-felt-800 border border-felt-600 rounded-t-2xl p-6 w-full max-w-md">
        <h2 className="text-base font-bold text-white mb-1">{title}</h2>
        {message && <p className="text-gray-400 text-sm mb-5 leading-relaxed">{message}</p>}
        <div className="flex gap-3">
          <button className="flex-1 btn-ghost py-3 text-sm" onClick={onCancel}>Cancelar</button>
          <button className="flex-1 btn-danger py-3 text-sm" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}
