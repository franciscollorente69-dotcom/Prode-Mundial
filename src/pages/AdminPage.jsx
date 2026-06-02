import { useEffect, useState, useMemo } from 'react'
import { subscribeMatches, updateMatchResult, calculateAndSavePoints, updateKnockoutMatch, getUsers, deleteAllMatches } from '../firebase/firestore'
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
  const [deleting, setDeleting] = useState(false)
  const [users, setUsers] = useState([])
  const [usersLoading, setUsersLoading] = useState(true)

  useEffect(() => {
    getUsers().then((data) => { setUsers(data); setUsersLoading(false) }).catch(() => setUsersLoading(false))
  }, [])

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
    // Firestore won't fire for an empty collection — unblock UI after 3s
    const timeout = setTimeout(() => setLoading(false), 3000)
    return () => { unsub(); clearTimeout(timeout) }
  }, [])

  const handleDelete = async () => {
    if (!window.confirm('⚠️ ¿Eliminar TODOS los partidos? Esta acción no se puede deshacer.')) return
    setDeleting(true)
    setSeedMsg('')
    try {
      const count = await deleteAllMatches()
      setSeedMsg(`🗑️ ${count} partidos eliminados.`)
    } catch (e) {
      setSeedMsg(`❌ Error: ${e.message}`)
    } finally {
      setDeleting(false)
    }
  }

  const handleSeed = async () => {
    if (!window.confirm('¿Cargar los 72 partidos de la fase de grupos y los 32 knockouts? Esto no se puede deshacer.')) return
    setSeeding(true)
    setSeedMsg('')
    try {
      const count = await seedMatches()
      setSeedMsg(`✅ ${count} partidos cargados correctamente.`)
    } catch (e) {
      setSeedMsg(`❌ Error: ${e.message}`)
    } finally {
      setSeeding(false)
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

  // Don't block the whole page — seed/delete buttons must always be accessible

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24">
      <h1 className="text-xl font-black text-white mb-1">Panel de Administración</h1>
      <p className="text-xs text-gray-500 mb-5">Solo visible para admins</p>

      {/* Seed button */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 mb-6">
        <h2 className="font-bold text-white text-sm mb-1">Cargar datos del Mundial</h2>
        <p className="text-xs text-gray-400 mb-3">
          Carga los 72 partidos de la fase de grupos (12 grupos de 4 equipos) + 32 partidos de eliminación directa como placeholders. Total: 104 partidos.
        </p>
        <button
          onClick={handleDelete}
          disabled={deleting || seeding}
          className="block w-full bg-red-700 hover:bg-red-600 disabled:bg-red-900 disabled:text-red-700 text-white font-semibold text-sm px-4 py-2 rounded-xl transition-colors mb-2"
        >
          {deleting ? '⏳ Eliminando...' : '🗑️ Eliminar todos los partidos'}
        </button>
        <button
          onClick={handleSeed}
          disabled={seeding || deleting}
          className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-900 disabled:text-blue-700 text-white font-semibold text-sm px-4 py-2 rounded-xl transition-colors"
        >
          {seeding ? '⏳ Cargando...' : '🌍 Cargar partidos del Mundial 2026'}
        </button>
        {seedMsg && (
          <p className={`mt-2 text-sm ${seedMsg.startsWith('✅') ? 'text-green-400' : 'text-red-400'}`}>
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
        {loading && <LoadingSpinner />}
        {!loading && filtered.map((match) => {
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

        {!loading && filtered.length === 0 && (
          <div className="text-center py-12 text-gray-600 text-sm">
            No hay partidos en esta fase. Cargá los datos primero.
          </div>
        )}
      </div>

      {/* Users section */}
      <div className="mt-8">
        <h2 className="text-lg font-black text-white mb-1">Usuarios Registrados</h2>
        {usersLoading ? (
          <p className="text-sm text-gray-500">Cargando usuarios...</p>
        ) : (
          <>
            <p className="text-4xl font-black text-green-400 mb-4">{users.length}</p>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-800 text-gray-500 text-left">
                      <th className="px-3 py-2 font-semibold">Nombre</th>
                      <th className="px-3 py-2 font-semibold">Usuario</th>
                      <th className="px-3 py-2 font-semibold">Email</th>
                      <th className="px-3 py-2 font-semibold text-right">Pts</th>
                      <th className="px-3 py-2 font-semibold">Registro</th>
                      <th className="px-3 py-2 font-semibold">Admin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-b border-gray-800/50 last:border-0">
                        <td className="px-3 py-2 text-white font-medium truncate max-w-[120px]">{u.displayName || '—'}</td>
                        <td className="px-3 py-2 text-gray-400">@{u.username || '—'}</td>
                        <td className="px-3 py-2 text-gray-400 truncate max-w-[160px]">{u.email || '—'}</td>
                        <td className="px-3 py-2 text-green-400 font-bold text-right">{u.totalPoints ?? 0}</td>
                        <td className="px-3 py-2 text-gray-500 whitespace-nowrap">
                          {u.createdAt?.toDate
                            ? u.createdAt.toDate().toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' })
                            : '—'}
                        </td>
                        <td className="px-3 py-2">
                          {u.isAdmin
                            ? <span className="text-yellow-400 font-bold">Sí</span>
                            : <span className="text-gray-600">No</span>}
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-3 py-6 text-center text-gray-600">
                          No hay usuarios registrados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
