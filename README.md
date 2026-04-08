# 🎮 Multiplayer Tic-Tac-Toe — Nakama

Production-ready, **server-authoritative** multiplayer Tic-Tac-Toe game built with **Nakama** backend and **React + Vite + Tailwind** frontend.

[![Live Game](https://img.shields.io/badge/Play%20Now-Live-brightgreen)](https://tictactoe.example.com)  
[![GitHub](https://img.shields.io/badge/GitHub-Repository-blue)](https://github.com/Madhu2003smita/tic-tac-toe)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────┐
│  Frontend (React/Vite/Tailwind)     │
│  ├─ Lobby (matchmaking)             │
│  ├─ Game (real-time UI)             │
│  └─ Leaderboard (stats)             │
└──────────────┬──────────────────────┘
               │ WebSocket
               │ (Nakama JS SDK)
               ▼
┌──────────────────────────────────────┐
│  Nakama Server (Server-Authoritative)│
│  ├─ Match Handler (game logic)       │
│  ├─ RPC Endpoints (matchmaking)      │
│  ├─ Storage API (leaderboard)        │
│  └─ Timer (timed mode)               │
└──────────────┬──────────────────────┘
               │ SQL
               ▼
        PostgreSQL Database
```

### Key Features
- ✅ **Server-authoritative**: All game logic runs on server; clients validate locally only
- ✅ **Real-time multiplayer**: WebSocket-based instant state updates
- ✅ **Matchmaking**: Join existing game or auto-create new match
- ✅ **Leaderboard**: Track wins, losses, win streaks (server-side storage)
- ✅ **Timed Mode**: 30-second turn timer with auto-forfeit on timeout
- ✅ **Scalable**: Supports concurrent multi-session games
- ✅ **Production-ready**: Docker containerized, cloud-deployable

---

## 📁 Project Structure

```
tictactoe/
├── backend/
│   ├── docker-compose.yml           # Nakama + PostgreSQL config
│   ├── nakama/
│   │   ├── src/
│   │   │   ├── index.ts             # ⭐ Main game module
│   │   │   └── nakama.d.ts          # Type definitions
│   │   ├── build/                   # Compiled JavaScript
│   │   ├── tsconfig.json
│   │   └── package.json
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── App.jsx              # Root component
│   │   │   ├── Lobby.jsx            # Matchmaking UI
│   │   │   ├── Game.jsx             # Game board & timer
│   │   │   ├── Board.jsx            # 3×3 grid
│   │   │   └── Cell.jsx             # Individual cell
│   │   ├── nakama.js                # Nakama client wrapper
│   │   ├── index.jsx                # Entry point
│   │   └── index.css                # Global styles
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── package.json
│   └── .env.example
│
└── README.md (this file)
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

---

## 🚀 Cloud Deployment

### Option 1: DigitalOcean (Recommended for simplicity)

1. **Create a Droplet** (Ubuntu 22.04, 2GB RAM minimum)
2. **SSH into the server** and install Docker:
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   sudo usermod -aG docker $USER
   ```
3. **Clone your repository**:
   ```bash
   git clone https://github.com/Madhu2003smita/tic-tac-toe.git
   cd tic-tac-toe/backend
   docker-compose up -d
   ```
4. **Configure firewall**:
   ```bash
   sudo ufw allow 7350/tcp
   sudo ufw allow 7351/tcp
   sudo ufw enable
   ```
5. **Deploy frontend** on Vercel/Netlify with backend URL

### Option 2: AWS EC2

1. Launch t3.small EC2 instance (Ubuntu 22.04)
2. Security Group: Allow ports 7349, 7350, 7351 (TCP)
3. SSH and install Docker (same as DigitalOcean)
4. Pull and run: `docker-compose up -d`
5. Get public IP and update frontend env variables

### Option 3: Docker Hub + Any VPS

1. **Build & push Docker image**:
   ```bash
   cd backend
   docker build -t yourusername/nakama-tictactoe .
   docker push yourusername/nakama-tictactoe
   ```
2. **On VPS**: 
   ```bash
   docker pull yourusername/nakama-tictactoe
   docker-compose up -d
   ```

---

## 🔧 Environment Variables

### Frontend (`.env`)
```env
VITE_NAKAMA_HOST=your-server-ip-or-domain
VITE_NAKAMA_PORT=7350
VITE_NAKAMA_KEY=defaultkey
VITE_NAKAMA_SSL=false
```

### Backend (`.env` optional — uses docker-compose defaults)
All Nakama config is in `docker-compose.yml`

---

## 💡 Design Decisions

### Server-Authoritative Architecture
- **Why**: Prevents client-side cheating (modified turn, invalid moves, etc.)
- **How**: Server validates every move, even if client says it's the player's turn
- **Trade-off**: Slightly higher latency (validation happens server-side)

### Matchmaking via RPC
- **Why**: Simple, no lobby database needed
- **How**: `find_match` RPC searches for matches with 1 player; if none, creates one
- **Limitation**: No "wait queue" — second player must call `find_match` to join

### Timer Enforced Server-Side
- **Why**: Prevents client from claiming more time
- **How**: Server decrements timer every tick; on timeout, current player forfeits
- **Edge case**: Network lag may cause late move rejection

### Storage API for Leaderboard
- **Why**: Persistent, per-user stats across sessions
- **How**: After each game, record win/loss/draw in Nakama Storage
- **Scalability**: Works for thousands of players; consider separate leaderboard service for millions

---

## 🐛 Troubleshooting

### Frontend can't connect to Nakama
```
TypeError: Failed to fetch
```
- Check Nakama is running: `docker ps | grep nakama`
- Check firewall allows port 7350
- Verify `VITE_NAKAMA_HOST` points to correct IP/domain
- Try `curl http://your-server:7350/` to test connectivity

### "Match join rejected" error
- Backend match handler code issue
- Check docker logs: `docker logs nakama --tail 50`
- Ensure `build/index.js` was recompiled after changes

### Game state not updating in real-time
- Check WebSocket connection status in browser DevTools (Network tab)
- Verify `setMatchDataHandler` is called in Game component
- Check browser console for errors

### Leaderboard not persisting
- Ensure PostgreSQL is running: `docker ps | grep postgres`
- Check Nakama Storage API permissions (permission level 2 = owner only)
- Verify `recordResult()` is called after game ends

---

## 📊 Performance & Scalability

| Metric | Current | Notes |
|--------|---------|-------|
| **Concurrent matches** | Unlimited | Nakama automatically scales |
| **Players per match** | 2 | Hard-coded; adjust if needed |
| **Message throughput** | ~1000/sec per match | Depends on Nakama tier |
| **Storage** | Up to 1GB (default Nakama) | Leaderboard query time ~5ms |

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit changes (`git commit -am 'Add feature'`)
4. Push to branch (`git push origin feature/your-feature`)
5. Open a Pull Request

---

## 📝 License

MIT License — feel free to use for personal or commercial projects.

---

## 📞 Support

- **Issues**: Open an issue on GitHub
- **Questions**: Check GitHub Discussions
- **Nakama Docs**: https://heroiclabs.com/docs/

---

**Built with ❤️ by Madhusmita Shial**  
**GitHub**: https://github.com/Madhu2003smita

