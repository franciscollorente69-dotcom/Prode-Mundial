import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { loginUser } from '../firebase/auth'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await loginUser(email, password)
      navigate('/')
    } catch (err) {
      const msgs = {
        'auth/user-not-found': 'No existe una cuenta con ese email.',
        'auth/wrong-password': 'Contraseña incorrecta.',
        'auth/invalid-credential': 'Email o contraseña incorrectos.',
        'auth/too-many-requests': 'Demasiados intentos. Intentá más tarde.',
      }
      setError(msgs[err.code] || 'Error al iniciar sesión. Revisá tus datos.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4 py-12">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="text-6xl mb-3">🏆</div>
        <h1 className="text-2xl font-black text-white tracking-tight">
          PRODE <span className="text-green-400">MUNDIAL</span> 2026
        </h1>
        <p className="text-gray-400 text-sm mt-1">Pronosticá y competí con tus amigos</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm">
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
          <h2 className="text-lg font-bold text-white mb-5">Iniciar sesión</h2>

          {error && (
            <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-green-500 transition-colors"
                placeholder="tu@email.com"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-green-500 transition-colors"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-500 disabled:bg-green-900 disabled:text-green-700 text-white font-semibold py-2.5 rounded-xl transition-colors mt-1"
            >
              {loading ? 'Ingresando...' : 'Entrar'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-5">
            ¿No tenés cuenta?{' '}
            <Link to="/register" className="text-green-400 hover:text-green-300 font-medium">
              Registrate
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
