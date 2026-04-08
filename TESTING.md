# 🧪 Testing Guide — Tic-Tac-Toe Nakama

Comprehensive testing guide for the multiplayer Tic-Tac-Toe game.

---

## 📋 Test Checklist

### Local Development Tests

#### Frontend
- [ ] App loads without console errors
- [ ] Login/device authentication works
- [ ] Lobby UI displays correctly
- [ ] Buttons are responsive

#### Backend
- [ ] Docker containers start: `docker ps`
- [ ] Nakama console accessible: `http://localhost:7351`
- [ ] PostgreSQL is running and healthy
- [ ] Nakama logs show module loaded

#### Integration
- [ ] Frontend connects to backend via WebSocket
- [ ] Console shows `[nakama] connected as <userId>`

---

## 🎮 Multiplayer Gameplay Tests

### Test 1: Basic Game Flow

**Setup**: Open frontend URL in two browser windows/tabs

**Steps**:
1. Both windows auto-connect
2. Both click "Find Match" button
3. Both should connect to same match
4. Board appears in both windows
5. One player is "X", other is "O"
6. Active player's badge is highlighted

**Expected**: Both players see identical board state in real-time

---

### Test 2: Move Validation (Server-Authoritative)

**Setup**: Two players in active game

**Steps**:
1. Player X makes valid move (click empty cell)
2. Move appears immediately in both UIs
3. Turn switches to O
4. Player O tries to click same cell → rejected
5. Player O clicks different empty cell → accepted
6. Try clicking outside the grid → no effect

**Expected**: 
- Only current player can move
- Occupied cells can't be clicked
- Server validates before applying

---

### Test 3: Win Detection

**Setup**: Two players in game

**Steps**:
1. Player X gets 3 in a row (horizontal, vertical, or diagonal)
2. Game immediately ends
3. Modal shows "X wins!"
4. Both players see the winner
5. "Play Again" button appears
6. Stats show X with +1 win

**Expected**: 
- Win detected immediately
- Both players notified
- Stats updated

---

### Test 4: Draw Detection

**Setup**: Two players in game

**Steps**:
1. Fill board with moves (no winner)
2. Last move is played
3. Game detects draw
4. Modal shows "It's a Draw!"
5. Both players' stats show +1 draw

**Expected**: Draw recognized, stats recorded

---

### Test 5: Disconnection Handling

**Setup**: Two players in active game

**Steps**:
1. Player A closes browser/tab mid-game
2. Player B waits ~3 seconds
3. Modal appears: "Opponent disconnected. You win!"
4. Player B's stats: +1 win
5. Player A's stats (if reload): +1 loss

**Expected**: 
- Graceful forfeit
- Winner determined immediately
- Stats recorded correctly

---

### Test 6: Timed Mode

**Setup**: Two players, "Timed Mode" enabled before matching

**Steps**:
1. Both click "Find Match (Timed Mode)"
2. Game starts
3. Timer displays "30" and counts down
4. Player X makes move at 15 seconds remaining
5. Timer resets to 30 (server-side logic)
6. Player O takes 30+ seconds → no move after timer expires
7. Player X gets "Opponent timed out. You win!"

**Expected**: 
- 30-second timer enforced
- Timer resets on valid move
- Auto-forfeit on timeout
- Clear timeout message

---

## 📊 Leaderboard Tests

### Test 7: Stats Tracking

**Setup**: Play 3-5 games and check leaderboard

**Steps**:
1. From "Lobby", click "View Stats"
2. See current player's stats:
   - Wins
   - Losses  
   - Draws
   - Win streak
3. Play more games
4. Refresh page (logout/login)
5. Stats persist

**Expected**: 
- All stats recorded correctly
- Persist across sessions
- Streak updates appropriately

---

### Test 8: Win Streak

**Steps**:
1. Win 3 games consecutively
2. Check "Streak" counter = 3
3. Lose 1 game
4. Streak resets to 0
5. Win again
6. Streak = 1

**Expected**: Streak increments on wins, resets on loss/draw

---

## 🔒 Server-Authoritative Tests

### Test 9: Client-Side Cheating Prevention

**Setup**: Two players in game (use browser DevTools)

**Steps**:
1. Player A's turn, clicks valid move
2. Open DevTools → Console
3. Try manually setting board state: `window.board = [...]`
4. Try calling move for other player
5. Watch network tab for WebSocket messages
6. Modify outgoing message to place invalid move

**Expected**: 
- Client-side state changes ignored (server source of truth)
- Invalid moves rejected by backend
- Game continues correctly
- Console shows "Invalid move" error

---

### Test 10: Concurrent Matches

**Setup**: 3+ pairs of players simultaneously

**Steps**:
1. Pair 1 plays Match A
2. Pair 2 plays Match B  
3. Pair 1 makes move (should update Match A only)
4. Pair 2 makes move (should update Match B only)
5. Verify no cross-contamination

**Expected**: Matches isolated from each other (no shared state)

---

## 🌐 Network Tests

### Test 11: Latency Handling

**Steps**:
1. Throttle network (DevTools → Network tab, "Slow 3G")
2. Make move
3. UI updates after ~500ms delay
4. Other player receives update

**Expected**: Works correctly, just slower

---

### Test 12: Reconnection

**Setup**: Game in progress, WiFi on/off or throttle network

**Steps**:
1. Disconnect (toggle WiFi off)
2. Reconnect (toggle WiFi on)
3. Check if game state syncs
4. Make move

**Expected**: Reconnects automatically, game state recovers

---

## 📱 Cross-Device Tests

### Test 13: Mobile Responsiveness

**Steps**:
1. Open frontend on:
   - iPhone/iPad Safari
   - Android Chrome
   - Desktop browser
2. Check layout adapts
3. Buttons are tappable (not too small)
4. Game is playable on mobile

**Expected**: Responsive design works across devices

---

### Test 14: Mobile to Desktop Match

**Setup**: Mobile + Desktop browsers

**Steps**:
1. Mobile player finds match
2. Desktop player finds match
3. Should pair together
4. Both play successfully

**Expected**: Works seamlessly cross-platform

---

## 🔍 Edge Cases

### Test 15: Rapid Clicks

**Steps**:
1. Player rapidly clicks multiple cells in quick succession
2. Only first valid click should register
3. Other clicks ignored

**Expected**: No duplicate moves, no crashes

---

### Test 16: Network Packet Loss

**Setup**: Simulate packet loss (DevTools Network throttling)

**Steps**:
1. Throttle to "Offline"
2. Try to make move
3. Error message appears
4. Reconnect
5. Try move again → works

**Expected**: Graceful error handling, retryable

---

### Test 17: Very Long Session

**Setup**: Keep game running for 1+ hours

**Steps**:
1. Play several games back-to-back
2. Check memory usage (DevTools → Performance)
3. Verify no memory leaks
4. Stats still correct

**Expected**: Stable performance, no crashes

---

## ✅ Pre-Production Checklist

Before public launch:

- [ ] All tests pass locally
- [ ] HTTPS enabled on frontend
- [ ] HTTPS enabled on backend (if possible)
- [ ] Backend deployed to cloud
- [ ] Frontend deployed to cloud
- [ ] Both can communicate
- [ ] Database backups configured
- [ ] Rate limiting enabled (optional)
- [ ] Monitoring/logging in place
- [ ] Security headers set
- [ ] Analytics integrated (optional)

---

## 📈 Performance Benchmarks

### Target Metrics

| Metric | Target | Actual |
|--------|--------|--------|
| **Move latency** | < 200ms | ___ |
| **Match creation time** | < 500ms | ___ |
| **Concurrent matches** | 100+ | ___ |
| **Memory per match** | < 1MB | ___ |
| **CPU per 100 matches** | < 5% | ___ |

### How to Measure

```bash
# Backend load test
ab -n 1000 -c 50 http://localhost:7350/v2/health

# Monitor Nakama
docker stats nakama

# Check memory
docker exec nakama free -h
```

---

## 🐛 Bug Report Template

If you find an issue:

```
## Environment
- Browser: Chrome/Firefox/Safari/iOS/Android
- Device: Desktop/Mobile
- Video/Screenshot: (if applicable)

## Steps to Reproduce
1. ...
2. ...
3. ...

## Expected Behavior
...

## Actual Behavior
...

## Console Errors
(Paste any error messages)

## Related Code
(Link to relevant file/component)
```

---

## 📞 Support

- **GitHub Issues**: Report bugs on GitHub
- **Nakama Forum**: https://forum.heroiclabs.com/
- **Discord**: Nakama Discord community

