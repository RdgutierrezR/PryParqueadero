import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from './Icon.jsx'
import { accessService } from '../services/access.js'
import { vehicleService } from '../services/vehicles.js'

function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

/**
 * Cabecera superior: contexto de la página, notificaciones reales del sistema
 * (solicitudes pendientes y estado de ocupación) e identidad del usuario.
 */
export function Topbar({ title, section, user, isAdmin, onMenu }) {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState([])
  const [notifError, setNotifError] = useState('')
  const wrapperRef = useRef(null)

  const loadNotifications = useCallback(async () => {
    try {
      const requests = [accessService.occupancy()]
      if (isAdmin) requests.push(vehicleService.pending())
      const [occupancyRes, pendingRes] = await Promise.all(requests)
      const occupancy = occupancyRes.data
      const pending = pendingRes?.data?.length || 0
      const list = []

      if (isAdmin && pending > 0) {
        list.push({
          key: 'pending',
          tone: 'info',
          icon: 'inbox',
          title: `${pending} ${pending === 1 ? 'solicitud pendiente' : 'solicitudes pendientes'}`,
          text: 'Requieren revisión y decisión.',
          to: '/admin/solicitudes',
        })
      }

      if (occupancy?.is_full) {
        list.push({
          key: 'full',
          tone: 'danger',
          icon: 'alert-circle',
          title: 'Parqueadero lleno',
          text: 'No se permiten nuevas entradas.',
          to: isAdmin ? '/admin/reportes' : '/acceso/ocupacion',
        })
      } else if (occupancy) {
        const threshold = Math.max(3, Math.ceil(occupancy.capacity * 0.1))
        if (occupancy.available <= threshold) {
          list.push({
            key: 'near-full',
            tone: 'warning',
            icon: 'alert-triangle',
            title: 'Capacidad casi al límite',
            text: `Quedan ${occupancy.available} espacios disponibles.`,
            to: isAdmin ? '/admin/reportes' : '/acceso/ocupacion',
          })
        }
      }

      if (isAdmin && occupancy?.capacity_is_demo) {
        list.push({
          key: 'demo',
          tone: 'warning',
          icon: 'info',
          title: 'Capacidad de demostración',
          text: 'Ajusta la capacidad real del parqueadero.',
          to: '/admin/configuracion',
        })
      }

      setItems(list)
      setNotifError('')
    } catch {
      setNotifError('No se pudo consultar el estado del sistema.')
    }
  }, [isAdmin])

  useEffect(() => {
    loadNotifications()
    const id = window.setInterval(loadNotifications, 60000)
    return () => window.clearInterval(id)
  }, [loadNotifications])

  useEffect(() => {
    if (open) loadNotifications()
  }, [open, loadNotifications])

  useEffect(() => {
    if (!open) return undefined
    const handleClick = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setOpen(false)
    }
    const handleKey = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  useEffect(() => {
    setOpen(false)
  }, [title])

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          type="button"
          className="btn btn-icon menu-toggle"
          onClick={onMenu}
          aria-label="Abrir menú de navegación"
        >
          <Icon name="menu" size={20} />
        </button>

        <nav className="breadcrumb" aria-label="Ruta de navegación">
          <span>Parqueadero CUL</span>
          {section && (
            <>
              <span className="crumb-sep" aria-hidden="true">
                <Icon name="chevron-right" size={13} />
              </span>
              <span>{section}</span>
            </>
          )}
          <span className="crumb-sep" aria-hidden="true">
            <Icon name="chevron-right" size={13} />
          </span>
          <span className="crumb-current" aria-current="page">
            {title}
          </span>
        </nav>
        <span className="breadcrumb-title">{title}</span>
      </div>

      <div className="topbar-right">
        <div className="notif-wrap" ref={wrapperRef}>
          <button
            type="button"
            className="btn btn-icon notif-bell"
            onClick={() => setOpen((value) => !value)}
            aria-label={`Notificaciones${items.length ? ` (${items.length})` : ''}`}
            aria-haspopup="true"
            aria-expanded={open}
          >
            <Icon name="bell" size={19} />
            {items.length > 0 && <span className="notif-dot" aria-hidden="true" />}
          </button>

          {open && (
            <div className="notif-popover" role="region" aria-label="Notificaciones del sistema">
              <div className="notif-head">
                <span>Notificaciones</span>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={loadNotifications}
                  aria-label="Actualizar notificaciones"
                >
                  <Icon name="refresh" size={14} />
                  Actualizar
                </button>
              </div>
              <div className="notif-list">
                {notifError ? (
                  <div className="notif-empty">{notifError}</div>
                ) : items.length === 0 ? (
                  <div className="notif-empty">No hay novedades por ahora.</div>
                ) : (
                  items.map((item) =>
                    item.to ? (
                      <Link
                        key={item.key}
                        to={item.to}
                        className={`notif-item ${item.tone}`}
                        onClick={() => setOpen(false)}
                      >
                        <span className="notif-icon" aria-hidden="true">
                          <Icon name={item.icon} size={17} />
                        </span>
                        <span>
                          <span className="notif-title">{item.title}</span>
                          <span className="notif-text">{item.text}</span>
                        </span>
                      </Link>
                    ) : (
                      <div key={item.key} className={`notif-item ${item.tone}`}>
                        <span className="notif-icon" aria-hidden="true">
                          <Icon name={item.icon} size={17} />
                        </span>
                        <span>
                          <span className="notif-title">{item.title}</span>
                          <span className="notif-text">{item.text}</span>
                        </span>
                      </div>
                    )
                  )
                )}
              </div>
            </div>
          )}
        </div>

        <div className="user-chip">
          <span className="avatar sm" aria-hidden="true">
            {initials(user?.name)}
          </span>
          <span className="user-meta">
            <span className="user-chip-name">{user?.name}</span>
            <span className="user-chip-role">{user?.role}</span>
          </span>
        </div>
      </div>
    </header>
  )
}

export default Topbar
