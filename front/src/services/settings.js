import { api } from './api.js'

export const settingService = {
  get: () => api.get('/settings'),
  update: (capacity) => api.put('/settings', { capacity }),
}

export const userService = {
  list: () => api.get('/users'),
  create: (data) => api.post('/users', data),
  setStatus: (id, isActive) => api.put(`/users/${id}/status`, { is_active: isActive }),
}
