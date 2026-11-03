import { useCallback, useState } from 'react'
import { accessService } from '../services/access.js'
import { Alert } from '../components/Alert.jsx'
import { OccupancyBar, OccupancyDonut, StatCard, occupancyLevel } from '../components/StatCard.jsx'
import { Badge } from '../components/Badge.jsx'
import { PageHeader } from '../components/PageHeader.jsx'
import { Icon } from '../components/Icon.jsx'
import GuardLayout from '../layouts/GuardLayout.jsx'
import { usePolling } from '../hooks/usePolling.js'

function formatTime(date) {
  return date ? date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'
}

export default function OccupancyPage() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [updatedAt, setUpdatedAt] = useState(null)

  const load = useCallback(async () => {
    try {
      const res = await accessService.occupancy()
      setData(res.data)
      setUpdatedAt(new Date())
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Se refresca cada 10 segundos para reflejar movimientos de otras sesiones.
  usePolling(load, 10000)

  const percent = data ? Math.round(occupancyLevel(data.inside, data.capacity).pct * 100) : 0
  const nearFull = data && !data.is_full && percent >= 80

  return (
    <GuardLayout title="Ocupación">
      <PageHeader
        eyebrow="Operación"
        title="Ocupación actual"
        description="Disponibilidad del parqueadero actualizada automáticamente cada 10 segundos."
        actions={
          <Badge tone="success" dot>
            Actualización automática
          </Badge>
        }
      />

      {error && (
        <Alert type="error" title="No se pudo consultar la ocupación">
          {error}
        </Alert>
      )}

      {loading && !data ? (
        <>
          <div className="kpi-grid" aria-hidden="true">
            {Array.from({ length: 3 }).map((_, index) => (
              <span className="skeleton kpi" key={index} />
            ))}
          </div>
          <div className="card">
            <span className="skeleton" style={{ width: '100%', height: 170 }} />
          </div>
        </>
      ) : (
        data && (
          <>
            {data.is_full && (
              <Alert type="error" title="Parqueadero lleno">
                No se permiten nuevas entradas hasta que se registre una salida.
              </Alert>
            )}
            {nearFull && (
              <Alert type="warning" title="Capacidad próxima al límite">
                Quedan {data.available} {data.available === 1 ? 'espacio disponible' : 'espacios disponibles'}.
                Supervisa las próximas entradas.
              </Alert>
            )}
            {data.capacity_is_demo && (
              <Alert type="warning" title="Capacidad de demostración">
                La capacidad configurada es un valor de demostración. Un administrador puede ajustarla
                en Configuración.
              </Alert>
            )}

            <div className="kpi-grid">
              <StatCard
                label="Capacidad total"
                value={data.capacity}
                icon="parking"
                tone="violet"
                hint={data.capacity_is_demo ? 'Valor de demostración' : 'Capacidad configurada'}
              />
              <StatCard
                label="Vehículos dentro"
                value={data.inside}
                icon="car"
                tone="info"
                hint={`${percent}% de ocupación`}
              />
              <StatCard
                label="Espacios disponibles"
                value={data.available}
                icon="check-circle"
                tone={data.is_full ? 'danger' : 'success'}
                hint={data.is_full ? 'Sin disponibilidad' : 'Listos para asignar'}
              />
            </div>

            <section className="card" aria-labelledby="occupancy-state">
              <div className="card-header">
                <div className="card-heading">
                  <h2 className="card-title" id="occupancy-state">
                    <Icon name="gauge" size={18} />
                    Estado de ocupación
                  </h2>
                  <p className="card-subtitle">
                    Última consulta: {formatTime(updatedAt)} · La información se actualiza sola.
                  </p>
                </div>
                <span
                  className={`badge ${data.is_full ? 'badge-danger' : nearFull ? 'badge-warning' : 'badge-success'}`}
                >
                  <span className="dot" aria-hidden="true" />
                  {data.is_full ? 'Lleno' : nearFull ? 'Capacidad alta' : 'Disponible'}
                </span>
              </div>

              <div className="occupancy-layout">
                <OccupancyDonut inside={data.inside} capacity={data.capacity} />

                <div>
                  <div className="occupancy-stats">
                    <div className="mini-stat">
                      <div className="label">Ocupados</div>
                      <div className="value">{data.inside}</div>
                    </div>
                    <div className="mini-stat">
                      <div className="label">Disponibles</div>
                      <div className="value">{data.available}</div>
                    </div>
                    <div className="mini-stat">
                      <div className="label">Capacidad</div>
                      <div className="value">{data.capacity}</div>
                    </div>
                  </div>

                  <OccupancyBar inside={data.inside} capacity={data.capacity} />

                  <p className="text-muted mt-2" style={{ fontSize: '0.82rem' }}>
                    Para registrar una entrada o salida, usa el módulo{' '}
                    <strong>Registrar entrada / salida</strong>.
                  </p>
                </div>
              </div>
            </section>
          </>
        )
      )}
    </GuardLayout>
  )
}
