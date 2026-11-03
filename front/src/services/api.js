/**
 * Cliente HTTP centralizado para consumir la API del backend.
 *
 * - Todas las peticiones van a /api (Vite lo redirige al backend Flask).
 * - Incluye las credenciales (cookie de sesión).
 * - Añade automáticamente el token CSRF en peticiones que modifican datos.
 * - Normaliza los errores del backend en un objeto Error legible.
 */

let csrfToken = null

export function setCsrfToken(token) {
  csrfToken = token
}

export function getCsrfToken() {
  return csrfToken
}

async function request(path, { method = 'GET', body, isForm = false } = {}) {
  const headers = {}
  const options = {
    method,
    credentials: 'include',
    headers,
  }

  if (body !== undefined) {
    if (isForm) {
      options.body = body
    } else {
      headers['Content-Type'] = 'application/json'
      options.body = JSON.stringify(body)
    }
  }

  // El backend exige el token CSRF en métodos que modifican datos.
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && csrfToken) {
    headers['X-CSRF-Token'] = csrfToken
  }

  const response = await fetch(`/api${path}`, options)

  // Respuestas CSV (descargas) se manejan aparte.
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    if (!response.ok) {
      throw new Error('Ocurrió un error al procesar la solicitud.')
    }
    return response
  }

  const data = await response.json()

  if (!response.ok || data.success === false) {
    const error = new Error(data.error || 'Ocurrió un error inesperado.')
    error.status = response.status
    error.errors = data.errors || null
    throw error
  }

  return data
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  del: (path) => request(path, { method: 'DELETE' }),
  getRaw: (path) => request(path, { method: 'GET' }),
}
