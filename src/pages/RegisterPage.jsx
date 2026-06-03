import { useState } from 'react'
import { Link } from 'react-router-dom'
import { registerUser } from '../firebase/auth'
import { logoutUser } from '../firebase/auth'

export default function RegisterPage() {
  const [form, setForm] = useState({ email: '', password: '', username: '', displayName: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [registered, setRegistered] = useState(false)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(form.username)) {
      setError('El usuario debe tener entre 3 y 20 caracteres (letras, números, _).')
      return
    }
    setLoading(true)
    try {
      await registerUser(form.email, form.password, form.username, form.displayName || form.username)
      setRegistered(true)
    } catch (err) {
      const msgs = {
        'auth/email-already-in-use': 'Ya existe una cuenta con ese email.',
        'auth/weak-password': 'La contraseña es demasiado débil.',
        'auth/invalid-email': 'El email no es válido.',
      }
      setError(msgs[err.code] || err.message || 'Error al registrarse.')
    } finally {
      setLoading(false)
    }
  }

  if (registered) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm text-center">
          <div className="text-6xl mb-4">⏳</div>
          <h2 className="text-xl font-black text-white mb-3">Cuenta creada</h2>
          <p className="text-gray-300 text-sm mb-6 leading-relaxed">
            Tu cuenta está pendiente de aprobación.<br />
            El administrador te habilitará pronto.
          </p>
          <button
            onClick={() => logoutUser()}
            className="text-sm text-gray-400 hover:text-white underline"
          >
            Volver al inicio de sesión
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4 py-12">
      <div className="mb-8 text-center">
        <div className="text-6xl mb-3">🏆</div>
        <h1 className="text-2xl font-black text-white tracking-tight">
          PRODE <span className="text-green-400">MUNDIAL</span> 2026
        </h1>
        <p className="text-gray-400 text-sm mt-1">Creá tu cuenta y empezá a pronosticar</p>
      </div>

      <div className="w-full max-w-sm">
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
          <h2 className="text-lg font-bold text-white mb-5">Crear cuenta</h2>

          {error && (
            <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Nombre para mostrar</label>
              <input
                type="text"
                value={form.displayName}
                onChange={set('displayName')}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-green-500 transition-colors"
                placeholder="Tu nombre"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Nombre de usuario <span className="text-gray-600">(único, sin espacios)</span>
              </label>
              <input
                type="text"
                value={form.username}
                onChange={set('username')}
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-green-500 transition-colors"
                placeholder="jugador_10"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={set('email')}
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
                value={form.password}
                onChange={set('password')}
                required
                minLength={6}
                autoComplete="new-password"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-green-500 transition-colors"
                placeholder="Mín. 6 caracteres"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-500 disabled:bg-green-900 disabled:text-green-700 text-white font-semibold py-2.5 rounded-xl transition-colors mt-1"
            >
              {loading ? 'Registrando...' : 'Crear cuenta'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-5">
            ¿Ya tenés cuenta?{' '}
            <Link to="/login" className="text-green-400 hover:text-green-300 font-medium">
              Iniciá sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
