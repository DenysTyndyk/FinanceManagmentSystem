import { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import {
  IconChevron,
  IconDots,
  IconInfo,
  IconMenu,
  IconPlus,
  IconTrend,
  IconWallet,
} from '../components/Icons'
import { api, errorMessage } from '../api'
import { convertFromPln, formatMoney, formatParts } from '../format'

// Tymczasowo jeden portfel osobisty, dopóki rejestracja nie tworzy go automatycznie
const PERSONAL_HOUSEHOLD_ID = 1

const DAILY_LIMIT = 120
const DAILY_SPENT = 18

const CURRENCIES = ['PLN', 'EUR', 'USD']

const EMPTY_EXPENSE = {
  categoryId: '',
  amount: '',
  transactionDate: new Date().toISOString().slice(0, 10),
  description: '',
}

export default function Dashboard({ firstName, onLogout }) {
  const [currency, setCurrency] = useState('PLN')
  const [menu, setMenu] = useState(null)
  const [showAll, setShowAll] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [dashboard, setDashboard] = useState(null)
  const [categories, setCategories] = useState([])
  const [isAddOpen, setAddOpen] = useState(false)
  const [expenseForm, setExpenseForm] = useState(EMPTY_EXPENSE)
  const [expenseError, setExpenseError] = useState('')
  const [isLimitsOpen, setLimitsOpen] = useState(false)
  // Edytowany limit (jeden naraz): { id: slug kategorii, value: tekst z pola }
  const [limitDraft, setLimitDraft] = useState(null)
  const [limitError, setLimitError] = useState('')
  const [toast, setToast] = useState('')

  useEffect(() => {
    if (!menu) return undefined
    const onPointer = (event) => {
      if (event.target.closest('[data-popover-root]')) return
      setMenu(null)
    }
    const onKey = (event) => {
      if (event.key === 'Escape') setMenu(null)
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [menu])

  // Pobranie danych pulpitu zalogowanego użytkownika z API
  function loadDashboard() {
    return api.dashboard().then((result) => {
      if (result.ok) setDashboard(result.data)
      return result.ok ? result.data : null
    })
  }

  useEffect(() => {
    loadDashboard()
    api.categories().then((result) => {
      if (result.ok) setCategories(result.data)
    })
  }, [])

  // Krótki komunikat znika sam po 4 sekundach
  useEffect(() => {
    if (!toast) return undefined
    const timer = setTimeout(() => setToast(''), 4000)
    return () => clearTimeout(timer)
  }, [toast])

  const transactions = dashboard?.transactions ?? []
  // Kategorie z limitem; "spent" to suma prawdziwych wydatków z bieżącego miesiąca (liczona w API)
  const activeLimits = (dashboard?.category_limits ?? []).filter((item) => item.limit != null)
  // Wszystkie kategorie dla formularza i okna limitów; brak wpisu w API = brak limitu
  const categoryLimits = categories.map((cat) => {
    const fromApi = activeLimits.find((item) => item.id === cat.slug)
    return { id: cat.slug, dbId: cat.id, label: cat.name, spent: fromApi?.spent ?? 0, limit: fromApi?.limit ?? null }
  })
  const totalParts = formatParts(convertFromPln(dashboard?.expenses ?? 0, currency))
  const visibleTransactions = showAll ? transactions : transactions.slice(0, 4)

  function toggleMenu(name) {
    setMenu((current) => (current === name ? null : name))
  }

  function updateExpenseField(name, value) {
    setExpenseForm((current) => ({ ...current, [name]: value }))
  }

  function openAddExpense() {
    setExpenseForm({ ...EMPTY_EXPENSE, categoryId: categoryLimits[0]?.id ?? '' })
    setExpenseError('')
    setLimitDraft(null)
    setAddOpen(true)
  }

  function openLimits() {
    setLimitDraft(null)
    setLimitsOpen(true)
  }

  function editLimit(cat) {
    setLimitDraft({ id: cat.id, value: cat.limit != null ? String(cat.limit) : '' })
    setLimitError('')
  }

  async function saveLimit(cat, remove = false) {
    const amount = Number(limitDraft?.value)
    if (!remove && !(amount > 0)) {
      setLimitError('Podaj limit większy niż 0.')
      return
    }
    const result = remove
      ? await api.deleteLimit(cat.dbId)
      : await api.setLimit(cat.dbId, { limit_amount: amount, household_id: PERSONAL_HOUSEHOLD_ID })
    if (!result.ok) {
      setLimitError(errorMessage(result.data, 'Nie udało się zapisać limitu.'))
      return
    }
    setLimitDraft(null)
    loadDashboard()
  }

  function renderLimitLine(cat) {
    if (!cat) return null
    const hasLimit = cat.limit != null
    if (limitDraft?.id !== cat.id) {
      return (
        <p className="hint">
          {hasLimit
            ? `Limit: ${formatMoney(cat.spent, 'PLN')} / ${formatMoney(cat.limit, 'PLN')} PLN (${Math.round((cat.spent / cat.limit) * 100)}%)`
            : 'Brak limitu'}
          {' · '}
          <button type="button" className="linkish" onClick={() => editLimit(cat)}>
            {hasLimit ? 'Zmień' : 'Ustaw limit'}
          </button>
        </p>
      )
    }
    return (
      <>
        <div className="limit-edit">
          <input
            type="number"
            min="0.01"
            step="0.01"
            inputMode="decimal"
            aria-label={`Limit dla kategorii ${cat.label} (PLN)`}
            autoFocus
            value={limitDraft.value}
            onChange={(event) => setLimitDraft({ id: cat.id, value: event.target.value })}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                saveLimit(cat)
              }
            }}
          />
          <span>PLN</span>
          <button type="button" className="btn-primary btn-sm" onClick={() => saveLimit(cat)}>
            Zapisz
          </button>
          {hasLimit ? (
            <button type="button" className="btn-outline btn-sm" onClick={() => saveLimit(cat, true)}>
              Usuń
            </button>
          ) : null}
          <button type="button" className="linkish" onClick={() => setLimitDraft(null)}>
            Anuluj
          </button>
        </div>
        {limitError ? <p className="field-error">{limitError}</p> : null}
      </>
    )
  }

  async function submitExpense(event) {
    event.preventDefault()
    const amount = Number(expenseForm.amount)
    if (!amount || amount <= 0) {
      setExpenseError('Podaj kwotę większą niż 0.')
      return
    }
    if (!expenseForm.transactionDate) {
      setExpenseError('Podaj datę wydatku.')
      return
    }
    const category = categoryLimits.find((cat) => cat.id === expenseForm.categoryId)
    if (!category) {
      setExpenseError('Wybierz kategorię.')
      return
    }
    // Zapis wydatku w bazie, potem odświeżenie pulpitu z API
    const result = await api.addExpense({
      amount,
      currency: 'PLN',
      category_id: category.dbId,
      household_id: PERSONAL_HOUSEHOLD_ID,
      transaction_date: expenseForm.transactionDate,
      description: expenseForm.description.trim() || null,
    })
    if (!result.ok) {
      setExpenseError(errorMessage(result.data, 'Nie udało się zapisać wydatku.'))
      return
    }
    setAddOpen(false)
    const spentBefore = activeLimits.find((item) => item.id === category.id)?.spent ?? 0
    const data = await loadDashboard()
    const after = data?.category_limits.find((item) => item.id === category.id && item.limit != null)
    if (after) {
      const ratio = after.spent / after.limit
      const crossed = [0.6, 0.8, 1].some((t) => spentBefore / after.limit < t && ratio >= t)
      if (crossed) setToast(`${after.label}: ${Math.round(ratio * 100)}% limitu`)
    }
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
              <button
                type="button"
                className="nav-toggle"
                aria-label="Otwórz menu"
                onClick={() => setSidebarOpen(true)}
              >
                <IconMenu />
              </button>
              <h1>Analiza wydatków</h1>
            </div>
            <div className="subtitle">
              Październik 2026
              <span className="subtitle-dot" aria-hidden="true">
                •
              </span>
              Witaj,{' '}
              <div className="popover" data-popover-root>
                <button
                  type="button"
                  className="name-btn"
                  aria-expanded={menu === 'account'}
                  aria-haspopup="menu"
                  onClick={() => toggleMenu('account')}
                >
                  {firstName}
                  <IconChevron />
                </button>
                {menu === 'account' ? (
                  <div className="menu" role="menu">
                    <button type="button" role="menuitem" onClick={onLogout}>
                      Wyloguj
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
          <button type="button" className="btn-primary" onClick={openAddExpense}>
            <IconPlus />
            Dodaj wydatek
          </button>
        </header>

        <section className="grid-top">
          <article className="card balance-card">
            <div className="card-head">
              <h2 className="muted-label">Całkowite wydatki</h2>
              <div className="popover" data-popover-root>
                <button
                  type="button"
                  className="currency-btn"
                  aria-expanded={menu === 'currency'}
                  aria-haspopup="menu"
                  onClick={() => toggleMenu('currency')}
                >
                  {currency}
                  <IconChevron />
                </button>
                {menu === 'currency' ? (
                  <div className="menu menu-end" role="menu">
                    {CURRENCIES.map((code) => (
                      <button
                        key={code}
                        type="button"
                        role="menuitem"
                        className={code === currency ? 'is-selected' : ''}
                        onClick={() => {
                          setCurrency(code)
                          setMenu(null)
                        }}
                      >
                        {code}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>

            <p className="balance-value">
              <span>{totalParts.grouped}</span>
              <span className="balance-cents">.{totalParts.cents}</span>
            </p>

            <p className="trend-row">
              <span className="trend">
                <IconTrend />
                +5.2%
              </span>
              <span className="muted">więcej niż we wrześniu</span>
            </p>

            <div className="divider" />

            <div className="limit-row">
              <div className="limit-head">
                <span className="stat-label">Dzienny limit wydatków</span>
                <span>
                  {formatMoney(DAILY_LIMIT, currency)} {currency}
                </span>
              </div>
              <div className="limit-track">
                <div className="limit-fill blue" style={{ width: `${(DAILY_SPENT / DAILY_LIMIT) * 100}%` }} />
              </div>
            </div>
          </article>

          <article className="card">
            <div className="card-head">
              <h2>Limity kategorii</h2>
              <button type="button" className="btn-outline btn-sm" onClick={openLimits}>
                Zarządzaj limitami
              </button>
            </div>
            <p className="muted" style={{ marginTop: 4 }}>
              Śledzenie wydatków wobec ustalonych limitów
            </p>

            {dashboard && activeLimits.length === 0 ? (
              <div className="limit-empty">
                <p className="muted">Nie masz jeszcze żadnych limitów.</p>
                <button type="button" className="btn-primary btn-sm" onClick={openLimits}>
                  Ustaw pierwszy limit
                </button>
              </div>
            ) : (
              <div className="limit-list">
                {activeLimits.map((cat) => {
                  const ratio = cat.spent / cat.limit
                  // Kolor paska: <60% zielony, 60–79% żółty, od 80% czerwony z ikoną ostrzeżenia
                  const level = ratio >= 0.8 ? 'over' : ratio >= 0.6 ? 'warn' : 'green'
                  const isOver = level === 'over'
                  return (
                    <div key={cat.id} className="limit-row">
                      <div className="limit-head">
                        <span>
                          {cat.label}
                          {isOver ? <IconInfo /> : null}
                        </span>
                        <span className={isOver ? 'limit-amount over' : 'limit-amount'}>
                          {formatMoney(cat.spent, currency)} / {formatMoney(cat.limit, currency)} {currency}
                        </span>
                      </div>
                      <div className="limit-track">
                        <div className={`limit-fill ${level}`} style={{ width: `${Math.min(ratio, 1) * 100}%` }} />
                      </div>
                      {cat.spent > cat.limit ? (
                        <p className="field-error">
                          Przekroczono o {formatMoney(cat.spent - cat.limit, currency)} {currency}
                        </p>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            )}
          </article>
        </section>

        <section className="grid-bottom">
          <article className="card">
            <div className="card-head">
              <h2>Ostatnie wydatki</h2>
              <button type="button" className="linkish" onClick={() => setShowAll((value) => !value)}>
                {showAll ? 'Zwiń' : 'Zobacz całą historię'}
              </button>
            </div>
            <ul className="tx-list">
              {visibleTransactions.map((item) => {
                const cat = activeLimits.find((c) => c.id === item.categoryId)
                const isOver = cat != null && cat.spent / cat.limit >= 0.8
                return (
                  <li key={item.id} className="tx">
                    <span className={`tx-icon ${isOver ? 'warn' : 'expense'}`}>
                      <IconWallet />
                    </span>
                    <div>
                      <p className="tx-title">
                        {item.title}
                        {isOver ? <span className="tx-badge">LIMIT &gt; 80%</span> : null}
                      </p>
                      <p className="tx-meta">
                        {item.category}
                        <span aria-hidden="true"> • </span>
                        {item.when}
                      </p>
                    </div>
                    <p className="tx-amount expense">
                      {formatMoney(item.amount, currency, { signMode: 'minus' })} {currency}
                    </p>
                  </li>
                )
              })}
            </ul>
          </article>

          <article className="card group-card">
            <div className="card-head">
              <h2>Współdzielenie kosztów</h2>
              <div className="popover" data-popover-root>
                <button
                  type="button"
                  className="icon-btn"
                  aria-label="Opcje grupy"
                  aria-expanded={menu === 'group'}
                  aria-haspopup="menu"
                  onClick={() => toggleMenu('group')}
                >
                  <IconDots />
                </button>
                {menu === 'group' ? (
                  <div className="menu menu-end" role="menu">
                    <button type="button" role="menuitem" onClick={() => setMenu(null)}>
                      3 uczestników · {currency}
                    </button>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="trip-row">
              <p className="trip-name">Wyjazd do Pragi</p>
              <p className="trip-people">3 osoby</p>
            </div>

            <div className="share-row">
              <span>Twój wkład (40%)</span>
              <strong>
                {formatMoney(1200, currency)} {currency}
              </strong>
            </div>

            <div className="share-row debt-row">
              <span className="debt-who">
                <span className="avatar">DF</span>
                zwraca Tobie
              </span>
              <strong className="stat-pos">+ {formatMoney(150, currency)} {currency}</strong>
            </div>

            <button type="button" className="btn-outline">
              Przejdź do rozliczeń grup
              <span aria-hidden="true"> ›</span>
            </button>
          </article>
        </section>
      </main>

      {isAddOpen ? (
        <div className="modal-backdrop" onClick={() => setAddOpen(false)}>
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-expense-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="add-expense-title">Dodaj wydatek</h2>
            <form onSubmit={submitExpense} noValidate>
              <div className="field">
                <label htmlFor="expense-category">Kategoria</label>
                <select
                  id="expense-category"
                  value={expenseForm.categoryId}
                  onChange={(event) => updateExpenseField('categoryId', event.target.value)}
                >
                  {categoryLimits.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
                {renderLimitLine(categoryLimits.find((cat) => cat.id === expenseForm.categoryId))}
              </div>

              <div className="field">
                <label htmlFor="expense-amount">Kwota ({currency})</label>
                <input
                  id="expense-amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  inputMode="decimal"
                  value={expenseForm.amount}
                  onChange={(event) => updateExpenseField('amount', event.target.value)}
                />
              </div>

              <div className="field">
                <label htmlFor="expense-date">Data</label>
                <input
                  id="expense-date"
                  type="date"
                  value={expenseForm.transactionDate}
                  onChange={(event) => updateExpenseField('transactionDate', event.target.value)}
                />
              </div>

              <div className="field">
                <label htmlFor="expense-description">Opis (opcjonalnie)</label>
                <input
                  id="expense-description"
                  type="text"
                  placeholder="np. Biedronka - zakupy"
                  value={expenseForm.description}
                  onChange={(event) => updateExpenseField('description', event.target.value)}
                />
              </div>

              {expenseError ? <p className="field-error">{expenseError}</p> : null}

              <div className="modal-actions">
                <button type="button" className="btn-outline" onClick={() => setAddOpen(false)}>
                  Anuluj
                </button>
                <button type="submit" className="btn-primary">
                  Dodaj
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <div className="toast-region" role="status" aria-live="polite">
        {toast ? <div className="toast">{toast}</div> : null}
      </div>

      {isLimitsOpen ? (
        <div className="modal-backdrop" onClick={() => setLimitsOpen(false)}>
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="limits-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="limits-title">Zarządzaj limitami</h2>
            {categoryLimits.map((cat) => (
              <div key={cat.id} className="field">
                <strong>{cat.label}</strong>
                {renderLimitLine(cat)}
              </div>
            ))}
            <div className="modal-actions">
              <button type="button" className="btn-outline" onClick={() => setLimitsOpen(false)}>
                Zamknij
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
