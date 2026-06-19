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

### 2026-06-19 — UX: botón pegar en código de sala + botón Abandonar con confirmación
**Archivos afectados:** `src/lib/clipboard.js`, `src/components/ConfirmModal.jsx` (nuevo), `src/pages/Home.jsx`, `src/pages/Lobby.jsx`, `src/pages/Game.jsx`

- `clipboard.js` → añadida `pasteFromClipboard()` sobre `navigator.clipboard.readText()`.
- `ConfirmModal.jsx` → componente compartido de modal de confirmación (sheet inferior, botones Cancelar/Confirmar).
- `Home.jsx` → botón 📋 "Pegar" junto al input de código de sala en la vista "Unirse a mesa". Usa `pasteFromClipboard`, recorta y normaliza a mayúsculas.
- `Lobby.jsx` → botón "Abandonar partida" en el footer (visible para host y jugadores). Modal con aviso extra para el host: "la sala quedará sin host y el resto no podrá continuar".
- `Game.jsx` → botón "✕ Salir" en la top bar (izquierda, visualmente secundario). Modal de confirmación. Añadido `useNavigate`.
- Sin cambios en lógica de juego ni eventos Socket.io.

### 2026-06-19 — Páginas legales, footer y banner de cookies
**Archivos afectados:** `src/pages/PrivacyPolicy.jsx` (nuevo), `src/pages/TermsOfUse.jsx` (nuevo), `src/pages/CookiesPolicy.jsx` (nuevo), `src/components/CookieBanner.jsx` (nuevo), `src/App.jsx`, `src/pages/Home.jsx`

- Tres páginas legales creadas con estilo casino coherente con la app.
- Rutas añadidas en `App.jsx`: `/privacy`, `/terms`, `/cookies`.
- Footer minimalista en `Home.jsx` (solo en la vista principal) con links a las tres páginas.
- `CookieBanner`: aparece en primera visita, usa `localStorage` (`cookie_consent`), botón "Aceptar y continuar" + link a política de cookies. Obligatorio por Ley 34/2002 (LSSI) y RGPD para poder mostrar AdSense.
- Sin cambios en lógica de juego ni en otras páginas.

### 2026-06-19 — Iconos PWA: migración de SVG a PNG
**Archivos afectados:** `vite.config.js`, `index.html`

Los SVG no funcionan como iconos de instalación en iOS Safari. Toda la referencia de iconos se migró a PNG.

**Cambios de configuración:**
- `vite.config.js` → manifest actualizado: iconos ahora apuntan a PNG (192, 512, 512-maskable). Se añadió `purpose: 'maskable'` al icono 512-maskable para adaptive icons de Android.
- `index.html` → `apple-touch-icon` cambiado de `icon-192.svg` a `icon-180.png`.
- `includeAssets` en VitePWA ampliado a `['icons/*.svg', 'icons/*.png']`.

**⚠️ PNG pendientes — pegar en `public/icons/` antes del próximo build:**

| Archivo | Tamaño | Uso |
|---|---|---|
| `icon-180.png` | 180×180 px | `apple-touch-icon` — iOS Safari "Añadir a inicio" |
| `icon-192.png` | 192×192 px | Manifest — Android Chrome instalación |
| `icon-512.png` | 512×512 px | Manifest — splash screen / Play Store |
| `icon-512-maskable.png` | 512×512 px | Manifest — adaptive icon Android (zona segura central ~80%) |

**Flujo para generarlos desde la imagen fuente (1024×1024 PNG):**
Proporcionar la imagen → Claude genera los 4 tamaños con `sharp` a partir de ella.

### 2026-06-19 — Persistencia de salas con Firebase Realtime Database
**Archivos afectados:** `server/index.js`, `package.json`, `.env.example`

- `server/index.js` → `rooms` sigue siendo un objeto en memoria (caché), pero ahora se persiste en Firebase bajo `/rooms/{roomCode}` tras cada `broadcast`.
- Al arrancar el servidor, `loadRooms()` recupera todas las salas guardadas en Firebase antes de aceptar conexiones.
- `persist(roomCode)` actualiza `rooms[roomCode].lastActivity` y hace `set` en Firebase (fire-and-forget).
- `deleteRoom(roomCode)` elimina del caché local y de Firebase.
- Un `setInterval` cada hora elimina salas con `lastActivity` > 12 h.
- Fallback graceful: si `FIREBASE_DATABASE_URL` no está configurada, el servidor opera solo en memoria (útil en local sin Firebase).
- La lógica de juego (Socket.io events, `checkStreetEnd`, etc.) no cambia.
- Instalado paquete `firebase` (v12) en `dependencies`.
- Añadida variable `FIREBASE_DATABASE_URL=` a `.env.example` (sin prefijo `VITE_` — es solo del servidor).

**Reglas de seguridad Firebase recomendadas** (Realtime Database → Rules):
```json
{
  "rules": {
    "rooms": {
      "$roomCode": {
        ".read": true,
        ".write": true
      }
    }
  }
}
```

### 2026-06-19 — Configuración de despliegue (Firebase Hosting + Render)
**Archivos afectados:** `server/index.js`, `render.yaml` (nuevo), `.env.example`, `.firebaserc` (nuevo), `firebase.json` (nuevo), `package.json`

- `server/index.js` → puerto cambiado de `3001` hardcodeado a `process.env.PORT || 3001` para compatibilidad con Render.
- `render.yaml` creado: define el servicio web con `npm install` como build command y `node server/index.js` como start command.
- `.env.example` → añadida variable `VITE_SOCKET_URL=` (vacía; rellenar con la URL de Render tras el despliegue).
- `.firebaserc` creado: apunta al proyecto Firebase `fichaspoker`.
- `firebase.json` creado: Firebase Hosting con `dist` como carpeta pública y rewrite SPA (`** → /index.html`).
- `package.json` → añadido script `deploy`: `npm run build && firebase deploy`.
- `.gitignore` ya excluía `.env`; `.env.example` no está excluido (correcto).

**Flujo de despliegue:**
1. Subir servidor a Render → copiar la URL pública.
2. Crear `.env.production` con `VITE_SOCKET_URL=<url-render>`.
3. `npm run deploy` → build + Firebase Hosting.



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
