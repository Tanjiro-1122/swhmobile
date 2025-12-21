import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bot } from 'lucide-react';

export default function WalkingRobot() {
  const [position, setPosition] = useState({ x: 100, y: 300 });
  const [direction, setDirection] = useState(1); // 1 = right, -1 = left
  const [isJumping, setIsJumping] = useState(false);

  useEffect(() => {
    const moveRobot = () => {
      setPosition(prev => {
        const maxX = window.innerWidth - 80;
        let newX = prev.x + (direction * (30 + Math.random() * 20));
        let newDirection = direction;

        // Bounce off edges
        if (newX >= maxX) {
          newX = maxX;
          newDirection = -1;
        } else if (newX <= 20) {
          newX = 20;
          newDirection = 1;
        }

        setDirection(newDirection);

        // Random vertical movement
        const newY = Math.max(200, Math.min(window.innerHeight - 150, prev.y + (Math.random() - 0.5) * 40));

        return { x: newX, y: newY };
      });

      // Random jump
      if (Math.random() < 0.15) {
        setIsJumping(true);
        setTimeout(() => setIsJumping(false), 400);
      }
    };

    const interval = setInterval(moveRobot, 1500);
    return () => clearInterval(interval);
  }, [direction]);

  return (
    <motion.div
      className="fixed z-30 pointer-events-none select-none"
      animate={{
        x: position.x,
        y: position.y,
        scaleX: direction,
        translateY: isJumping ? -20 : 0,
      }}
      transition={{
        x: { duration: 1.2, ease: "easeInOut" },
        y: { duration: 1.2, ease: "easeInOut" },
        scaleX: { duration: 0.2 },
        translateY: { duration: 0.2, ease: "easeOut" },
      }}
    >
      <div className="relative">
        {/* Robot body */}
        <motion.div
          animate={{ rotate: [0, -5, 5, -5, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut" }}
          className="relative"
        >
          <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30 border border-white/20">
            <Bot className="w-7 h-7 text-white" />
          </div>
          
          {/* Antenna */}
          <motion.div
            animate={{ rotate: [-10, 10, -10] }}
            transition={{ duration: 0.8, repeat: Infinity }}
            className="absolute -top-3 left-1/2 -translate-x-1/2"
          >
            <div className="w-1 h-3 bg-cyan-400 rounded-full" />
            <div className="w-2 h-2 bg-lime-400 rounded-full -mt-0.5 -ml-0.5 animate-pulse" />
          </motion.div>

          {/* Legs walking animation */}
          <div className="absolute -bottom-2 left-1 flex gap-4">
            <motion.div
              animate={{ rotate: [-20, 20, -20] }}
              transition={{ duration: 0.3, repeat: Infinity }}
              className="w-2 h-3 bg-slate-600 rounded-b-full origin-top"
            />
            <motion.div
              animate={{ rotate: [20, -20, 20] }}
              transition={{ duration: 0.3, repeat: Infinity }}
              className="w-2 h-3 bg-slate-600 rounded-b-full origin-top"
            />
          </div>
        </motion.div>

        {/* Speech bubble - shows occasionally */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ 
            opacity: isJumping ? 1 : 0, 
            scale: isJumping ? 1 : 0 
          }}
          className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white text-slate-800 text-xs font-bold px-2 py-1 rounded-lg whitespace-nowrap shadow-md"
        >
          Beep! 🤖
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white rotate-45" />
        </motion.div>
      </div>
    </motion.div>
  );
}