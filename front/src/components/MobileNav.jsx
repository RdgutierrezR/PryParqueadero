import { NavLink } from 'react-router-dom'
import { Icon } from './Icon.jsx'

/**
 * Barra de navegación inferior para móviles.
 * Solo se muestra cuando el rol tiene pocos accesos, como el vigilante.
 */
export function MobileNav({ nav }) {
  const items = nav.flatMap((group) => group.items)

  return (
    <nav className="mobile-nav" aria-label="Navegación rápida">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) => `mobile-nav-link${isActive ? ' active' : ''}`}
          aria-label={item.label}
        >
          <Icon name={item.icon} size={20} />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}

export default MobileNav
