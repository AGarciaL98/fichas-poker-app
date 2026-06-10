// Central config — set VITE_SOCKET_URL in .env when the server moves to the cloud.
// Capacitor native builds will point here to the production URL.
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '/'
