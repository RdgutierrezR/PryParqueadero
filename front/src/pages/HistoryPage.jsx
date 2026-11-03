import { useCallback, useEffect, useRef, useState } from 'react'
import { accessService } from '../services/access.js'
import { reportService } from '../services/reports.js'
import { useAuth } from '../context/useAuth.js'
import { DataTable } from '../components/DataTable.jsx'
import { PageHeader } from '../components/PageHeader.jsx'
import { FormField } from '../components/FormField.jsx'
import { Badge } from '../components/Badge.jsx'
import { Icon } from '../components/Icon.jsx'
import AdminLayout from '../layouts/AdminLayout.jsx'
import GuardLayout from '../layouts/GuardLayout.jsx'
import {
  VEHICLE_TYPE_LABELS,
  PERSON_TYPE_LABELS,
  daysAgoISO,
  formatDateTime,
  todayISO,
} from '../utils/format.js'

/** Duración aproximada de la estadía a partir de las horas reales. */
function formatStay(entryAt, exitAt) {
  if (!entryAt) return '—'
  const start = new Date(entryAt)
  const end = exitAt ? new Date(exitAt) : new Date()
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return '—'
  const minutes = Math.max(Math.round((end - start) / 60000), 0)
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`
}

/**
 * Historial de movimientos.
 *
 * El filtro "Adentro ahora" responde de forma directa a la pregunta
 * "¿quién está adentro?": no depende del rango de fechas y lista
 * únicamente los vehículos con entrada activa (sin salida).
 */
export default function HistoryPage() {
  const { user } = useAuth()
  const [start, setStart] = useState(daysAgoISO(7))
  const [end, setEnd] = useState(todayISO())
  const [plate, setPlate] = useState('')
  const [filter, setFilter] = useState('todos') // todos | inside | outside
  const [insideCount, setInsideCount] = useState(null)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searched, setSearched] = useState(false)
  // Identifica la última petición para descartar respuestas viejas (evita mezclar vistas).
  const requestRef = useRef(0)

  // El administrador y el vigilante comparten el contenido; cambia el layout.
  const Layout = user?.role === 'administrador' ? AdminLayout : GuardLayout
  const isInsideView = filter === 'inside'

  const loadInsideCount = useCallback(async () => {
    try {
      const res = await accessService.occupancy()
      setInsideCount(res.data.inside)
    } catch {
      setInsideCount(null) // el contador es informativo, no bloquea el historial
    }
  }, [])

  const load = useCallback(
    async (activeFilter = filter) => {
      const requestId = ++requestRef.current
      setLoading(true)
      setError('')
      try {
        const status = activeFilter === 'todos' ? undefined : activeFilter
        const res = await reportService.history(start, end, plate, status)
        if (requestId !== requestRef.current) return // respuesta de una vista anterior
        // Blindaje: "Adentro ahora" jamás muestra un vehículo que ya registró salida,
        // aunque el backend estuviera desactualizado.
        const data = status === 'inside' ? res.data.filter((movement) => !movement.exit_at) : res.data
        setRows(data)
        setSearched(true)
        loadInsideCount()
      } catch (err) {
        if (requestId !== requestRef.current) return
        setError(err.message)
        setRows([])
      } finally {
        if (requestId === requestRef.current) setLoading(false)
      }
    },
    [start, end, plate, filter, loadInsideCount],
  )

  useEffect(() => {
    load('todos')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const applyFilter = (value) => {
    setFilter(value)
    load(value)
  }

  const handleSearch = (event) => {
    event.preventDefault()
    load()
  }

  const titleTable = isInsideView
    ? 'Vehículos adentro ahora'
    : filter === 'outside'
      ? 'Movimientos finalizados'
      : 'Movimientos registrados'

  const columns = [
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
      render: (movement) => (
        <div className="cell-identity">
          <span className="avatar sm" aria-hidden="true">
            {(movement.vehicle?.person?.full_name || '?').slice(0, 2).toUpperCase()}
          </span>
          <span>
            <div className="cell-main">{movement.vehicle?.person?.full_name || '—'}</div>
            <div className="cell-sub">
              {PERSON_TYPE_LABELS[movement.vehicle?.person?.person_type] || 'Sin tipo registrado'}
            </div>
          </span>
        </div>
      ),
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
      key: 'exit_at',
      header: 'Salida',
      render: (movement) =>
        movement.exit_at ? (
          <span className="mono" style={{ fontSize: '0.82rem' }}>
            {formatDateTime(movement.exit_at)}
          </span>
        ) : (
          <span className="text-subtle">En curso</span>
        ),
    },
    {
      key: 'stay',
      header: 'Permanencia',
      sortable: false,
      render: (movement) => (
        <span className="text-muted">{formatStay(movement.entry_at, movement.exit_at)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      sortAccessor: (movement) => (movement.exit_at ? 1 : 0),
      render: (movement) =>
        movement.exit_at ? (
          <Badge tone="outside" dot>
            Salió
          </Badge>
        ) : (
          <Badge tone="inside" dot>
            Dentro
          </Badge>
        ),
    },
  ]

  return (
    <Layout title="Historial">
      <PageHeader
        eyebrow="Consulta"
        title="Historial de movimientos"
        description="Consulta las entradas y salidas registradas, o identifica de inmediato quién está dentro del parqueadero."
        actions={
          <button type="button" className="btn btn-secondary" onClick={() => load()} disabled={loading}>
            <Icon name="refresh" size={16} />
            {loading ? 'Actualizando…' : 'Actualizar'}
          </button>
        }
      />

      <section className="card" aria-labelledby="history-filters">
        <div className="card-header">
          <div className="card-heading">
            <h2 className="card-title" id="history-filters">
              <Icon name="filter" size={18} />
              Filtros del historial
            </h2>
            <p className="card-subtitle">Selecciona el estado de los movimientos que deseas consultar.</p>
          </div>
        </div>

        <div className="segmented mb-2" role="group" aria-label="Filtrar por estado del movimiento">
          <button
            type="button"
            className="segment"
            aria-pressed={isInsideView}
            onClick={() => applyFilter('inside')}
          >
            <Icon name="car" size={14} />
            Adentro ahora
            <span className="count">{insideCount ?? '—'}</span>
          </button>
          <button
            type="button"
            className="segment"
            aria-pressed={filter === 'todos'}
            onClick={() => applyFilter('todos')}
          >
            Todos
          </button>
          <button
            type="button"
            className="segment"
            aria-pressed={filter === 'outside'}
            onClick={() => applyFilter('outside')}
          >
            Ya salieron
          </button>
        </div>

        <form onSubmit={handleSearch}>
          <div className="toolbar">
            {!isInsideView && (
              <>
                <div className="toolbar-field">
                  <FormField label="Desde" htmlFor="history-start">
                    <input
                      id="history-start"
                      type="date"
                      className="form-control"
                      value={start}
                      onChange={(event) => setStart(event.target.value)}
                    />
                  </FormField>
                </div>
                <div className="toolbar-field">
                  <FormField label="Hasta" htmlFor="history-end">
                    <input
                      id="history-end"
                      type="date"
                      className="form-control"
                      value={end}
                      onChange={(event) => setEnd(event.target.value)}
                    />
                  </FormField>
                </div>
              </>
            )}

            <div className="toolbar-field grow">
              <FormField label="Placa (opcional)" htmlFor="history-plate">
                <div className="search-field">
                  <span className="search-icon" aria-hidden="true">
                    <Icon name="search" size={16} />
                  </span>
                  <input
                    id="history-plate"
                    className="form-control mono"
                    value={plate}
                    onChange={(event) => setPlate(event.target.value)}
                    placeholder="Ej: ABC123"
                  />
                </div>
              </FormField>
            </div>

            <div className="toolbar-actions">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? <span className="spinner" /> : <Icon name="search" size={15} />}
                {loading ? 'Buscando…' : 'Buscar'}
              </button>
            </div>
          </div>
        </form>

        {isInsideView && (
          <p className="text-muted mt-2" style={{ fontSize: '0.82rem' }}>
            Se muestran todos los vehículos que están dentro en este momento, sin importar la fecha de
            entrada.
          </p>
        )}
      </section>

      <section className="table-card" aria-labelledby="history-title">
        <div className="card-header">
          <div className="card-heading">
            <h2 className="card-title" id="history-title">
              <Icon name="history" size={18} />
              {titleTable}
            </h2>
            <p className="card-subtitle">
              {searched
                ? `${rows.length} ${rows.length === 1 ? 'registro' : 'registros'} en la vista actual.`
                : 'Realiza una búsqueda para consultar los movimientos.'}
            </p>
          </div>
          {isInsideView && insideCount !== null && (
            <span className="badge badge-inside">
              <span className="dot" aria-hidden="true" />
              {insideCount} dentro
            </span>
          )}
        </div>

        <DataTable
          columns={columns}
          rows={rows}
          loading={loading}
          error={error}
          onRetry={() => load()}
          emptyIcon="history"
          emptyTitle={isInsideView ? 'No hay vehículos adentro' : 'Sin movimientos'}
          emptyText={
            isInsideView
              ? 'En este momento el parqueadero no registra vehículos dentro.'
              : 'No hay movimientos con los filtros seleccionados.'
          }
          caption="Historial de entradas y salidas del parqueadero"
        />
      </section>
    </Layout>
  )
}
