/**
 * Bloqueo de desplazamiento compartido.
 *
 * Varios componentes (modales y el menú lateral móvil) pueden necesitar
 * bloquear el scroll del documento al mismo tiempo. Un contador evita que
 * uno de ellos restaure el scroll mientras el otro sigue abierto.
 */
let lockCount = 0
let previousOverflow = ''

export function lockScroll() {
  if (lockCount === 0) {
    previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  }
  lockCount += 1
}

export function unlockScroll() {
  lockCount = Math.max(lockCount - 1, 0)
  if (lockCount === 0) {
    document.body.style.overflow = previousOverflow
    previousOverflow = ''
  }
}
