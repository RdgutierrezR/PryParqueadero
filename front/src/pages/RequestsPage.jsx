import { useCallback, useEffect, useState } from 'react'
import { vehicleService } from '../services/vehicles.js'
import { Alert } from '../components/Alert.jsx'
import { Modal } from '../components/Modal.jsx'
import { DataTable } from '../components/DataTable.jsx'
import { PageHeader } from '../components/PageHeader.jsx'
import { FormField } from '../components/FormField.jsx'
import { Icon } from '../components/Icon.jsx'
import { useToast } from '../context/ToastContext.jsx'
import AdminLayout from '../layouts/AdminLayout.jsx'
import { PERSON_TYPE_LABELS, VEHICLE_TYPE_LABELS, formatDateTime } from '../utils/format.js'

export default function RequestsPage() {
  const toast = useToast()
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [decision, setDecision] = useState(null) // { vehicle, type }
  const [observation, setObservation] = useState('')
  const [processing, setProcessing] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await vehicleService.pending()
      setVehicles(res.data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const openDecision = (vehicle, type) => {
    setDecision({ vehicle, type })
    setObservation('')
  }

  const confirmDecision = async () => {
    if (!decision) return
    setProcessing(true)
    try {
      const res = await vehicleService.decide(decision.vehicle.id, decision.type, observation)
      toast.success(
        decision.type === 'aprobado' ? 'Solicitud aprobada' : 'Solicitud rechazada',
        res.message,
      )
      setDecision(null)
      setObservation('')
      load()
    } catch (err) {
      toast.error('No fue posible registrar la decisión', err.message)
    } finally {
      setProcessing(false)
    }
  }

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
      key: 'person_type',
      header: 'Tipo de persona',
      sortAccessor: (vehicle) => vehicle.person?.person_type || '',
      render: (vehicle) =>
        PERSON_TYPE_LABELS[vehicle.person?.person_type] || vehicle.person?.person_type || '—',
    },
    {
      key: 'created_at',
      header: 'Registrado',
      render: (vehicle) => (
        <span className="text-muted">{formatDateTime(vehicle.created_at)}</span>
      ),
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
            className="btn btn-sm btn-success"
            onClick={() => openDecision(vehicle, 'aprobado')}
          >
            <Icon name="check" size={14} />
            Aprobar
          </button>
          <button
            type="button"
            className="btn btn-sm btn-danger"
            onClick={() => openDecision(vehicle, 'rechazado')}
          >
            <Icon name="x" size={14} />
            Rechazar
          </button>
        </div>
      ),
    },
  ]

  return (
    <AdminLayout title="Solicitudes">
      <PageHeader
        eyebrow="Autorizaciones"
        title="Solicitudes pendientes"
        description="Revisa cada solicitud y toma una decisión explícita. Un vehículo registrado no queda habilitado hasta su aprobación."
        actions={
          <button type="button" className="btn btn-secondary" onClick={load} disabled={loading}>
            <Icon name="refresh" size={16} />
            {loading ? 'Actualizando…' : 'Actualizar'}
          </button>
        }
      />

      <Alert type="info" title="Flujo de autorización">
        El registro de un vehículo lo deja en estado <strong>pendiente</strong>. Solo después de la
        aprobación podrá registrar entradas en el parqueadero.
      </Alert>

      <section className="table-card" aria-labelledby="requests-title">
        <div className="card-header">
          <div className="card-heading">
            <h2 className="card-title" id="requests-title">
              <Icon name="inbox" size={18} />
              Solicitudes por revisar
            </h2>
            <p className="card-subtitle">
              {vehicles.length === 0
                ? 'No hay solicitudes esperando decisión.'
                : `${vehicles.length} ${vehicles.length === 1 ? 'solicitud espera' : 'solicitudes esperan'} decisión.`}
            </p>
          </div>
          <span className="badge badge-warning">
            <span className="dot" aria-hidden="true" />
            {vehicles.length} pendientes
          </span>
        </div>

        <DataTable
          columns={columns}
          rows={vehicles}
          loading={loading}
          error={error}
          onRetry={load}
          emptyIcon="check-circle"
          emptyTitle="Todo está al día"
          emptyText="No hay vehículos pendientes de autorización en este momento."
          caption="Solicitudes de vehículos pendientes de aprobación"
          initialSort={null}
        />
      </section>

      {decision && (
        <Modal
          title={decision.type === 'aprobado' ? 'Aprobar vehículo' : 'Rechazar vehículo'}
          subtitle={
            decision.type === 'aprobado'
              ? 'El vehículo quedará autorizado para ingresar.'
              : 'El vehículo no podrá ingresar al parqueadero.'
          }
          icon={decision.type === 'aprobado' ? 'check-circle' : 'alert-triangle'}
          iconTone={decision.type === 'aprobado' ? 'success' : 'danger'}
          onClose={() => setDecision(null)}
          busy={processing}
          footer={
            <>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setDecision(null)}
                disabled={processing}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={`btn ${decision.type === 'aprobado' ? 'btn-success' : 'btn-danger'}`}
                onClick={confirmDecision}
                disabled={processing}
              >
                {processing && <span className="spinner" />}
                {processing
                  ? 'Procesando…'
                  : decision.type === 'aprobado'
                    ? 'Confirmar aprobación'
                    : 'Confirmar rechazo'}
              </button>
            </>
          }
        >
          <div className="mini-stat mb-2">
            <div className="label">Vehículo</div>
            <div className="flex items-center gap-1 wrap mt-1">
              <span className="plate">{decision.vehicle.plate}</span>
              <span className="text-muted">{decision.vehicle.person?.full_name || 'Sin responsable'}</span>
            </div>
            <div className="cell-sub mt-1">
              {VEHICLE_TYPE_LABELS[decision.vehicle.vehicle_type] || decision.vehicle.vehicle_type}
              {' · '}
              Registrado el {formatDateTime(decision.vehicle.created_at)}
            </div>
          </div>

          <FormField
            label="Observación (opcional)"
            htmlFor="observation"
            hint="Motivo o detalle de la decisión. Queda registrado en el historial del vehículo."
          >
            <textarea
              id="observation"
              className="form-control"
              rows={3}
              value={observation}
              onChange={(event) => setObservation(event.target.value)}
              placeholder="Ej: Documentación verificada con la coordinación académica."
              maxLength={500}
            />
          </FormField>
        </Modal>
      )}
    </AdminLayout>
  )
}
