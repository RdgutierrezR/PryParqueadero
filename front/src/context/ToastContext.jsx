import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { ToastViewport } from '../components/ToastViewport.jsx'

const ToastContext = createContext(null)

const DEFAULT_DURATION = {
  success: 4500,
  info: 5000,
  warning: 6000,
  error: 7500,
  loading: 0,
}

/**
 * Sistema centralizado de notificaciones (toasts).
 *
 * Uso:
 *   const toast = useToast()
 *   toast.success('Vehículo registrado', 'La solicitud quedó pendiente de aprobación.')
 *   toast.error('No fue posible guardar', detalleDelError)
 *
 * Los mensajes de éxito solo deben mostrarse después de una respuesta
 * exitosa del backend.
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef(new Map())
  const sequence = useRef(0)

  const clearTimer = useCallback((id) => {
    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
  }, [])

  const remove = useCallback(
    (id) => {
      clearTimer(id)
      setToasts((current) => current.filter((toast) => toast.id !== id))
    },
    [clearTimer]
  )

  const dismiss = useCallback(
    (id) => {
      clearTimer(id)
      setToasts((current) =>
        current.map((toast) => (toast.id === id ? { ...toast, leaving: true } : toast))
      )
      window.setTimeout(() => remove(id), 190)
    },
    [clearTimer, remove]
  )

  const push = useCallback(
    (type, title, message = '', options = {}) => {
      const id = ++sequence.current
      const duration =
        options.duration !== undefined ? options.duration : DEFAULT_DURATION[type] ?? 5000

      setToasts((current) => [
        ...current.slice(-3),
        { id, type, title, message, duration },
      ])

      if (duration > 0) {
        timers.current.set(
          id,
          window.setTimeout(() => dismiss(id), duration)
        )
      }
      return id
    },
    [dismiss]
  )

  useEffect(() => {
    const map = timers.current
    return () => {
      map.forEach((timer) => clearTimeout(timer))
      map.clear()
    }
  }, [])

  const api = useMemo(
    () => ({
      success: (title, message, options) => push('success', title, message, options),
      error: (title, message, options) => push('error', title, message, options),
      warning: (title, message, options) => push('warning', title, message, options),
      info: (title, message, options) => push('info', title, message, options),
      loading: (title, message, options) =>
        push('loading', title, message, { duration: 0, ...options }),
      show: push,
      dismiss,
      clear: () => {
        timers.current.forEach((timer) => clearTimeout(timer))
        timers.current.clear()
        setToasts([])
      },
    }),
    [push, dismiss]
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast debe usarse dentro de un ToastProvider.')
  }
  return context
}
