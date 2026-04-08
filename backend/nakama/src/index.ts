// ─── Op Codes ────────────────────────────────────────────────────────────────
const OP_MOVE        = 1;  // client → server: { index }
const OP_STATE       = 2;  // server → client: full game state
const OP_TIMER       = 3;  // server → client: { remaining }
const OP_GAME_OVER   = 4;  // server → client: { winner, draw }

// ─── Storage ─────────────────────────────────────────────────────────────────
const COLLECTION = "leaderboard";
const KEY        = "stats";

// ─── Helpers ─────────────────────────────────────────────────────────────────
function checkWinner(board: string[]): string | null {
  const wins = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];
  for (const [a,b,c] of wins) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return null;
}

function isDraw(board: string[]): boolean {
  return board.every(cell => cell !== "") ;
}

function broadcastState(dispatcher: nkruntime.MatchDispatcher, state: any) {
  dispatcher.broadcastMessage(OP_STATE, JSON.stringify({
    board:    state.board,
    turn:     state.turn,
    players:  state.players,
    winner:   state.winner,
    draw:     state.draw,
    timedMode: state.timedMode,
  }));
}

// ─── Leaderboard helpers ──────────────────────────────────────────────────────
function getStats(nk: nkruntime.Nakama, userId: string): any {
  try {
    const reads = [{ collection: COLLECTION, key: KEY, userId }];
    const result = nk.storageRead(reads);
    if (result && result.length > 0) return result[0].value;
  } catch (_) {}
  return { wins: 0, losses: 0, draws: 0, streak: 0 };
}

function saveStats(nk: nkruntime.Nakama, userId: string, stats: any) {
  const writes = [{
    collection: COLLECTION,
    key: KEY,
    userId,
    value: stats,
    permissionRead: 2,
    permissionWrite: 1,
  }];
  nk.storageWrite(writes);
}

function recordResult(nk: nkruntime.Nakama, userId: string, result: "win"|"loss"|"draw") {
  const stats = getStats(nk, userId);
  if (result === "win")   { stats.wins++;   stats.streak = (stats.streak > 0 ? stats.streak : 0) + 1; }
  if (result === "loss")  { stats.losses++; stats.streak = 0; }
  if (result === "draw")  { stats.draws++;  stats.streak = 0; }
  saveStats(nk, userId, stats);
}

// ─── RPC: Get leaderboard ─────────────────────────────────────────────────────
function rpcGetLeaderboard(
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  payload: string
): string {
  const userId = ctx.userId;
  const stats = getStats(nk, userId);
  return JSON.stringify(stats);
}

// ─── RPC: Find or create match (matchmaking) ──────────────────────────────────
function rpcFindMatch(
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  payload: string
): string {
  let timedMode = false;
  try {
    const p = JSON.parse(payload);
    timedMode = !!p.timedMode;
  } catch (_) {}

  const label = timedMode ? "timed" : "classic";

  // Look for an open match with 1 player
  const matches = nk.matchList(10, true, label, 1, 1, "");
  if (matches && matches.length > 0) {
    return JSON.stringify({ matchId: matches[0].matchId });
  }

  // No open match found
  return JSON.stringify({ matchId: null });
}

// ─── RPC: Create new match ────────────────────────────────────────────────────
function rpcCreateMatch(
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  payload: string
): string {
  let timedMode = false;
  try {
    const p = JSON.parse(payload);
    timedMode = !!p.timedMode;
  } catch (_) {}

  const matchId = nk.matchCreate("tictactoe", { timedMode });
  return JSON.stringify({ matchId });
}

// ─── Match handlers ───────────────────────────────────────────────────────────
function matchInit(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, params: any) {
  const timedMode = params && params.timedMode ? true : false;
  const state = {
    board:      ["","","","","","","","",""],
    turn:       "X",
    winner:     null as string | null,
    draw:       false,
    players:    {} as Record<string, string>,   // userId → "X" | "O"
    presences:  {} as Record<string, nkruntime.Presence>,
    timedMode,
    turnTimer:  timedMode ? 30 : 0,             // seconds remaining
    nk,
  };

  return {
    state,
    tickRate: 1,
    label: timedMode ? "timed" : "classic",
  };
}

function matchJoin(
  ctx: nkruntime.Context,
  dispatcher: nkruntime.MatchDispatcher,
  tick: number,
  state: any,
  presences: nkruntime.Presence[]
) {
  for (const p of presences) {
    state.presences[p.userId] = p;

    // Assign X to first player, O to second
    const assigned = Object.keys(state.players);
    if (assigned.length === 0) {
      state.players[p.userId] = "X";
    } else if (assigned.length === 1 && !state.players[p.userId]) {
      state.players[p.userId] = "O";
    }
  }

  // Once 2 players are in, broadcast initial state
  if (Object.keys(state.players).length === 2) {
    broadcastState(dispatcher, state);
  }

  return { state };
}

function matchLeave(
  ctx: nkruntime.Context,
  dispatcher: nkruntime.MatchDispatcher,
  tick: number,
  state: any,
  presences: nkruntime.Presence[]
) {
  for (const p of presences) {
    delete state.presences[p.userId];
  }

  // If game was still in progress, the remaining player wins by forfeit
  if (!state.winner && !state.draw && Object.keys(state.presences).length === 1) {
    const remainingId = Object.keys(state.presences)[0];
    const remainingSymbol = state.players[remainingId];
    state.winner = remainingSymbol;

    dispatcher.broadcastMessage(OP_GAME_OVER, JSON.stringify({
      winner: state.winner,
      draw:   false,
      reason: "opponent_disconnected",
    }));

    // Record stats
    try {
      const nk = state.nk;
      for (const [uid, sym] of Object.entries(state.players)) {
        if (uid === remainingId) recordResult(nk, uid, "win");
        else recordResult(nk, uid, "loss");
      }
    } catch (_) {}
  }

  return { state };
}

function matchTerminate(
  ctx: nkruntime.Context,
  dispatcher: nkruntime.MatchDispatcher,
  tick: number,
  state: any,
  graceSeconds: number
) {
  return { state };
}

function matchJoinAttempt(
  ctx: nkruntime.Context,
  dispatcher: nkruntime.MatchDispatcher,
  tick: number,
  state: any,
  presence: nkruntime.Presence,
  metadata: Record<string, any>
) {
  // Allow up to 2 players to join (check players dict, not presences which are updated after)
  const assignedCount = Object.keys(state.players).length;
  const canJoin = assignedCount < 2;
  return { state, accept: canJoin };
}

function matchSignal(
  ctx: nkruntime.Context,
  dispatcher: nkruntime.MatchDispatcher,
  tick: number,
  state: any,
  data: string
) {
  return { state, data: "" };
}

function matchLoop(
  ctx: nkruntime.Context,
  dispatcher: nkruntime.MatchDispatcher,
  tick: number,
  state: any,
  messages: nkruntime.MatchMessage[]
) {
  // ── Timer tick (timed mode) ──────────────────────────────────────────────
  if (state.timedMode && !state.winner && !state.draw) {
    if (Object.keys(state.players).length === 2) {
      state.turnTimer -= 1;

      dispatcher.broadcastMessage(OP_TIMER, JSON.stringify({
        remaining: state.turnTimer,
        turn: state.turn,
      }));

      if (state.turnTimer <= 0) {
        // Current player forfeits — opponent wins
        const forfeitSymbol = state.turn;
        const winSymbol = forfeitSymbol === "X" ? "O" : "X";
        state.winner = winSymbol;
        state.turnTimer = 0;

        dispatcher.broadcastMessage(OP_GAME_OVER, JSON.stringify({
          winner: winSymbol,
          draw:   false,
          reason: "timeout",
        }));

        // Record stats
        try {
          const nk = state.nk;
          for (const [uid, sym] of Object.entries(state.players)) {
            recordResult(nk, uid, sym === winSymbol ? "win" : "loss");
          }
        } catch (_) {}

        return { state };
      }
    }
  }

  // ── Process incoming moves ───────────────────────────────────────────────
  for (const msg of messages) {
    if (state.winner || state.draw) continue;
    if (Object.keys(state.players).length < 2) continue;

    const senderSymbol = state.players[msg.sender.userId];
    if (!senderSymbol) continue;

    // Enforce turn
    if (senderSymbol !== state.turn) continue;

    let data: any;
    try { data = JSON.parse(msg.data); } catch (_) { continue; }

    const index = data.index;
    if (typeof index !== "number" || index < 0 || index > 8) continue;
    if (state.board[index] !== "") continue;

    // Apply move
    state.board[index] = state.turn;

    // Reset timer on valid move
    if (state.timedMode) state.turnTimer = 30;

    const winner = checkWinner(state.board);
    if (winner) {
      state.winner = winner;
      broadcastState(dispatcher, state);
      dispatcher.broadcastMessage(OP_GAME_OVER, JSON.stringify({
        winner,
        draw: false,
        reason: "win",
      }));

      // Record stats
      try {
        const nk = state.nk;
        for (const [uid, sym] of Object.entries(state.players)) {
          recordResult(nk, uid, sym === winner ? "win" : "loss");
        }
      } catch (_) {}

      return { state };
    }

    if (isDraw(state.board)) {
      state.draw = true;
      broadcastState(dispatcher, state);
      dispatcher.broadcastMessage(OP_GAME_OVER, JSON.stringify({
        winner: null,
        draw:   true,
        reason: "draw",
      }));

      // Record stats
      try {
        const nk = state.nk;
        for (const uid of Object.keys(state.players)) {
          recordResult(nk, uid, "draw");
        }
      } catch (_) {}

      return { state };
    }

    state.turn = state.turn === "X" ? "O" : "X";
    broadcastState(dispatcher, state);
  }

  return { state };
}

// ─── Module init ──────────────────────────────────────────────────────────────
function InitModule(
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  initializer: nkruntime.Initializer
) {
  logger.info("Registering tictactoe match handler...");

  initializer.registerMatch("tictactoe", {
    matchInit,
    matchJoinAttempt,
    matchJoin,
    matchLeave,
    matchLoop,
    matchTerminate,
    matchSignal,
  });

  initializer.registerRpc("find_match",      rpcFindMatch);
  initializer.registerRpc("create_match",    rpcCreateMatch);
  initializer.registerRpc("get_leaderboard", rpcGetLeaderboard);

  logger.info("tictactoe module loaded.");
}
