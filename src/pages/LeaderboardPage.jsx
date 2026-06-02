import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { subscribeLeaderboard } from '../firebase/firestore'
import LoadingSpinner from '../components/LoadingSpinner'

const MEDAL = ['🥇', '🥈', '🥉']

export default function LeaderboardPage() {
  const { user, profile } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = subscribeLeaderboard((data) => {
      setUsers(data)
      setLoading(false)
    })
    return unsub
  }, [])

  const myRank = users.findIndex((u) => u.uid === user?.uid) + 1

  if (loading) return <LoadingSpinner />

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24">
      <h1 className="text-xl font-black text-white mb-1">Tabla de Posiciones</h1>
      <p className="text-xs text-gray-500 mb-5">Se actualiza en tiempo real</p>

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
