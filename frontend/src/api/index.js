import client from './client'

export const eventsApi = {
  list: (params, signal) => client.get('/events', { params, signal }),
  calendar: (params, signal) => client.get('/events/calendar', { params, signal }),
  get: (id) => client.get(`/events/${encodeURIComponent(id)}`),
}

export const usersApi = {
  register: (data) => client.post('/users', data),
  me: () => client.get('/users/me'),
  update: (data) => client.patch('/users/me', data),
}

export const rsvpApi = {
  list: () => client.get('/rsvps'),
  create: (eventId, ref) => client.post('/rsvps', { eventId, ref }),
  updateReminder: (id, data) => client.patch(`/rsvps/${id}/reminder`, data),
  remove: (id) => client.delete(`/rsvps/${id}`),
}

export const shareApi = {
  create: (eventId) => client.post('/share', { eventId }),
  invite: (token) => client.get(`/share/${token}`),
}
