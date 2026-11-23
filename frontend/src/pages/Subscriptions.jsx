import { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import { IconMenu } from '../components/Icons'
import { api } from '../api'

// shortcut: strona-zaślepka — formularz nic nie zapisuje (brak API subskrypcji); podpiąć pod tabelę recurring_subscriptions, gdy powstanie API
export default function Subscriptions() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [categories, setCategories] = useState([])

  // Ta sama lista co w formularzu wydatku i limitach: domyślne + własne kategorie użytkownika
  useEffect(() => {
    api.categories().then((result) => {
      if (result.ok) setCategories(result.data)
    })
  }, [])

  return (
    <div className="shell">
      {sidebarOpen ? (
        <button type="button" className="scrim" aria-label="Zamknij menu" onClick={() => setSidebarOpen(false)} />
      ) : null}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="content">
        <header className="topbar">
          <div>
            <div className="title-row">
              <button type="button" className="nav-toggle" aria-label="Otwórz menu" onClick={() => setSidebarOpen(true)}>
                <IconMenu />
              </button>
              <h1>Subskrypcje</h1>
            </div>
            <div className="subtitle">Funkcja w przygotowaniu — formularz nie zapisuje jeszcze danych.</div>
          </div>
        </header>

        <article className="card" style={{ maxWidth: 460 }}>
          <h2>Nowa subskrypcja</h2>
          <form onSubmit={(event) => event.preventDefault()} noValidate style={{ marginTop: 16 }}>
            <div className="field">
              <label htmlFor="sub-title">Nazwa</label>
              <input id="sub-title" type="text" placeholder="np. Netflix" />
            </div>
            <div className="field">
              <label htmlFor="sub-amount">Kwota miesięczna (PLN)</label>
              <input id="sub-amount" type="number" min="0.01" step="0.01" inputMode="decimal" />
            </div>
            <div className="field">
              <label htmlFor="sub-category">Kategoria</label>
              <select id="sub-category">
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn-primary" disabled>
              Zapisz (wkrótce)
            </button>
          </form>
        </article>
      </main>
    </div>
  )
}
