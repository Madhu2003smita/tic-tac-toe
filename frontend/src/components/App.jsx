import { useState, useEffect } from "react";
import { connectToNakama } from "../nakama";
import Lobby from "./Lobby";
import Game from "./Game";

export default function App() {
  const [ready, setReady]     = useState(false);
  const [matchId, setMatchId] = useState(null);
  const [timedMode, setTimedMode] = useState(false);

  useEffect(() => {
    connectToNakama().then(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-white text-lg animate-pulse">Connecting...</p>
      </div>
    );
  }

  if (matchId) {
    return (
      <Game
        matchId={matchId}
        timedMode={timedMode}
        onLeave={() => setMatchId(null)}
      />
    );
  }

  return (
    <Lobby
      onMatch={(id, timed) => { setMatchId(id); setTimedMode(timed); }}
    />
  );
}
