import { io } from 'socket.io-client'

// In dev: Vite proxies /socket.io → localhost:3001
// In prod: same origin
export const socket = io({ autoConnect: true })
