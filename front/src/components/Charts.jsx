/** Lista de barras horizontales para distribuciones reales (sin librerías). */
export function BarList({ items, total = 0, emptyText = 'Sin datos en el periodo.' }) {
  const max = Math.max(...items.map((item) => item.value), 0)
  if (!items.length || max === 0) {
    return <p className="text-muted" style={{ fontSize: '0.84rem' }}>{emptyText}</p>
  }

  return (
    <div className="bar-list">
      {items.map((item) => {
        const width = max > 0 ? Math.max((item.value / max) * 100, item.value > 0 ? 4 : 0) : 0
        const share = total > 0 ? Math.round((item.value / total) * 100) : 0
        return (
          <div className="bar-row" key={item.label}>
            <div className="bar-row-head">
              <span className="bar-name">{item.label}</span>
              <span className="bar-count">
                {item.value}
                {total > 0 ? ` · ${share}%` : ''}
              </span>
            </div>
            <div
              className="bar-track"
              role="img"
              aria-label={`${item.label}: ${item.value} de ${total}`}
            >
              <div
                className={`bar-fill ${item.tone || ''}`.trim()}
                style={{ width: `${width}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

/** Gráfica de columnas por hora (0–23) construida con HTML/CSS. */
export function HourChart({ data, emptyText = 'Sin entradas en el periodo.' }) {
  const counts = Array.from({ length: 24 }, (_, hour) => {
    const found = data?.find((item) => item.hour === hour)
    return found ? found.count : 0
  })
  const max = Math.max(...counts, 0)

  if (max === 0) {
    return <p className="text-muted" style={{ fontSize: '0.84rem' }}>{emptyText}</p>
  }

  return (
    <div className="hour-chart" role="img" aria-label="Entradas agrupadas por hora del día">
      {counts.map((count, hour) => (
        <div
          className="hour-col"
          key={hour}
          title={`${String(hour).padStart(2, '0')}:00 · ${count} ${count === 1 ? 'entrada' : 'entradas'}`}
        >
          <div
            className="hour-bar"
            style={{ height: `${count === 0 ? 2 : Math.max((count / max) * 100, 5)}%` }}
          />
          {hour % 3 === 0 && <span className="hour-label">{String(hour).padStart(2, '0')}</span>}
        </div>
      ))}
    </div>
  )
}

export default BarList
