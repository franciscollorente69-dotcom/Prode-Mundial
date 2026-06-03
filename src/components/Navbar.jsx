import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { logoutUser } from '../firebase/auth'
import { subscribeMatches, subscribePredictionsByUser } from '../firebase/firestore'

export default function Navbar() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [allMatches, setAllMatches] = useState([])
  const [predictions, setPredictions] = useState([])

  useEffect(() => {
    if (!user) return
    const unsubM = subscribeMatches(setAllMatches)
    const unsubP = subscribePredictionsByUser(user.uid, setPredictions)
    return () => { unsubM(); unsubP() }
  }, [user])

  const unpredictedCount = useMemo(() => {
    if (!user) return 0
    const now = Date.now()
    const deadline = 10 * 60 * 1000
    const predMatchIds = new Set(predictions.map((p) => p.matchId))
    return allMatches.filter((m) => {
      if (m.isFinished) return false
      const matchTime = m.matchDate?.toDate ? m.matchDate.toDate().getTime() : new Date(m.matchDate).getTime()
      return matchTime - now > deadline && !predMatchIds.has(m.id)
    }).length
  }, [allMatches, predictions, user])

  const handleLogout = async () => {
    await logoutUser()
    navigate('/login')
  }

  const navClass = ({ isActive }) =>
    `text-sm font-medium transition-colors ${
      isActive ? 'text-green-400' : 'text-gray-300 hover:text-white'
    }`

  return (
    <nav className="sticky top-0 z-50 bg-gray-950/95 backdrop-blur border-b border-gray-800">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-bold text-white">
          <span className="text-2xl">🏆</span>
          <span className="hidden sm:inline text-sm font-extrabold tracking-tight">
            PRODE <span className="text-green-400">MUNDIAL</span> 2026
          </span>
          <span className="sm:hidden text-sm font-extrabold tracking-tight">
            PRODE <span className="text-green-400">2026</span>
          </span>
        </Link>

        {/* Desktop nav */}
        {user && (
          <div className="hidden md:flex items-center gap-6">
            <NavLink to="/" end className={navClass}>
              <span className="relative inline-flex items-center gap-1">
                Partidos
                {unpredictedCount > 0 && (
                  <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-black leading-none">
                    {unpredictedCount > 9 ? '9+' : unpredictedCount}
                  </span>
                )}
              </span>
            </NavLink>
            <NavLink to="/mis-pronosticos" className={navClass}>Mis Pronósticos</NavLink>
            <NavLink to="/tabla" className={navClass}>Tabla</NavLink>
            {profile?.isAdmin && (
              <NavLink to="/admin" className={navClass}>Admin</NavLink>
            )}
          </div>
        )}

        {/* Right side */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="hidden sm:inline text-xs text-gray-400">
                {profile?.displayName || profile?.username}
              </span>
              <span className="hidden sm:inline text-xs font-bold text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">
                {profile?.totalPoints ?? 0} pts
              </span>
              <button
                onClick={handleLogout}
                className="hidden sm:inline text-xs text-gray-400 hover:text-red-400 transition-colors"
              >
                Salir
              </button>
              {/* Mobile hamburger */}
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800"
              >
                {menuOpen ? '✕' : '☰'}
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="text-sm font-medium text-white bg-green-600 hover:bg-green-500 px-4 py-1.5 rounded-lg transition-colors"
            >
              Ingresar
            </Link>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && user && (
        <div className="md:hidden border-t border-gray-800 bg-gray-950 px-4 py-3 flex flex-col gap-3">
          <div className="flex items-center justify-between pb-2 border-b border-gray-800">
            <span className="text-sm font-medium text-white">
              {profile?.displayName}
            </span>
            <span className="text-xs font-bold text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">
              {profile?.totalPoints ?? 0} pts
            </span>
          </div>
          <NavLink to="/" end className={navClass} onClick={() => setMenuOpen(false)}>
            <span className="inline-flex items-center gap-1.5">
              ⚽ Partidos
              {unpredictedCount > 0 && (
                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-black leading-none">
                  {unpredictedCount > 9 ? '9+' : unpredictedCount}
                </span>
              )}
            </span>
          </NavLink>
          <NavLink to="/mis-pronosticos" className={navClass} onClick={() => setMenuOpen(false)}>📋 Mis Pronósticos</NavLink>
          <NavLink to="/tabla" className={navClass} onClick={() => setMenuOpen(false)}>🏅 Tabla de Posiciones</NavLink>
          {profile?.isAdmin && (
            <NavLink to="/admin" className={navClass} onClick={() => setMenuOpen(false)}>⚙️ Panel Admin</NavLink>
          )}
          <button onClick={handleLogout} className="text-left text-sm text-red-400 hover:text-red-300 pt-1 border-t border-gray-800">
            Cerrar sesión
          </button>
        </div>
      )}
    </nav>
  )
}
