import Cell from "./Cell";
import { motion } from "framer-motion";

export default function Board({ board = [], onClick, disabled = false }) {
  return (
    <motion.div
      className="grid grid-cols-3 gap-3 bg-white/10 p-4 rounded-2xl backdrop-blur-lg"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
    >
      {board.map((cell, i) => (
        <Cell
          key={i}
          value={cell}
          onClick={() => !disabled && onClick(i)}
          disabled={disabled || cell !== ""}
        />
      ))}
    </motion.div>
  );
}
