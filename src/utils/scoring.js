export const computePoints = (predictedHome, predictedAway, realHome, realAway) => {
  if (predictedHome === realHome && predictedAway === realAway) return 3
  const predOutcome = predictedHome > predictedAway ? 'H' : predictedHome < predictedAway ? 'A' : 'D'
  const realOutcome = realHome > realAway ? 'H' : realHome < realAway ? 'A' : 'D'
  return predOutcome === realOutcome ? 1 : 0
}

export const STAGE_LABELS = {
  group: 'Fase de Grupos',
  round_of_32: 'Octavos de Final',
  round_of_16: 'Dieciseisavos',
  quarterfinal: 'Cuartos de Final',
  semifinal: 'Semifinal',
  third_place: 'Tercer Puesto',
  final: 'Final',
}

export const STAGE_ORDER = [
  'group',
  'round_of_32',
  'round_of_16',
  'quarterfinal',
  'semifinal',
  'third_place',
  'final',
]

export const getDeadline = (matchDate) => {
  const d = matchDate instanceof Date ? matchDate : matchDate.toDate()
  return new Date(d.getTime() - 10 * 60 * 1000)
}

export const isPredictionOpen = (matchDate) => {
  const deadline = getDeadline(matchDate)
  return new Date() < deadline
}

export const formatLocalDate = (matchDate) => {
  const d = matchDate instanceof Date ? matchDate : matchDate.toDate()
  return d.toLocaleDateString('es-AR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const pointsLabel = (pts) => {
  if (pts === null || pts === undefined) return '—'
  if (pts === 3) return '✅ 3 pts'
  if (pts === 1) return '🟡 1 pt'
  return '❌ 0 pts'
}
