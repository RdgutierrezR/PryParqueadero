import { useState } from 'react'
import { vehicleService } from '../services/vehicles.js'
import { VEHICLE_TYPE_LABELS } from '../utils/format.js'
import { Modal } from './Modal.jsx'
import { Icon } from './Icon.jsx'

/**
 * Muestra el código QR de un vehículo y permite imprimirlo.
 * El QR solo contiene el token seguro; nunca datos personales.
 */
export function VehicleQR({ vehicle, onClose }) {
  const [error, setError] = useState('')

  const handlePrint = () => {
    window.print()
  }

  return (
    <Modal
      title={`Código QR — ${vehicle.plate}`}
      subtitle="Identificación del vehículo para el control de acceso."
      icon="qr"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-secondary no-print" onClick={onClose}>
            Cerrar
          </button>
          <a
            className="btn btn-secondary no-print"
            href={vehicleService.qrUrl(vehicle.id)}
            download={`qr_${vehicle.plate}.png`}
          >
            <Icon name="download" size={16} />
            Descargar
          </a>
          <button type="button" className="btn btn-primary no-print" onClick={handlePrint}>
            <Icon name="printer" size={16} />
            Imprimir
          </button>
        </>
      }
    >
      {error && (
        <div className="alert alert-error" role="alert">
          <span className="alert-icon" aria-hidden="true">
            <Icon name="alert-circle" size={18} />
          </span>
          <div className="alert-body">{error}</div>
        </div>
      )}

      <div className="text-center">
        <div className="qr-print">
          <div
            style={{
              display: 'inline-flex',
              padding: '0.85rem',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border)',
              background: '#fff',
            }}
          >
            <img
              src={vehicleService.qrUrl(vehicle.id)}
              alt={`Código QR del vehículo ${vehicle.plate}`}
              width="220"
              height="220"
              style={{ width: 220, height: 220, display: 'block' }}
              onError={() => setError('No se pudo cargar el código QR.')}
            />
          </div>

          <div className="mt-2">
            <span className="plate" style={{ fontSize: '1rem', padding: '0.3rem 0.8rem' }}>
              {vehicle.plate}
            </span>
          </div>

          <p className="mt-1" style={{ fontWeight: 600, marginBottom: '0.1rem' }}>
            {vehicle.person?.full_name || 'Sin responsable'}
          </p>
          <p className="text-muted" style={{ fontSize: '0.84rem' }}>
            {VEHICLE_TYPE_LABELS[vehicle.vehicle_type] || vehicle.vehicle_type}
            {vehicle.person?.institutional_code ? ` · Código ${vehicle.person.institutional_code}` : ''}
          </p>
        </div>

        <p className="text-muted mt-2" style={{ fontSize: '0.8rem' }}>
          <Icon name="shield" size={13} /> El código solo contiene un token de identificación seguro;
          no incluye datos personales.
        </p>
      </div>
    </Modal>
  )
}

export default VehicleQR
