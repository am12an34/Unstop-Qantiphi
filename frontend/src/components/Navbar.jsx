import { NavLink } from 'react-router-dom'
import { useUser } from '../context/UserContext'
import { useSocket } from '../context/SocketContext'

export default function Navbar() {
  const { user, openProfile } = useUser()
  const { connected } = useSocket()

  return (
    <nav className="navbar">
      <NavLink to="/" className="brand">⚡ EventPulse</NavLink>
      <div className="nav-links">
        <NavLink to="/" end>Discover</NavLink>
        <NavLink to="/dashboard">My RSVPs</NavLink>
      </div>
      <div className="nav-right">
        <span className={`live ${connected ? 'on' : ''}`} title={connected ? 'Live updates on' : 'Offline'}>
          ● {connected ? 'Live' : 'Offline'}
        </span>
        <button className="btn btn-ghost" onClick={openProfile}>
          {user ? `👤 ${user.name}` : 'Sign in'}
        </button>
      </div>
    </nav>
  )
}
