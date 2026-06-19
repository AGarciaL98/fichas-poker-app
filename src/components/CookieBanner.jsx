import { useState } from 'react'
import { Link } from 'react-router-dom'

const STORAGE_KEY = 'cookie_consent'

export default function CookieBanner() {
  const [accepted, setAccepted] = useState(() => !!localStorage.getItem(STORAGE_KEY))

  if (accepted) return null

  function accept() {
    localStorage.setItem(STORAGE_KEY, 'accepted')
    setAccepted(true)
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-felt-800 border-t border-felt-600 px-4 py-4 shadow-2xl max-w-md mx-auto">
      <p className="text-xs text-gray-400 mb-3 leading-relaxed">
        Usamos cookies propias y de terceros (Google AdSense) para mostrarte publicidad personalizada.
        Al continuar aceptas su uso.{' '}
        <Link to="/cookies" className="text-gold-400 underline underline-offset-2">
          Política de cookies
        </Link>
      </p>
      <button className="btn-gold w-full py-2 text-sm" onClick={accept}>
        Aceptar y continuar
      </button>
    </div>
  )
}
