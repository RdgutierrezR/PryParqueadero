import { useCallback, useEffect, useState } from 'react'
import { accessService } from '../services/access.js'
import { reportService } from '../services/reports.js'
import { Alert } from '../components/Alert.jsx'
import { StatCard, OccupancyBar } from '../components/StatCard.jsx'
import { PageHeader } from '../components/PageHeader.jsx'
import { BarList, HourChart } from '../components/Charts.jsx'
import { DataTable } from '../components/DataTable.jsx'
import { FormField } from '../components/FormField.jsx'
import { Icon } from '../components/Icon.jsx'
import AdminLayout from '../layouts/AdminLayout.jsx'
import {
  PERSON_TYPE_LABELS,
  VEHICLE_TYPE_LABELS,
  daysAgoISO,
  formatDateTime,
  todayISO,
} from '../utils/format.js'

function formatStay(entryAt) {
  if (!entryAt) return '—'
  const start = new Date(entryAt)
  if (Number.isNaN(start.getTime())) return '—'
  const minutes = Math.max(Math.round((Date.now() - start.getTime()) / 60000), 0)
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`
}

export default function ReportsPage() {
  const [start, setStart] = useState(daysAgoISO(7))
  const [end, setEnd] = useState(todayISO())
  const [summary, setSummary] = useState(null)
  const [inside, setInside] = useState([])
  const [occupancy, setOccupancy] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [summaryRes, insideRes, occupancyRes] = await Promise.all([
        reportService.summary(start, end),
        reportService.inside(),
        accessService.occupancy(),
      ])
      setSummary(summaryRes.data)
      setInside(insideRes.data)
      setOccupancy(occupancyRes.data)
    } catch (err) {
      setError(err.message)
      setSummary(null)
    } finally {
      setLoading(false)
    }
  }, [start, end])

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSubmit = (event) => {
    event.preventDefault()
    load()
  }

  const personEntries = Object.entries(summary?.by_person_type || {}).map(([key, value]) => ({
    label: PERSON_TYPE_LABELS[key] || key,
    value,
  }))
  const vehicleEntries = Object.entries(summary?.by_vehicle_type || {}).map(([key, value]) => ({
    label: VEHICLE_TYPE_LABELS[key] || key,
    value,
    tone: key === 'motocicleta' ? 'violet' : '',
  }))

  const insideColumns = [
    {
      key: 'plate',
      header: 'Placa',
      sortAccessor: (movement) => movement.vehicle?.plate || '',
      render: (movement) => <span className="plate">{movement.vehicle?.plate || '—'}</span>,
    },
    {
      key: 'vehicle_type',
      header: 'Tipo',
      sortAccessor: (movement) => movement.vehicle?.vehicle_type || '',
      render: (movement) => VEHICLE_TYPE_LABELS[movement.vehicle?.vehicle_type] || '—',
    },
    {
      key: 'person',
      header: 'Responsable',
      sortAccessor: (movement) => movement.vehicle?.person?.full_name || '',
      render: (movement) => movement.vehicle?.person?.full_name || '—',
    },
    {
      key: 'entry_at',
      header: 'Entrada',
      render: (movement) => (
        <span className="mono" style={{ fontSize: '0.82rem' }}>
          {formatDateTime(movement.entry_at)}
        </span>
      ),
    },
    {
      key: 'stay',
      header: 'Permanencia',
      sortable: false,
      render: (movement) => <span className="text-muted">{formatStay(movement.entry_at)}</span>,
    },
  ]

  return (
    <AdminLayout title="Reportes">
      <PageHeader
        eyebrow="Análisis"
        title="Reportes"
        description="Estadísticas de operación por periodo y exportación de movimientos."
        actions={
          <a
            className="btn btn-secondary"
            href={reportService.exportUrl(start, end)}
            download
            aria-label="Exportar el historial del periodo en formato CSV"
          >
            <Icon name="download" size={16} />
            Exportar CSV
          </a>
        }
      />

      <section className="card" aria-labelledby="report-period">
        <div className="card-header">
          <div className="card-heading">
            <h2 className="card-title" id="report-period">
              <Icon name="calendar" size={18} />
              Periodo del reporte
            </h2>
            <p className="card-subtitle">
              Las fechas se interpretan en la hora local del equipo. El CSV incluye los mismos
              movimientos del periodo.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="toolbar">
            <div className="toolbar-field">
              <FormField label="Desde" htmlFor="report-start">
                <input
                  id="report-start"
                  type="date"
                  className="form-control"
                  value={start}
                  onChange={(event) => setStart(event.target.value)}
                />
              </FormField>
            </div>
            <div className="toolbar-field">
              <FormField label="Hasta" htmlFor="report-end">
                <input
                  id="report-end"
                  type="date"
                  className="form-control"
                  value={end}
                  onChange={(event) => setEnd(event.target.value)}
                />
              </FormField>
            </div>
            <div className="toolbar-actions">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? <span className="spinner" /> : <Icon name="chart" size={15} />}
                {loading ? 'Generando…' : 'Generar reporte'}
              </button>
            </div>
          </div>
        </form>
      </section>

      {error && (
        <Alert type="error" title="No se pudo generar el reporte">
          {error}
        </Alert>
      )}

      {loading && !summary ? (
        <div className="kpi-grid" aria-hidden="true">
          {Array.from({ length: 3 }).map((_, index) => (
            <span className="skeleton kpi" key={index} />
          ))}
        </div>
      ) : (
        summary && (
          <>
            <div className="kpi-grid">
              <StatCard
                label="Entradas del periodo"
                value={summary.entries}
                icon="login"
                tone="info"
                hint={`${summary.period.start} → ${summary.period.end}`}
              />
              <StatCard
                label="Salidas del periodo"
                value={summary.exits}
                icon="logout"
                tone="warning"
                hint="Movimientos cerrados en el periodo"
              />
              <StatCard
                label="Vehículos dentro ahora"
                value={summary.inside_now}
                icon="car"
                tone="success"
                hint="Estado actual del parqueadero"
              />
            </div>

            <div className="split-grid">
              <section className="card" aria-labelledby="report-person-types">
                <div className="card-header">
                  <div className="card-heading">
                    <h2 className="card-title" id="report-person-types">
                      <Icon name="users" size={18} />
                      Entradas por tipo de usuario
                    </h2>
                    <p className="card-subtitle">Distribución según el responsable del vehículo.</p>
                  </div>
                </div>
                <BarList items={personEntries} total={summary.entries} />
              </section>

              <section className="card" aria-labelledby="report-vehicle-types">
                <div className="card-header">
                  <div className="card-heading">
                    <h2 className="card-title" id="report-vehicle-types">
                      <Icon name="car" size={18} />
                      Entradas por tipo de vehículo
                    </h2>
                    <p className="card-subtitle">Vehículos que ingresaron en el periodo.</p>
                  </div>
                </div>
                <BarList items={vehicleEntries} total={summary.entries} />
              </section>
            </div>

            <section className="card" aria-labelledby="report-hourly">
              <div className="card-header">
                <div className="card-heading">
                  <h2 className="card-title" id="report-hourly">
                    <Icon name="activity" size={18} />
                    Entradas por hora
                  </h2>
                  <p className="card-subtitle">Horas de mayor actividad en el periodo consultado.</p>
                </div>
              </div>
              <HourChart
                data={summary.hourly_distribution}
                emptyText="Sin entradas registradas en el periodo seleccionado."
              />
            </section>

            <section className="card" aria-labelledby="report-occupancy">
              <div className="card-header">
                <div className="card-heading">
                  <h2 className="card-title" id="report-occupancy">
                    <Icon name="gauge" size={18} />
                    Ocupación actual
                  </h2>
                  <p className="card-subtitle">Disponibilidad del parqueadero en este momento.</p>
                </div>
              </div>
              {occupancy ? (
                <OccupancyBar inside={occupancy.inside} capacity={occupancy.capacity} />
              ) : (
                <p className="text-muted">Sin datos de capacidad disponibles.</p>
              )}
            </section>
          </>
        )
      )}

      <section className="table-card" aria-labelledby="report-inside">
        <div className="card-header">
          <div className="card-heading">
            <h2 className="card-title" id="report-inside">
              <Icon name="parking" size={18} />
              Vehículos actualmente dentro
            </h2>
            <p className="card-subtitle">Listado en vivo de los vehículos que no han registrado salida.</p>
          </div>
          <span className="badge badge-info">
            <span className="dot" aria-hidden="true" />
            {inside.length} dentro
          </span>
        </div>

        <DataTable
          columns={insideColumns}
          rows={inside}
          loading={loading && inside.length === 0}
          emptyIcon="parking"
          emptyTitle="Sin vehículos dentro"
          emptyText="El parqueadero no registra vehículos dentro en este momento."
          caption="Vehículos actualmente dentro del parqueadero"
        />
      </section>
    </AdminLayout>
  )
}
