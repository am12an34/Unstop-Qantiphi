import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { SERVER_URL } from '../api/client'

const SocketContext = createContext({ socket: null, connected: false })

// One shared socket connection for the whole app.
export function SocketProvider({ children }) {
  const [state, setState] = useState({ socket: null, connected: false })

  useEffect(() => {
    const socket = io(SERVER_URL, { transports: ['websocket'] })
    setState({ socket, connected: false })
    socket.on('connect', () => setState({ socket, connected: true }))
    socket.on('disconnect', () => setState({ socket, connected: false }))
    return () => socket.disconnect()
  }, [])

  return <SocketContext.Provider value={state}>{children}</SocketContext.Provider>
}

export const useSocket = () => useContext(SocketContext)

// Subscribes to a socket event; the latest handler is always used without re-subscribing.
export function useSocketEvent(event, handler) {
  const { socket } = useSocket()
  const handlerRef = useRef(handler)

  useEffect(() => {
    handlerRef.current = handler
  })

  useEffect(() => {
    if (!socket) return
    const listener = (payload) => handlerRef.current(payload)
    socket.on(event, listener)
    return () => socket.off(event, listener)
  }, [socket, event])
}
