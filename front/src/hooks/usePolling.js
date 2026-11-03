import { useEffect, useRef, useState } from 'react'

/**
 * Ejecuta una función cada cierto intervalo (para refrescar ocupación, etc.).
 * Se detiene automáticamente al desmontar el componente.
 */
export function usePolling(callback, intervalMs = 10000, deps = []) {
  const savedCallback = useRef(callback)

  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  useEffect(() => {
    let active = true
    const tick = async () => {
      if (!active) return
      await savedCallback.current()
    }
    tick()
    const id = setInterval(tick, intervalMs)
    return () => {
      active = false
      clearInterval(id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intervalMs, ...deps])
}

/** Hook simple de mensajes (éxito/error) con autoocultado. */
export function useNotification(timeoutMs = 4000) {
  const [notification, setNotification] = useState(null)

  const show = (type, message) => {
    setNotification({ type, message })
  }

  useEffect(() => {
    if (!notification) return
    const id = setTimeout(() => setNotification(null), timeoutMs)
    return () => clearTimeout(id)
  }, [notification, timeoutMs])

  return {
    notification,
    success: (message) => show('success', message),
    error: (message) => show('error', message),
    clear: () => setNotification(null),
  }
}
