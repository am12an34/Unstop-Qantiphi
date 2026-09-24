import { useCallback, useState } from 'react'
import { eventsApi, rsvpApi, shareApi } from '../api'
import { useUser } from '../context/UserContext'
import { useToast } from '../context/ToastContext'

async function copy(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

// RSVP and share actions shared by the feed and the invite banner.
export default function useEventActions(onEventChange) {
  const { user, openProfile } = useUser()
  const { notify } = useToast()
  const [busyId, setBusyId] = useState(null)

  const markInterested = useCallback(
    async (event, ref) => {
      if (!user) {
        notify('Create your profile to RSVP', 'info')
        openProfile()
        return
      }
      setBusyId(event.id)
      try {
        await rsvpApi.create(event.id, ref)
        // Re-read the event so counts come from the server, not the client.
        onEventChange?.(await eventsApi.get(event.id))
        notify(`You're going to ${event.title}!`)
      } catch (err) {
        notify(err.message, 'error')
      } finally {
        setBusyId(null)
      }
    },
    [user, openProfile, notify, onEventChange],
  )

  const shareEvent = useCallback(
    async (event) => {
      setBusyId(event.id)
      try {
        const link = await shareApi.create(event.id)
        const copied = await copy(link.url)
        notify(copied ? 'Invite link copied to clipboard' : `Invite link: ${link.url}`)
        return link
      } catch (err) {
        notify(err.message, 'error')
      } finally {
        setBusyId(null)
      }
    },
    [notify],
  )

  return { markInterested, shareEvent, busyId }
}
