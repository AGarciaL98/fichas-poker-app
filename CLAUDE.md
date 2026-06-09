# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

PWA de póker para grupos de amigos (sin fichas físicas). React + Vite + Firebase Realtime Database + Tailwind CSS.

## Commands

```bash
npm run dev      # Dev server (localhost:5173)
npm run build    # Production build → dist/
npm run preview  # Preview production build locally
```

## Architecture

- `src/lib/firebase.js` — Firebase init, exports `db`
- `src/lib/gameLogic.js` — Pure game logic (no Firebase): blind calculations, seat ordering, chip formatting
- `src/hooks/useRoom.js` — Firebase reads (`useRoom` hook) + all write actions (createRoom, joinRoom, playerAction, newHand, etc.)
- `src/pages/` — Home (create/join), Lobby (waiting room), Game (main gameplay)
- `src/components/` — TableMap (oval seat preview), ActionLog (last action), BlindTimer (countdown)

## Game flow

1. Host creates room → Lobby with code + QR
2. Players join via code or QR scan
3. Host starts game → Firebase state drives all devices in real time
4. **Dealer** (host) controls: nueva mano, siguiente ronda (flop/turn/river), dar bote
5. **Players** control their own actions: fold/call/check/raise/all-in on their turn

## Firebase env vars

Copy `.env.example` → `.env` and fill in your Firebase project values.
All vars prefixed with `VITE_FIREBASE_`.

## Key constraints

- Portrait-only mobile layout — never assume landscape
- `sessionStorage` stores player ID (not localStorage) so different tabs = different players
- Dealer = room host (first player, seat 0). Dealer seat advances each hand automatically
- Blind levels defined in `DEFAULT_BLIND_LEVELS` in gameLogic.js
