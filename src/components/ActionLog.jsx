import { formatChips } from '../lib/gameLogic'

const ACTION_ICONS = {
  fold: '✗',
  call: '=',
  check: '✓',
  raise: '↑',
  bet: '↑',
  allin: '★',
  win: '🏆',
}

const ACTION_COLOR = {
  fold: 'text-red-400',
  call: 'text-blue-400',
  check: 'text-gray-400',
  raise: 'text-gold-400',
  bet: 'text-gold-400',
  allin: 'text-yellow-400',
  win: 'text-green-400',
}

export default function ActionLog({ room }) {
  const last = room?.hand?.lastAction

  if (!last) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-600 text-sm">La mano comenzará pronto</p>
      </div>
    )
  }

  const icon = ACTION_ICONS[last.action] || '•'
  const color = ACTION_COLOR[last.action] || 'text-gray-400'

  const label = {
    fold: 'se retira',
    call: `iguala ${formatChips(last.amount)}`,
    check: 'pasa',
    raise: `sube a ${formatChips(last.amount)}`,
    bet: `apuesta ${formatChips(last.amount)}`,
    allin: 'va ALL-IN',
    win: `gana ${formatChips(last.amount)}`,
  }[last.action] || last.action

  return (
    <div className="flex items-center justify-center h-full">
      <div className="card-felt px-5 py-3 flex items-center gap-3">
        <span className={`text-2xl ${color}`}>{icon}</span>
        <div>
          <p className="font-bold text-white">{last.playerName}</p>
          <p className={`text-sm ${color}`}>{label}</p>
        </div>
      </div>
    </div>
  )
}
