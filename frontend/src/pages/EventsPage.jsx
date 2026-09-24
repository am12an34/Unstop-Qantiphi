import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Calendar from '../components/Calendar'
import EventCard from '../components/EventCard'
import useDebounce from '../hooks/useDebounce'
import useEvents from '../hooks/useEvents'
import useEventActions from '../hooks/useEventActions'
import { eventsApi, shareApi } from '../api'
import { isCancel } from '../api/client'
import { useUser } from '../context/UserContext'
import { formatDate } from '../utils/format'

const CATEGORIES = ['', 'Music', 'Sports', 'Comedy', 'Arts & Theatre', 'Miscellaneous']

function currentMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export default function EventsPage() {
  const { user } = useUser()
  const [params, setParams] = useSearchParams()
  const inviteToken = params.get('ref')
  const invitedEventId = params.get('event')

  const [month, setMonth] = useState(currentMonth)
  const [selectedDate, setSelectedDate] = useState(null)
  const [city, setCity] = useState('')
  const [keyword, setKeyword] = useState('')
  const [category, setCategory] = useState('')
  const [page, setPage] = useState(1)
  const [calendar, setCalendar] = useState({ days: {}, loading: true })
  const [invite, setInvite] = useState(null)

  const debouncedCity = useDebounce(city)
  const debouncedKeyword = useDebounce(keyword)

  // Any filter change goes back to page 1.
  const resetting = (setter) => (value) => {
    setter(value)
    setPage(1)
  }

  const query = useMemo(
    () => ({
      ...(selectedDate ? { from: selectedDate, to: selectedDate } : { month }),
      city: debouncedCity || undefined,
      keyword: debouncedKeyword || undefined,
      category: category || undefined,
      page,
      limit: 9,
      user: user?._id, // part of the cache key so isInterested refreshes on sign-in
    }),
    [selectedDate, month, debouncedCity, debouncedKeyword, category, page, user?._id],
  )

  const { events, total, totalPages, loading, error, replaceEvent } = useEvents(query)
  const { markInterested, shareEvent, busyId } = useEventActions(replaceEvent)

  // Calendar highlights come from the server, per month and filters.
  useEffect(() => {
    const controller = new AbortController()
    setCalendar((c) => ({ ...c, loading: true }))
    eventsApi
      .calendar({ month, city: debouncedCity || undefined, keyword: debouncedKeyword || undefined }, controller.signal)
      .then((res) => setCalendar({ days: res.days, loading: false }))
      .catch((err) => !isCancel(err) && setCalendar({ days: {}, loading: false }))
    return () => controller.abort()
  }, [month, debouncedCity, debouncedKeyword])

  // Opened from a friend's share link: show who invited them and the event.
  useEffect(() => {
    if (!inviteToken || !invitedEventId) return
    Promise.all([shareApi.invite(inviteToken), eventsApi.get(invitedEventId)])
      .then(([details, event]) => setInvite({ ...details, event }))
      .catch(() => setInvite(null))
  }, [inviteToken, invitedEventId, user?._id])

  const onMonthChange = useCallback((m) => {
    setMonth(m)
    setSelectedDate(null)
    setPage(1)
  }, [])

  const onSelectDate = useCallback((date) => {
    setSelectedDate(date)
    setPage(1)
  }, [])

  const onInviteRsvp = useCallback(
    async (event) => {
      await markInterested(event, inviteToken)
      const fresh = await eventsApi.get(event.id).catch(() => null)
      if (fresh) setInvite((inv) => inv && { ...inv, event: fresh })
    },
    [markInterested, inviteToken],
  )

  const dismissInvite = () => {
    setInvite(null)
    setParams({})
  }

  return (
    <div className="page">
      {invite && (
        <section className="invite-banner">
          <div>
            <p className="eyebrow">You're invited 🎉</p>
            <h2>{invite.invitedBy} invited you to {invite.eventTitle}</h2>
          </div>
          <div className="invite-card">
            <EventCard event={invite.event} busy={busyId === invite.event.id} highlighted onInterested={onInviteRsvp} onShare={shareEvent} />
          </div>
          <button className="icon-btn close" onClick={dismissInvite} aria-label="Dismiss">✕</button>
        </section>
      )}

      <section className="hero">
        <h1>Find what's happening near you</h1>
        <p className="muted">Browse live events, RSVP in one click and bring your friends along.</p>
        <div className="filters">
          <input placeholder="🔍 Search events or venues" value={keyword} onChange={(e) => resetting(setKeyword)(e.target.value)} />
          <input placeholder="📍 City" value={city} onChange={(e) => resetting(setCity)(e.target.value)} />
          <select value={category} onChange={(e) => resetting(setCategory)(e.target.value)}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c || 'All categories'}</option>)}
          </select>
        </div>
      </section>

      <div className="layout">
        <aside>
          <Calendar
            month={month}
            days={calendar.days}
            loading={calendar.loading}
            selectedDate={selectedDate}
            onSelectDate={onSelectDate}
            onMonthChange={onMonthChange}
          />
        </aside>

        <section>
          <div className="section-head">
            <h2>{selectedDate ? `Events on ${formatDate(selectedDate)}` : 'Events this month'}</h2>
            <span className="muted small">{loading ? 'Loading…' : `${total} found`}</span>
          </div>

          {error && <div className="card empty error">⚠ {error}</div>}
          {!error && !loading && events.length === 0 && (
            <div className="card empty">No events match these filters. Try another date or city.</div>
          )}

          <div className={`grid${loading ? ' is-loading' : ''}`}>
            {loading && events.length === 0
              ? Array.from({ length: 6 }, (_, i) => <div key={i} className="card skeleton" />)
              : events.map((e) => (
                  <EventCard key={e.id} event={e} busy={busyId === e.id} onInterested={markInterested} onShare={shareEvent} />
                ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button className="btn btn-ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Prev</button>
              <span className="muted small">Page {page} of {totalPages}</span>
              <button className="btn btn-ghost" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next →</button>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
