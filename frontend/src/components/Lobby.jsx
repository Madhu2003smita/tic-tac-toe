import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { findMatch, getLeaderboard } from "../nakama";

export default function Lobby({ onMatch }) {
  const [searching, setSearching]   = useState(false);
  const [timedMode, setTimedMode]   = useState(false);
  const [stats, setStats]           = useState(null);
  const [error, setError]           = useState(null);
  const username = sessionStorage.getItem("username") || "Player";

  useEffect(() => {
    getLeaderboard().then(setStats).catch(() => {});
  }, []);

  async function handleFind() {
    setSearching(true);
    setError(null);
    try {
      console.log("[Lobby] calling findMatch timedMode=", timedMode);
      const id = await findMatch(timedMode);
      console.log("[Lobby] got matchId=", id);
      onMatch(id, timedMode);
    } catch (e) {
      const errorMsg = e?.message || e?.toString() || "Failed to find match";
      console.error("[Lobby] findMatch error", errorMsg, e);
      setError(errorMsg);
      setSearching(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center gap-8 p-4">
      <motion.h1
        className="text-4xl font-bold text-white"
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        Tic-Tac-Toe
      </motion.h1>

      <motion.div
        className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 w-full max-w-sm flex flex-col gap-4"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        <p className="text-gray-300 text-center">Welcome, <span className="text-white font-semibold">{username}</span></p>

        {/* Mode toggle */}
        <div className="flex items-center justify-between bg-gray-800 rounded-xl px-4 py-3">
          <span className="text-gray-300 text-sm">Timed mode (30s/turn)</span>
          <button
            onClick={() => setTimedMode(v => !v)}
            className={`w-12 h-6 rounded-full transition-colors ${timedMode ? "bg-blue-500" : "bg-gray-600"} relative`}
          >
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${timedMode ? "left-7" : "left-1"}`} />
          </button>
        </div>

        <motion.button
          onClick={handleFind}
          disabled={searching}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          {searching ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Finding match...
            </span>
          ) : "Find Match"}
        </motion.button>

        {error && (
          <p className="text-red-400 text-sm text-center">{error}</p>
        )}
      </motion.div>

      {/* Stats card */}
      {stats && (
        <motion.div
          className="bg-white/10 backdrop-blur-lg rounded-2xl p-5 w-full max-w-sm"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-white font-semibold mb-3 text-center">Your Stats</h2>
          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              { label: "Wins",   value: stats.wins   ?? 0, color: "text-green-400" },
              { label: "Losses", value: stats.losses ?? 0, color: "text-red-400"   },
              { label: "Draws",  value: stats.draws  ?? 0, color: "text-yellow-400"},
              { label: "Streak", value: stats.streak ?? 0, color: "text-blue-400"  },
            ].map(s => (
              <div key={s.label} className="bg-gray-800 rounded-xl py-2">
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-gray-400 text-xs">{s.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
