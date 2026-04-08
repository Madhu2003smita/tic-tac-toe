# Multiplayer Tic-Tac-Toe — Nakama

Real-time, server-authoritative multiplayer Tic-Tac-Toe built with **Nakama** (backend) and **React + Vite + Tailwind** (frontend).

---

## Architecture

```
frontend (React/Vite)
    │  WebSocket (Nakama JS SDK)
    ▼
Nakama Server  ──── PostgreSQL
    │  TypeScript module (server-authoritative)
    └── Match handler, RPC endpoints, Storage API
```

- All game logic runs on the server. Clients only send move intents; the server validates, applies, and broadcasts state.
- Matchmaking via RPC — finds an open match or creates one.
- Leaderboard persisted in Nakama Storage (per-user wins/losses/draws/streak).
- Timed mode: 30-second turn timer enforced server-side; timeout = forfeit.

---

## Project Structure

```
backend/
  docker-compose.yml          # Nakama + PostgreSQL
  nakama/
    src/index.ts              # Server module (match logic, RPCs)
    src/nakama.d.ts           # Type declarations
    tsconfig.json
    package.json

frontend/
  src/
    components/
      App.jsx                 # Root — connects, routes lobby ↔ game
      Lobby.jsx               # Matchmaking + stats
      Game.jsx                # Live game, timer, game-over modal
      Board.jsx               # 3×3 grid
      Cell.jsx                # Individual cell
    nakama.js                 # Nakama client helpers
    index.jsx                 # Entry point
  .env.example
```

---

## Setup & Installation

### Prerequisites
- Docker + Docker Compose
- Node.js 18+

### 1. Build the Nakama module

```bash
cd backend/nakama
npm install
npm run build
# Outputs to backend/nakama/build/index.js
```

### 2. Start the backend

```bash
cd backend
docker-compose up
```

Nakama console: http://localhost:7351  
API: http://localhost:7350

### 3. Start the frontend

```bash
cd frontend
cp .env.example .env        # edit if needed
npm install
npm run dev
```

Open http://localhost:5173

---

## Deployment

### Backend (any VPS / cloud VM)

1. Copy the `backend/` folder to your server.
2. Build the module locally and ensure `backend/nakama/build/index.js` exists.
3. `docker-compose up -d`
4. Open ports `7349`, `7350`, `7351` in your firewall/security group.

### Frontend (Vercel / Netlify / any static host)

1. Set environment variables:
   ```
   VITE_NAKAMA_HOST=<your-server-ip-or-domain>
   VITE_NAKAMA_PORT=7350
   VITE_NAKAMA_KEY=defaultkey
   VITE_NAKAMA_SSL=false   # true if behind HTTPS
   ```
2. `npm run build` → deploy `dist/` folder.

---

## API / Server Details

### Op Codes (WebSocket messages)

| Code | Direction       | Payload                                      |
|------|-----------------|----------------------------------------------|
| 1    | client → server | `{ index: 0-8 }` — player move               |
| 2    | server → client | Full game state (board, turn, players, etc.) |
| 3    | server → client | `{ remaining, turn }` — timer tick           |
| 4    | server → client | `{ winner, draw, reason }` — game over       |

### RPC Endpoints

| ID                | Payload              | Returns                        |
|-------------------|----------------------|--------------------------------|
| `find_match`      | `{ timedMode: bool }`| `{ matchId: string }`          |
| `get_leaderboard` | `{}`                 | `{ wins, losses, draws, streak }` |

---

## Testing Multiplayer

1. Open two browser tabs (or two different browsers) at the frontend URL.
2. Each tab auto-authenticates with a unique device ID.
3. Click "Find Match" in both tabs — they'll be paired automatically.
4. Play moves; only the correct player's turn is accepted by the server.
5. Close one tab mid-game — the other player wins by forfeit.
6. Enable "Timed mode" before matching to test the 30-second turn timer.
7. After a game, return to lobby to see updated stats.

---

## Features

- Server-authoritative move validation (turn enforcement, bounds check, occupied cell check)
- Auto-matchmaking (classic and timed modes)
- Disconnection handling — opponent forfeit on leave
- Draw detection
- Leaderboard with wins / losses / draws / win streak (persisted in Nakama Storage)
- Timed mode — 30s per turn, server-enforced timeout forfeit
- Responsive UI with Framer Motion animations
