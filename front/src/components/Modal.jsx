import { useEffect, useId, useRef } from 'react'
import { Icon } from './Icon.jsx'
import { lockScroll, unlockScroll } from '../utils/scrollLock.js'

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Ventana modal accesible: bloquea el scroll, atrapa el foco, cierra con Escape
 * y restaura el foco al elemento que la abrió.
 */
export function Modal({
  title,
  subtitle,
  icon,
  iconTone = '',
  size = 'md',
  children,
  onClose,
  footer,
  closeOnBackdrop = true,
  busy = false,
  labelledBy,
}) {
  const panelRef = useRef(null)
  const previouslyFocused = useRef(null)
  const onCloseRef = useRef(onClose)
  const busyRef = useRef(busy)
  const generatedId = useId()
  const titleId = labelledBy || `modal-title-${generatedId}`

  useEffect(() => {
    onCloseRef.current = onClose
    busyRef.current = busy
  }, [onClose, busy])

  useEffect(() => {
    previouslyFocused.current = document.activeElement
    lockScroll()

    const panel = panelRef.current
    const preferred =
      panel?.querySelector('input:not([type="hidden"]), select, textarea') ||
      panel?.querySelector(FOCUSABLE)
    if (preferred) {
      preferred.focus()
    } else {
      panel?.focus()
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        if (!busyRef.current) onCloseRef.current?.()
        return
      }
      if (event.key !== 'Tab' || !panel) return
      const items = Array.from(panel.querySelectorAll(FOCUSABLE)).filter(
        (element) => element.offsetParent !== null
      )
      if (items.length === 0) {
        event.preventDefault()
        return
      }
      const first = items[0]
      const last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      unlockScroll()
      if (previouslyFocused.current instanceof HTMLElement) {
        previouslyFocused.current.focus()
      }
    }
  }, [])

  const sizeClass = size === 'lg' ? 'modal-lg' : size === 'sm' ? 'modal-sm' : ''

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && closeOnBackdrop && !busy) onClose?.()
      }}
    >
      <div
        ref={panelRef}
        className={`modal ${sizeClass}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <div className="modal-header">
          <div className="modal-title-wrap">
            {icon && (
              <span className={`modal-title-icon ${iconTone}`.trim()} aria-hidden="true">
                <Icon name={icon} size={19} />
              </span>
            )}
            <div>
              <h3 id={titleId}>{title}</h3>
              {subtitle && <p className="modal-subtitle">{subtitle}</p>}
            </div>
          </div>
          <button
            type="button"
            className="modal-close"
            onClick={() => onClose?.()}
            aria-label="Cerrar ventana"
            disabled={busy}
          >
            <Icon name="x" size={18} />
          </button>
        </div>

        <div className="modal-body">{children}</div>

        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  )
}

export default Modal
