import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute'
import Navbar from './components/Navbar'
import InstallPrompt from './components/InstallPrompt'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import HomePage from './pages/HomePage'
import MyPredictionsPage from './pages/MyPredictionsPage'
import LeaderboardPage from './pages/LeaderboardPage'
import AdminPage from './pages/AdminPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-950">
          <Navbar />
          <main>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <HomePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/mis-pronosticos"
                element={
                  <ProtectedRoute>
                    <MyPredictionsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tabla"
                element={
                  <ProtectedRoute>
                    <LeaderboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminPage />
                  </AdminRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <InstallPrompt />
        </div>
      </BrowserRouter>
    </AuthProvider>
  )
}
