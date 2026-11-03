import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/useAuth.js'
import { LoadingState } from './components/States.jsx'

import LoginPage from './pages/LoginPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import RequestsPage from './pages/RequestsPage.jsx'
import VehiclesPage from './pages/VehiclesPage.jsx'
import PersonsPage from './pages/PersonsPage.jsx'
import HistoryPage from './pages/HistoryPage.jsx'
import ReportsPage from './pages/ReportsPage.jsx'
import SettingsPage from './pages/SettingsPage.jsx'
import AccessPage from './pages/AccessPage.jsx'
import OccupancyPage from './pages/OccupancyPage.jsx'

function SessionLoader() {
  return (
    <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', background: 'var(--bg)' }}>
      <LoadingState text="Restaurando sesión…" />
    </div>
  )
}

/** Ruta protegida: exige sesión y, opcionalmente, un rol concreto. */
function ProtectedRoute({ role, children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <SessionLoader />
  }
  if (!user) {
    return <Navigate to="/login" replace />
  }
  if (role && user.role !== role) {
    // Si el rol no coincide, redirigir a su panel correspondiente.
    return <Navigate to={user.role === 'administrador' ? '/admin' : '/acceso'} replace />
  }
  return children
}

/** Redirige a cada rol a su panel después de iniciar sesión. */
function HomeRedirect() {
  const { user, loading } = useAuth()
  if (loading) return <SessionLoader />
  if (!user) return <Navigate to="/login" replace />
  return <Navigate to={user.role === 'administrador' ? '/admin' : '/acceso'} replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<HomeRedirect />} />

      {/* Rutas del administrador */}
      <Route path="/admin" element={<ProtectedRoute role="administrador"><DashboardPage /></ProtectedRoute>} />
      <Route path="/admin/solicitudes" element={<ProtectedRoute role="administrador"><RequestsPage /></ProtectedRoute>} />
      <Route path="/admin/vehiculos" element={<ProtectedRoute role="administrador"><VehiclesPage /></ProtectedRoute>} />
      <Route path="/admin/personas" element={<ProtectedRoute role="administrador"><PersonsPage /></ProtectedRoute>} />
      <Route path="/admin/historial" element={<ProtectedRoute role="administrador"><HistoryPage /></ProtectedRoute>} />
      <Route path="/admin/reportes" element={<ProtectedRoute role="administrador"><ReportsPage /></ProtectedRoute>} />
      <Route path="/admin/configuracion" element={<ProtectedRoute role="administrador"><SettingsPage /></ProtectedRoute>} />

      {/* Rutas del vigilante */}
      <Route path="/acceso" element={<ProtectedRoute role="vigilante"><AccessPage /></ProtectedRoute>} />
      <Route path="/acceso/ocupacion" element={<ProtectedRoute role="vigilante"><OccupancyPage /></ProtectedRoute>} />
      <Route path="/acceso/historial" element={<ProtectedRoute role="vigilante"><HistoryPage /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
