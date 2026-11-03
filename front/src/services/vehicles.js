import { api } from './api.js'

export const vehicleService = {
  list: (filters = {}) => {
    const params = new URLSearchParams()
    if (filters.status) params.set('status', filters.status)
    if (filters.type) params.set('type', filters.type)
    if (filters.plate) params.set('plate', filters.plate)
    const qs = params.toString()
    return api.get(`/vehicles${qs ? `?${qs}` : ''}`)
  },
  get: (id) => api.get(`/vehicles/${id}`),
  create: (data) => api.post('/vehicles', data),
  update: (id, data) => api.put(`/vehicles/${id}`, data),
  decide: (id, decision, observation) =>
    api.post(`/vehicles/${id}/decision`, { decision, observation }),
  history: (id) => api.get(`/vehicles/${id}/history`),
  pending: () => api.get('/vehicles?status=pendiente'),
  qrUrl: (id) => `/api/vehicles/${id}/qr.png`,
}
