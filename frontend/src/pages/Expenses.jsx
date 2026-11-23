import { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import { IconMenu, IconPencil, IconPlus, IconWallet } from '../components/Icons'
import { api, errorMessage } from '../api'
import { formatMoney } from '../format'

const PINNED_COUNT = 5
const DEFAULT_COLOR = '#3b6ff5'

export default function Expenses() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [categories, setCategories] = useState([])
  const [selectedId, setSelectedId] = useState(null) // null = "Wszystkie"
  const [expanded, setExpanded] = useState(false)
  const [expenses, setExpenses] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [editor, setEditor] = useState(null)
  const [editorError, setEditorError] = useState('')

  useEffect(() => {
    api.categories().then((result) => {
      if (result.ok) setCategories(result.data)
    })
  }, [])

  // Lista wydatków filtrowana po stronie API (cała historia kategorii, nie tylko wczytany fragment)
  useEffect(() => {
    let active = true
    setExpenses(null)
    api.expenses(selectedId).then((result) => {
      if (active) setExpenses(result.ok ? result.data : [])
    })
    return () => {
      active = false
    }
  }, [selectedId, reloadKey])

  // 5 najczęściej używanych (stabilne sortowanie: przy remisie kolejność listy domyślnej) + własne
  const top = [...categories].sort((a, b) => b.usage_count - a.usage_count).slice(0, PINNED_COUNT)
  const pinned = [...top, ...categories.filter((cat) => cat.is_own && !top.includes(cat))]
  const rest = categories.filter((cat) => !pinned.includes(cat))
  // Po zwinięciu wybrana kategoria z "Pokaż więcej" zostaje widoczna
  const visible = expanded ? [...pinned, ...rest] : [...pinned, ...rest.filter((cat) => cat.id === selectedId)]

  function openEditor(cat) {
    setEditor(cat ? { id: cat.id, name: cat.name, color: cat.color ?? DEFAULT_COLOR } : { id: null, name: '', color: DEFAULT_COLOR })
    setEditorError('')
  }

  async function submitEditor(event) {
    event.preventDefault()
    const name = editor.name.trim()
    if (!name) {
      setEditorError('Podaj nazwę kategorii.')
      return
    }
    const isNew = editor.id === null
    const result = isNew
      ? await api.createCategory(name, editor.color)
      : await api.updateCategory(editor.id, name, editor.color)
    if (!result.ok) {
      setEditorError(errorMessage(result.data, 'Nie udało się zapisać kategorii.'))
      return
    }
    const saved = result.data
    setCategories((current) =>
      isNew
        ? [...current, saved]
        : current.map((cat) => (cat.id === saved.id ? { ...cat, name: saved.name, slug: saved.slug, color: saved.color } : cat)),
    )
    setEditor(null)
    if (!isNew) setReloadKey((key) => key + 1)
  }

  async function deleteCategory() {
    if (!window.confirm(`Usunąć kategorię „${editor.name}”? Wydatki z tej kategorii zostaną zachowane.`)) return
    const result = await api.deleteCategory(editor.id)
    if (!result.ok) {
      setEditorError(errorMessage(result.data, 'Nie udało się usunąć kategorii.'))
      return
    }
    setCategories((current) => current.filter((cat) => cat.id !== editor.id))
    if (selectedId === editor.id) setSelectedId(null)
    setEditor(null)
  }

  function chip(key, label, pressed, onClick, color) {
    return (
      <button key={key} type="button" className="chip" aria-pressed={pressed} onClick={onClick}>
        {color ? <span className="chip-dot" style={{ background: color }} aria-hidden="true" /> : null}
        {label}
      </button>
    )
  }

  function categoryChip(cat) {
    const button = chip(cat.id, cat.name, selectedId === cat.id, () => setSelectedId(cat.id), cat.color)
    if (!cat.is_own) return button
    return (
      <span key={cat.id} className="chip-group">
        {button}
        <button
          type="button"
          className="chip-edit"
          aria-label={`Edytuj kategorię ${cat.name}`}
          onClick={() => openEditor(cat)}
        >
          <IconPencil />
        </button>
      </span>
    )
  }

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
              <h1>Wydatki osobiste</h1>
            </div>
          </div>
        </header>

        <article className="card">
          <div className={expanded ? 'chip-bar is-expanded' : 'chip-bar'} role="group" aria-label="Filtr kategorii">
            {chip('all', 'Wszystkie', selectedId === null, () => setSelectedId(null))}
            {visible.map(categoryChip)}
            {rest.length > 0 ? (
              <button type="button" className="chip chip-ghost" aria-expanded={expanded} onClick={() => setExpanded((v) => !v)}>
                {expanded ? 'Pokaż mniej' : 'Pokaż więcej'}
              </button>
            ) : null}
            <button type="button" className="chip chip-ghost" onClick={() => openEditor(null)}>
              <IconPlus />
              Nowa kategoria
            </button>
          </div>

          {expenses === null ? null : expenses.length === 0 ? (
            <p className="muted" style={{ marginTop: 16 }}>
              {selectedId === null ? 'Brak wydatków.' : 'Brak wydatków w tej kategorii.'}
            </p>
          ) : (
            <ul className="tx-list">
              {expenses.map((item) => (
                <li key={item.id} className="tx">
                  <span className="tx-icon expense">
                    <IconWallet />
                  </span>
                  <div>
                    <p className="tx-title">{item.title}</p>
                    <p className="tx-meta">
                      {item.category}
                      <span aria-hidden="true"> • </span>
                      {item.transaction_date.split('-').reverse().join('.')}
                    </p>
                  </div>
                  <p className="tx-amount expense">{formatMoney(-item.amount, 'PLN')} PLN</p>
                </li>
              ))}
            </ul>
          )}
        </article>
      </main>

      {editor ? (
        <div className="modal-backdrop" onClick={() => setEditor(null)}>
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="category-editor-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="category-editor-title">{editor.id === null ? 'Nowa kategoria' : 'Edytuj kategorię'}</h2>
            <form onSubmit={submitEditor} noValidate>
              <div className="field">
                <label htmlFor="category-name">Nazwa</label>
                <input
                  id="category-name"
                  type="text"
                  maxLength={100}
                  autoFocus
                  placeholder="np. Kawa i słodycze"
                  value={editor.name}
                  onChange={(event) => setEditor({ ...editor, name: event.target.value })}
                />
              </div>
              <div className="field">
                <label htmlFor="category-color">Kolor</label>
                <input
                  id="category-color"
                  className="color-input"
                  type="color"
                  value={editor.color}
                  onChange={(event) => setEditor({ ...editor, color: event.target.value })}
                />
              </div>
              {editorError ? <p className="field-error">{editorError}</p> : null}
              <div className="modal-actions">
                {editor.id !== null ? (
                  <button type="button" className="btn-outline btn-danger" onClick={deleteCategory}>
                    Usuń
                  </button>
                ) : null}
                <button type="button" className="btn-outline" onClick={() => setEditor(null)}>
                  Anuluj
                </button>
                <button type="submit" className="btn-primary">
                  {editor.id === null ? 'Dodaj' : 'Zapisz'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  )
}
