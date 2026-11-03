import { createContext, useCallback, useEffect, useState } from 'react'
import { authService } from '../services/auth.js'
import { setCsrfToken } from '../services/api.js'

export const AuthContext = createContext(null)

/**
 * Provee el estado de autenticación a toda la aplicación.
 * Al cargar consulta /auth/me para restaurar la sesión y el token CSRF.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const res = await authService.me()
      if (res.data?.user) {
        setUser(res.data.user)
        setCsrfToken(res.data.csrf_token)
      } else {
        setUser(null)
      }
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const login = useCallback(async (username, password) => {
    const res = await authService.login(username, password)
    setCsrfToken(res.data.csrf_token)
    setUser(res.data.user)
    return res.data.user
  }, [])

  const logout = useCallback(async () => {
    try {
      await authService.logout()
    } finally {
      setUser(null)
      setCsrfToken(null)
    }
  }, [])

  const value = {
    user,
    loading,
    login,
    logout,
    isAdmin: user?.role === 'administrador',
    isGuard: user?.role === 'vigilante',
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
