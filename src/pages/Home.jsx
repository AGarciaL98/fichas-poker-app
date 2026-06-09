import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { generateRoomCode, getOrCreatePlayerId, DEFAULT_BLIND_LEVELS } from '../lib/gameLogic'
import { createRoom, joinRoom } from '../hooks/useRoom'

const SUIT_ICONS = ['♠', '♥', '♦', '♣']

const PRESET_STRUCTURES = {
  rapida: [
    { small: 25, big: 50 },
    { small: 50, big: 100 },
    { small: 100, big: 200 },
    { small: 200, big: 400 },
  ],
  normal: DEFAULT_BLIND_LEVELS,
  larga: [
    { small: 10, big: 20 },
    { small: 15, big: 30 },
    { small: 25, big: 50 },
    { small: 50, big: 100 },
    { small: 75, big: 150 },
    { small: 100, big: 200 },
    { small: 150, big: 300 },
    { small: 200, big: 400 },
    { small: 300, big: 600 },
    { small: 500, big: 1000 },
    { small: 750, big: 1500 },
    { small: 1000, big: 2000 },
  ],
}

export default function Home() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [view, setView] = useState('home')
  const [name, setName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const [config, setConfig] = useState({
    startingChips: 3000,
    blindIncreaseMinutes: 20,
    blindLevels: [...DEFAULT_BLIND_LEVELS],
  })

  useEffect(() => {
    const code = searchParams.get('join')
    if (code) {
      setJoinCode(code.toUpperCase())
      setView('join')
    }
  }, [])

  // ── Blind levels helpers ─────────────────────────────────────────────────

  function updateLevel(idx, field, value) {
    const val = parseInt(value) || 0
    setConfig((c) => {
      const levels = [...c.blindLevels]
      levels[idx] = { ...levels[idx], [field]: val }
      return { ...c, blindLevels: levels }
    })
  }

  function addLevel() {
    setConfig((c) => {
      const last = c.blindLevels[c.blindLevels.length - 1] || { small: 25, big: 50 }
      return {
        ...c,
        blindLevels: [...c.blindLevels, { small: last.small * 2, big: last.big * 2 }],
      }
    })
  }

  function removeLevel(idx) {
    setConfig((c) => ({
      ...c,
      blindLevels: c.blindLevels.filter((_, i) => i !== idx),
    }))
  }

  function applyPreset(key) {
    setConfig((c) => ({ ...c, blindLevels: [...PRESET_STRUCTURES[key]] }))
  }

  // ── Actions ──────────────────────────────────────────────────────────────

  async function handleCreate() {
    if (!name.trim()) return setError('Escribe tu nombre')
    if (config.blindLevels.length === 0) return setError('Añade al menos un nivel de ciegas')
    setLoading(true)
    setError('')
    try {
      const code = generateRoomCode()
      const playerId = getOrCreatePlayerId()
      await createRoom(code, config, { id: playerId, name: name.trim() })
      navigate(`/lobby/${code}`)
    } catch (e) {
      setError(e.message)
    }
    setLoading(false)
  }

  async function handleJoin() {
    const code = joinCode.trim().toUpperCase()
    if (!name.trim()) return setError('Escribe tu nombre')
    if (code.length < 5) return setError('Código inválido (5 caracteres)')
    setLoading(true)
    setError('')
    try {
      const playerId = getOrCreatePlayerId()
      await joinRoom(code, { id: playerId, name: name.trim() })
      navigate(`/lobby/${code}`)
    } catch (e) {
      setError(e.message)
    }
    setLoading(false)
  }

  // ── Views ────────────────────────────────────────────────────────────────

  if (view === 'home') {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-6 p-6">
        <div className="text-center mb-4">
          <div className="text-5xl mb-3 flex justify-center gap-2">
            {SUIT_ICONS.map((s, i) => (
              <span key={i} className={i % 2 === 0 ? 'text-white' : 'text-red-500'}>{s}</span>
            ))}
          </div>
          <h1 className="text-3xl font-casino font-bold text-gold-400 tracking-wider">FichasPoker</h1>
          <p className="text-gray-400 text-sm mt-1">Póker con amigos, sin fichas físicas</p>
        </div>
        <div className="w-full flex flex-col gap-3">
          <button className="btn-gold w-full text-lg py-4" onClick={() => setView('create')}>
            Crear mesa
          </button>
          <button className="btn-ghost w-full text-lg py-4" onClick={() => setView('join')}>
            Unirse a mesa
          </button>
        </div>
      </div>
    )
  }

  if (view === 'join') {
    return (
      <div className="flex flex-col h-full p-6 gap-4 justify-center">
        <button onClick={() => { setView('home'); setError('') }} className="text-gray-400 text-sm self-start">
          ← Volver
        </button>
        <h2 className="text-xl font-bold text-gold-400">Unirse a mesa</h2>
        <div className="flex flex-col gap-4">
          <div>
            <label className="label-sm mb-1 block">Tu nombre</label>
            <input
              className="input-field"
              placeholder="¿Cómo te llamas?"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={20}
              autoFocus
            />
          </div>
          <div>
            <label className="label-sm mb-1 block">Código de sala</label>
            <input
              className="input-field text-2xl text-center tracking-[0.3em] uppercase"
              placeholder="XXXXX"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              maxLength={5}
            />
          </div>
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <button className="btn-gold w-full text-lg py-4 mt-2" onClick={handleJoin} disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </div>
      </div>
    )
  }

  // ── Create room view (full config) ────────────────────────────────────────
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Sticky header */}
      <div className="flex-shrink-0 px-4 pt-4 pb-2 bg-felt-900 border-b border-felt-600">
        <button onClick={() => { setView('home'); setError('') }} className="text-gray-400 text-sm mb-2 block">
          ← Volver
        </button>
        <h2 className="text-xl font-bold text-gold-400">Configurar mesa</h2>
      </div>

      {/* Scrollable config */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">

        {/* Nombre */}
        <Section title="Tu nombre (eres el dealer)">
          <input
            className="input-field"
            placeholder="¿Cómo te llamas?"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={20}
          />
        </Section>

        {/* Fichas iniciales */}
        <Section title="Fichas iniciales por jugador">
          <div className="flex gap-2 flex-wrap">
            {[1000, 2000, 3000, 5000, 10000].map((v) => (
              <Pill
                key={v}
                active={config.startingChips === v}
                onClick={() => setConfig((c) => ({ ...c, startingChips: v }))}
              >
                {v >= 1000 ? `${v / 1000}K` : v}
              </Pill>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Cada jugador empieza con <span className="text-gold-400">{config.startingChips.toLocaleString('es')}</span> fichas
          </p>
        </Section>

        {/* Ciegas iniciales */}
        <Section title="Ciegas iniciales">
          <p className="text-sm text-gray-400 mb-2">
            Primera mano: SB <span className="text-gold-400 font-bold">{config.blindLevels[0]?.small ?? '—'}</span>{' '}
            · BB <span className="text-gold-400 font-bold">{config.blindLevels[0]?.big ?? '—'}</span>
          </p>
        </Section>

        {/* Subida de ciegas */}
        <Section title="Subir ciegas cada…">
          <div className="flex gap-2 flex-wrap">
            {[0, 10, 15, 20, 30, 45].map((v) => (
              <Pill
                key={v}
                active={config.blindIncreaseMinutes === v}
                onClick={() => setConfig((c) => ({ ...c, blindIncreaseMinutes: v }))}
              >
                {v === 0 ? 'Manual' : `${v} min`}
              </Pill>
            ))}
          </div>
          {config.blindIncreaseMinutes === 0 && (
            <p className="text-xs text-gray-500 mt-1">El dealer sube las ciegas manualmente cuando quiera</p>
          )}
        </Section>

        {/* Estructura de ciegas */}
        <Section title="Estructura de ciegas">
          {/* Preset buttons */}
          <div className="flex gap-2 mb-3">
            {[['rapida', 'Rápida'], ['normal', 'Normal'], ['larga', 'Larga']].map(([k, label]) => (
              <button
                key={k}
                className="flex-1 py-1.5 rounded-lg border border-felt-600 text-xs text-gray-300 active:bg-felt-700"
                onClick={() => applyPreset(k)}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Levels table */}
          <div className="space-y-1.5">
            <div className="flex gap-2 px-1 mb-1">
              <span className="w-7 text-[10px] text-gray-500 text-center">#</span>
              <span className="flex-1 text-[10px] text-gray-500 text-center">Ciega pequeña</span>
              <span className="flex-1 text-[10px] text-gray-500 text-center">Ciega grande</span>
              <span className="w-7" />
            </div>

            {config.blindLevels.map((level, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="w-7 text-center text-xs text-gray-500">{idx + 1}</span>
                <input
                  type="number"
                  className="flex-1 bg-felt-800 border border-felt-600 rounded-lg px-2 py-2 text-white text-sm text-center focus:outline-none focus:border-gold-500"
                  value={level.small}
                  onChange={(e) => updateLevel(idx, 'small', e.target.value)}
                  min={1}
                />
                <input
                  type="number"
                  className="flex-1 bg-felt-800 border border-felt-600 rounded-lg px-2 py-2 text-white text-sm text-center focus:outline-none focus:border-gold-500"
                  value={level.big}
                  onChange={(e) => updateLevel(idx, 'big', e.target.value)}
                  min={1}
                />
                <button
                  className="w-7 h-7 flex items-center justify-center text-red-500 active:opacity-60"
                  onClick={() => removeLevel(idx)}
                  disabled={config.blindLevels.length === 1}
                >
                  ✕
                </button>
              </div>
            ))}

            <button
              className="w-full mt-2 py-2 border border-dashed border-felt-600 rounded-lg text-sm text-gray-400 active:bg-felt-800"
              onClick={addLevel}
            >
              + Añadir nivel
            </button>
          </div>
        </Section>
      </div>

      {/* Sticky footer */}
      <div className="flex-shrink-0 px-4 pb-6 pt-3 bg-felt-900 border-t border-felt-600">
        {error && <p className="text-red-400 text-sm text-center mb-2">{error}</p>}
        <button
          className="btn-gold w-full text-lg py-4"
          onClick={handleCreate}
          disabled={loading}
        >
          {loading ? 'Creando...' : 'Crear mesa y compartir código →'}
        </button>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div>
      <p className="label-sm mb-2">{title}</p>
      {children}
    </div>
  )
}

function Pill({ active, onClick, children }) {
  return (
    <button
      className={`px-4 py-2 rounded-lg border font-semibold text-sm transition-colors active:scale-95 ${
        active
          ? 'bg-gold-500 border-gold-400 text-black'
          : 'border-felt-600 text-gray-300 bg-felt-800'
      }`}
      onClick={onClick}
    >
      {children}
    </button>
  )
}
