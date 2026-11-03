import AppLayout from './AppLayout.jsx'

const ADMIN_NAV = [
  {
    section: 'General',
    items: [
      { to: '/admin', label: 'Panel principal', icon: 'dashboard', end: true },
      { to: '/admin/solicitudes', label: 'Solicitudes', icon: 'inbox' },
    ],
  },
  {
    section: 'Gestión',
    items: [
      { to: '/admin/vehiculos', label: 'Vehículos', icon: 'car' },
      { to: '/admin/personas', label: 'Personas', icon: 'users' },
    ],
  },
  {
    section: 'Análisis',
    items: [
      { to: '/admin/historial', label: 'Historial', icon: 'history' },
      { to: '/admin/reportes', label: 'Reportes', icon: 'chart' },
    ],
  },
  {
    section: 'Sistema',
    items: [{ to: '/admin/configuracion', label: 'Configuración', icon: 'settings' }],
  },
]

/**
 * Layout del administrador: barra lateral con todas las secciones de gestión.
 */
export function AdminLayout({ title, section = 'Administración', children }) {
  return (
    <AppLayout
      title={title}
      section={section}
      label="Panel administrativo"
      nav={ADMIN_NAV}
    >
      {children}
    </AppLayout>
  )
}

export default AdminLayout
