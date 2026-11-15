import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { formatMoney } from '../format'
import { IconCalendar, IconChevronLeft, IconChevronRight } from './Icons'

const MONTH_NAMES = [
  'Styczeń',
  'Luty',
  'Marzec',
  'Kwiecień',
  'Maj',
  'Czerwiec',
  'Lipiec',
  'Sierpień',
  'Wrzesień',
  'Październik',
  'Listopad',
  'Grudzień',
]

const WEEKDAYS = ['Pn', 'Wt', 'Śr', 'Czw', 'Pt', 'So', 'Nd']

export default function ExpenseCalendar({
  month,
  onMonthChange,
  data = null,
  currency = 'PLN',
  mini = false,
  onNavigateReports,
}) {
  const navigate = useNavigate()
  const [todayIso] = useState(() => new Date().toISOString().slice(0, 10))
  const defaultMonth = todayIso.slice(0, 7)
  const currentMonth = month || defaultMonth

  // Stan dla danych pobranych lokalnie (gdy nie przekazano propsa data)
  const [fetchedData, setFetchedData] = useState(null)
  const [selectedDay, setSelectedDay] = useState(null)

  // Używamy danych z propsa lub pobranych przez komponent
  const activeData = data || fetchedData

  // Pobieranie danych z endpointu raportów, jeśli nie zostały przekazane z góry
  useEffect(() => {
    if (data) return
    let isMounted = true
    api.reports(currentMonth).then((res) => {
      if (isMounted && res.ok) {
        setFetchedData(res.data)
      }
    })

    return () => {
      isMounted = false
    }
  }, [currentMonth, data])

  // Parsowanie roku i miesiąca
  const { year, monthIndex, daysInMonth, startOffset } = useMemo(() => {
    const [yStr, mStr] = (currentMonth || defaultMonth).split('-')
    const y = parseInt(yStr, 10) || 2026
    const m = (parseInt(mStr, 10) || 1) - 1
    const totalDays = new Date(y, m + 1, 0).getDate()
    // 0 = Niedziela, 1 = Poniedziałek -> przekształcamy na tydzień pon–nd (0 = Pon, 6 = Nd)
    const offset = (new Date(y, m, 1).getDay() + 6) % 7
    return { year: y, monthIndex: m, daysInMonth: totalDays, startOffset: offset }
  }, [currentMonth, defaultMonth])

  // Mapowanie wydatków na poszczególne dni
  const { dailyMap, maxDailyExpense } = useMemo(() => {
    const map = {}
    const maxVal = activeData?.max_daily_expense || 0
    if (activeData?.daily_expenses) {
      for (const item of activeData.daily_expenses) {
        map[item.date] = item
      }
    }
    return { dailyMap: map, maxDailyExpense: maxVal }
  }, [activeData])

  // Wyznaczanie odcienia heatmapy (0 - neutralny, 1..4 - intensywność)
  const calculateHeatmapLevel = useCallback(
    (amount, isFuture) => {
      if (isFuture || !amount || amount <= 0) return 0
      if (!maxDailyExpense || maxDailyExpense <= 0) return 1
      const ratio = amount / maxDailyExpense
      if (ratio <= 0.25) return 1
      if (ratio <= 0.5) return 2
      if (ratio <= 0.75) return 3
      return 4
    },
    [maxDailyExpense]
  )

  function handlePrevMonth() {
    const prev = new Date(year, monthIndex - 1, 1)
    const newMonth = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`
    if (onMonthChange) onMonthChange(newMonth)
  }

  function handleNextMonth() {
    const next = new Date(year, monthIndex + 1, 1)
    const newMonth = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`
    if (onMonthChange) onMonthChange(newMonth)
  }

  function handleDayClick(dayObj) {
    if (mini) {
      if (onNavigateReports) {
        onNavigateReports()
      } else {
        navigate('/raporty')
      }
      return
    }
    if (dayObj.isFuture) return
    setSelectedDay((curr) => (curr?.date === dayObj.date ? null : dayObj))
  }

  function handleCardClick() {
    if (mini) {
      if (onNavigateReports) {
        onNavigateReports()
      } else {
        navigate('/raporty')
      }
    }
  }

  // Generowanie komórek siatki kalendarza
  const calendarCells = useMemo(() => {
    const cells = []
    // Puste komórki przed 1. dniem miesiąca
    for (let i = 0; i < startOffset; i++) {
      cells.push({ key: `pad-${i}`, isPadding: true })
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      const isToday = dateStr === todayIso
      const isFuture = dateStr > todayIso
      const dayData = dailyMap[dateStr]
      const totalAmount = dayData?.total_amount || 0
      const transactions = dayData?.transactions || []
      const level = calculateHeatmapLevel(totalAmount, isFuture)

      cells.push({
        key: dateStr,
        date: dateStr,
        day: d,
        isPadding: false,
        isToday,
        isFuture,
        totalAmount,
        transactions,
        count: transactions.length,
        level,
      })
    }
    return cells
  }, [
    startOffset,
    daysInMonth,
    year,
    monthIndex,
    todayIso,
    dailyMap,
    calculateHeatmapLevel,
  ])

  const selectedData = selectedDay ? dailyMap[selectedDay.date] || selectedDay : null

  return (
    <div className={`expense-calendar ${mini ? 'is-mini' : 'is-full'}`}>
      <div className="calendar-header">
        <div className="calendar-title-group">
          <span className="calendar-icon">
            <IconCalendar size={mini ? 16 : 20} />
          </span>
          <h2 className="calendar-title">
            {mini ? 'Kalendarz wydatków' : `${MONTH_NAMES[monthIndex]} ${year}`}
          </h2>
          {mini ? (
            <span className="calendar-mini-month">
              {MONTH_NAMES[monthIndex]} {year}
            </span>
          ) : null}
        </div>

        {!mini && onMonthChange ? (
          <div className="calendar-nav-buttons">
            <button
              type="button"
              className="cal-nav-btn"
              onClick={handlePrevMonth}
              aria-label="Poprzedni miesiąc"
              title="Poprzedni miesiąc"
            >
              <IconChevronLeft size={16} />
            </button>
            <button
              type="button"
              className="cal-nav-btn"
              onClick={handleNextMonth}
              aria-label="Następny miesiąc"
              title="Następny miesiąc"
            >
              <IconChevronRight size={16} />
            </button>
          </div>
        ) : null}
      </div>

      <div
        className="calendar-grid-wrapper"
        onClick={mini ? handleCardClick : undefined}
        role={mini ? 'button' : undefined}
        tabIndex={mini ? 0 : undefined}
        aria-label={mini ? 'Przejdź do pełnego kalendarza w raportach' : undefined}
      >
        <div className="calendar-weekdays">
          {WEEKDAYS.map((wd) => (
            <div key={wd} className="weekday-label">
              {mini ? wd[0] : wd}
            </div>
          ))}
        </div>

        <div className="calendar-days-grid">
          {calendarCells.map((cell) => {
            if (cell.isPadding) {
              return <div key={cell.key} className="day-cell is-empty" aria-hidden="true" />
            }

            const isSelected = selectedDay?.date === cell.date

            return (
              <button
                key={cell.key}
                type="button"
                className={`day-cell heat-level-${cell.level} ${cell.isToday ? 'is-today' : ''} ${
                  cell.isFuture ? 'is-future' : ''
                } ${isSelected ? 'is-selected' : ''}`}
                onClick={(e) => {
                  e.stopPropagation()
                  handleDayClick(cell)
                }}
                disabled={cell.isFuture && !mini}
                aria-label={`${cell.day} ${MONTH_NAMES[monthIndex]}: ${
                  cell.totalAmount > 0
                    ? `${formatMoney(cell.totalAmount, currency)} ${currency}`
                    : 'Brak wydatków'
                }`}
              >
                <span className="day-number">{cell.day}</span>
                {!mini && cell.totalAmount > 0 ? (
                  <span className="day-amount-badge">
                    {Math.round(cell.totalAmount)}
                  </span>
                ) : null}

                {/* Tooltip przy najechaniu */}
                <div className="calendar-tooltip" role="tooltip">
                  <div className="tip-date">
                    {cell.day} {MONTH_NAMES[monthIndex]} {year}
                    {cell.isToday ? ' (Dziś)' : ''}
                  </div>
                  {cell.isFuture ? (
                    <div className="tip-empty">Dzień przyszły</div>
                  ) : cell.totalAmount > 0 ? (
                    <>
                      <div className="tip-amount">
                        {formatMoney(cell.totalAmount, currency)} {currency}
                      </div>
                      <div className="tip-count">
                        {cell.count} {cell.count === 1 ? 'wydatek' : 'wydatków'}
                      </div>
                    </>
                  ) : (
                    <div className="tip-empty">Brak wydatków</div>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Legenda heatmapy */}
      <div className="calendar-legend">
        <span className="legend-label">Mniej</span>
        <div className="legend-levels" aria-hidden="true">
          <span className="legend-box heat-level-0" title="Brak wydatków" />
          <span className="legend-box heat-level-1" title="Niski wydatek" />
          <span className="legend-box heat-level-2" title="Średni wydatek" />
          <span className="legend-box heat-level-3" title="Podwyższony wydatek" />
          <span className="legend-box heat-level-4" title="Wysoki wydatek" />
        </div>
        <span className="legend-label">Więcej</span>
      </div>

      {/* Przycisk przejścia do raportów dla widoku mini */}
      {mini ? (
        <button
          type="button"
          className="btn-outline cal-mini-link"
          onClick={(e) => {
            e.stopPropagation()
            handleCardClick()
          }}
        >
          Przejdź do raportów
          <span aria-hidden="true"> ›</span>
        </button>
      ) : null}

      {/* Szczegóły klikniętego dnia (widok pełny) */}
      {!mini && selectedData ? (
        <div className="day-details-card">
          <div className="day-details-header">
            <div>
              <h3>
                Wydatki z dnia {selectedData.day} {MONTH_NAMES[monthIndex]} {year}
              </h3>
              <p className="day-details-sub">
                Łącznie: <strong>{formatMoney(selectedData.totalAmount || 0, currency)} {currency}</strong>
              </p>
            </div>
            <button
              type="button"
              className="day-details-close"
              onClick={() => setSelectedDay(null)}
              aria-label="Zamknij podgląd dnia"
            >
              ✕
            </button>
          </div>

          {selectedData.transactions && selectedData.transactions.length > 0 ? (
            <ul className="day-tx-list">
              {selectedData.transactions.map((tx) => (
                <li key={tx.id} className="day-tx-item">
                  <div className="day-tx-info">
                    <span className="day-tx-title">{tx.title}</span>
                    <span className="day-tx-category">{tx.category}</span>
                  </div>
                  <strong className="day-tx-amount">
                    -{formatMoney(tx.amount, currency)} {currency}
                  </strong>
                </li>
              ))}
            </ul>
          ) : (
            <p className="day-tx-empty">W tym dniu nie odnotowano żadnych wydatków.</p>
          )}
        </div>
      ) : null}
    </div>
  )
}
