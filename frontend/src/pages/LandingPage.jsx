import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { useUser } from '../context/UserContext'

const FEATURES = [
  ['🗓', 'Event calendar', 'See at a glance which days have events near you.'],
  ['★', 'One-click RSVP', 'Mark events you are going to and track them in your dashboard.'],
  ['🔔', 'Smart reminders', 'Choose when to be reminded, from 15 minutes to 3 days before.'],
  ['👥', 'Friend invites', 'Share a link and watch the Friends Attending count grow live.'],
]

export default function LandingPage() {
  const [params] = useSearchParams()
  const { user, openProfile } = useUser()

  // Share links redirect to "/?event=…&ref=…"; send those visitors straight to the event feed.
  if (params.get('event') || params.get('invite')) {
    return <Navigate to={`/events?${params.toString()}`} replace />
  }

  return (
    <div className="page landing">
      <section className="landing-hero">
        <p className="eyebrow">Powered by Ticketmaster</p>
        <h1>Find events. RSVP. Bring your friends.</h1>
        <p className="muted lead">
          EventPulse finds concerts, sports, comedy and more near you, keeps track of what you're attending
          and lets you invite friends with a single link.
        </p>
        <div className="landing-cta">
          <Link className="btn btn-primary btn-lg" to="/events">Explore events →</Link>
          {user ? (
            <Link className="btn btn-ghost btn-lg" to="/dashboard">My RSVPs</Link>
          ) : (
            <button className="btn btn-ghost btn-lg" onClick={openProfile}>Create profile</button>
          )}
        </div>
      </section>

      <section className="feature-grid">
        {FEATURES.map(([icon, title, text]) => (
          <div key={title} className="card feature">
            <span className="feature-icon">{icon}</span>
            <h3>{title}</h3>
            <p className="muted">{text}</p>
          </div>
        ))}
      </section>
    </div>
  )
}
