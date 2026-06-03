import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { subscribeMatches, subscribePredictionsByUser, subscribePrize } from '../firebase/firestore'
import MatchCard from '../components/MatchCard'
import LoadingSpinner from '../components/LoadingSpinner'
import { STAGE_LABELS, STAGE_ORDER, isPredictionOpen } from '../utils/scoring'

const GROUP_LABELS = 'ABCDEFGHIJKL'.split('')

// Return a comparable local-date key "YYYY-MM-DD" using the browser's timezone
function localDateKey(matchDate) {
  const d = matchDate instanceof Date ? matchDate : matchDate?.toDate?.() ?? new Date(matchDate)
  return (
    d.getFullYear() +
    '-' + String(d.getMonth() + 1).padStart(2, '0') +
    '-' + String(d.getDate()).padStart(2, '0')
  )
}

function formatDayHeading(dateKey) {
  // dateKey is "YYYY-MM-DD" in local TZ — parse as local midnight
  const [y, mo, dd] = dateKey.split('-').map(Number)
  const d = new Date(y, mo - 1, dd)
  return d.toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

export default function HomePage() {
  const { user } = useAuth()
  const [matches, setMatches] = useState([])
  const [predictions, setPredictions] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeStage, setActiveStage] = useState('group')
  const [activeGroup, setActiveGroup] = useState('A')
  const [prize, setPrize] = useState(null)

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

  useEffect(() => {
    const unsub = subscribePrize(setPrize)
    return unsub
  }, [])

  const predMap = useMemo(() => {
    const m = {}
    for (const p of predictions) m[p.matchId] = p
    return m
  }, [predictions])

  // ── Next-matchday logic ────────────────────────────────────────────────────
  // Find all open (deadline not passed, not finished) matches that have no
  // prediction yet, grouped by local calendar date. Return the matches
  // belonging to the earliest such date.
  const { nextDayMatches, nextDayLabel, allPredicted } = useMemo(() => {
    // Collect every open match without a prediction
    const open = matches.filter((m) => {
      if (m.isFinished) return false
      const matchDate = m.matchDate?.toDate ? m.matchDate.toDate() : new Date(m.matchDate)
      if (!isPredictionOpen(matchDate)) return false // deadline already passed
      if (predMap[m.id]) return false // already predicted
      return true
    })

    // Check if there are upcoming matches at all (open OR closed, not finished)
    const hasUpcoming = matches.some((m) => {
      if (m.isFinished) return false
      const matchDate = m.matchDate?.toDate ? m.matchDate.toDate() : new Date(m.matchDate)
      return matchDate > new Date()
    })

    if (open.length === 0) {
      return {
        nextDayMatches: [],
        nextDayLabel: '',
        allPredicted: hasUpcoming, // true only when upcoming matches exist but all predicted
      }
    }

    // Group by local calendar date key
    const byDate = {}
    for (const m of open) {
      const matchDate = m.matchDate?.toDate ? m.matchDate.toDate() : new Date(m.matchDate)
      const key = localDateKey(matchDate)
      if (!byDate[key]) byDate[key] = []
      byDate[key].push(m)
    }

    // Pick the earliest date
    const nearestKey = Object.keys(byDate).sort()[0]
    const dayMatches = byDate[nearestKey].sort((a, b) => {
      const da = a.matchDate?.toDate ? a.matchDate.toDate() : new Date(a.matchDate)
      const db_ = b.matchDate?.toDate ? b.matchDate.toDate() : new Date(b.matchDate)
      return da - db_
    })

    return {
      nextDayMatches: dayMatches,
      nextDayLabel: formatDayHeading(nearestKey),
      allPredicted: false,
    }
  }, [matches, predMap])

  // ── Browse-all tabs ────────────────────────────────────────────────────────
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

      {/* ── Prize banner ── */}
      {prize !== null && prize > 0 && (
        <div className="bg-gradient-to-r from-yellow-900/40 to-yellow-800/20 border border-yellow-600/30 rounded-2xl px-4 py-3 mb-5 flex items-center gap-3">
          <span className="text-2xl">🏆</span>
          <div>
            <p className="text-xs text-yellow-500/80 font-medium uppercase tracking-wide">Premio acumulado</p>
            <p className="text-xl font-black text-yellow-400">${prize.toLocaleString('es-AR')}</p>
          </div>
        </div>
      )}

      {/* ── PRÓXIMOS PARTIDOS PARA PRONOSTICAR ── */}
      <section className="mb-7">
        <h2 className="text-sm font-black text-white uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="text-green-400">⚡</span> Próximos partidos para pronosticar
        </h2>

        {allPredicted ? (
          // All upcoming open matches have predictions
          <div className="bg-green-500/10 border border-green-500/30 rounded-2xl px-4 py-5 flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <p className="text-sm font-semibold text-green-300">
              ¡Ya pronosticaste todos los partidos próximos!
            </p>
          </div>
        ) : nextDayMatches.length === 0 ? (
          // No upcoming matches (tournament hasn't started or all finished)
          <div className="bg-gray-900 border border-gray-800 rounded-2xl px-4 py-5 text-center">
            <p className="text-2xl mb-2">⚽</p>
            <p className="text-sm text-gray-500">No hay partidos próximos disponibles.</p>
          </div>
        ) : (
          <>
            {/* Date heading */}
            <div className="flex items-center gap-3 mb-3">
              <span className="text-xs font-bold text-green-400 bg-green-400/10 border border-green-400/20 px-3 py-1 rounded-full capitalize">
                {nextDayLabel}
              </span>
              <span className="text-xs text-gray-500">
                {nextDayMatches.length} partido{nextDayMatches.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Match cards */}
            <div className="flex flex-col gap-3">
              {nextDayMatches.map((m) => (
                <MatchCard key={m.id} match={m} prediction={predMap[m.id] ?? null} />
              ))}
            </div>
          </>
        )}
      </section>

      {/* ── DIVIDER ── */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-px bg-gray-800" />
        <span className="text-xs text-gray-600 font-medium uppercase tracking-widest">Todos los partidos</span>
        <div className="flex-1 h-px bg-gray-800" />
      </div>

      {/* ── Stage tabs ── */}
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

      {/* ── Group tabs ── */}
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

      {/* ── Section header ── */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-white uppercase tracking-wide">
          {activeStage === 'group' ? `Grupo ${activeGroup}` : STAGE_LABELS[activeStage]}
        </h2>
        <span className="text-xs text-gray-500">{filtered.length} partidos</span>
      </div>

      {/* ── Match cards (browse all) ── */}
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
