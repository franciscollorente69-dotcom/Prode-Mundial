import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { subscribeMatches, subscribePredictionsByUser } from '../firebase/firestore'
import MatchCard from '../components/MatchCard'
import LoadingSpinner from '../components/LoadingSpinner'
import { STAGE_LABELS, STAGE_ORDER } from '../utils/scoring'

const GROUP_LABELS = 'ABCDEFGHIJKLMNOP'.split('')

export default function HomePage() {
  const { user } = useAuth()
  const [matches, setMatches] = useState([])
  const [predictions, setPredictions] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeStage, setActiveStage] = useState('group')
  const [activeGroup, setActiveGroup] = useState('A')

  useEffect(() => {
    const unsub = subscribeMatches((data) => {
      setMatches(data)
      setLoading(false)
    })
    return unsub
  }, [])

  useEffect(() => {
    if (!user) return
    const unsub = subscribePredictionsByUser(user.uid, setPredictions)
    return unsub
  }, [user])

  const predMap = useMemo(() => {
    const m = {}
    for (const p of predictions) m[p.matchId] = p
    return m
  }, [predictions])

  const stages = useMemo(() => {
    const found = new Set(matches.map((m) => m.stage))
    return STAGE_ORDER.filter((s) => found.has(s))
  }, [matches])

  const groups = useMemo(() => {
    if (activeStage !== 'group') return []
    const found = new Set(matches.filter((m) => m.stage === 'group').map((m) => m.group))
    return GROUP_LABELS.filter((g) => found.has(g))
  }, [matches, activeStage])

  const filtered = useMemo(() => {
    if (activeStage === 'group') {
      return matches.filter((m) => m.stage === 'group' && m.group === activeGroup)
    }
    return matches.filter((m) => m.stage === activeStage)
  }, [matches, activeStage, activeGroup])

  if (loading) return <LoadingSpinner />

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24">
      {/* Stage tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
        {stages.map((s) => (
          <button
            key={s}
            onClick={() => {
              setActiveStage(s)
              if (s === 'group') setActiveGroup('A')
            }}
            className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${
              activeStage === s
                ? 'bg-green-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            {STAGE_LABELS[s]}
          </button>
        ))}
      </div>

      {/* Group tabs (only for group stage) */}
      {activeStage === 'group' && groups.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto pb-3 mb-4 scrollbar-hide">
          {groups.map((g) => (
            <button
              key={g}
              onClick={() => setActiveGroup(g)}
              className={`flex-shrink-0 w-9 h-9 rounded-full text-xs font-bold transition-all ${
                activeGroup === g
                  ? 'bg-green-600 text-white shadow-lg shadow-green-900/40'
                  : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      )}

      {/* Section header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-white uppercase tracking-wide">
          {activeStage === 'group'
            ? `Grupo ${activeGroup}`
            : STAGE_LABELS[activeStage]}
        </h2>
        <span className="text-xs text-gray-500">{filtered.length} partidos</span>
      </div>

      {/* Match cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-600">
          <p className="text-4xl mb-3">⚽</p>
          <p className="text-sm">No hay partidos en esta fase todavía.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((m) => (
            <MatchCard key={m.id} match={m} prediction={predMap[m.id] ?? null} />
          ))}
        </div>
      )}
    </div>
  )
}
