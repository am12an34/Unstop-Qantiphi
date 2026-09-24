import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import ProfileModal from './components/ProfileModal'
import { ToastProvider } from './context/ToastContext'
import { UserProvider, useUser } from './context/UserContext'
import { SocketProvider } from './context/SocketContext'

// Route-level code splitting: each page is loaded only when visited.
const EventsPage = lazy(() => import('./pages/EventsPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))

function ProfileModalHost() {
  const { profileOpen, user } = useUser()
  // Remount per user so the form starts from the current profile.
  return profileOpen ? <ProfileModal key={user?._id ?? 'guest'} /> : null
}

export default function App() {
  return (
    <ToastProvider>
      <UserProvider>
        <SocketProvider>
          <BrowserRouter>
            <Navbar />
            <main>
              <Suspense fallback={<div className="page"><div className="card skeleton tall" /></div>}>
                <Routes>
                  <Route path="/" element={<EventsPage />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="*" element={<EventsPage />} />
                </Routes>
              </Suspense>
            </main>
            <ProfileModalHost />
          </BrowserRouter>
        </SocketProvider>
      </UserProvider>
    </ToastProvider>
  )
}
