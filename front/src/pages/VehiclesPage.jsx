import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { personService } from '../services/persons.js'
import { vehicleService } from '../services/vehicles.js'
import { Alert } from '../components/Alert.jsx'
import { Modal } from '../components/Modal.jsx'
import { StatusBadge, InsideBadge } from '../components/Badge.jsx'
import { VehicleQR } from '../components/VehicleQR.jsx'
import { DataTable } from '../components/DataTable.jsx'
import { PageHeader } from '../components/PageHeader.jsx'
import { FormField } from '../components/FormField.jsx'
import { Icon } from '../components/Icon.jsx'
import { useToast } from '../context/ToastContext.jsx'
import AdminLayout from '../layouts/AdminLayout.jsx'
import { STATUS_LABELS, VEHICLE_TYPE_LABELS, formatDateTime } from '../utils/format.js'
import { normalizePlate, validateVehicleForm } from '../utils/validators.js'

const EMPTY = { plate: '', vehicle_type: '', person_id: '' }

export default function VehiclesPage() {
  const toast = useToast()
  const [vehicles, setVehicles] = useState([])
  const [persons, setPersons] = useState([])
  const [filters, setFilters] = useState({ status: '', type: '', plate: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [qrVehicle, setQrVehicle] = useState(null)
  const [decideVehicle, setDecideVehicle] = useState(null)
  const [decision, setDecision] = useState('aprobado')
  const [observation, setObservation] = useState('')
  const [deciding, setDeciding] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await vehicleService.list(filters)
      setVehicles(res.data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    load()
  }, [load])

  const loadPersons = async () => {
    try {
      const res = await personService.list()
      setPersons(res.data)
    } catch (err) {
      toast.error('No se pudo cargar la lista de personas', err.message)
    }
  }

  const openCreate = async () => {
    setForm(EMPTY)
    setErrors({})
    setModalOpen(true)
    await loadPersons()
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const validation = validateVehicleForm(form)
    setErrors(validation)
    if (Object.keys(validation).length > 0) return

    setSaving(true)
    try {
      const res = await vehicleService.create({
        ...form,
        plate: normalizePlate(form.plate),
        person_id: Number(form.person_id),
      })
      toast.success('Vehículo registrado', res.message)
      setModalOpen(false)
      load()
    } catch (err) {
      const serverErrors = err.errors || {}
      if (err.status === 409) {
        setErrors({ plate: err.message })
      } else {
        setErrors(serverErrors)
      }
      toast.error('No fue posible registrar el vehículo', err.message)
    } finally {
      setSaving(false)
    }
  }

  const openDecision = (vehicle) => {
    setDecideVehicle(vehicle)
    setDecision(vehicle.status === 'autorizado' ? 'suspendido' : 'aprobado')
    setObservation('')
  }

  const confirmDecision = async () => {
    if (!decideVehicle) return
    setDeciding(true)
    try {
      const res = await vehicleService.decide(decideVehicle.id, decision, observation)
      toast.success('Estado actualizado', res.message)
      setDecideVehicle(null)
      setObservation('')
      load()
    } catch (err) {
      toast.error('No fue posible actualizar el estado', err.message)
    } finally {
      setDeciding(false)
    }
  }

  const clearFilters = () => setFilters({ status: '', type: '', plate: '' })
  const hasFilters = Boolean(filters.status || filters.type || filters.plate)

  const columns = [
    {
      key: 'plate',
      header: 'Placa',
      render: (vehicle) => <span className="plate">{vehicle.plate}</span>,
    },
    {
      key: 'vehicle_type',
      header: 'Tipo',
      render: (vehicle) => VEHICLE_TYPE_LABELS[vehicle.vehicle_type] || vehicle.vehicle_type,
    },
    {
      key: 'person',
      header: 'Responsable',
      sortAccessor: (vehicle) => vehicle.person?.full_name || '',
      render: (vehicle) => (
        <div className="cell-identity">
          <span className="avatar sm" aria-hidden="true">
            {(vehicle.person?.full_name || '?').slice(0, 2).toUpperCase()}
          </span>
          <span>
            <div className="cell-main">{vehicle.person?.full_name || '—'}</div>
            <div className="cell-sub">{vehicle.person?.institutional_code || 'Sin código'}</div>
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      render: (vehicle) => <StatusBadge status={vehicle.status} />,
    },
    {
      key: 'inside',
      header: 'Ubicación',
      sortAccessor: (vehicle) => (vehicle.inside ? 1 : 0),
      render: (vehicle) => <InsideBadge inside={vehicle.inside} />,
    },
    {
      key: 'created_at',
      header: 'Registrado',
      render: (vehicle) => <span className="text-muted">{formatDateTime(vehicle.created_at)}</span>,
    },
    {
      key: 'actions',
      header: 'Acciones',
      align: 'right',
      sortable: false,
      render: (vehicle) => (
        <div className="row-actions">
          <button
            type="button"
            className="btn btn-sm btn-secondary"
            onClick={() => setQrVehicle(vehicle)}
            aria-label={`Ver código QR de ${vehicle.plate}`}
          >
            <Icon name="qr" size={14} />
            QR
          </button>
          <button type="button" className="btn btn-sm btn-secondary" onClick={() => openDecision(vehicle)}>
            <Icon name="shield" size={14} />
            Estado
          </button>
        </div>
      ),
    },
  ]

  return (
    <AdminLayout title="Vehículos">
      <PageHeader
        eyebrow="Gestión"
        title="Vehículos"
        description="Consulta, registra y administra los vehículos vinculados al parqueadero."
        actions={
          <button type="button" className="btn btn-primary" onClick={openCreate}>
            <Icon name="plus" size={16} />
            Registrar vehículo
          </button>
        }
      />

      <section className="table-card" aria-labelledby="vehicles-title">
        <div className="card-header">
          <div className="card-heading">
            <h2 className="card-title" id="vehicles-title">
              <Icon name="car" size={18} />
              Vehículos registrados
            </h2>
            <p className="card-subtitle">
              {loading
                ? 'Consultando vehículos…'
                : `${vehicles.length} ${vehicles.length === 1 ? 'vehículo encontrado' : 'vehículos encontrados'} con los filtros actuales.`}
            </p>
          </div>
        </div>

        <div style={{ padding: '0 1.35rem 1rem' }}>
          <div className="toolbar">
            <div className="toolbar-field">
              <FormField label="Estado" htmlFor="filter-status">
                <select
                  id="filter-status"
                  className="form-control"
                  value={filters.status}
                  onChange={(event) => setFilters({ ...filters, status: event.target.value })}
                >
                  <option value="">Todos</option>
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>

            <div className="toolbar-field">
              <FormField label="Tipo de vehículo" htmlFor="filter-type">
                <select
                  id="filter-type"
                  className="form-control"
                  value={filters.type}
                  onChange={(event) => setFilters({ ...filters, type: event.target.value })}
                >
                  <option value="">Todos</option>
                  {Object.entries(VEHICLE_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>

            <div className="toolbar-field grow">
              <FormField label="Buscar por placa" htmlFor="filter-plate">
                <div className="search-field">
                  <span className="search-icon" aria-hidden="true">
                    <Icon name="search" size={16} />
                  </span>
                  <input
                    id="filter-plate"
                    className="form-control"
                    value={filters.plate}
                    onChange={(event) => setFilters({ ...filters, plate: event.target.value })}
                    placeholder="Ej: ABC123"
                  />
                </div>
              </FormField>
            </div>

            {hasFilters && (
              <div className="toolbar-actions">
                <button type="button" className="btn btn-ghost" onClick={clearFilters}>
                  <Icon name="x" size={15} />
                  Limpiar
                </button>
              </div>
            )}
          </div>
        </div>

        <DataTable
          columns={columns}
          rows={vehicles}
          loading={loading}
          error={error}
          onRetry={load}
          emptyIcon="car"
          emptyTitle="Sin vehículos"
          emptyText="No hay vehículos que coincidan con los filtros seleccionados."
          caption="Vehículos registrados en el parqueadero"
        />
      </section>

      {modalOpen && (
        <Modal
          title="Registrar vehículo"
          subtitle="El vehículo quedará pendiente hasta que se apruebe la solicitud."
          icon="car"
          onClose={() => setModalOpen(false)}
          busy={saving}
          footer={
            <>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setModalOpen(false)}
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="vehicle-form"
                className="btn btn-primary"
                disabled={saving || persons.length === 0}
              >
                {saving && <span className="spinner" />}
                {saving ? 'Guardando…' : 'Registrar vehículo'}
              </button>
            </>
          }
        >
          <Alert type="info">
            Registrar el vehículo no lo autoriza: queda <strong>pendiente</strong> hasta la decisión
            de un administrador.
          </Alert>

          <form id="vehicle-form" onSubmit={handleSubmit} noValidate>
            <FormField
              label="Placa"
              htmlFor="vehicle-plate"
              required
              error={errors.plate}
              hint="Letras y números, sin espacios ni guiones. Se guarda en mayúsculas."
            >
              <input
                id="vehicle-plate"
                className={`form-control mono${errors.plate ? ' is-invalid' : ''}`}
                value={form.plate}
                onChange={(event) => {
                  setForm({ ...form, plate: event.target.value })
                  if (errors.plate) setErrors({ ...errors, plate: '' })
                }}
                placeholder="Ej: ABC123"
                autoComplete="off"
                maxLength={12}
                aria-invalid={Boolean(errors.plate)}
                aria-describedby={errors.plate ? 'vehicle-plate-error' : undefined}
              />
            </FormField>

            <FormField label="Tipo de vehículo" htmlFor="vehicle-type" required error={errors.vehicle_type}>
              <select
                id="vehicle-type"
                className={`form-control${errors.vehicle_type ? ' is-invalid' : ''}`}
                value={form.vehicle_type}
                onChange={(event) => {
                  setForm({ ...form, vehicle_type: event.target.value })
                  if (errors.vehicle_type) setErrors({ ...errors, vehicle_type: '' })
                }}
                aria-invalid={Boolean(errors.vehicle_type)}
              >
                <option value="">Selecciona una opción…</option>
                {Object.entries(VEHICLE_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField
              label="Persona responsable"
              htmlFor="vehicle-person"
              required
              error={errors.person_id}
              hint={
                persons.length === 0 ? (
                  <>
                    No hay personas registradas. <Link to="/admin/personas">Registra una persona</Link>{' '}
                    antes de continuar.
                  </>
                ) : (
                  'Responsable del vehículo dentro de la institución.'
                )
              }
            >
              <select
                id="vehicle-person"
                className={`form-control${errors.person_id ? ' is-invalid' : ''}`}
                value={form.person_id}
                onChange={(event) => {
                  setForm({ ...form, person_id: event.target.value })
                  if (errors.person_id) setErrors({ ...errors, person_id: '' })
                }}
                aria-invalid={Boolean(errors.person_id)}
              >
                <option value="">Selecciona una opción…</option>
                {persons.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.full_name} · {person.person_type}
                  </option>
                ))}
              </select>
            </FormField>
          </form>
        </Modal>
      )}

      {decideVehicle && (
        <Modal
          title={`Cambiar estado — ${decideVehicle.plate}`}
          subtitle="La decisión queda registrada en el historial del vehículo."
          icon="shield"
          onClose={() => setDecideVehicle(null)}
          busy={deciding}
          footer={
            <>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setDecideVehicle(null)}
                disabled={deciding}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={confirmDecision}
                disabled={deciding}
              >
                {deciding && <span className="spinner" />}
                {deciding ? 'Guardando…' : 'Confirmar decisión'}
              </button>
            </>
          }
        >
          <div className="mini-stat mb-2">
            <div className="label">Vehículo seleccionado</div>
            <div className="flex items-center gap-1 wrap mt-1">
              <span className="plate">{decideVehicle.plate}</span>
              <StatusBadge status={decideVehicle.status} />
            </div>
            <div className="cell-sub mt-1">{decideVehicle.person?.full_name || 'Sin responsable'}</div>
          </div>

          <FormField label="Nueva decisión" htmlFor="decision">
            <select
              id="decision"
              className="form-control"
              value={decision}
              onChange={(event) => setDecision(event.target.value)}
            >
              <option value="aprobado">Aprobar (autorizado)</option>
              <option value="rechazado">Rechazar</option>
              <option value="suspendido">Suspender</option>
            </select>
          </FormField>

          <FormField
            label="Observación (opcional)"
            htmlFor="decision-observation"
            hint="Motivo o detalle de la decisión."
          >
            <textarea
              id="decision-observation"
              className="form-control"
              rows={3}
              value={observation}
              onChange={(event) => setObservation(event.target.value)}
              placeholder="Ej: Suspensión preventiva por revisión documental."
              maxLength={500}
            />
          </FormField>

          {(decision === 'rechazado' || decision === 'suspendido') && (
            <Alert type="warning">
              {decision === 'rechazado'
                ? 'El vehículo no podrá ingresar al parqueadero mientras esté rechazado.'
                : 'El vehículo quedará inhabilitado para nuevas entradas hasta que se autorice de nuevo.'}
            </Alert>
          )}
        </Modal>
      )}

      {qrVehicle && <VehicleQR vehicle={qrVehicle} onClose={() => setQrVehicle(null)} />}
    </AdminLayout>
  )
}
