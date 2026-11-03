import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth.js'
import { Alert } from '../components/Alert.jsx'
import { Icon } from '../components/Icon.jsx'
import logo from '../assets/logo-cul.svg'

const FEATURES = [
  { icon: 'scan', text: 'Validación de acceso por placa y código QR.' },
  { icon: 'gauge', text: 'Entradas, salidas y ocupación actualizadas al instante.' },
  { icon: 'chart', text: 'Historial, reportes y exportación de movimientos.' },
]

export default function LoginPage() {
  const { login, user } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    document.title = 'Iniciar sesión · Parqueadero CUL'
  }, [])

  useEffect(() => {
    if (user) {
      navigate(user.role === 'administrador' ? '/admin' : '/acceso', { replace: true })
    }
  }, [user, navigate])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    const validation = {}
    if (!username.trim()) validation.username = 'Ingresa tu usuario.'
    if (!password) validation.password = 'Ingresa tu contraseña.'
    setErrors(validation)
    if (Object.keys(validation).length > 0) return

    setLoading(true)
    try {
      const logged = await login(username.trim(), password)
      navigate(logged.role === 'administrador' ? '/admin' : '/acceso', { replace: true })
    } catch (err) {
      setError(err.message || 'No se pudo iniciar sesión.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <section className="login-hero" aria-label="Información del sistema">
        <div className="login-hero-brand">
          <img src={logo} alt="" />
          <div>
            <strong>Parqueadero CUL</strong>
            <span>Control y gestión del parqueadero</span>
          </div>
        </div>

        <div className="login-hero-copy">
          <h1>Control total del parqueadero, en un solo lugar.</h1>
          <p>
            Plataforma administrativa para registrar accesos, supervisar la ocupación y
            consultar la trazabilidad completa de vehículos y personas.
          </p>
        </div>

        <ul className="login-features">
          {FEATURES.map((feature) => (
            <li key={feature.icon}>
              <span className="feature-icon" aria-hidden="true">
                <Icon name={feature.icon} size={16} />
              </span>
              {feature.text}
            </li>
          ))}
        </ul>

        <span className="login-hero-foot">
          Sistema académico de demostración · Corporación Universitaria
        </span>
      </section>

      <section className="login-panel">
        <div className="login-card">
          <div className="login-brand">
            <img src={logo} alt="Logotipo del Parqueadero CUL" className="logo" />
            <h1>Iniciar sesión</h1>
            <p>Accede con las credenciales asignadas a tu rol.</p>
          </div>

          {error && (
            <Alert type="error" title="No se pudo iniciar sesión">
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="username">
                Usuario<span className="field-required" aria-hidden="true">*</span>
              </label>
              <input
                id="username"
                className={`form-control${errors.username ? ' is-invalid' : ''}`}
                value={username}
                onChange={(event) => {
                  setUsername(event.target.value)
                  if (errors.username) setErrors((current) => ({ ...current, username: '' }))
                }}
                autoComplete="username"
                autoFocus
                placeholder="Ej: admin"
                aria-invalid={Boolean(errors.username)}
                aria-describedby={errors.username ? 'username-error' : undefined}
              />
              {errors.username && (
                <div className="field-error" id="username-error">
                  <Icon name="alert-circle" size={13} />
                  <span>{errors.username}</span>
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="password">
                Contraseña<span className="field-required" aria-hidden="true">*</span>
              </label>
              <div className="password-field">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className={`form-control${errors.password ? ' is-invalid' : ''}`}
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value)
                    if (errors.password) setErrors((current) => ({ ...current, password: '' }))
                  }}
                  autoComplete="current-password"
                  placeholder="Tu contraseña"
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  aria-pressed={showPassword}
                >
                  <Icon name={showPassword ? 'eye-off' : 'eye'} size={17} />
                </button>
              </div>
              {errors.password && (
                <div className="field-error" id="password-error">
                  <Icon name="alert-circle" size={13} />
                  <span>{errors.password}</span>
                </div>
              )}
            </div>

            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
              {loading && <span className="spinner" />}
              {loading ? 'Ingresando…' : 'Iniciar sesión'}
            </button>
          </form>

          <p className="login-footer">
            Sistema académico de demostración. No representa datos reales de la CUL.
          </p>
        </div>
      </section>
    </div>
  )
}
