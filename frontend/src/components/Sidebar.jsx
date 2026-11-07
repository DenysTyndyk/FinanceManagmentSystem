import { NavLink } from 'react-router-dom'
import { IconChart, IconGrid, IconList, IconLogo, IconSettings, IconUsers } from './Icons'

const ITEMS = [
  { to: '/', label: 'Pulpit', icon: IconGrid, end: true },
  { to: '/wydatki', label: 'Wydatki osobiste', icon: IconList },
  { to: '/grupy', label: 'Grupy i podziały', icon: IconUsers },
  { to: '/raporty', label: 'Raporty', icon: IconChart },
]

export default function Sidebar({ open, onClose }) {
  return (
    <aside className={`sidebar ${open ? 'is-open' : ''}`}>
      <div className="brand">
        <span className="logo-mark">
          <IconLogo />
        </span>
        <span className="brand-name">FinManager</span>
      </div>

      <nav className="side-nav" aria-label="Główne">
        {ITEMS.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `nav-item ${isActive ? 'is-active' : ''}`}
              onClick={onClose}
            >
              <Icon />
              {item.label}
            </NavLink>
          )
        })}
      </nav>

      <button type="button" className="nav-item settings" onClick={onClose}>
        <IconSettings />
        Ustawienia
      </button>
    </aside>
  )
}
