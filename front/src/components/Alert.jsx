import { Icon } from './Icon.jsx'

/** Mensaje de alerta en línea (persistente, no emergente). */
export function Alert({ type = 'info', title, children, action }) {
  if (!children && !title) return null

  const config = {
    success: { icon: 'check-circle', label: 'Éxito' },
    error: { icon: 'alert-circle', label: 'Error' },
    warning: { icon: 'alert-triangle', label: 'Advertencia' },
    info: { icon: 'info', label: 'Información' },
  }[type] || { icon: 'info', label: 'Información' }

  return (
    <div className={`alert alert-${type}`} role={type === 'error' ? 'alert' : 'status'}>
      <span className="alert-icon" aria-hidden="true">
        <Icon name={config.icon} size={18} />
      </span>
      <div className="alert-body grow">
        {title && <div className="alert-title">{title || config.label}</div>}
        {children}
      </div>
      {action && <div className="alert-action">{action}</div>}
    </div>
  )
}

export default Alert
