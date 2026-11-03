import { Icon } from './Icon.jsx'
import { occupancyLevel } from './StatCard.jsx'

/**
 * Vista esquemática del parqueadero.
 *
 * Dibuja una cuadrícula con la capacidad configurada y marca los espacios
 * ocupados. No es un plano real: es una vista didáctica basada en la capacidad
 * actual y los movimientos activos.
 */
export function ParkingMap({ inside = 0, capacity = 0 }) {
  if (!capacity || capacity <= 0) return null
  const { level } = occupancyLevel(inside, capacity)
  const slots = Array.from({ length: capacity }, (_, index) => index < inside)

  return (
    <section className="card" aria-labelledby="parking-map-title">
      <header className="card-header">
        <div className="card-heading">
          <h2 className="card-title" id="parking-map-title">
            <Icon name="parking" size={18} /> Esqueleto del parqueadero
          </h2>
          <p className="card-subtitle">
            Vista esquemática con los {capacity} espacios de la capacidad configurada.
          </p>
        </div>
        <span
          className={`badge ${
            level === 'full' ? 'badge-danger' : level === 'high' ? 'badge-warning' : 'badge-success'
          }`}
        >
          <span className="dot" aria-hidden="true" />
          {inside}/{capacity} ocupados
        </span>
      </header>

      <div
        className="parking-map"
        role="img"
        aria-label={`Mapa del parqueadero: ${inside} de ${capacity} espacios ocupados`}
      >
        {slots.map((occupied, index) => (
          <span
            key={index}
            className={`parking-spot ${occupied ? 'is-occupied' : 'is-free'}`}
            aria-hidden="true"
          />
        ))}
      </div>

      <p className="card-subtitle mt-2">
        Verde = vehículo dentro · Gris = espacio libre.
      </p>
    </section>
  )
}

export default ParkingMap
