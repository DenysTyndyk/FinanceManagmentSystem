import { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import {
  IconArrowIn,
  IconArrowOut,
  IconChevron,
  IconDots,
  IconMenu,
  IconPlus,
  IconTrend,
} from '../components/Icons'
import { convertFromPln, formatMoney, formatParts } from '../format'

const TRANSACTIONS = [
  {
    id: 1,
    title: 'Biedronka - Zakupy spożywcze',
    category: 'Jedzenie',
    when: 'Dziś, 14:30',
    amount: -145.5,
    kind: 'expense',
  },
  {
    id: 2,
    title: 'Netflix Subscription',
    category: 'Rozrywka',
    when: 'Dziś, 09:00',
    amount: -60,
    kind: 'expense',
  },
  {
    id: 3,
    title: 'Wynagrodzenie - Październik',
    category: 'Przychód',
    when: 'Wczoraj, 08:15',
    amount: 8200,
    kind: 'income',
  },
  {
    id: 4,
    title: 'Orlen - Paliwo',
    category: 'Transport',
    when: '23 Paź 2026',
    amount: -250,
    kind: 'expense',
  },
]

const MORE_TRANSACTIONS = [
  {
    id: 5,
    title: 'Żabka - Kawa',
    category: 'Jedzenie',
    when: 'Wczoraj, 18:40',
    amount: -18.9,
    kind: 'expense',
  },
  {
    id: 6,
    title: 'Spotify',
    category: 'Rozrywka',
    when: '20 Paź 2026',
    amount: -29.99,
    kind: 'expense',
  },
]

const MONTH_BARS = [
  { day: '1 Paź', weight: 42, solid: true },
  { day: '3 Paź', weight: 70, solid: true },
  { day: '5 Paź', weight: 36, solid: false },
  { day: '8 Paź', weight: 96, solid: false },
  { day: '10 Paź', weight: 86, solid: true },
  { day: '12 Paź', weight: 74, solid: true },
  { day: '15 Paź', weight: 24, solid: false },
  { day: '17 Paź', weight: 64, solid: false },
  { day: '19 Paź', weight: 100, solid: true },
  { day: '22 Paź', weight: 58, solid: true },
  { day: '24 Paź', weight: 30, solid: false },
  { day: '26 Paź', weight: 76, solid: true },
  { day: '28 Paź', weight: 28, solid: false },
  { day: '31 Paź', weight: 54, solid: true },
]

const WEEK_BARS = [
  { day: 'Pon', weight: 48, solid: true },
  { day: 'Wt', weight: 76, solid: true },
  { day: 'Śr', weight: 40, solid: false },
  { day: 'Czw', weight: 92, solid: true },
  { day: 'Pt', weight: 66, solid: true },
  { day: 'Sob', weight: 28, solid: false },
  { day: 'Nd', weight: 58, solid: true },
]

const CURRENCIES = ['PLN', 'EUR', 'USD']

function barAmount(weight, weights, total) {
  const sum = weights.reduce((acc, item) => acc + item, 0)
  return Math.round((total * weight) / sum)
}

export default function Dashboard({ firstName, onOpenRegister }) {
  const [currency, setCurrency] = useState('PLN')
  const [range, setRange] = useState('month')
  const [menu, setMenu] = useState(null)
  const [showAll, setShowAll] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

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

  const balance = formatParts(convertFromPln(8450, currency))
  const bars = range === 'month' ? MONTH_BARS : WEEK_BARS
  const chartTotal = range === 'month' ? 3750 : 980
  const visibleTransactions = showAll ? [...TRANSACTIONS, ...MORE_TRANSACTIONS] : TRANSACTIONS

  function toggleMenu(name) {
    setMenu((current) => (current === name ? null : name))
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
              <h1>Przegląd finansów</h1>
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
                    <button type="button" role="menuitem" onClick={onOpenRegister}>
                      Utwórz nowe konto
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
          <button type="button" className="btn-primary">
            <IconPlus />
            Dodaj wydatek
          </button>
        </header>

        <section className="grid-top">
          <article className="card balance-card">
            <div className="card-head">
              <h2 className="muted-label">Dostępne środki</h2>
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
              <span>{balance.grouped}</span>
              <span className="balance-cents">.{balance.cents}</span>
            </p>

            <p className="trend-row">
              <span className="trend">
                <IconTrend />
                +12.5%
              </span>
              <span className="muted">od zeszłego miesiąca</span>
            </p>

            <div className="divider" />

            <div className="split-stats">
              <div>
                <p className="stat-label">Przychody</p>
                <p className="stat-pos">{formatMoney(12200, currency, { signMode: 'spaced' })}</p>
              </div>
              <div>
                <p className="stat-label">Wydatki</p>
                <p className="stat-neg">{formatMoney(-3750, currency, { signMode: 'spaced' })}</p>
              </div>
            </div>
          </article>

          <article className="card">
            <div className="card-head">
              <h2>Wydatki w czasie</h2>
              <div className="segment" role="tablist" aria-label="Zakres wykresu">
                <button
                  type="button"
                  role="tab"
                  aria-selected={range === 'week'}
                  className={range === 'week' ? 'is-on' : ''}
                  onClick={() => setRange('week')}
                >
                  Tydzień
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={range === 'month'}
                  className={range === 'month' ? 'is-on' : ''}
                  onClick={() => setRange('month')}
                >
                  Miesiąc
                </button>
              </div>
            </div>

            <div className="chart" aria-hidden="true">
              <div className="chart-plot">
                {bars.map((bar) => {
                  const amount = barAmount(
                    bar.weight,
                    bars.map((item) => item.weight),
                    chartTotal,
                  )
                  return (
                    <div key={bar.day} className="bar-col">
                      <div
                        className={`bar ${bar.solid ? 'is-solid' : 'is-pale'}`}
                        style={{ height: `${bar.weight}%` }}
                      >
                        <span className="bar-tip">
                          {bar.day} · {formatMoney(amount, currency)} {currency}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="chart-axis">
                {(range === 'month' ? ['1 Paź', '15 Paź', '31 Paź'] : ['Pon', 'Czw', 'Nd']).map((label) => (
                  <span key={label}>{label}</span>
                ))}
              </div>
            </div>
          </article>
        </section>

        <section className="grid-bottom">
          <article className="card">
            <div className="card-head">
              <h2>Ostatnie transakcje</h2>
              <button type="button" className="linkish" onClick={() => setShowAll((value) => !value)}>
                {showAll ? 'Zwiń' : 'Zobacz wszystkie'}
              </button>
            </div>
            <ul className="tx-list">
              {visibleTransactions.map((item) => (
                <li key={item.id} className="tx">
                  <span className={`tx-icon ${item.kind}`}>
                    {item.kind === 'income' ? <IconArrowIn /> : <IconArrowOut />}
                  </span>
                  <div>
                    <p className="tx-title">{item.title}</p>
                    <p className="tx-meta">
                      {item.category}
                      <span aria-hidden="true"> • </span>
                      {item.when}
                    </p>
                  </div>
                  <p className={`tx-amount ${item.kind}`}>
                    {formatMoney(item.amount, currency, {
                      signMode: item.kind === 'income' ? 'always' : 'minus',
                    })}{' '}
                    {currency}
                  </p>
                </li>
              ))}
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
    </div>
  )
}
