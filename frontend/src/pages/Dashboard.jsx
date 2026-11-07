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
import { convertFromPln, formatMoney, formatParts } from '../format'

const CATEGORY_LIMITS = [
  { id: 'jedzenie', label: 'Jedzenie na mieście', spent: 450, limit: 500, color: 'green' },
  { id: 'zakupy', label: 'Zakupy spożywcze', spent: 800, limit: 1200, color: 'green' },
  { id: 'transport', label: 'Transport', spent: 200, limit: 300, color: 'blue' },
  { id: 'rozrywka', label: 'Rozrywka (Subskrypcje)', spent: 150, limit: 150, color: 'green' },
]

const TRANSACTIONS = [
  {
    id: 1,
    title: 'Biedronka - Zakupy spożywcze',
    categoryId: 'zakupy',
    category: 'Zakupy spożywcze',
    when: 'Dziś, 14:30',
    amount: -145.5,
  },
  {
    id: 2,
    title: 'Pizzeria Napoli',
    categoryId: 'jedzenie',
    category: 'Jedzenie na mieście',
    when: 'Wczoraj, 20:00',
    amount: -120,
  },
  {
    id: 3,
    title: 'Netflix (Subskrypcja)',
    categoryId: 'rozrywka',
    category: 'Rozrywka',
    when: '24 Paź 2026',
    amount: -60,
  },
  {
    id: 4,
    title: 'Orlen - Paliwo',
    categoryId: 'transport',
    category: 'Transport',
    when: '23 Paź 2026',
    amount: -250,
  },
]

const MORE_TRANSACTIONS = [
  {
    id: 5,
    title: 'Żabka - Kawa',
    categoryId: 'jedzenie',
    category: 'Jedzenie na mieście',
    when: 'Wczoraj, 18:40',
    amount: -18.9,
  },
  {
    id: 6,
    title: 'Spotify',
    categoryId: 'rozrywka',
    category: 'Rozrywka',
    when: '20 Paź 2026',
    amount: -29.99,
  },
]

const TOTAL_EXPENSES = 3750
const DAILY_LIMIT = 120
const DAILY_SPENT = 18

const CURRENCIES = ['PLN', 'EUR', 'USD']

const EMPTY_EXPENSE = {
  categoryId: CATEGORY_LIMITS[0].id,
  amount: '',
  transactionDate: new Date().toISOString().slice(0, 10),
  description: '',
}

function todayLabel(isoDate) {
  const today = new Date().toISOString().slice(0, 10)
  if (isoDate === today) return 'Dziś'
  const [year, month, day] = isoDate.split('-')
  return `${day}.${month}.${year}`
}

export default function Dashboard({ firstName, onLogout }) {
  const [currency, setCurrency] = useState('PLN')
  const [menu, setMenu] = useState(null)
  const [showAll, setShowAll] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [transactions, setTransactions] = useState(TRANSACTIONS)
  const [isAddOpen, setAddOpen] = useState(false)
  const [expenseForm, setExpenseForm] = useState(EMPTY_EXPENSE)
  const [expenseError, setExpenseError] = useState('')

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

  const totalParts = formatParts(convertFromPln(TOTAL_EXPENSES, currency))
  const visibleTransactions = showAll ? [...transactions, ...MORE_TRANSACTIONS] : transactions

  function toggleMenu(name) {
    setMenu((current) => (current === name ? null : name))
  }

  function updateExpenseField(name, value) {
    setExpenseForm((current) => ({ ...current, [name]: value }))
  }

  function openAddExpense() {
    setExpenseForm(EMPTY_EXPENSE)
    setExpenseError('')
    setAddOpen(true)
  }

  function submitExpense(event) {
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
    const category = CATEGORY_LIMITS.find((cat) => cat.id === expenseForm.categoryId)
    setTransactions((current) => [
      {
        id: Date.now(),
        title: expenseForm.description.trim() || category.label,
        categoryId: category.id,
        category: category.label,
        when: todayLabel(expenseForm.transactionDate),
        amount: -amount,
      },
      ...current,
    ])
    setAddOpen(false)
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
              <button type="button" className="btn-outline btn-sm">
                Zarządzaj limitami
              </button>
            </div>
            <p className="muted" style={{ marginTop: 4 }}>
              Śledzenie wydatków wobec ustalonych limitów
            </p>

            <div className="limit-list">
              {CATEGORY_LIMITS.map((cat) => {
                const ratio = cat.spent / cat.limit
                const isOver = ratio >= 0.8
                const fillColor = isOver ? 'over' : cat.color
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
                      <div className={`limit-fill ${fillColor}`} style={{ width: `${Math.min(ratio, 1) * 100}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
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
                const cat = CATEGORY_LIMITS.find((c) => c.id === item.categoryId)
                const isOver = cat ? cat.spent / cat.limit >= 0.8 : false
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
                  {CATEGORY_LIMITS.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
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
    </div>
  )
}
