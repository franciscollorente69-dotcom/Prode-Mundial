import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { subscribeLeaderboard, subscribePrize, getLastFinishedMatches, getPredictionsForMatches } from '../firebase/firestore'
import LoadingSpinner from '../components/LoadingSpinner'

const MEDAL = ['🥇', '🥈', '🥉']

export default function LeaderboardPage() {
  const { user, profile } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [prize, setPrize] = useState(null)
  // badges: { [uid]: { fire: bool, sad: bool } }
  const [badges, setBadges] = useState({})

  useEffect(() => {
    const unsub = subscribeLeaderboard((data) => {
      setUsers(data)
      setLoading(false)
    })
    return unsub
  }, [])

  useEffect(() => {
    const unsub = subscribePrize(setPrize)
    return unsub
  }, [])

  // Load streak badges once we have users
  useEffect(() => {
    if (!users.length) return
    let cancelled = false
    const loadBadges = async () => {
      try {
        const lastMatches = await getLastFinishedMatches(3)
        if (!lastMatches.length || cancelled) return
        const matchIds = lastMatches.map((m) => m.id)
        const preds = await getPredictionsForMatches(matchIds)
        if (cancelled) return
        // Group predictions by userId
        const byUser = {}
        for (const p of preds) {
          if (!byUser[p.userId]) byUser[p.userId] = {}
          byUser[p.userId][p.matchId] = p.pointsEarned
        }
        const result = {}
        for (const u of users) {
          const userPreds = byUser[u.uid] || {}
          const pts = matchIds.map((id) => userPreds[id])
          // Only badge if user has predictions for all 3 matches
          const hasAll = pts.every((p) => p !== undefined)
          if (hasAll) {
            result[u.uid] = {
              fire: pts.every((p) => p === 3),
              sad: pts.every((p) => p === 0),
            }
          }
        }
        setBadges(result)
      } catch (_) {}
    }
    loadBadges()
    return () => { cancelled = true }
  }, [users.length])

  const myRank = users.findIndex((u) => u.uid === user?.uid) + 1

  if (loading) return <LoadingSpinner />

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24">
      <h1 className="text-xl font-black text-white mb-1">Tabla de Posiciones</h1>
      <p className="text-xs text-gray-500 mb-4">Se actualiza en tiempo real</p>

      {/* Prize banner */}
      {prize !== null && prize > 0 && (
        <div className="bg-gradient-to-r from-yellow-900/40 to-yellow-800/20 border border-yellow-600/30 rounded-2xl px-4 py-3 mb-5 flex items-center gap-3">
          <span className="text-2xl">🏆</span>
          <div>
            <p className="text-xs text-yellow-500/80 font-medium uppercase tracking-wide">Premio acumulado</p>
            <p className="text-xl font-black text-yellow-400">${prize.toLocaleString('es-AR')}</p>
          </div>
        </div>
      )}

      {/* My rank card */}
      {myRank > 0 && (
        <div className="bg-gradient-to-r from-green-900/40 to-green-800/20 border border-green-700/30 rounded-2xl p-4 mb-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-green-600/30 border-2 border-green-500 flex items-center justify-center font-black text-green-300 text-lg">
            {myRank <= 3 ? MEDAL[myRank - 1] : `#${myRank}`}
          </div>
          <div>
            <p className="font-bold text-white">{profile?.displayName || profile?.username}</p>
            <p className="text-xs text-gray-400">Tu posición actual</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-2xl font-black text-white">{profile?.totalPoints ?? 0}</p>
            <p className="text-xs text-gray-400">puntos</p>
          </div>
        </div>
      )}

      {/* Leaderboard list */}
      {users.length === 0 ? (
        <div className="text-center py-16 text-gray-600">
          <p className="text-4xl mb-3">🏅</p>
          <p className="text-sm">Todavía no hay jugadores registrados.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {users.map((u, i) => {
            const rank = i + 1
            const isMe = u.uid === user?.uid
            const isFirst = rank === 1
            const isLast = rank === users.length && users.length > 1
            const streak = badges[u.uid]
            return (
              <div
                key={u.id}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-all ${
                  isMe
                    ? 'bg-green-900/20 border-green-700/40'
                    : 'bg-gray-900 border-gray-800 hover:border-gray-700'
                }`}
              >
                {/* Rank */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-black ${
                  rank === 1 ? 'bg-yellow-500/20 text-yellow-400' :
                  rank === 2 ? 'bg-gray-400/20 text-gray-300' :
                  rank === 3 ? 'bg-orange-500/20 text-orange-400' :
                  'bg-gray-800 text-gray-400'
                }`}>
                  {rank <= 3 ? MEDAL[rank - 1] : rank}
                </div>

                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-gray-700 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                  {(u.displayName || u.username || '?')[0].toUpperCase()}
                </div>

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold text-sm truncate ${isMe ? 'text-green-300' : 'text-white'}`}>
                    {u.displayName || u.username}
                    {isMe && <span className="text-xs text-green-500 ml-1">(vos)</span>}
                    {isFirst && <span className="ml-1" title="1er lugar">⭐</span>}
                    {isLast && <span className="ml-1" title="Último lugar">💀</span>}
                    {streak?.fire && <span className="ml-1" title="Últimos 3 partidos perfectos">🔥</span>}
                    {streak?.sad && <span className="ml-1" title="0 puntos en últimos 3 partidos">😢</span>}
                  </p>
                  <p className="text-xs text-gray-500 truncate">@{u.username}</p>
                </div>

                {/* Points */}
                <div className="text-right flex-shrink-0">
                  <p className={`text-lg font-black ${rank === 1 ? 'text-yellow-400' : 'text-white'}`}>
                    {u.totalPoints ?? 0}
                  </p>
                  <p className="text-xs text-gray-500">pts</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
