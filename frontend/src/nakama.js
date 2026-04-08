import { Client } from "@heroiclabs/nakama-js";

const HOST    = import.meta.env.VITE_NAKAMA_HOST  || "127.0.0.1";
const PORT    = import.meta.env.VITE_NAKAMA_PORT  || "7350";
const KEY     = import.meta.env.VITE_NAKAMA_KEY   || "defaultkey";
const USE_SSL = import.meta.env.VITE_NAKAMA_SSL   === "true";

const client = new Client(KEY, HOST, PORT, USE_SSL);

let _session  = null;
let _socket   = null;
let _onMatchData     = null;
let _onMatchPresence = null;
const _messageQueue  = [];

export async function connectToNakama() {
  const deviceId = crypto.randomUUID();
  _session = await client.authenticateDevice(deviceId, true, "Player_" + deviceId.slice(0, 6));
  sessionStorage.setItem("userId",   _session.user_id);
  sessionStorage.setItem("username", _session.username);
  console.log("[nakama] connected as", _session.user_id);

  _socket = client.createSocket(USE_SSL);
  _socket.onmatchdata = (msg) => {
    console.log("[socket] onmatchdata opcode", msg.op_code);
    if (_onMatchData) _onMatchData(msg);
    else _messageQueue.push(msg);
  };
  _socket.onmatchpresence = (e) => {
    if (_onMatchPresence) _onMatchPresence(e);
  };
  await _socket.connect(_session, true);
  return { socket: _socket, session: _session };
}

export async function findMatch(timedMode = false) {
  // Step 1: try to find an existing waiting match (size=1)
  console.log("[findMatch] looking for open match...");
  const findRes = await client.rpc(_session, "find_match", { timedMode });
  
  if (findRes.payload.matchId) {
    // Player 2 path: join existing match
    const matchId = findRes.payload.matchId;
    console.log("[findMatch] P2 joining existing match", matchId);
    try {
      await _socket.joinMatch(matchId);
      console.log("[findMatch] P2 joined successfully");
      return matchId;
    } catch (err) {
      console.error("[findMatch] P2 join failed:", err);
      throw new Error(`Failed to join match: ${err?.message || err}`);
    }
  }

  // Step 2: no open match — create one and join it (Player 1)
  const createRes = await client.rpc(_session, "create_match", { timedMode });
  const matchId = createRes.payload.matchId;
  console.log("[findMatch] P1 created match", matchId);
  
  try {
    await _socket.joinMatch(matchId);
    console.log("[findMatch] P1 joined successfully");
  } catch (err) {
    console.error("[findMatch] P1 join failed:", err);
    throw new Error(`Failed to join created match: ${err?.message || err}`);
  }

  // Step 3: poll until P2 joins (server broadcasts OP_STATE with 2 players)
  // Game component handles the waiting state — just return matchId
  return matchId;
}

export function setMatchDataHandler(handler) {
  _onMatchData = handler;
  while (_messageQueue.length > 0) handler(_messageQueue.shift());
}
export function setMatchPresenceHandler(handler) { _onMatchPresence = handler; }
export function clearMatchHandlers() { _onMatchData = null; _onMatchPresence = null; }

export async function getLeaderboard() {
  const res = await client.rpc(_session, "get_leaderboard", {});
  return res.payload;
}
export function getSession() { return _session; }
export function getSocket()  { return _socket;  }
