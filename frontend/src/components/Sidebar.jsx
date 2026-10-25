import { IconChart, IconGrid, IconList, IconLogo, IconSettings, IconUsers } from './Icons'

const ITEMS = [
  { id: 'pulpit', label: 'Pulpit', icon: IconGrid },
  { id: 'wydatki', label: 'Wydatki osobiste', icon: IconList },
  { id: 'grupy', label: 'Grupy i podziały', icon: IconUsers },
  { id: 'raporty', label: 'Raporty', icon: IconChart },
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
          const active = item.id === 'pulpit'
          return (
            <button
              key={item.id}
              type="button"
              className={`nav-item ${active ? 'is-active' : ''}`}
              aria-current={active ? 'page' : undefined}
              onClick={onClose}
            >
              <Icon />
              {item.label}
            </button>
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
