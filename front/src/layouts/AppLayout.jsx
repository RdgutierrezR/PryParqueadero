import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Sidebar } from '../components/Sidebar.jsx'
import { Topbar } from '../components/Topbar.jsx'
import { ConfirmDialog } from '../components/ConfirmDialog.jsx'
import { useAuth } from '../context/useAuth.js'
import { useToast } from '../context/ToastContext.jsx'
import { lockScroll, unlockScroll } from '../utils/scrollLock.js'
import { MobileNav } from '../components/MobileNav.jsx'

/**
 * Estructura común de la aplicación: barra lateral, cabecera y contenido.
 * El menú se convierte en un panel deslizante en pantallas pequeñas.
 */
export function AppLayout({ title, section, label, nav, children }) {
  const { user, logout } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [confirmLogout, setConfirmLogout] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const isAdmin = user?.role === 'administrador'
  const flatNav = nav.flatMap((group) => group.items)
  const showMobileNav = flatNav.length <= 4

  // Cierra el menú móvil al cambiar de ruta.
  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  useEffect(() => {
    document.title = `${title} · Parqueadero CUL`
  }, [title])

  useEffect(() => {
    if (!sidebarOpen) return undefined
    const handleKey = (event) => {
      if (event.key === 'Escape') setSidebarOpen(false)
    }
    lockScroll()
    document.addEventListener('keydown', handleKey)
    return () => {
      unlockScroll()
      document.removeEventListener('keydown', handleKey)
    }
  }, [sidebarOpen])

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await logout()
      toast.success('Sesión cerrada', 'Tu sesión se cerró correctamente.')
      navigate('/login', { replace: true })
    } catch (err) {
      toast.error('No se pudo cerrar la sesión', err.message)
    } finally {
      setLoggingOut(false)
      setConfirmLogout(false)
    }
  }

  return (
    <>
      <a href="#contenido" className="skip-link">
        Saltar al contenido
      </a>

      <div className={`app-shell${sidebarOpen ? ' sidebar-open' : ''}`}>
        <Sidebar
          label={label}
          nav={nav}
          user={user}
          onLogout={() => setConfirmLogout(true)}
          onNavigate={() => setSidebarOpen(false)}
        />

        {sidebarOpen && (
          <div
            className="sidebar-overlay"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        <div className="main-content">
          <Topbar
            title={title}
            section={section}
            user={user}
            isAdmin={isAdmin}
            onMenu={() => setSidebarOpen(true)}
          />
          <main className="page" id="contenido">
            {children}
          </main>
          {showMobileNav && (
            <MobileNav nav={nav} />
          )}
        </div>
      </div>

      {confirmLogout && (
        <ConfirmDialog
          title="Cerrar sesión"
          description="Se cerrará tu sesión y volverás a la pantalla de acceso. ¿Deseas continuar?"
          confirmLabel="Cerrar sesión"
          variant="warning"
          icon="logout"
          loading={loggingOut}
          onCancel={() => setConfirmLogout(false)}
          onConfirm={handleLogout}
        />
      )}
    </>
  )
}

export default AppLayout
