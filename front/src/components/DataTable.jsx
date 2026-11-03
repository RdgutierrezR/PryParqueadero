import { useMemo, useState } from 'react'
import { EmptyState, ErrorState } from './States.jsx'
import { Icon } from './Icon.jsx'

function getSortValue(row, column) {
  if (column.sortAccessor) return column.sortAccessor(row)
  return row[column.key]
}

function compareValues(a, b) {
  if (a == null && b == null) return 0
  if (a == null) return 1
  if (b == null) return -1
  if (typeof a === 'number' && typeof b === 'number') return a - b
  return String(a).localeCompare(String(b), 'es', { numeric: true, sensitivity: 'base' })
}

/**
 * Tabla de datos reutilizable con ordenamiento por columna, estados de carga,
 * vacío y error. Las columnas se definen como:
 * { key, header, render?, align?, width?, sortable?, sortAccessor? }
 */
export function DataTable({
  columns,
  rows,
  rowKey = 'id',
  loading = false,
  loadingRows = 5,
  error = '',
  onRetry,
  emptyTitle = 'Sin resultados',
  emptyText = '',
  emptyIcon = 'inbox',
  sortable = true,
  initialSort = null,
  caption,
}) {
  const [sort, setSort] = useState(initialSort)

  const sortedRows = useMemo(() => {
    if (!sort) return rows
    const column = columns.find((item) => item.key === sort.key)
    if (!column) return rows
    const copy = [...rows]
    copy.sort((a, b) => {
      const result = compareValues(getSortValue(a, column), getSortValue(b, column))
      return sort.dir === 'asc' ? result : -result
    })
    return copy
  }, [rows, sort, columns])

  const toggleSort = (column) => {
    if (!sortable || column.sortable === false) return
    setSort((current) => {
      if (current?.key === column.key) {
        return { key: column.key, dir: current.dir === 'asc' ? 'desc' : 'asc' }
      }
      return { key: column.key, dir: 'asc' }
    })
  }

  const columnCount = columns.length
  const keyFor = typeof rowKey === 'function' ? rowKey : (row) => row[rowKey]

  return (
    <div className="table-scroll">
      <table className="data-table">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr>
            {columns.map((column) => {
              const isSorted = sort?.key === column.key
              const canSort = sortable && column.sortable !== false
              return (
                <th
                  key={column.key}
                  scope="col"
                  className={canSort ? 'is-sortable' : undefined}
                  style={{
                    width: column.width,
                    textAlign: column.align || 'left',
                  }}
                  aria-sort={
                    isSorted ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined
                  }
                >
                  {canSort ? (
                    <button
                      type="button"
                      className="th-sort-btn"
                      onClick={() => toggleSort(column)}
                      title={`Ordenar por ${column.header}`}
                    >
                      {column.header}
                      <span className="sort-ind" aria-hidden="true">
                        <Icon
                          name={isSorted && sort.dir === 'desc' ? 'chevron-down' : 'chevron-right'}
                          size={13}
                        />
                      </span>
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {error ? (
            <tr>
              <td colSpan={columnCount}>
                <ErrorState text={error} onRetry={onRetry} />
              </td>
            </tr>
          ) : loading ? (
            Array.from({ length: loadingRows }).map((_, index) => (
              <tr key={`skeleton-${index}`} aria-hidden="true">
                {columns.map((column) => (
                  <td key={column.key}>
                    <span className="skeleton row" style={{ width: `${55 + ((index * 13) % 40)}%` }} />
                  </td>
                ))}
              </tr>
            ))
          ) : sortedRows.length === 0 ? (
            <tr>
              <td colSpan={columnCount}>
                <EmptyState icon={emptyIcon} title={emptyTitle} text={emptyText} />
              </td>
            </tr>
          ) : (
            sortedRows.map((row) => (
              <tr key={keyFor(row)}>
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={column.className}
                    style={{ textAlign: column.align || 'left' }}
                  >
                    {column.render ? column.render(row) : row[column.key] ?? '—'}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

export default DataTable
