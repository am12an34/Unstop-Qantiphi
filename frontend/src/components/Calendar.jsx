import { memo, useMemo } from 'react'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const pad = (n) => String(n).padStart(2, '0')

export function shiftMonth(month, delta) {
  const [y, m] = month.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
}

function Calendar({ month, days, loading, selectedDate, onSelectDate, onMonthChange }) {
  const [year, monthIndex] = month.split('-').map(Number)

  // Grid cells for the month, padded with blanks so day 1 lands on the right weekday.
  const cells = useMemo(() => {
    const firstWeekday = new Date(year, monthIndex - 1, 1).getDay()
    const daysInMonth = new Date(year, monthIndex, 0).getDate()
    const list = Array.from({ length: firstWeekday }, () => null)
    for (let d = 1; d <= daysInMonth; d++) list.push(`${month}-${pad(d)}`)
    return list
  }, [month, year, monthIndex])

  const today = useMemo(() => {
    const d = new Date()
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  }, [])

  const label = new Date(year, monthIndex - 1, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })

  return (
    <section className="card calendar">
      <header className="calendar-header">
        <button className="icon-btn" onClick={() => onMonthChange(shiftMonth(month, -1))} aria-label="Previous month">‹</button>
        <h2>{label}</h2>
        <button className="icon-btn" onClick={() => onMonthChange(shiftMonth(month, 1))} aria-label="Next month">›</button>
      </header>

      <div className={`calendar-grid${loading ? ' is-loading' : ''}`}>
        {WEEKDAYS.map((w) => <div key={w} className="weekday">{w}</div>)}
        {cells.map((date, i) => {
          if (!date) return <div key={`blank-${i}`} />
          const count = days[date] || 0
          const classes = ['day']
          if (count) classes.push('has-events')
          if (date === selectedDate) classes.push('selected')
          if (date === today) classes.push('today')
          return (
            <button
              key={date}
              className={classes.join(' ')}
              onClick={() => onSelectDate(date === selectedDate ? null : date)}
              title={count ? `${count} event${count > 1 ? 's' : ''}` : 'No events'}
            >
              <span>{Number(date.slice(-2))}</span>
              {count > 0 && <small className="dot">{count}</small>}
            </button>
          )
        })}
      </div>
      <p className="muted small legend">
        <span className="legend-dot" /> Highlighted days have events · click a day to filter
      </p>
    </section>
  )
}

export default memo(Calendar)
