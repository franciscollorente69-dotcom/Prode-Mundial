import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { savePrediction, getPredictionsForMatches, getUsers } from '../firebase/firestore'
import { isPredictionOpen, formatLocalDate, pointsLabel } from '../utils/scoring'
import CountdownTimer from './CountdownTimer'

export default function MatchCard({ match, prediction }) {
  const { user } = useAuth()
  const [home, setHome] = useState(prediction?.predictedHome ?? '')
  const [away, setAway] = useState(prediction?.predictedAway ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showAllPreds, setShowAllPreds] = useState(false)
  const [allPreds, setAllPreds] = useState(null)  // null = not loaded yet
  const [allPredsLoading, setAllPredsLoading] = useState(false)

  const matchDate = match.matchDate?.toDate ? match.matchDate.toDate() : new Date(match.matchDate)
  const open = isPredictionOpen(matchDate)
  const hasPrediction = prediction !== undefined && prediction !== null
  const isFinished = match.isFinished

  const handleSave = async () => {
    if (home === '' || away === '') return
    if (!open) return
    setSaving(true)
    try {
      await savePrediction(user.uid, match.id, Number(home), Number(away))
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  const handleToggleAllPreds = async () => {
    if (showAllPreds) { setShowAllPreds(false); return }
    setShowAllPreds(true)
    if (allPreds !== null) return
    setAllPredsLoading(true)
    try {
      const [preds, users] = await Promise.all([
        getPredictionsForMatches([match.id]),
        getUsers(),
      ])
      const userMap = Object.fromEntries(users.map((u) => [u.uid, u]))
      const rows = preds
        .map((p) => ({
          ...p,
          displayName: userMap[p.userId]?.displayName || userMap[p.userId]?.username || '?',
          username: userMap[p.userId]?.username || '',
        }))
        .sort((a, b) => (b.pointsEarned ?? -1) - (a.pointsEarned ?? -1))
      setAllPreds(rows)
    } finally {
      setAllPredsLoading(false)
    }
  }

  const scoreChanged = hasPrediction
    ? (Number(home) !== prediction.predictedHome || Number(away) !== prediction.predictedAway)
    : (home !== '' || away !== '')

  return (
    <div className={`relative rounded-2xl border overflow-hidden transition-all ${
      isFinished
        ? 'bg-gray-900/60 border-gray-700/50'
        : open
        ? 'bg-gray-900 border-gray-700 hover:border-gray-600'
        : 'bg-gray-900/40 border-gray-800/50'
    }`}>
      {/* Match number + date */}
      <div className="px-4 pt-3 pb-1 flex items-center justify-between">
        <span className="text-xs text-gray-500">Partido #{match.matchNumber}</span>
        <div className="flex items-center gap-2">
          {open && !isFinished && <CountdownTimer matchDate={matchDate} />}
          <span className="text-xs text-gray-500">{formatLocalDate(matchDate)}</span>
        </div>
      </div>

      {/* Teams + Score */}
      <div className="px-4 py-3 flex items-center gap-3">
        {/* Home team */}
        <div className="flex-1 flex flex-col items-center gap-1">
          <span className="text-3xl">{match.homeFlag}</span>
          <span className="text-xs font-medium text-gray-200 text-center leading-tight">{match.homeTeam}</span>
        </div>

        {/* Score / VS */}
        <div className="flex flex-col items-center gap-1 min-w-[80px]">
          {isFinished ? (
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-white">{match.homeScore}</span>
              <span className="text-gray-500 text-lg">-</span>
              <span className="text-2xl font-black text-white">{match.awayScore}</span>
            </div>
          ) : (
            <span className="text-lg font-bold text-gray-600">VS</span>
          )}
          {!isFinished && !open && (
            <span className="text-xs text-red-400/80 font-medium">Cerrado</span>
          )}
        </div>

        {/* Away team */}
        <div className="flex-1 flex flex-col items-center gap-1">
          <span className="text-3xl">{match.awayFlag}</span>
          <span className="text-xs font-medium text-gray-200 text-center leading-tight">{match.awayTeam}</span>
        </div>
      </div>

      {/* Prediction section */}
      {user && (
        <div className={`px-4 pb-3 border-t border-gray-800 pt-3 ${!open && !isFinished ? 'opacity-50' : ''}`}>
          {isFinished ? (
            // Show own result + toggle all predictions
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">Tu pronóstico:</span>
                  {hasPrediction ? (
                    <span className="text-sm font-bold text-white">
                      {prediction.predictedHome} - {prediction.predictedAway}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-600 italic">Sin pronóstico</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {hasPrediction && (
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      prediction.pointsEarned === 3
                        ? 'bg-green-500/20 text-green-400'
                        : prediction.pointsEarned === 1
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : prediction.pointsEarned === 0
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-gray-800 text-gray-400'
                    }`}>
                      {pointsLabel(prediction.pointsEarned)}
                    </span>
                  )}
                  <button
                    onClick={handleToggleAllPreds}
                    className="text-xs text-gray-500 hover:text-green-400 transition-colors underline underline-offset-2"
                  >
                    {showAllPreds ? 'Ocultar' : 'Ver todos'}
                  </button>
                </div>
              </div>

              {showAllPreds && (
                <div className="mt-3 border-t border-gray-800 pt-3">
                  {allPredsLoading ? (
                    <p className="text-xs text-gray-500 text-center py-2">Cargando...</p>
                  ) : allPreds?.length === 0 ? (
                    <p className="text-xs text-gray-600 text-center py-2">Nadie pronosticó este partido.</p>
                  ) : (
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-gray-600 text-left border-b border-gray-800">
                          <th className="pb-1.5 font-semibold">Jugador</th>
                          <th className="pb-1.5 font-semibold text-center">Pronóstico</th>
                          <th className="pb-1.5 font-semibold text-center">Pts</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allPreds.map((p) => (
                          <tr key={p.id} className="border-b border-gray-800/40 last:border-0">
                            <td className="py-1.5 text-gray-300">{p.displayName}</td>
                            <td className="py-1.5 text-center font-bold text-white">
                              {p.predictedHome} - {p.predictedAway}
                            </td>
                            <td className="py-1.5 text-center">
                              <span className={`font-bold ${
                                p.pointsEarned === 3 ? 'text-green-400'
                                : p.pointsEarned === 1 ? 'text-yellow-400'
                                : 'text-red-400'
                              }`}>
                                {p.pointsEarned ?? '—'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </>
          ) : open ? (
            // Prediction input
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 flex-shrink-0">Tu pronóstico:</span>
              <div className="flex items-center gap-1.5 flex-1">
                <input
                  type="number"
                  min="0"
                  max="99"
                  value={home}
                  onChange={(e) => setHome(e.target.value)}
                  className="w-12 text-center bg-gray-800 border border-gray-700 rounded-lg py-1 text-white text-sm font-bold focus:outline-none focus:border-green-500"
                  placeholder="0"
                />
                <span className="text-gray-600 text-sm">-</span>
                <input
                  type="number"
                  min="0"
                  max="99"
                  value={away}
                  onChange={(e) => setAway(e.target.value)}
                  className="w-12 text-center bg-gray-800 border border-gray-700 rounded-lg py-1 text-white text-sm font-bold focus:outline-none focus:border-green-500"
                  placeholder="0"
                />
              </div>
              <button
                onClick={handleSave}
                disabled={saving || !scoreChanged || home === '' || away === ''}
                className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                  saved
                    ? 'bg-green-600 text-white'
                    : saving
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : scoreChanged && home !== '' && away !== ''
                    ? 'bg-green-600 hover:bg-green-500 text-white'
                    : 'bg-gray-800 text-gray-600 cursor-not-allowed'
                }`}
              >
                {saved ? '✓ Guardado' : saving ? '...' : hasPrediction ? 'Actualizar' : 'Guardar'}
              </button>
            </div>
          ) : (
            // Closed — show last prediction
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Tu pronóstico:</span>
              {hasPrediction ? (
                <span className="text-sm font-bold text-gray-400">
                  {prediction.predictedHome} - {prediction.predictedAway}
                </span>
              ) : (
                <span className="text-xs text-gray-600 italic">Sin pronóstico</span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
