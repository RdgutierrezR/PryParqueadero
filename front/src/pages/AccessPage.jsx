import { useCallback, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { accessService } from '../services/access.js'
import { Alert } from '../components/Alert.jsx'
import { StatusBadge, Badge } from '../components/Badge.jsx'
import { QRScanner } from '../components/QRScanner.jsx'
import { PageHeader } from '../components/PageHeader.jsx'
import { FormField } from '../components/FormField.jsx'
import { Icon } from '../components/Icon.jsx'
import { useToast } from '../context/ToastContext.jsx'
import GuardLayout from '../layouts/GuardLayout.jsx'
import { PERSON_TYPE_LABELS, VEHICLE_TYPE_LABELS } from '../utils/format.js'
import { normalizePlate } from '../utils/validators.js'

export default function AccessPage() {
  const toast = useToast()
  const [plate, setPlate] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [fieldError, setFieldError] = useState('')
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState('plate') // 'plate' | 'qr'
  const busyRef = useRef(false)

  const reset = () => {
    setResult(null)
    setPlate('')
    setError('')
    setFieldError('')
  }

  const validateByPlate = async (event) => {
    event?.preventDefault()
    const normalized = normalizePlate(plate)
    if (!normalized) {
      setFieldError('Escribe una placa para consultar.')
      return
    }

    setFieldError('')
    setLoading(true)
    setResult(null)
    setError('')
    try {
      const res = await accessService.search(normalized)
      setResult(res.data)
      setPlate(normalized)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // El QR solo contiene el token; SIEMPRE se valida contra el backend.
  const handleQrDetected = useCallback(
    async (token) => {
      if (!token || busyRef.current) return
      busyRef.current = true
      setLoading(true)
      setError('')
      try {
        const res = await accessService.validate({ token })
        setResult(res.data)
      } catch (err) {
        setError(err.message)
      } finally {
        busyRef.current = false
        setLoading(false)
      }
    },
    [],
  )

  const handleEntry = async () => {
    if (!result?.can_enter) return
    setLoading(true)
    try {
      const res = await accessService.entry({ plate: result.vehicle.plate })
      toast.success('Entrada registrada', res.message)
      // Tras entrar, el vehículo queda dentro: refrescar el estado mostrado.
      const refreshed = await accessService.search(result.vehicle.plate)
      setResult(refreshed.data)
    } catch (err) {
      toast.error('No fue posible registrar la entrada', err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleExit = async () => {
    if (!result?.can_exit) return
    setLoading(true)
    try {
      const res = await accessService.exit({ plate: result.vehicle.plate })
      toast.success('Salida registrada', res.message)
      reset()
    } catch (err) {
      toast.error('No fue posible registrar la salida', err.message)
    } finally {
      setLoading(false)
    }
  }

  const canProceed = result?.can_enter || result?.can_exit

  return (
    <GuardLayout title="Registrar acceso">
      <PageHeader
        eyebrow="Operación"
        title="Registrar entrada / salida"
        description="Valida la placa o el código QR del vehículo antes de registrar el movimiento."
        actions={
          <Link to="/acceso/ocupacion" className="btn btn-secondary">
            <Icon name="gauge" size={16} />
            Ver ocupación
          </Link>
        }
      />

      {error && (
        <Alert type="error" title="No se pudo completar la consulta">
          {error}
        </Alert>
      )}

      <section className="card" aria-labelledby="access-search-title">
        <div className="card-header">
          <div className="card-heading">
            <h2 className="card-title" id="access-search-title">
              <Icon name="scan" size={18} />
              Identificar vehículo
            </h2>
            <p className="card-subtitle">Consulta por placa o escanea el código QR del vehículo.</p>
          </div>
        </div>

        <div className="segmented mode-tabs" role="group" aria-label="Método de identificación">
          <button
            type="button"
            className="segment"
            aria-pressed={mode === 'plate'}
            onClick={() => setMode('plate')}
          >
            <Icon name="search" size={14} />
            Buscar por placa
          </button>
          <button
            type="button"
            className="segment"
            aria-pressed={mode === 'qr'}
            onClick={() => setMode('qr')}
          >
            <Icon name="qr" size={14} />
            Escanear QR
          </button>
        </div>

        {mode === 'plate' ? (
          <form className="access-search" onSubmit={validateByPlate} noValidate>
            <FormField
              label="Placa del vehículo"
              htmlFor="access-plate"
              required
              error={fieldError}
              className="grow"
            >
              <div className="search-field">
                <span className="search-icon" aria-hidden="true">
                  <Icon name="search" size={16} />
                </span>
                <input
                  id="access-plate"
                  className={`form-control mono${fieldError ? ' is-invalid' : ''}`}
                  value={plate}
                  onChange={(event) => {
                    setPlate(event.target.value)
                    if (fieldError) setFieldError('')
                  }}
                  placeholder="Ej: ABC123"
                  autoComplete="off"
                  autoFocus
                  aria-invalid={Boolean(fieldError)}
                  aria-describedby={fieldError ? 'access-plate-error' : undefined}
                />
              </div>
            </FormField>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner" /> : <Icon name="search" size={16} />}
              {loading ? 'Consultando…' : 'Consultar'}
            </button>
          </form>
        ) : (
          <QRScanner onDetected={handleQrDetected} active={mode === 'qr'} />
        )}
      </section>

      {result && (
        <section
          className={`card vehicle-result ${canProceed ? 'ok' : 'blocked'}`}
          aria-labelledby="access-result-title"
        >
          <div className="card-header">
            <div className="card-heading">
              <div className="flex items-center gap-1 wrap">
                <span className="plate" style={{ fontSize: '0.95rem', padding: '0.28rem 0.7rem' }}>
                  {result.vehicle.plate}
                </span>
                <h2 className="card-title" id="access-result-title">
                  {result.vehicle.person?.full_name || 'Sin responsable registrado'}
                </h2>
              </div>
              <p className="card-subtitle">
                Consulta realizada correctamente. Verifica la información antes de registrar el
                movimiento.
              </p>
            </div>
            <div className="flex gap-1 wrap">
              <StatusBadge status={result.vehicle.status} />
              <Badge tone={result.vehicle.inside ? 'inside' : 'neutral'} dot>
                {result.vehicle.inside ? 'Dentro' : 'Fuera'}
              </Badge>
            </div>
          </div>

          <div className="vehicle-meta">
            <div>
              <div className="label">Tipo de vehículo</div>
              <div className="value">
                {VEHICLE_TYPE_LABELS[result.vehicle.vehicle_type] || result.vehicle.vehicle_type}
              </div>
            </div>
            <div>
              <div className="label">Tipo de persona</div>
              <div className="value">
                {PERSON_TYPE_LABELS[result.vehicle.person?.person_type] || '—'}
              </div>
            </div>
            <div>
              <div className="label">Espacios disponibles</div>
              <div className="value">{result.occupancy?.available ?? '—'}</div>
            </div>
            <div>
              <div className="label">Capacidad total</div>
              <div className="value">{result.occupancy?.capacity ?? '—'}</div>
            </div>
          </div>

          {result.can_enter && (
            <Alert type="success" title="Autorizado para ingresar">
              El vehículo está autorizado y hay disponibilidad. Puedes registrar la entrada.
            </Alert>
          )}
          {result.can_exit && (
            <Alert type="info" title="Salida habilitada">
              El vehículo está dentro del parqueadero y puede registrar su salida.
            </Alert>
          )}

          {result.reasons?.length > 0 && (
            <Alert
              type="warning"
              title={
                canProceed
                  ? result.can_enter
                    ? 'Observaciones'
                    : 'Entrada no disponible'
                  : 'No puede ingresar'
              }
            >
              <ul style={{ margin: 0, paddingLeft: '1.1rem' }}>
                {result.reasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            </Alert>
          )}

          <div className="access-actions">
            {result.can_enter && (
              <button type="button" className="btn btn-success btn-lg" onClick={handleEntry} disabled={loading}>
                {loading ? <span className="spinner" /> : <Icon name="login" size={17} />}
                {loading ? 'Registrando…' : 'Registrar entrada'}
              </button>
            )}
            {result.can_exit && (
              <button type="button" className="btn btn-primary btn-lg" onClick={handleExit} disabled={loading}>
                {loading ? <span className="spinner" /> : <Icon name="logout" size={17} />}
                {loading ? 'Registrando…' : 'Registrar salida'}
              </button>
            )}
            <button type="button" className="btn btn-secondary btn-lg" onClick={reset} disabled={loading}>
              <Icon name="refresh" size={16} />
              Nueva consulta
            </button>
          </div>
        </section>
      )}
    </GuardLayout>
  )
}
