import { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import ExpenseCalendar from '../components/ExpenseCalendar'
import { IconChevron, IconMenu } from '../components/Icons'
import { api } from '../api'
import { formatMoney } from '../format'

const DEFAULT_MONTH_BARS = [
  { day: '1 Paź', weight: 42, solid: true, amount: 157.5 },
  { day: '3 Paź', weight: 70, solid: true, amount: 262.5 },
  { day: '5 Paź', weight: 36, solid: false, amount: 135.0 },
  { day: '8 Paź', weight: 96, solid: false, amount: 360.0 },
  { day: '10 Paź', weight: 86, solid: true, amount: 322.5 },
  { day: '12 Paź', weight: 74, solid: true, amount: 277.5 },
  { day: '15 Paź', weight: 24, solid: false, amount: 90.0 },
  { day: '17 Paź', weight: 64, solid: false, amount: 240.0 },
  { day: '19 Paź', weight: 100, solid: true, amount: 375.0 },
  { day: '22 Paź', weight: 58, solid: true, amount: 217.5 },
  { day: '24 Paź', weight: 30, solid: false, amount: 112.5 },
  { day: '26 Paź', weight: 76, solid: true, amount: 285.0 },
  { day: '28 Paź', weight: 28, solid: false, amount: 105.0 },
  { day: '31 Paź', weight: 54, solid: true, amount: 202.5 },
]

const DEFAULT_WEEK_BARS = [
  { day: 'Pon', weight: 48, solid: true, amount: 180.0 },
  { day: 'Wt', weight: 76, solid: true, amount: 285.0 },
  { day: 'Śr', weight: 40, solid: false, amount: 150.0 },
  { day: 'Czw', weight: 92, solid: true, amount: 345.0 },
  { day: 'Pt', weight: 66, solid: true, amount: 247.5 },
  { day: 'Sob', weight: 28, solid: false, amount: 105.0 },
  { day: 'Nd', weight: 58, solid: true, amount: 217.5 },
]

const CURRENCIES = ['PLN', 'EUR', 'USD']

const POLISH_MONTH_SHORT = [
  'Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze',
  'Lip', 'Sie', 'Wrz', 'Paź', 'Lis', 'Gru'
]

export default function Reports() {
  const [currency, setCurrency] = useState('PLN')
  const [range, setRange] = useState('month')
  const [menu, setMenu] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Wybór miesiąca w formacie YYYY-MM
  const [currentMonth, setCurrentMonth] = useState(() => new Date().toISOString().slice(0, 7))
  const [reportsData, setReportsData] = useState(null)

  useEffect(() => {
    let active = true
    api.reports(currentMonth).then((res) => {
      if (active && res.ok) {
        setReportsData(res.data)
      }
    })
    return () => {
      active = false
    }
  }, [currentMonth])

  // Dane wykresu z API lub wartości domyślne w razie braku danych
  const activeMonthBars =
    reportsData?.chart_month_bars && reportsData.chart_month_bars.length > 0
      ? reportsData.chart_month_bars
      : DEFAULT_MONTH_BARS

  const activeWeekBars =
    reportsData?.chart_week_bars && reportsData.chart_week_bars.length > 0
      ? reportsData.chart_week_bars
      : DEFAULT_WEEK_BARS

  const bars = range === 'month' ? activeMonthBars : activeWeekBars
  const chartTotal =
    reportsData?.total_expenses !== undefined && reportsData.total_expenses > 0
      ? reportsData.total_expenses
      : range === 'month'
        ? 3750
        : 980

  // Etykiety osi X
  const [yearStr, monthStr] = currentMonth.split('-')
  const monthNum = parseInt(monthStr, 10) || 1
  const mLabel = POLISH_MONTH_SHORT[monthNum - 1]
  const lastDay = new Date(parseInt(yearStr, 10), monthNum, 0).getDate()

  const axisLabels =
    range === 'month'
      ? [`1 ${mLabel}`, `15 ${mLabel}`, `${lastDay} ${mLabel}`]
      : ['Pon', 'Czw', 'Nd']

  return (
    <div className="shell">
      {sidebarOpen ? (
        <button
          type="button"
          className="scrim"
          aria-label="Zamknij menu"
          onClick={() => setSidebarOpen(false)}
        />
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
                  const amount = bar.amount > 0 ? bar.amount : (chartTotal * bar.weight) / 100
                  return (
                    <div key={bar.day} className="bar-col">
                      <div
                        className={`bar ${bar.solid ? 'is-solid' : 'is-pale'}`}
                        style={{ height: `${Math.max(bar.weight, 4)}%` }}
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
                {axisLabels.map((label) => (
                  <span key={label}>{label}</span>
                ))}
              </div>
            </div>
          </article>
        </section>

        {/* Kalendarz wydatków i heatmapa */}
        <section className="reports-calendar-section" style={{ marginTop: 24 }}>
          <article className="card">
            <ExpenseCalendar
              month={currentMonth}
              onMonthChange={setCurrentMonth}
              data={reportsData}
              currency={currency}
              mini={false}
            />
          </article>
        </section>
      </main>
    </div>
  )
}
