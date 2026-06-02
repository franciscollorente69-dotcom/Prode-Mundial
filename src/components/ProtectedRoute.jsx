import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from './LoadingSpinner'

export const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return <LoadingSpinner />
  return user ? children : <Navigate to="/login" replace />
}

export const AdminRoute = ({ children }) => {
  const { user, profile, loading } = useAuth()
  if (loading) return <LoadingSpinner />
  if (!user) return <Navigate to="/login" replace />
  if (!profile?.isAdmin) return <Navigate to="/" replace />
  return children
}
