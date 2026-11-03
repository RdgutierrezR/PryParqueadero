import AppLayout from './AppLayout.jsx'

const GUARD_NAV = [
  {
    section: 'Operación',
    items: [
      { to: '/acceso', label: 'Registrar entrada / salida', icon: 'scan', end: true },
      { to: '/acceso/ocupacion', label: 'Ocupación actual', icon: 'gauge' },
    ],
  },
  {
    section: 'Consulta',
    items: [{ to: '/acceso/historial', label: 'Historial', icon: 'history' }],
  },
]

/**
 * Layout del vigilante: interfaz enfocada en el control de acceso.
 */
export function GuardLayout({ title, section = 'Control de acceso', children }) {
  return (
    <AppLayout title={title} section={section} label="Control de acceso" nav={GUARD_NAV}>
      {children}
    </AppLayout>
  )
}

export default GuardLayout
