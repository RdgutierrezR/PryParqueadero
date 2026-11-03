import { NavLink } from 'react-router-dom'
import { Icon } from './Icon.jsx'
import logo from '../assets/logo-cul.svg'

function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

/** Navegación lateral del sistema, agrupada por secciones. */
export function Sidebar({ label, nav, user, onLogout, onNavigate }) {
  return (
    <aside className="sidebar" aria-label="Navegación principal">
      <div className="sidebar-brand">
        <img src={logo} alt="" className="brand-logo" />
        <div className="brand-text">
          <strong>Parqueadero CUL</strong>
          <span>{label}</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {nav.map((group) => (
          <div key={group.section}>
            <div className="nav-section">{group.section}</div>
            {group.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                onClick={onNavigate}
              >
                <span className="nav-icon" aria-hidden="true">
                  <Icon name={item.icon} size={18} />
                </span>
                {item.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-profile">
          <span className="avatar" aria-hidden="true">
            {initials(user?.name)}
          </span>
          <div className="profile-info">
            <div className="user-name" title={user?.name}>
              {user?.name || 'Usuario'}
            </div>
            <div className="user-role">{user?.role || ''}</div>
          </div>
          <button
            type="button"
            className="sidebar-logout"
            onClick={onLogout}
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
          >
            <Icon name="logout" size={17} />
          </button>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
