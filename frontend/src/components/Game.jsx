import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Board from "./Board";
import { getSocket, getSession, setMatchDataHandler, setMatchPresenceHandler, clearMatchHandlers } from "../nakama";

const OP_STATE     = 2;
const OP_TIMER     = 3;
const OP_GAME_OVER = 4;

export default function Game({ matchId, timedMode, onLeave }) {
  const [board, setBoard]       = useState(Array(9).fill(""));
  const [turn, setTurn]         = useState("X");
  const [mySymbol, setMySymbol] = useState(null);
  const [players, setPlayers]   = useState({});
  const [timer, setTimer]       = useState(timedMode ? 30 : null);
  const [gameOver, setGameOver] = useState(null);
  const [waiting, setWaiting]   = useState(true);

  const socketRef = useRef(null);
  const myId      = getSession()?.user_id;

  useEffect(() => {
    socketRef.current = getSocket();
    console.log("[Game] mounted, match=", matchId, "user=", myId);

    // Register handler immediately — also flushes any queued messages
    setMatchDataHandler((msg) => {
      const decoded = new TextDecoder().decode(msg.data);
      const data    = JSON.parse(decoded);
      console.log("[Game] onmatchdata opcode=", msg.op_code, data);

      if (msg.op_code === OP_STATE) {
        setBoard(data.board);
        setTurn(data.turn);
        setPlayers(data.players || {});
        if (data.players && data.players[myId]) {
          setMySymbol(data.players[myId]);
        }
        setWaiting(Object.keys(data.players || {}).length < 2);
      }
      if (msg.op_code === OP_TIMER)     setTimer(data.remaining);
      if (msg.op_code === OP_GAME_OVER) setGameOver(data);
    });

    setMatchPresenceHandler((e) => {
      console.log("[Game] presence", e);
    });

    return () => {
      clearMatchHandlers();
      getSocket().leaveMatch(matchId).catch(() => {});
    };
  }, [matchId]);

  function handleClick(index) {
    if (gameOver || !mySymbol || mySymbol !== turn) return;
    getSocket().sendMatchState(matchId, 1, JSON.stringify({ index }));
  }

  const isMyTurn     = mySymbol === turn && !gameOver && !waiting;
  const timerColor   = timer !== null && timer <= 5 ? "text-red-400" : timer !== null && timer <= 10 ? "text-yellow-400" : "text-green-400";
  const opponentSymbol = mySymbol === "X" ? "O" : "X";

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center gap-6 p-4">
      <motion.h1
        className="text-3xl font-bold text-white"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        Tic-Tac-Toe
      </motion.h1>

      <div className="flex items-center gap-4 w-full max-w-sm">
        <PlayerBadge symbol={mySymbol || "?"} label="You"      active={isMyTurn} />
        <span className="text-gray-500 text-sm flex-1 text-center">vs</span>
        <PlayerBadge symbol={opponentSymbol}  label="Opponent" active={!isMyTurn && !waiting && !gameOver} />
      </div>

      {waiting && (
        <motion.div
          className="bg-white/10 backdrop-blur-lg rounded-2xl px-6 py-4 text-center"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        >
          <p className="text-white flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Waiting for opponent...
          </p>
        </motion.div>
      )}

      {timedMode && !waiting && !gameOver && (
        <motion.div key={timer} className={`text-4xl font-bold ${timerColor}`}
          initial={{ scale: 1.3 }} animate={{ scale: 1 }}>
          {timer}s
        </motion.div>
      )}

      {!waiting && !gameOver && (
        <p className="text-gray-300 text-sm">
          {isMyTurn ? "Your turn" : "Opponent's turn"}
        </p>
      )}

      <Board board={board} onClick={handleClick} disabled={!isMyTurn} />

      <p className="text-gray-600 text-xs">Match: {matchId}</p>

      <AnimatePresence>
        {gameOver && (
          <GameOverModal gameOver={gameOver} mySymbol={mySymbol} onLeave={onLeave} />
        )}
      </AnimatePresence>
    </div>
  );
}

function PlayerBadge({ symbol, label, active }) {
  return (
    <div className={`flex-1 flex flex-col items-center bg-gray-800 rounded-xl py-2 border-2 transition-colors
      ${active ? "border-blue-500" : "border-transparent"}`}>
      <span className={`text-2xl font-bold ${symbol === "X" ? "text-blue-400" : "text-red-400"}`}>{symbol}</span>
      <span className="text-gray-400 text-xs">{label}</span>
    </div>
  );
}

function GameOverModal({ gameOver, mySymbol, onLeave }) {
  const { winner, draw, reason } = gameOver;
  let title, subtitle, color;
  if (draw) {
    title = "It's a Draw!"; subtitle = "Well played."; color = "text-yellow-400";
  } else if (winner === mySymbol) {
    title = "You Win!";
    subtitle = reason === "opponent_disconnected" ? "Opponent disconnected."
             : reason === "timeout" ? "Opponent ran out of time." : "Great move!";
    color = "text-green-400";
  } else {
    title = "You Lose.";
    subtitle = reason === "timeout" ? "You ran out of time." : "Better luck next time.";
    color = "text-red-400";
  }

  return (
    <motion.div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="bg-gray-800 rounded-2xl p-8 flex flex-col items-center gap-4 mx-4 w-full max-w-xs"
        initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}>
        <p className={`text-3xl font-bold ${color}`}>{title}</p>
        <p className="text-gray-400 text-sm text-center">{subtitle}</p>
        <motion.button onClick={onLeave} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-3 rounded-xl w-full">
          Back to Lobby
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
