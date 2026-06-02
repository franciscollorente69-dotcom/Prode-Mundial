import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { subscribePredictionsByUser, subscribeMatches } from '../firebase/firestore'
import { STAGE_LABELS, STAGE_ORDER, formatLocalDate, pointsLabel } from '../utils/scoring'
import LoadingSpinner from '../components/LoadingSpinner'

export default function MyPredictionsPage() {
  const { user, profile } = useAuth()
  const [predictions, setPredictions] = useState([])
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    const u1 = subscribeMatches((data) => {
      setMatches(data)
      setLoading(false)
    })
    const u2 = subscribePredictionsByUser(user.uid, setPredictions)
    return () => { u1(); u2() }
  }, [user])

  const matchMap = useMemo(() => {
    const m = {}
    for (const match of matches) m[match.id] = match
    return m
  }, [matches])

  const enriched = useMemo(() => {
    return predictions
      .map((p) => ({ ...p, match: matchMap[p.matchId] }))
      .filter((p) => p.match)
      .sort((a, b) => a.match.matchNumber - b.match.matchNumber)
  }, [predictions, matchMap])

  const filtered = useMemo(() => {
    if (filter === 'all') return enriched
    if (filter === 'pending') return enriched.filter((p) => !p.match.isFinished)
    if (filter === 'done') return enriched.filter((p) => p.match.isFinished)
    return enriched
  }, [enriched, filter])

  const stats = useMemo(() => {
    const done = enriched.filter((p) => p.match.isFinished && p.pointsEarned !== null)
    return {
      total: enriched.length,
      exact: done.filter((p) => p.pointsEarned === 3).length,
      result: done.filter((p) => p.pointsEarned === 1).length,
      wrong: done.filter((p) => p.pointsEarned === 0).length,
      totalPts: done.reduce((s, p) => s + p.pointsEarned, 0),
    }
  }, [enriched])

  if (loading) return <LoadingSpinner />

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24">
      <h1 className="text-xl font-black text-white mb-4">Mis Pronósticos</h1>

      {/* Stats strip */}
      <div className="grid grid-cols-4 gap-2 mb-5">
        {[
          { label: 'Total', value: stats.total, color: 'text-white' },
          { label: '✅ Exacto', value: stats.exact, color: 'text-green-400' },
          { label: '🟡 Resultado', value: stats.result, color: 'text-yellow-400' },
          { label: '❌ Error', value: stats.wrong, color: 'text-red-400' },
        ].map((s) => (
          <div key={s.label} className="bg-gray-900 rounded-xl border border-gray-800 p-3 text-center">
            <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5 leading-tight">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Total points banner */}
      <div className="bg-gradient-to-r from-green-900/40 to-green-800/20 border border-green-700/30 rounded-2xl p-4 mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs text-green-400/80 font-medium uppercase tracking-wide">Puntos totales</p>
          <p className="text-3xl font-black text-white mt-0.5">{profile?.totalPoints ?? 0}</p>
        </div>
        <span className="text-4xl">🏅</span>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        {[
          { key: 'all', label: 'Todos' },
          { key: 'pending', label: 'Pendientes' },
          { key: 'done', label: 'Jugados' },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${
              filter === f.key
                ? 'bg-green-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-600">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-sm">
            {filter === 'all'
              ? 'Todavía no hiciste pronósticos. ¡Andá a los partidos!'
              : 'No hay pronósticos en esta categoría.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((p) => {
            const match = p.match
            const matchDate = match.matchDate?.toDate ? match.matchDate.toDate() : new Date(match.matchDate)
            return (
              <div
                key={p.id}
                className={`bg-gray-900 rounded-xl border p-4 ${
                  match.isFinished ? 'border-gray-700/50' : 'border-gray-800'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500">
                    {STAGE_LABELS[match.stage]}
                    {match.group ? ` · Grupo ${match.group}` : ''} · #{match.matchNumber}
                  </span>
                  <span className="text-xs text-gray-500">{formatLocalDate(matchDate)}</span>
                </div>

                <div className="flex items-center gap-3">
                  {/* Teams */}
                  <div className="flex-1 flex items-center gap-2">
                    <span className="text-xl">{match.homeFlag}</span>
                    <span className="text-sm font-medium text-gray-200 truncate">{match.homeTeam}</span>
                  </div>

                  {/* Scores */}
                  <div className="flex flex-col items-center gap-0.5 min-w-[120px]">
                    {match.isFinished && (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-500">Real:</span>
                        <span className="text-sm font-black text-white">
                          {match.homeScore} - {match.awayScore}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-500">Pron.:</span>
                      <span className={`text-sm font-bold ${match.isFinished ? 'text-gray-400' : 'text-green-300'}`}>
                        {p.predictedHome} - {p.predictedAway}
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 flex items-center justify-end gap-2">
                    <span className="text-sm font-medium text-gray-200 truncate text-right">{match.awayTeam}</span>
                    <span className="text-xl">{match.awayFlag}</span>
                  </div>
                </div>

                {match.isFinished && (
                  <div className="mt-2 pt-2 border-t border-gray-800 flex justify-end">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      p.pointsEarned === 3
                        ? 'bg-green-500/20 text-green-400'
                        : p.pointsEarned === 1
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : p.pointsEarned === 0
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-gray-800 text-gray-500'
                    }`}>
                      {pointsLabel(p.pointsEarned)}
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
