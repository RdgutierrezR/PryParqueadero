/** Funciones de formato para mostrar datos al usuario. */

/** Formatea una fecha ISO a formato local legible. */
export function formatDateTime(iso) {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('es-CO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatDate(iso) {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('es-CO')
}

/** Fecha de hoy en formato YYYY-MM-DD (para los filtros de reportes). */
export function todayISO() {
  const now = new Date()
  const offset = now.getTimezoneOffset()
  const local = new Date(now.getTime() - offset * 60 * 1000)
  return local.toISOString().slice(0, 10)
}

/** Devuelve la fecha YYYY-MM-DD de hace N días. */
export function daysAgoISO(days) {
  const now = new Date()
  now.setDate(now.getDate() - days)
  const offset = now.getTimezoneOffset()
  const local = new Date(now.getTime() - offset * 60 * 1000)
  return local.toISOString().slice(0, 10)
}

export const PERSON_TYPE_LABELS = {
  estudiante: 'Estudiante',
  docente: 'Docente',
  administrativo: 'Administrativo',
  visitante: 'Visitante',
}

export const VEHICLE_TYPE_LABELS = {
  automovil: 'Automóvil',
  motocicleta: 'Motocicleta',
}

export const STATUS_LABELS = {
  pendiente: 'Pendiente',
  autorizado: 'Autorizado',
  rechazado: 'Rechazado',
  suspendido: 'Suspendido',
}
