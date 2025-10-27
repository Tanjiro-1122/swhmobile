import React from "react";
import { Button } from "@/components/ui/button";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { motion } from "framer-motion";

export default function ThemeToggle({ variant = "default" }) {
  const { theme, toggleTheme } = useTheme();

  if (variant === "switch") {
    return (
      <button
        onClick={toggleTheme}
        className="relative inline-flex h-10 w-20 items-center rounded-full bg-slate-700 transition-colors hover:bg-slate-600"
        aria-label="Toggle theme"
      >
        <motion.div
          className="absolute h-8 w-8 rounded-full bg-white flex items-center justify-center shadow-lg"
          animate={{
            x: theme === 'dark' ? 4 : 44
          }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        >
          {theme === 'dark' ? (
            <Moon className="w-4 h-4 text-slate-900" />
          ) : (
            <Sun className="w-4 h-4 text-yellow-500" />
          )}
        </motion.div>
      </button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="text-gray-400 hover:text-white transition-colors"
      aria-label="Toggle theme"
    >
      <motion.div
        initial={false}
        animate={{ rotate: theme === 'dark' ? 0 : 180 }}
        transition={{ duration: 0.3 }}
      >
        {theme === 'dark' ? (
          <Moon className="w-5 h-5" />
        ) : (
          <Sun className="w-5 h-5" />
        )}
      </motion.div>
    </Button>
  );
}