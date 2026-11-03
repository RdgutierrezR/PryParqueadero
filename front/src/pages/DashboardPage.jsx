import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { usePolling } from '../hooks/usePolling.js'
import { accessService } from '../services/access.js'
import { reportService } from '../services/reports.js'
import { Alert } from '../components/Alert.jsx'
import { OccupancyBar, OccupancyDonut, StatCard, occupancyLevel } from '../components/StatCard.jsx'
import { PageHeader } from '../components/PageHeader.jsx'
import { BarList, HourChart } from '../components/Charts.jsx'
import { Icon } from '../components/Icon.jsx'
import AdminLayout from '../layouts/AdminLayout.jsx'
import { PERSON_TYPE_LABELS, VEHICLE_TYPE_LABELS } from '../utils/format.js'

function formatTime(date) {
  return date ? date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : '—'
}

export default function DashboardPage() {
  const [occupancy, setOccupancy] = useState(null)
  const [summary, setSummary] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [updatedAt, setUpdatedAt] = useState(null)

  const load = useCallback(async () => {
    try {
      const [occ, rep] = await Promise.all([
        accessService.occupancy(),
        reportService.summary(undefined, undefined),
      ])
      setOccupancy(occ.data)
      setSummary(rep.data)
      setError('')
      setUpdatedAt(new Date())
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Refresca automáticamente para reflejar cambios de otras sesiones.
  usePolling(load, 10000)

  const refresh = async () => {
    setRefreshing(true)
    try {
      await load()
    } finally {
      setRefreshing(false)
    }
  }

  const capacity = occupancy?.capacity ?? 0
  const inside = occupancy?.inside ?? 0
  const available = occupancy?.available ?? Math.max(capacity - inside, 0)
  const { pct, level } = occupancyLevel(inside, capacity)
  const percent = Math.round(pct * 100)
  const isFull = Boolean(occupancy?.is_full)
  const nearFull = !isFull && percent >= 80

  const personEntries = Object.entries(summary?.by_person_type || {}).map(([key, value]) => ({
    label: PERSON_TYPE_LABELS[key] || key,
    value,
  }))
  const vehicleEntries = Object.entries(summary?.by_vehicle_type || {}).map(([key, value]) => ({
    label: VEHICLE_TYPE_LABELS[key] || key,
    value,
    tone: key === 'motocicleta' ? 'violet' : '',
  }))

  return (
    <AdminLayout title="Panel principal">
      <PageHeader
        eyebrow="Resumen operativo"
        title="Panel principal"
        description="Estado del parqueadero y actividad registrada durante el día de hoy."
        actions={
          <>
            <span className="meta-row" aria-live="polite">
              <Icon name="clock" size={14} />
              Actualizado {formatTime(updatedAt)}
            </span>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={refresh}
              disabled={refreshing}
            >
              <Icon name="refresh" size={16} />
              {refreshing ? 'Actualizando…' : 'Actualizar'}
            </button>
            <Link to="/admin/solicitudes" className="btn btn-primary">
              <Icon name="inbox" size={16} />
              Revisar solicitudes
            </Link>
          </>
        }
      />

      {error && (
        <Alert type="error" title="No se pudo cargar el panel">
          {error}
        </Alert>
      )}

      {loading && !occupancy ? (
        <>
          <div className="kpi-grid" aria-hidden="true">
            {Array.from({ length: 5 }).map((_, index) => (
              <span className="skeleton kpi" key={index} />
            ))}
          </div>
          <div className="card">
            <span className="skeleton" style={{ width: '45%', height: 18 }} />
            <div className="mt-2">
              <span className="skeleton" style={{ width: '100%', height: 140 }} />
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="kpi-grid">
            <StatCard
              label="Capacidad total"
              value={occupancy ? capacity : '—'}
              icon="parking"
              tone="violet"
              hint={occupancy?.capacity_is_demo ? 'Valor de demostración' : 'Capacidad configurada'}
            />
            <StatCard
              label="Vehículos dentro"
              value={occupancy ? inside : '—'}
              icon="car"
              tone="info"
              hint={occupancy ? `${percent}% de ocupación` : ''}
            />
            <StatCard
              label="Espacios disponibles"
              value={occupancy ? available : '—'}
              icon="check-circle"
              tone={isFull ? 'danger' : 'success'}
              hint={isFull ? 'Sin disponibilidad' : 'Listos para asignar'}
            />
            <StatCard
              label="Entradas de hoy"
              value={summary ? summary.entries : '—'}
              icon="login"
              tone="success"
              hint="Movimientos con entrada hoy"
            />
            <StatCard
              label="Salidas de hoy"
              value={summary ? summary.exits : '—'}
              icon="logout"
              tone="warning"
              hint="Movimientos cerrados hoy"
            />
          </div>

          <section className="card" aria-labelledby="occupancy-title">
            <div className="card-header">
              <div className="card-heading">
                <h2 className="card-title" id="occupancy-title">
                  <Icon name="gauge" size={18} />
                  Ocupación del parqueadero
                </h2>
                <p className="card-subtitle">
                  Estado actualizado automáticamente cada 10 segundos.
                </p>
              </div>
              <span className={`badge ${isFull ? 'badge-danger' : nearFull ? 'badge-warning' : 'badge-success'}`}>
                <span className="dot" aria-hidden="true" />
                {isFull ? 'Sin disponibilidad' : nearFull ? 'Capacidad alta' : 'Operación normal'}
              </span>
            </div>

            {occupancy ? (
              <div className="occupancy-layout">
                <OccupancyDonut inside={inside} capacity={capacity} />

                <div>
                  <div className="occupancy-stats">
                    <div className="mini-stat">
                      <div className="label">Ocupados</div>
                      <div className="value">{inside}</div>
                    </div>
                    <div className="mini-stat">
                      <div className="label">Disponibles</div>
                      <div className="value">{available}</div>
                    </div>
                    <div className="mini-stat">
                      <div className="label">Capacidad</div>
                      <div className="value">{capacity}</div>
                    </div>
                  </div>

                  <OccupancyBar inside={inside} capacity={capacity} />

                  {isFull && (
                    <Alert type="error" title="Parqueadero lleno">
                      No se permiten nuevas entradas hasta que se registre una salida.
                    </Alert>
                  )}
                  {nearFull && (
                    <Alert type="warning" title="Capacidad próxima al límite">
                      Quedan {available} {available === 1 ? 'espacio disponible' : 'espacios disponibles'}.
                      Supervisa las próximas entradas.
                    </Alert>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-muted">Sin datos de ocupación por el momento.</p>
            )}
          </section>

          <div className="split-grid">
            <section className="card" aria-labelledby="person-types-title">
              <div className="card-header">
                <div className="card-heading">
                  <h2 className="card-title" id="person-types-title">
                    <Icon name="users" size={18} />
                    Entradas por tipo de usuario
                  </h2>
                  <p className="card-subtitle">Movimientos de hoy según el responsable del vehículo.</p>
                </div>
                <span className="chip">
                  Total <strong>{summary?.entries ?? 0}</strong>
                </span>
              </div>
              <BarList items={personEntries} total={summary?.entries ?? 0} />
            </section>

            <section className="card" aria-labelledby="vehicle-types-title">
              <div className="card-header">
                <div className="card-heading">
                  <h2 className="card-title" id="vehicle-types-title">
                    <Icon name="car" size={18} />
                    Entradas por tipo de vehículo
                  </h2>
                  <p className="card-subtitle">Distribución de los ingresos registrados hoy.</p>
                </div>
              </div>
              <BarList items={vehicleEntries} total={summary?.entries ?? 0} />
            </section>
          </div>

          <section className="card" aria-labelledby="hourly-title">
            <div className="card-header">
              <div className="card-heading">
                <h2 className="card-title" id="hourly-title">
                  <Icon name="activity" size={18} />
                  Actividad por hora
                </h2>
                <p className="card-subtitle">Entradas registradas en cada hora del día (hora local).</p>
              </div>
            </div>
            <HourChart data={summary?.hourly_distribution || []} emptyText="Aún no hay entradas registradas hoy." />
          </section>
        </>
      )}
    </AdminLayout>
  )
}
