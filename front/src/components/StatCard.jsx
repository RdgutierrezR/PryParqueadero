import { Icon } from './Icon.jsx'

/**
 * Tarjeta de indicador (KPI).
 * `tone` cambia el color del icono y del acento lateral.
 */
export function StatCard({ label, value, hint, icon = 'activity', tone = 'info' }) {
  return (
    <div className={`kpi-card tone-${tone}`}>
      <div className="kpi-top">
        <span className="kpi-label">{label}</span>
        <span className="kpi-icon" aria-hidden="true">
          <Icon name={icon} size={18} />
        </span>
      </div>
      <div className="kpi-value">{value}</div>
      {hint && <div className="kpi-hint">{hint}</div>}
    </div>
  )
}

/** Determina el nivel de ocupación: normal, alto o lleno. */
export function occupancyLevel(inside, capacity) {
  if (!capacity || capacity <= 0) return { pct: 0, level: 'normal' }
  const pct = Math.min(Math.max(inside / capacity, 0), 1)
  if (pct >= 1) return { pct, level: 'full' }
  if (pct >= 0.8) return { pct, level: 'high' }
  return { pct, level: 'normal' }
}

/** Barra de progreso accesible con texto de contexto. */
export function OccupancyBar({ inside = 0, capacity = 0 }) {
  const { pct, level } = occupancyLevel(inside, capacity)
  const percent = Math.round(pct * 100)
  const barClass = level === 'full' ? 'is-full' : level === 'high' ? 'is-high' : ''
  const available = Math.max(capacity - inside, 0)

  return (
    <div>
      <div
        className="progress"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-label={`Ocupación del parqueadero: ${percent}%`}
      >
        <div className={`progress-bar ${barClass}`.trim()} style={{ width: `${percent}%` }} />
      </div>
      <div className="progress-meta">
        <span>
          <strong>{inside}</strong> de <strong>{capacity}</strong> espacios ocupados ({percent}%)
        </span>
        <span>{available} disponibles</span>
      </div>
    </div>
  )
}

/** Dona de ocupación con porcentaje central. */
export function OccupancyDonut({ inside = 0, capacity = 0, size = 190 }) {
  const { pct, level } = occupancyLevel(inside, capacity)
  const percent = Math.round(pct * 100)
  const radius = 64
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - pct)
  const color =
    level === 'full'
      ? 'var(--red-600)'
      : level === 'high'
        ? 'var(--amber-600)'
        : 'var(--green-600)'

  return (
    <div className="donut" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 160 160"
        role="img"
        aria-label={`Ocupación del parqueadero: ${percent}%`}
      >
        <circle className="donut-track" cx="80" cy="80" r={radius} fill="none" strokeWidth="14" />
        <circle
          className="donut-fill"
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="14"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="donut-center">
        <span className="donut-value">{percent}%</span>
        <span className="donut-label">ocupación</span>
      </div>
    </div>
  )
}

export default StatCard
