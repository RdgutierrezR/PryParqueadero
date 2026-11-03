import { api } from './api.js'

export const accessService = {
  validate: (payload) => api.post('/access/validate', payload),
  search: (plate) => api.get(`/access/search?plate=${encodeURIComponent(plate)}`),
  entry: (payload) => api.post('/access/entry', payload),
  exit: (payload) => api.post('/access/exit', payload),
  occupancy: () => api.get('/access/occupancy'),
}
