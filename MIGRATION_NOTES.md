# MIGRATION_NOTES.md
Notas de compatibilidad para futura migración a Capacitor (iOS / Android).
Este archivo se actualiza en cada commit que afecte a dependencias, rutas, estilos, almacenamiento, red, componentes UI complejos o APIs de navegador.

---

## Estado actual de compatibilidad Capacitor

| Área | Estado | Notas |
|---|---|---|
| **Clipboard** | ✅ Abstraído | `src/lib/clipboard.js` — cambiar por `@capacitor/clipboard` |
| **Storage** | ✅ Abstraído | `src/lib/storage.js` — cambiar por `@capacitor/preferences` |
| **Socket URL** | ✅ Abstraído | `src/lib/config.js` — leer de `VITE_SOCKET_URL` |
| **Capacitor config** | ✅ Creado | `capacitor.config.ts` en raíz, inerte |
| **Servidor Socket.io** | ⚠️ Solo local | Necesita desplegarse en la nube antes de publicar |
| **Firebase** | ⚠️ Placeholder | `src/lib/firebase.js` existe pero no está conectado ni en uso |
| **Orientación** | ✅ Portrait-only | Forzado en manifest PWA y diseño Tailwind |
| **CSS nativo** | ✅ Compatible | Tailwind CSS funciona en WebView de Capacitor sin cambios |
| **Router** | ✅ Compatible | React Router v6 funciona en WebView |
| **QR Code** | ✅ Compatible | `qrcode.react` funciona en WebView; en RN necesitaría sustitución |
| **PWA Service Worker** | ⚠️ Irrelevante en nativo | `vite-plugin-pwa` se ignora en Capacitor, no interfiere |
| **`sessionStorage`** | ✅ Abstraído | Mediante `src/lib/storage.js` |
| **`navigator.clipboard`** | ✅ Abstraído | Mediante `src/lib/clipboard.js` |

---

## Pendiente antes de migrar a Capacitor

- [ ] **Desplegar servidor Socket.io en la nube** (Railway, Render, Fly.io, o Firebase Functions + Realtime DB). Sin esto la app nativa no puede conectar.
- [ ] **Configurar `VITE_SOCKET_URL`** en `.env.production` apuntando al servidor desplegado.
- [ ] **Reemplazar `src/lib/clipboard.js`** por `@capacitor/clipboard`:
  ```ts
  import { Clipboard } from '@capacitor/clipboard'
  export async function copyToClipboard(text) {
    await Clipboard.write({ string: text })
  }
  ```
- [ ] **Reemplazar `src/lib/storage.js`** por `@capacitor/preferences`:
  ```ts
  import { Preferences } from '@capacitor/preferences'
  export async function getItem(key) { const { value } = await Preferences.get({ key }); return value }
  export async function setItem(key, value) { await Preferences.set({ key, value }) }
  ```
  ⚠️ Ojo: `@capacitor/preferences` es async. `getOrCreatePlayerId()` en `gameLogic.js` tendrá que volverse `async`.
- [ ] **Instalar Capacitor y añadir plataformas**:
  ```bash
  npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android
  npx cap init
  npx cap add ios
  npx cap add android
  ```
- [ ] **Probar build web** (`npm run build`) y sincronizar (`npx cap sync`) antes de abrir en Xcode / Android Studio.
- [ ] **Revisar íconos**: los actuales son SVG (`public/icons/`). Capacitor necesita PNG. Generar con `npx @capacitor/assets generate`.
- [ ] **`capacitor.config.ts`**: descomentar el bloque `server.url` cuando el servidor esté en la nube.

---

## Historial de cambios relevantes

### 2026-06-10 — Abstracciones para Capacitor
**Archivos afectados:** `src/lib/clipboard.js` (nuevo), `src/lib/storage.js` (nuevo), `src/lib/config.js` (nuevo), `src/lib/socket.js`, `src/lib/gameLogic.js`, `src/pages/Lobby.jsx`, `capacitor.config.ts` (nuevo)

- Creado `clipboard.js`: abstracción sobre `navigator.clipboard.writeText`.
- Creado `storage.js`: abstracción sobre `sessionStorage.getItem/setItem`.
- Creado `config.js`: centraliza `SOCKET_URL` leída de `VITE_SOCKET_URL` con fallback a `'/'`.
- `socket.js` actualizado para usar `SOCKET_URL`.
- `gameLogic.js` → `getOrCreatePlayerId` usa `storage.js` en lugar de `sessionStorage` directo.
- `Lobby.jsx` → `copyCode` usa `clipboard.js` en lugar de `navigator.clipboard` directo.
- `capacitor.config.ts` creado en raíz con `appId: com.fichaspoker.app`, `webDir: dist`. Server URL comentado hasta tener servidor en la nube.

### 2026-06-10 — Preparación del dealer rotativo y auto-award
**Archivos afectados:** `server/index.js`, `src/pages/Game.jsx`

- `isDealer` en `Game.jsx` cambiado de `room.host === playerId` a `me?.seat === hand.dealerSeat`. El dealer de cada mano (rota automáticamente) es quien ve los controles de otorgar bote e iniciar nueva mano.
- `server/index.js` → `checkStreetEnd`: cuando `notFolded.length === 1`, se auto-adjudica el bote al ganador sin pasar por showdown manual (`hand.awaitingNewHand = true`).
- `Game.jsx` → `useEffect` de seguridad: si el dealer llega a showdown con un solo jugador en mano, llama `awardPot` automáticamente (fallback del servidor).
- `hand.aggressorName` añadido al estado de `new-hand` en servidor para mostrar quién hizo la última apuesta.
- Botones de acción (Fold/Check/Bet) ocultados durante la fase `showdown`.

*No hay impacto en la migración Capacitor — cambios de lógica de negocio y UI pura.*
