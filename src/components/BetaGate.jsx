import { useState } from 'react'

const ACCESS_CODE = '0000'
const STORAGE_KEY = 'beta_unlocked'

const EMPTY_TAPS_TO_UNLOCK = 3
const EMPTY_TAPS_WINDOW_MS = 5000

export default function BetaGate({ children }) {
  const [unlocked, setUnlocked] = useState(() => localStorage.getItem(STORAGE_KEY) === 'true')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [emptyTaps, setEmptyTaps] = useState([])

  if (unlocked) return children

  function unlock() {
    localStorage.setItem(STORAGE_KEY, 'true')
    setUnlocked(true)
  }

  function handleSubmit(e) {
    e.preventDefault()

    if (code === '') {
      const now = Date.now()
      const recentTaps = [...emptyTaps, now].filter((t) => now - t < EMPTY_TAPS_WINDOW_MS)
      if (recentTaps.length >= EMPTY_TAPS_TO_UNLOCK) {
        unlock()
        return
      }
      setEmptyTaps(recentTaps)
      setError('Por favor introduce el código')
      return
    }

    if (code === ACCESS_CODE) {
      unlock()
    } else {
      setError('Código incorrecto')
    }
  }

  return (
    <div className="h-full w-full flex flex-col items-center justify-center bg-felt-900 px-6 text-center gap-6">
      <div>
        <h1 className="text-2xl font-casino font-bold text-gold-400 tracking-wide">
          App en desarrollo
        </h1>
        <p className="text-gray-400 text-sm mt-2 leading-relaxed">
          Estamos preparando algo grande — introduce tu código de acceso.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-xs flex flex-col gap-3">
        <input
          className="input-field text-center"
          type="password"
          placeholder="Código de acceso"
          value={code}
          onChange={(e) => { setCode(e.target.value); setError('') }}
          autoFocus
        />
        {error && (
          <p className="text-red-400 text-xs">{error}</p>
        )}
        <button type="submit" className="btn-gold w-full">
          Entrar
        </button>
      </form>
    </div>
  )
}
