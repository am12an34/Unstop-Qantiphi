import { useCallback, useEffect, useState } from 'react'
import { eventsApi } from '../api'
import { isCancel } from '../api/client'
import { useSocketEvent } from '../context/SocketContext'

const EMPTY = { events: [], total: 0, totalPages: 0, page: 1 }

// Loads the event feed for a query, cancelling stale requests, and applies live socket updates.
export default function useEvents(query) {
  const [data, setData] = useState(EMPTY)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const key = JSON.stringify(query)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    eventsApi
      .list(JSON.parse(key), controller.signal)
      .then((res) => {
        setData(res)
        setError(null)
      })
      .catch((err) => !isCancel(err) && setError(err.message))
      .finally(() => !controller.signal.aborted && setLoading(false))
    return () => controller.abort()
  }, [key])

  const replaceEvent = useCallback((event) => {
    setData((d) => ({ ...d, events: d.events.map((e) => (e.id === event.id ? { ...e, ...event } : e)) }))
  }, [])

  useSocketEvent('friends:update', ({ eventId, friendsAttending }) => {
    setData((d) => ({
      ...d,
      events: d.events.map((e) => (e.id === eventId ? { ...e, friendsAttending } : e)),
    }))
  })

  return { ...data, loading, error, replaceEvent }
}
