import { Icon } from './Icon.jsx'

/** Estado vacío con icono, título, descripción y acción opcional. */
export function EmptyState({ icon = 'inbox', title = 'Sin datos', text, action }) {
  return (
    <div className="empty-state">
      <span className="state-icon" aria-hidden="true">
        <Icon name={icon} size={22} />
      </span>
      <div className="state-title">{title}</div>
      {text && <div className="state-text">{text}</div>}
      {action && <div className="mt-1">{action}</div>}
    </div>
  )
}

/** Estado de carga con texto opcional. */
export function LoadingState({ text = 'Cargando información…' }) {
  return (
    <div className="loading-state" role="status">
      <span className="spinner lg" aria-hidden="true" />
      <div className="state-text">{text}</div>
    </div>
  )
}

/** Estado de error con opción de reintentar. */
export function ErrorState({ title = 'No se pudo cargar la información', text, onRetry }) {
  return (
    <div className="error-state" role="alert">
      <span className="state-icon" aria-hidden="true">
        <Icon name="alert-circle" size={22} />
      </span>
      <div className="state-title">{title}</div>
      {text && <div className="state-text">{text}</div>}
      {onRetry && (
        <button type="button" className="btn btn-secondary btn-sm mt-1" onClick={onRetry}>
          <Icon name="refresh" size={15} />
          Reintentar
        </button>
      )}
    </div>
  )
}

export default EmptyState
