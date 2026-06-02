import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { logoutUser } from '../firebase/auth'
import LoadingSpinner from './LoadingSpinner'

const PendingApprovalScreen = () => (
  <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-6 text-center">
    <div className="text-7xl mb-5">⏳</div>
    <h2 className="text-xl font-black text-white mb-3">Cuenta pendiente de aprobación</h2>
    <p className="text-gray-400 text-sm leading-relaxed max-w-xs mb-8">
      Una vez que realices el pago, el administrador te habilitará para participar.
    </p>
    <button
      onClick={() => logoutUser()}
      className="bg-gray-800 hover:bg-gray-700 text-white font-semibold text-sm px-6 py-2.5 rounded-xl transition-colors"
    >
      Salir
    </button>
  </div>
)

export const ProtectedRoute = ({ children }) => {
  const { user, profile, loading } = useAuth()
  if (loading) return <LoadingSpinner />
  if (!user) return <Navigate to="/login" replace />
  // Admins are always approved; regular users need approved: true
  if (!profile?.isAdmin && profile?.approved !== true) return <PendingApprovalScreen />
  return children
}

export const AdminRoute = ({ children }) => {
  const { user, profile, loading } = useAuth()
  if (loading) return <LoadingSpinner />
  if (!user) return <Navigate to="/login" replace />
  if (!profile?.isAdmin) return <Navigate to="/" replace />
  return children
}
