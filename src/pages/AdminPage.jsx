import { useEffect, useState, useMemo } from 'react'
import {
  subscribeMatches,
  updateMatchResult,
  calculateAndSavePoints,
  updateKnockoutMatch,
  getUsers,
  approveUser,
  deleteUser,
  deleteAllMatches,
  subscribePrize,
  savePrize,
} from '../firebase/firestore'
import { seedMatches } from '../firebase/seedData'
import { STAGE_LABELS, STAGE_ORDER } from '../utils/scoring'
import LoadingSpinner from '../components/LoadingSpinner'

export default function AdminPage() {
  // ── Matches state ──────────────────────────────────────────────────────────
  const [matches, setMatches] = useState([])
  const [matchesLoading, setMatchesLoading] = useState(true)
  const [activeStage, setActiveStage] = useState('group')
  const [seeding, setSeeding] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [seedMsg, setSeedMsg] = useState('')
  const [scores, setScores] = useState({})
  const [saving, setSaving] = useState({})
  const [calculating, setCalculating] = useState({})

  // ── Users state ────────────────────────────────────────────────────────────
  const [users, setUsers] = useState([])
  const [usersLoading, setUsersLoading] = useState(true)
  const [usersError, setUsersError] = useState('')
  const [approvingId, setApprovingId] = useState(null)
  const [deletingUserId, setDeletingUserId] = useState(null)

  // ── Prize state ────────────────────────────────────────────────────────────
  const [prize, setPrize] = useState(0)
  const [prizeInput, setPrizeInput] = useState('')
  const [savingPrize, setSavingPrize] = useState(false)
  const [prizeMsg, setPrizeMsg] = useState('')

  // Pending users derived from users list — no extra Firestore query needed
  const pendingUsers = useMemo(
    () => users.filter(u => !u.isAdmin && !u.approved),
    [users]
  )

  // ── Load users ─────────────────────────────────────────────────────────────
  const reloadUsers = async () => {
    setUsersLoading(true)
    setUsersError('')
    try {
      const all = await getUsers()
      setUsers(all)
    } catch (err) {
      console.error('Error cargando usuarios:', err)
      setUsersError(`Error al cargar usuarios: ${err.message}`)
    } finally {
      setUsersLoading(false)
    }
  }

  useEffect(() => { reloadUsers() }, [])

  // ── Load matches ───────────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = subscribeMatches((data) => {
      setMatches(data)
      setMatchesLoading(false)
      setScores((prev) => {
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
        // prev values override init so user edits aren't wiped
        return { ...init, ...prev }
      })
    })
    // Firestore won't fire for an empty collection — unblock UI after 3s
    const timeout = setTimeout(() => setMatchesLoading(false), 3000)
    return () => { unsub(); clearTimeout(timeout) }
  }, [])

  // ── Load prize ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = subscribePrize((val) => {
      setPrize(val)
      setPrizeInput(String(val))
    })
    return unsub
  }, [])

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleApprove = async (uid) => {
    setApprovingId(uid)
    try {
      await approveUser(uid)
      await reloadUsers()
    } catch (err) {
      setUsersError(`Error al aprobar: ${err.message}`)
    } finally {
      setApprovingId(null)
    }
  }

  const handleDeleteUser = async (u) => {
    if (!window.confirm(`¿Eliminar a @${u.username}? Se eliminarán todos sus pronósticos. Esta acción no se puede deshacer.`)) return
    setDeletingUserId(u.id)
    try {
      await deleteUser(u.id)
      await reloadUsers()
    } catch (err) {
      setUsersError(`Error al eliminar: ${err.message}`)
    } finally {
      setDeletingUserId(null)
    }
  }

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

  const handleSavePrize = async () => {
    const val = Number(prizeInput)
    if (isNaN(val) || val < 0) return
    setSavingPrize(true)
    setPrizeMsg('')
    try {
      await savePrize(val)
      setPrizeMsg('✅ Premio guardado.')
    } catch (e) {
      setPrizeMsg(`❌ ${e.message}`)
    } finally {
      setSavingPrize(false)
      setTimeout(() => setPrizeMsg(''), 3000)
    }
  }

  const stages = useMemo(() => {
    const found = new Set(matches.map((m) => m.stage))
    return STAGE_ORDER.filter((s) => found.has(s))
  }, [matches])

  const filtered = useMemo(
    () => matches.filter((m) => m.stage === activeStage),
    [matches, activeStage]
  )

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24">
      <h1 className="text-xl font-black text-white mb-1">Panel de Administración</h1>
      <p className="text-xs text-gray-500 mb-5">Solo visible para admins</p>

      {/* ── 1. PENDING USERS — always visible at top ── */}
      <section className={`rounded-2xl border p-4 mb-6 ${
        pendingUsers.length > 0
          ? 'bg-yellow-500/10 border-yellow-500/40'
          : 'bg-gray-900 border-gray-800'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <h2 className={`font-bold text-sm ${pendingUsers.length > 0 ? 'text-yellow-400' : 'text-gray-400'}`}>
            ⏳ Usuarios Pendientes de Aprobación
          </h2>
          <button
            onClick={reloadUsers}
            disabled={usersLoading}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            {usersLoading ? 'Actualizando...' : '↺ Actualizar'}
          </button>
        </div>

        {usersError && (
          <p className="text-red-400 text-xs mb-3 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2">
            {usersError}
          </p>
        )}

        {usersLoading ? (
          <p className="text-xs text-gray-500">Cargando...</p>
        ) : pendingUsers.length === 0 ? (
          <p className="text-xs text-gray-500 italic">
            No hay usuarios pendientes de aprobación.{' '}
            {users.length > 0 && `(${users.length} usuario${users.length !== 1 ? 's' : ''} registrado${users.length !== 1 ? 's' : ''})`}
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {pendingUsers.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between gap-3 bg-gray-900/80 rounded-xl px-3 py-2.5 border border-gray-800"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-white text-sm font-semibold truncate">
                    {u.displayName || u.username || '—'}
                  </p>
                  <p className="text-gray-400 text-xs truncate">
                    @{u.username} · {u.email}
                  </p>
                  <p className="text-gray-600 text-xs">
                    {u.createdAt?.toDate
                      ? u.createdAt.toDate().toLocaleDateString('es-AR', {
                          day: '2-digit', month: '2-digit', year: '2-digit',
                          hour: '2-digit', minute: '2-digit',
                        })
                      : '—'}
                  </p>
                </div>
                <button
                  onClick={() => handleApprove(u.id)}
                  disabled={approvingId === u.id}
                  className="flex-shrink-0 bg-green-600 hover:bg-green-500 disabled:bg-green-900 disabled:text-green-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors"
                >
                  {approvingId === u.id ? '...' : '✅ Aprobar'}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── 2. PRIZE ── */}
      <section className="bg-gray-900 border border-gray-800 rounded-2xl p-4 mb-6">
        <h2 className="font-bold text-white text-sm mb-1">💰 Premio Acumulado</h2>
        <p className="text-xs text-gray-400 mb-3">
          Actual: <span className="text-yellow-400 font-bold">${prize.toLocaleString('es-AR')}</span>
        </p>
        <div className="flex gap-2">
          <input
            type="number"
            min="0"
            value={prizeInput}
            onChange={(e) => setPrizeInput(e.target.value)}
            className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500"
            placeholder="Ej: 50000"
          />
          <button
            onClick={handleSavePrize}
            disabled={savingPrize}
            className="bg-yellow-600 hover:bg-yellow-500 disabled:bg-yellow-900 text-white font-semibold text-sm px-4 py-2 rounded-xl transition-colors"
          >
            {savingPrize ? '...' : 'Guardar'}
          </button>
        </div>
        {prizeMsg && <p className="mt-2 text-xs text-green-400">{prizeMsg}</p>}
      </section>

      {/* ── 3. SEED / DELETE matches ── */}
      <section className="bg-gray-900 border border-gray-800 rounded-2xl p-4 mb-6">
        <h2 className="font-bold text-white text-sm mb-1">🌍 Datos del Mundial 2026</h2>
        <p className="text-xs text-gray-400 mb-3">
          72 partidos de fase de grupos (12 grupos × 6 partidos) + 32 knockouts = 104 total.
          Si hay datos viejos, primero eliminá y luego recargá.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleDeleteAll}
            disabled={seeding || deleting || matches.length === 0}
            className="bg-red-700 hover:bg-red-600 disabled:bg-red-950 disabled:text-red-800 text-white font-semibold text-sm px-4 py-2 rounded-xl transition-colors"
          >
            {deleting ? '⏳ Eliminando...' : '🗑️ Eliminar todos los partidos'}
          </button>
          <button
            onClick={handleSeed}
            disabled={seeding || deleting}
            className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-900 disabled:text-blue-700 text-white font-semibold text-sm px-4 py-2 rounded-xl transition-colors"
          >
            {seeding ? '⏳ Cargando...' : '⬆️ Cargar partidos'}
          </button>
        </div>
        {seedMsg && (
          <p className={`mt-2 text-sm ${
            seedMsg.startsWith('✅') ? 'text-green-400'
            : seedMsg.startsWith('🗑️') ? 'text-yellow-400'
            : 'text-red-400'
          }`}>
            {seedMsg}
          </p>
        )}
      </section>

      {/* ── 4. MATCH RESULTS ── */}
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

      <div className="flex flex-col gap-3 mb-10">
        {matchesLoading && <div className="py-8"><LoadingSpinner text="Cargando partidos..." /></div>}

        {!matchesLoading && filtered.map((match) => {
          const s = scores[match.id] || { home: '', away: '' }
          const isKnockout = match.stage !== 'group'
          const isPending = match.homeTeam === 'Por definir'

          return (
            <div key={match.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-gray-400">
                  Partido #{match.matchNumber}
                  {match.group ? ` · Grupo ${match.group}` : ''}
                  {match.matchday ? ` · Fecha ${match.matchday}` : ''}
                </span>
                {match.isFinished && (
                  <span className="text-xs font-bold text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">
                    Finalizado
                  </span>
                )}
              </div>

              {isKnockout && isPending && (
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {[
                    ['homeFlag', '🏳️', 'Flag local'],
                    ['awayFlag', '🏳️', 'Flag visitante'],
                    ['homeTeam', 'País', 'Equipo local'],
                    ['awayTeam', 'País', 'Equipo visitante'],
                  ].map(([key, ph, label]) => (
                    <div key={key}>
                      <label className="text-xs text-gray-500 mb-1 block">{label}</label>
                      <input
                        value={s[key] || ''}
                        onChange={(e) => setScores((p) => ({ ...p, [match.id]: { ...p[match.id], [key]: e.target.value } }))}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-green-500"
                        placeholder={ph}
                      />
                    </div>
                  ))}
                  <button
                    onClick={() => handleUpdateKnockout(match.id)}
                    className="col-span-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold py-2 rounded-xl transition-colors"
                  >
                    Actualizar equipos
                  </button>
                </div>
              )}

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

              {!isPending && (
                <div className="flex items-center gap-2">
                  <input
                    type="number" min="0" max="99"
                    value={s.home}
                    onChange={(e) => setScores((p) => ({ ...p, [match.id]: { ...p[match.id], home: e.target.value } }))}
                    className="w-14 text-center bg-gray-800 border border-gray-700 rounded-lg py-2 text-white font-bold focus:outline-none focus:border-green-500"
                    placeholder="0"
                  />
                  <span className="text-gray-500">-</span>
                  <input
                    type="number" min="0" max="99"
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
                    {saving[match.id] ? '...' : match.isFinished ? 'Actualizar' : 'Guardar resultado'}
                  </button>
                  {match.isFinished && (
                    <button
                      onClick={() => handleCalcPoints(match.id)}
                      disabled={calculating[match.id]}
                      className="flex-shrink-0 bg-yellow-600 hover:bg-yellow-500 disabled:bg-yellow-900 text-white text-xs font-semibold py-2 px-3 rounded-xl transition-colors"
                      title="Calcular puntos de todos los pronósticos"
                    >
                      {calculating[match.id] ? '...' : '🧮 Pts'}
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}

        {!matchesLoading && filtered.length === 0 && (
          <div className="text-center py-12 text-gray-600 text-sm">
            No hay partidos en esta fase. Cargá los datos primero.
          </div>
        )}
      </div>

      {/* ── 5. USERS TABLE ── */}
      <section className="mt-2">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-black text-white">
            Usuarios Registrados
            {!usersLoading && (
              <span className="ml-2 text-sm font-normal text-green-400">{users.length}</span>
            )}
          </h2>
          <button
            onClick={reloadUsers}
            disabled={usersLoading}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            {usersLoading ? 'Cargando...' : '↺ Actualizar'}
          </button>
        </div>

        {usersError && (
          <p className="text-red-400 text-xs mb-3 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2">
            {usersError}
          </p>
        )}

        {usersLoading ? (
          <p className="text-sm text-gray-500 py-4">Cargando usuarios...</p>
        ) : users.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-center">
            <p className="text-gray-600 text-sm">No hay usuarios registrados.</p>
          </div>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-500 text-left">
                    <th className="px-3 py-2 font-semibold">Nombre</th>
                    <th className="px-3 py-2 font-semibold">Usuario</th>
                    <th className="px-3 py-2 font-semibold hidden sm:table-cell">Email</th>
                    <th className="px-3 py-2 font-semibold text-right">Pts</th>
                    <th className="px-3 py-2 font-semibold text-center">Admin</th>
                    <th className="px-3 py-2 font-semibold text-center">Estado</th>
                    <th className="px-3 py-2 font-semibold text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-gray-800/50 last:border-0 hover:bg-gray-800/30 transition-colors">
                      <td className="px-3 py-2.5 text-white font-medium truncate max-w-[110px]">
                        {u.displayName || '—'}
                      </td>
                      <td className="px-3 py-2.5 text-gray-400">@{u.username || '—'}</td>
                      <td className="px-3 py-2.5 text-gray-400 truncate max-w-[160px] hidden sm:table-cell">
                        {u.email || '—'}
                      </td>
                      <td className="px-3 py-2.5 text-green-400 font-bold text-right">
                        {u.totalPoints ?? 0}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        {u.isAdmin
                          ? <span className="text-yellow-400 font-bold">⭐</span>
                          : <span className="text-gray-700">—</span>}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        {u.isAdmin || u.approved
                          ? <span className="text-green-400 font-bold" title="Aprobado">✅</span>
                          : (
                            <button
                              onClick={() => handleApprove(u.id)}
                              disabled={approvingId === u.id}
                              className="text-yellow-400 hover:text-yellow-300 disabled:text-yellow-800 font-bold transition-colors"
                              title="Click para aprobar"
                            >
                              {approvingId === u.id ? '...' : '⏳ Aprobar'}
                            </button>
                          )}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        {!u.isAdmin && (
                          <button
                            onClick={() => handleDeleteUser(u)}
                            disabled={deletingUserId === u.id}
                            className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-400 hover:text-red-300 disabled:opacity-40 transition-colors text-sm"
                            title={`Eliminar a @${u.username}`}
                          >
                            {deletingUserId === u.id ? '…' : '🗑️'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
