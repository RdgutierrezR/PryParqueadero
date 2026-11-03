import { api } from './api.js'

export const personService = {
  list: (q) => api.get(`/persons${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  create: (data) => api.post('/persons', data),
  update: (id, data) => api.put(`/persons/${id}`, data),
  remove: (id) => api.del(`/persons/${id}`),
}
