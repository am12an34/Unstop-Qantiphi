import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { usersApi } from '../api'
import { USER_KEY } from '../api/client'

const UserContext = createContext(null)

export function UserProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem(USER_KEY)))
  const [profileOpen, setProfileOpen] = useState(false)

  // Restore the saved profile on first load.
  useEffect(() => {
    if (!localStorage.getItem(USER_KEY)) return
    usersApi
      .me()
      .then(setUser)
      .catch(() => localStorage.removeItem(USER_KEY))
      .finally(() => setLoading(false))
  }, [])

  const signIn = useCallback(async (data) => {
    const profile = await usersApi.register(data)
    localStorage.setItem(USER_KEY, profile._id)
    setUser(profile)
    return profile
  }, [])

  const updateProfile = useCallback(async (data) => {
    const profile = await usersApi.update(data)
    setUser(profile)
    return profile
  }, [])

  const signOut = useCallback(() => {
    localStorage.removeItem(USER_KEY)
    setUser(null)
  }, [])

  const openProfile = useCallback(() => setProfileOpen(true), [])
  const closeProfile = useCallback(() => setProfileOpen(false), [])

  const value = useMemo(
    () => ({ user, loading, signIn, updateProfile, signOut, profileOpen, openProfile, closeProfile }),
    [user, loading, signIn, updateProfile, signOut, profileOpen, openProfile, closeProfile],
  )

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

export const useUser = () => useContext(UserContext)
