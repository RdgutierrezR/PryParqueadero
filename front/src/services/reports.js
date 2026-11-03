import { api } from './api.js'

function range(start, end) {
  const params = new URLSearchParams()
  if (start) params.set('start', start)
  if (end) params.set('end', end)
  return params.toString()
}

export const reportService = {
  summary: (start, end) => api.get(`/reports/summary?${range(start, end)}`),
  /**
   * Historial de movimientos.
   * @param {string} start fecha inicial (YYYY-MM-DD)
   * @param {string} end fecha final (YYYY-MM-DD)
   * @param {string} plate filtro opcional por placa
   * @param {'inside'|'outside'|undefined} status fila de estado; "inside" ignora las fechas
   */
  history: (start, end, plate, status) => {
    const params = new URLSearchParams()
    if (status) params.set('status', status)
    if (status !== 'inside') {
      if (start) params.set('start', start)
      if (end) params.set('end', end)
    }
    if (plate) params.set('plate', plate)
    const query = params.toString()
    return api.get(`/reports/history${query ? `?${query}` : ''}`)
  },
  inside: () => api.get('/reports/inside'),
  exportUrl: (start, end) => `/api/reports/export?${range(start, end)}`,
}
