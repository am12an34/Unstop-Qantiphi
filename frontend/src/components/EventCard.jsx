import { memo } from 'react'
import { formatDate, formatTime } from '../utils/format'

function EventCard({ event, busy, highlighted, onInterested, onShare }) {
  return (
    <article className={`card event-card${highlighted ? ' highlighted' : ''}`}>
      <div className="event-image">
        {event.image ? <img src={event.image} alt="" loading="lazy" /> : <div className="image-fallback" />}
        <span className="chip">{event.category}</span>
      </div>
      <div className="event-body">
        <h3>{event.title}</h3>
        <p className="muted">📍 {event.venue}{event.city ? `, ${event.city}` : ''}</p>
        <p className="muted">🗓 {formatDate(event.date)} · 🕒 {formatTime(event.time)}</p>

        <div className="social">
          <span className="friends" title="Unique friends who opened an invite link">
            👥 <strong>{event.friendsAttending}</strong> friends attending
          </span>
          {event.attendeeCount > 0 && <span className="muted small">{event.attendeeCount} going</span>}
        </div>

        <div className="actions">
          {event.isInterested ? (
            <>
              <span className="btn btn-done">✓ Going</span>
              <button className="btn btn-ghost" disabled={busy} onClick={() => onShare(event)}>
                🔗 Share link
              </button>
            </>
          ) : (
            <button className="btn btn-primary" disabled={busy} onClick={() => onInterested(event)}>
              {busy ? 'Saving…' : '★ Interested'}
            </button>
          )}
          {event.url && (
            <a className="btn btn-link" href={event.url} target="_blank" rel="noreferrer">Tickets</a>
          )}
        </div>
      </div>
    </article>
  )
}

// Only re-render a card when its own data or busy state changes.
export default memo(EventCard)
