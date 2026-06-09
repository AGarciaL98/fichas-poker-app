# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

PWA móvil de póker para grupos de amigos sin fichas físicas. React + Vite + Socket.io + Tailwind CSS.

## Commands

```bash
npm run dev      # Arranca servidor Socket.io (puerto 3001) + Vite (5173) en paralelo
npm run build    # Build de producción → dist/
npm run preview  # Preview del build en local
```

## Architecture

- `server/index.js` — Servidor Socket.io con toda la lógica del juego en memoria (rooms map)
- `src/lib/gameLogic.js` — Lógica pura compartida: ciegas, orden de asientos, formateo de fichas
- `src/lib/socket.js` — Cliente Socket.io (conecta vía proxy Vite → puerto 3001)
- `src/hooks/useRoom.js` — Hook `useRoom` (escucha `room-update`) + funciones de acción (emit)
- `src/pages/` — Home (crear/unirse + config completa), Lobby (espera + QR), Game (partida)
- `src/components/` — TableMap (mesa oval), ActionLog (última acción), BlindTimer (countdown)

## Game flow

1. Host crea sala → configura fichas, estructura de ciegas → Lobby con código + QR
2. Jugadores se unen por código o escaneando QR
3. Host inicia partida → Socket.io sincroniza estado en tiempo real a todos los dispositivos
4. **Dealer** (host): controla nueva mano, siguiente ronda (flop/turn/river), dar bote, subir ciegas
5. **Jugadores**: fold/call/check/raise/all-in en su turno desde su propio móvil

## Key constraints

- Portrait-only — nunca asumir landscape
- `sessionStorage` guarda el player ID → distintas pestañas = distintos jugadores
- El estado del juego vive en memoria del servidor; se pierde si el servidor reinicia
- Dealer = host de la sala (seat 0). El dealer rota automáticamente en cada nueva mano
- Niveles de ciegas en `DEFAULT_BLIND_LEVELS` en `gameLogic.js`
- Vite proxy `/socket.io` → `localhost:3001` (configurado en `vite.config.js`)

## Commits

Al hacer un commit: `git add -A` + mensaje descriptivo en español de los cambios sustanciales + `git push`.
