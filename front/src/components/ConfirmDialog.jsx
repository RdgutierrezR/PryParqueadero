import { Modal } from './Modal.jsx'
import { Icon } from './Icon.jsx'

/**
 * Diálogo de confirmación para acciones sensibles.
 * La acción solo se ejecuta al pulsar el botón de confirmación;
 * nunca al abrir el diálogo.
 */
export function ConfirmDialog({
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
  icon = 'alert-triangle',
  loading = false,
  onConfirm,
  onCancel,
  children,
}) {
  const buttonClass =
    variant === 'danger' ? 'btn btn-danger' : variant === 'warning' ? 'btn btn-warning' : 'btn btn-primary'

  return (
    <Modal
      title={title}
      size="sm"
      onClose={onCancel}
      busy={loading}
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </button>
          <button type="button" className={buttonClass} onClick={onConfirm} disabled={loading}>
            {loading && <span className="spinner" />}
            {loading ? 'Procesando…' : confirmLabel}
          </button>
        </>
      }
    >
      <div className="confirm-body">
        <span className={`confirm-icon ${variant}`} aria-hidden="true">
          <Icon name={icon} size={22} />
        </span>
        <div className="confirm-text">
          {description}
          {children}
        </div>
      </div>
    </Modal>
  )
}

export default ConfirmDialog
