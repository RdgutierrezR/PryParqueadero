import { STATUS_LABELS } from '../utils/format.js'
import { Icon } from './Icon.jsx'

/** Etiqueta genérica con tono semántico. */
export function Badge({ tone = 'neutral', dot = false, icon, children, className = '' }) {
  return (
    <span className={`badge badge-${tone} ${className}`.trim()}>
      {dot && <span className="dot" aria-hidden="true" />}
      {icon && <Icon name={icon} size={12} />}
      {children}
    </span>
  )
}

const STATUS_TONES = {
  pendiente: 'pendiente',
  autorizado: 'autorizado',
  rechazado: 'rechazado',
  suspendido: 'suspendido',
}

/** Estado de autorización del vehículo. */
export function StatusBadge({ status }) {
  const label = STATUS_LABELS[status] || status
  return (
    <Badge tone={STATUS_TONES[status] || 'neutral'} dot>
      {label}
    </Badge>
  )
}

/** Indica si el vehículo está dentro o fuera del parqueadero. */
export function InsideBadge({ inside }) {
  return (
    <Badge tone={inside ? 'inside' : 'outside'} dot>
      {inside ? 'Dentro' : 'Fuera'}
    </Badge>
  )
}

/** Rol de una cuenta del sistema. */
export function RoleBadge({ role }) {
  const isAdmin = role === 'administrador'
  return (
    <Badge tone={isAdmin ? 'violet' : 'info'} icon={isAdmin ? 'shield' : 'user-check'}>
      {isAdmin ? 'Administrador' : 'Vigilante'}
    </Badge>
  )
}

/** Estado activo/inactivo de una cuenta. */
export function AccountBadge({ active }) {
  return (
    <Badge tone={active ? 'success' : 'danger'} dot>
      {active ? 'Activa' : 'Inactiva'}
    </Badge>
  )
}

export default Badge
