// Display-only formatting; all date maths lives on the server.
export function formatDate(date) {
  if (!date) return 'Date TBA'
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

export function formatTime(time) {
  if (!time || time === 'TBA') return 'Time TBA'
  const [h, m] = time.split(':').map(Number)
  const d = new Date()
  d.setHours(h, m)
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

export const REMINDER_LABELS = {
  15: '15 minutes before',
  60: '1 hour before',
  180: '3 hours before',
  1440: '1 day before',
  4320: '3 days before',
}
