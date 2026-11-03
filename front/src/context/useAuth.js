import { useContext } from 'react'
import { AuthContext } from '../context/AuthContext.jsx'

/** Acceso rápido al contexto de autenticación. */
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider.')
  }
  return context
}
