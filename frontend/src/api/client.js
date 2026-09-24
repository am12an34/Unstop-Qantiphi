import axios from 'axios'

export const SERVER_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
export const USER_KEY = 'eventpulse:userId'

const client = axios.create({ baseURL: `${SERVER_URL}/api`, timeout: 10000 })

// Identify the caller on every request; the server resolves the user from this header.
client.interceptors.request.use((config) => {
  const userId = localStorage.getItem(USER_KEY)
  if (userId) config.headers['x-user-id'] = userId
  return config
})

// Normalise errors to a single readable message for the UI.
client.interceptors.response.use(
  (res) => res.data,
  (err) => {
    if (axios.isCancel(err)) return Promise.reject(err)
    const message = err.response?.data?.error || err.message || 'Something went wrong'
    return Promise.reject(Object.assign(new Error(message), { status: err.response?.status }))
  },
)

export const isCancel = axios.isCancel
export default client
