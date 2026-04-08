import { motion } from "framer-motion";

export default function Cell({ value, onClick, disabled }) {
  const color = value === "X" ? "text-blue-400" : value === "O" ? "text-red-400" : "text-transparent";

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={!disabled && !value ? { scale: 1.08 } : {}}
      whileTap={!disabled && !value ? { scale: 0.88 } : {}}
      className={`w-24 h-24 bg-gray-800 border border-gray-600 text-3xl font-bold rounded-xl
        flex items-center justify-center transition-shadow
        ${!disabled && !value ? "hover:shadow-lg hover:shadow-blue-500/40 cursor-pointer" : "cursor-default"}
        ${color}`}
    >
      {value && (
        <motion.span
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          {value}
        </motion.span>
      )}
    </motion.button>
  );
}
