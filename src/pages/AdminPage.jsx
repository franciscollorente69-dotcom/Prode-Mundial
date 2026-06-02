import { useEffect, useState, useMemo } from 'react'
import { subscribeMatches, updateMatchResult, calculateAndSavePoints, updateKnockoutMatch, deleteAllMatches } from '../firebase/firestore'
import { seedMatches } from '../firebase/seedData'
import { STAGE_LABELS, STAGE_ORDER } from '../utils/scoring'
import LoadingSpinner from '../components/LoadingSpinner'

export default function AdminPage() {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeStage, setActiveStage] = useState('group')
  const [seeding, setSeeding] = useState(false)
  const [seedMsg, setSeedMsg] = useState('')
  const [scores, setScores] = useState({})
  const [saving, setSaving] = useState({})
  const [calculating, setCalculating] = useState({})

  useEffect(() => {
    const unsub = subscribeMatches((data) => {
      setMatches(data)
      setLoading(false)
      const init = {}
      for (const m of data) {
        init[m.id] = {
          home: m.homeScore ?? '',
          away: m.awayScore ?? '',
          homeTeam: m.homeTeam,
          awayTeam: m.awayTeam,
          homeFlag: m.homeFlag,
          awayFlag: m.awayFlag,
        }
      }
      setScores((prev) => ({ ...init, ...prev }))
    })
    return unsub
  }, [])

  const [deleting, setDeleting] = useState(false)

  const handleSeed = async () => {
    if (!window.confirm('¿Cargar los 72 partidos de la fase de grupos (12 grupos × 6 partidos) + knockouts? Esto no se puede deshacer.')) return
    setSeeding(true)
    setSeedMsg('')
    try {
      const result = await seedMatches()
      setSeedMsg(`✅ ${result.groupStage} partidos de grupos + ${result.knockout} knockouts = ${result.total} en total.`)
    } catch (e) {
      setSeedMsg(`❌ Error: ${e.message}`)
    } finally {
      setSeeding(false)
    }
  }

  const handleDeleteAll = async () => {
    if (!window.confirm('⚠️ ¿ELIMINAR TODOS los partidos de Firestore? Esta acción es irreversible.')) return
    setDeleting(true)
    setSeedMsg('')
    try {
      const count = await deleteAllMatches()
      setSeedMsg(`🗑️ ${count} partidos eliminados. Podés volver a cargar los datos.`)
    } catch (e) {
      setSeedMsg(`❌ Error al eliminar: ${e.message}`)
    } finally {
      setDeleting(false)
    }
  }

  const handleSaveResult = async (matchId) => {
    const s = scores[matchId]
    if (s.home === '' || s.away === '') return
    setSaving((p) => ({ ...p, [matchId]: true }))
    try {
      await updateMatchResult(matchId, Number(s.home), Number(s.away))
    } finally {
      setSaving((p) => ({ ...p, [matchId]: false }))
    }
  }

  const handleCalcPoints = async (matchId) => {
    setCalculating((p) => ({ ...p, [matchId]: true }))
    try {
      await calculateAndSavePoints(matchId)
    } finally {
      setCalculating((p) => ({ ...p, [matchId]: false }))
    }
  }

  const handleUpdateKnockout = async (matchId) => {
    const s = scores[matchId]
    await updateKnockoutMatch(matchId, {
      homeTeam: s.homeTeam,
      awayTeam: s.awayTeam,
      homeFlag: s.homeFlag,
      awayFlag: s.awayFlag,
    })
  }

  const stages = useMemo(() => {
    const found = new Set(matches.map((m) => m.stage))
    return STAGE_ORDER.filter((s) => found.has(s))
  }, [matches])

  const filtered = useMemo(
    () => matches.filter((m) => m.stage === activeStage),
    [matches, activeStage]
  )

  if (loading) return <LoadingSpinner />

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24">
      <h1 className="text-xl font-black text-white mb-1">Panel de Administración</h1>
      <p className="text-xs text-gray-500 mb-5">Solo visible para admins</p>

      {/* Seed / Reset buttons */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 mb-6">
        <h2 className="font-bold text-white text-sm mb-1">Datos del Mundial 2026</h2>
        <p className="text-xs text-gray-400 mb-3">
          Carga los <strong className="text-white">72 partidos de la fase de grupos</strong> (12 grupos × 6 partidos, draw oficial de diciembre 2025)
          más los partidos de eliminación directa como placeholders.
          Si ya hay partidos cargados, primero eliminá y luego recargá.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleSeed}
            disabled={seeding || deleting}
            className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-900 disabled:text-blue-700 text-white font-semibold text-sm px-4 py-2 rounded-xl transition-colors"
          >
            {seeding ? '⏳ Cargando...' : '🌍 Cargar partidos del Mundial 2026'}
          </button>
          <button
            onClick={handleDeleteAll}
            disabled={seeding || deleting || matches.length === 0}
            className="bg-red-700 hover:bg-red-600 disabled:bg-red-950 disabled:text-red-800 text-white font-semibold text-sm px-4 py-2 rounded-xl transition-colors"
          >
            {deleting ? '⏳ Eliminando...' : '🗑️ Eliminar todos los partidos'}
          </button>
        </div>
        {seedMsg && (
          <p className={`mt-2 text-sm ${seedMsg.startsWith('✅') ? 'text-green-400' : seedMsg.startsWith('🗑️') ? 'text-yellow-400' : 'text-red-400'}`}>
            {seedMsg}
          </p>
        )}
      </div>

      {/* Stage tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
        {stages.map((s) => (
          <button
            key={s}
            onClick={() => setActiveStage(s)}
            className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${
              activeStage === s
                ? 'bg-green-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            {STAGE_LABELS[s]} ({matches.filter((m) => m.stage === s).length})
          </button>
        ))}
      </div>

      {/* Match list */}
      <div className="flex flex-col gap-3">
        {filtered.map((match) => {
          const s = scores[match.id] || { home: '', away: '' }
          const isKnockout = match.stage !== 'group'
          const isPending = match.homeTeam === 'Por definir'

          return (
            <div key={match.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-gray-400">
                  Partido #{match.matchNumber}
                  {match.group ? ` · Grupo ${match.group}` : ''}
                </span>
                {match.isFinished && (
                  <span className="text-xs font-bold text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">
                    Finalizado
                  </span>
                )}
              </div>

              {/* Knockout team name editor */}
              {isKnockout && isPending && (
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Flag local</label>
                    <input
                      value={s.homeFlag || ''}
                      onChange={(e) => setScores((p) => ({ ...p, [match.id]: { ...p[match.id], homeFlag: e.target.value } }))}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-green-500"
                      placeholder="🏳️"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Flag visitante</label>
                    <input
                      value={s.awayFlag || ''}
                      onChange={(e) => setScores((p) => ({ ...p, [match.id]: { ...p[match.id], awayFlag: e.target.value } }))}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-green-500"
                      placeholder="🏳️"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Equipo local</label>
                    <input
                      value={s.homeTeam || ''}
                      onChange={(e) => setScores((p) => ({ ...p, [match.id]: { ...p[match.id], homeTeam: e.target.value } }))}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-green-500"
                      placeholder="País"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Equipo visitante</label>
                    <input
                      value={s.awayTeam || ''}
                      onChange={(e) => setScores((p) => ({ ...p, [match.id]: { ...p[match.id], awayTeam: e.target.value } }))}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-green-500"
                      placeholder="País"
                    />
                  </div>
                  <button
                    onClick={() => handleUpdateKnockout(match.id)}
                    className="col-span-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold py-2 rounded-xl transition-colors"
                  >
                    Actualizar equipos
                  </button>
                </div>
              )}

              {/* Teams display */}
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-2xl">{match.homeFlag}</span>
                  <span className="text-sm font-medium text-white truncate">{match.homeTeam}</span>
                </div>
                <span className="text-gray-600 text-xs">vs</span>
                <div className="flex items-center gap-2 flex-1 justify-end">
                  <span className="text-sm font-medium text-white truncate text-right">{match.awayTeam}</span>
                  <span className="text-2xl">{match.awayFlag}</span>
                </div>
              </div>

              {/* Score input */}
              {!isPending && (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="99"
                    value={s.home}
                    onChange={(e) => setScores((p) => ({ ...p, [match.id]: { ...p[match.id], home: e.target.value } }))}
                    className="w-14 text-center bg-gray-800 border border-gray-700 rounded-lg py-2 text-white font-bold focus:outline-none focus:border-green-500"
                    placeholder="0"
                  />
                  <span className="text-gray-500">-</span>
                  <input
                    type="number"
                    min="0"
                    max="99"
                    value={s.away}
                    onChange={(e) => setScores((p) => ({ ...p, [match.id]: { ...p[match.id], away: e.target.value } }))}
                    className="w-14 text-center bg-gray-800 border border-gray-700 rounded-lg py-2 text-white font-bold focus:outline-none focus:border-green-500"
                    placeholder="0"
                  />
                  <button
                    onClick={() => handleSaveResult(match.id)}
                    disabled={saving[match.id]}
                    className="flex-1 bg-green-600 hover:bg-green-500 disabled:bg-green-900 text-white text-xs font-semibold py-2 rounded-xl transition-colors"
                  >
                    {saving[match.id] ? '...' : match.isFinished ? 'Actualizar resultado' : 'Guardar resultado'}
                  </button>
                  {match.isFinished && (
                    <button
                      onClick={() => handleCalcPoints(match.id)}
                      disabled={calculating[match.id]}
                      className="flex-shrink-0 bg-yellow-600 hover:bg-yellow-500 disabled:bg-yellow-900 text-white text-xs font-semibold py-2 px-3 rounded-xl transition-colors"
                      title="Calcular puntos"
                    >
                      {calculating[match.id] ? '...' : '🧮 Pts'}
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-600 text-sm">
            No hay partidos en esta fase. Cargá los datos primero.
          </div>
        )}
      </div>
    </div>
  )
}
