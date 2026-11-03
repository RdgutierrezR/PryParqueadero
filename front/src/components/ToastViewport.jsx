import { Icon } from './Icon.jsx'

const TYPE_CONFIG = {
  success: { icon: 'check-circle', title: 'Operación exitosa' },
  error: { icon: 'alert-circle', title: 'Ocurrió un error' },
  warning: { icon: 'alert-triangle', title: 'Atención' },
  info: { icon: 'info', title: 'Información' },
  loading: { icon: 'refresh', title: 'Procesando' },
}

/** Contenedor de notificaciones apiladas, accesible para lectores de pantalla. */
export function ToastViewport({ toasts, onDismiss }) {
  return (
    <div className="toast-viewport" aria-live="polite" aria-atomic="false">
      {toasts.map((toast) => {
        const config = TYPE_CONFIG[toast.type] || TYPE_CONFIG.info
        return (
          <div
            key={toast.id}
            className={`toast ${toast.type}${toast.leaving ? ' leaving' : ''}`}
            role={toast.type === 'error' ? 'alert' : 'status'}
            style={toast.duration > 0 ? { '--toast-duration': `${toast.duration}ms` } : undefined}
          >
            <span className="toast-icon" aria-hidden="true">
              {toast.type === 'loading' ? (
                <span className="spinner" />
              ) : (
                <Icon name={config.icon} size={18} />
              )}
            </span>
            <div className="toast-content">
              <div className="toast-title">{toast.title || config.title}</div>
              {toast.message && <div className="toast-message">{toast.message}</div>}
            </div>
            <button
              type="button"
              className="toast-close"
              onClick={() => onDismiss(toast.id)}
              aria-label="Cerrar notificación"
            >
              <Icon name="x" size={15} />
            </button>
            {toast.duration > 0 && <span className="toast-progress" aria-hidden="true" />}
          </div>
        )
      })}
    </div>
  )
}

export default ToastViewport
