import { useState } from 'react'
import Sidebar from '../components/Sidebar'
import { IconChevron, IconMenu } from '../components/Icons'
import { formatMoney } from '../format'

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

export default function Reports() {
  const [currency, setCurrency] = useState('PLN')
  const [range, setRange] = useState('month')
  const [menu, setMenu] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const bars = range === 'month' ? MONTH_BARS : WEEK_BARS
  const chartTotal = range === 'month' ? 3750 : 980

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
              <h1>Raporty</h1>
            </div>
            <div className="subtitle">Diagramy i analiza wydatków w czasie</div>
          </div>
        </header>

        <section className="grid-top" style={{ gridTemplateColumns: '1fr' }}>
          <article className="card">
            <div className="card-head">
              <h2>Wydatki w czasie</h2>
              <div style={{ display: 'flex', gap: 10 }}>
                <div className="popover" data-popover-root>
                  <button
                    type="button"
                    className="currency-btn"
                    aria-expanded={menu}
                    aria-haspopup="menu"
                    onClick={() => setMenu((value) => !value)}
                  >
                    {currency}
                    <IconChevron />
                  </button>
                  {menu ? (
                    <div className="menu menu-end" role="menu">
                      {CURRENCIES.map((code) => (
                        <button
                          key={code}
                          type="button"
                          role="menuitem"
                          className={code === currency ? 'is-selected' : ''}
                          onClick={() => {
                            setCurrency(code)
                            setMenu(false)
                          }}
                        >
                          {code}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
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
      </main>
    </div>
  )
}
