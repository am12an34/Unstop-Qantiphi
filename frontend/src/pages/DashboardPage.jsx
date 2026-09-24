import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { rsvpApi, shareApi } from '../api'
import { useUser } from '../context/UserContext'
import { useToast } from '../context/ToastContext'
import { useSocketEvent } from '../context/SocketContext'
import { formatDate, formatTime, REMINDER_LABELS } from '../utils/format'

function RsvpRow({ rsvp, onReminder, onShare, onRemove }) {
  const { event, reminder, share } = rsvp
  return (
    <article className="card rsvp-row">
      {event.image && <img src={event.image} alt="" loading="lazy" />}
      <div className="rsvp-info">
        <h3>{event.title}</h3>
        <p className="muted">📍 {event.venue}{event.city ? `, ${event.city}` : ''}</p>
        <p className="muted">🗓 {formatDate(event.date)} · 🕒 {formatTime(event.time)}</p>
        <p className="countdown">{rsvp.daysUntil === 0 ? 'Today!' : `In ${rsvp.daysUntil} day${rsvp.daysUntil > 1 ? 's' : ''}`}</p>
      </div>

      <div className="rsvp-side">
        <div className="reminder">
          <label className="switch">
            <input type="checkbox" checked={reminder.enabled} onChange={(e) => onReminder(rsvp, { enabled: e.target.checked })} />
            Reminder
          </label>
          <select
            value={reminder.minutesBefore}
            disabled={!reminder.enabled}
            onChange={(e) => onReminder(rsvp, { minutesBefore: Number(e.target.value) })}
          >
            {Object.entries(REMINDER_LABELS).map(([v, t]) => <option key={v} value={v}>{t}</option>)}
          </select>
          {rsvp.reminderAt && (
            <span className="muted small">
              {rsvp.reminderDue ? '🔔 Reminder due now' : `🔔 ${new Date(rsvp.reminderAt).toLocaleString()}`}
            </span>
          )}
        </div>

        <div className="share-box">
          <span className="friends">👥 <strong>{rsvp.friendsAttending}</strong> friends attending</span>
          {share ? (
            <>
              <input readOnly value={share.url} onFocus={(e) => e.target.select()} />
              <span className="muted small">{share.clicks} unique click{share.clicks === 1 ? '' : 's'} on your link</span>
            </>
          ) : null}
          <div className="actions">
            <button className="btn btn-primary" onClick={() => onShare(rsvp)}>{share ? 'Copy link' : '🔗 Generate share link'}</button>
            <button className="btn btn-ghost danger" onClick={() => onRemove(rsvp)}>Cancel RSVP</button>
          </div>
        </div>
      </div>
    </article>
  )
}

export default function DashboardPage() {
  const { user, loading: userLoading, openProfile } = useUser()
  const { notify } = useToast()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  const load = useCallback(() => {
    rsvpApi.list().then(setData).catch((err) => setError(err.message))
  }, [])

  useEffect(() => {
    if (user) load()
  }, [user, load])

  const patchRow = useCallback((id, next) => {
    setData((d) => d && { ...d, upcoming: d.upcoming.map((r) => (r.id === id ? { ...r, ...next } : r)) })
  }, [])

  // Live counts when a friend opens one of the invite links.
  useSocketEvent('friends:update', ({ eventId, friendsAttending, token, linkClicks }) => {
    setData((d) =>
      d && {
        ...d,
        upcoming: d.upcoming.map((r) =>
          r.eventId !== eventId
            ? r
            : { ...r, friendsAttending, share: r.share && r.share.token === token ? { ...r.share, clicks: linkClicks } : r.share },
        ),
      },
    )
  })

  const onReminder = useCallback(
    async (rsvp, change) => {
      try {
        patchRow(rsvp.id, await rsvpApi.updateReminder(rsvp.id, change))
        notify('Reminder updated')
      } catch (err) {
        notify(err.message, 'error')
      }
    },
    [patchRow, notify],
  )

  const onShare = useCallback(
    async (rsvp) => {
      try {
        const link = await shareApi.create(rsvp.eventId)
        patchRow(rsvp.id, { share: link })
        await navigator.clipboard.writeText(link.url).catch(() => {})
        notify('Invite link copied to clipboard')
      } catch (err) {
        notify(err.message, 'error')
      }
    },
    [patchRow, notify],
  )

  const onRemove = useCallback(
    async (rsvp) => {
      if (!window.confirm(`Cancel your RSVP for ${rsvp.event.title}?`)) return
      try {
        await rsvpApi.remove(rsvp.id)
        load()
        notify('RSVP cancelled')
      } catch (err) {
        notify(err.message, 'error')
      }
    },
    [load, notify],
  )

  if (userLoading) return <div className="page"><div className="card skeleton tall" /></div>

  if (!user) {
    return (
      <div className="page">
        <div className="card empty">
          <h2>Your RSVP dashboard</h2>
          <p className="muted">Sign in to see the events you're attending.</p>
          <button className="btn btn-primary" onClick={openProfile}>Sign in</button>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="section-head">
        <h1>My RSVPs</h1>
        {data && (
          <div className="stats">
            <span className="stat"><strong>{data.stats.upcoming}</strong> upcoming</span>
            <span className="stat"><strong>{data.stats.past}</strong> past</span>
          </div>
        )}
      </div>

      {error && <div className="card empty error">⚠ {error}</div>}
      {!data && !error && <div className="card skeleton tall" />}
      {data && data.upcoming.length === 0 && (
        <div className="card empty">
          <p>You haven't RSVPed to any upcoming events yet.</p>
          <Link className="btn btn-primary" to="/">Discover events</Link>
        </div>
      )}
      <div className="rsvp-list">
        {data?.upcoming.map((r) => (
          <RsvpRow key={r.id} rsvp={r} onReminder={onReminder} onShare={onShare} onRemove={onRemove} />
        ))}
      </div>
    </div>
  )
}
