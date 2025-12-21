import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bot } from 'lucide-react';

export default function WalkingRobot() {
  // Edges: 0=top, 1=right, 2=bottom, 3=left
  const [edge, setEdge] = useState(0);
  const [progress, setProgress] = useState(0); // 0 to 1 along current edge
  const [isJumping, setIsJumping] = useState(false);

  const getPosition = (currentEdge, currentProgress) => {
    const padding = 30;
    const maxX = window.innerWidth - 60;
    const maxY = window.innerHeight - 60;

    switch (currentEdge) {
      case 0: // Top edge - moving right
        return { x: padding + currentProgress * (maxX - padding), y: padding };
      case 1: // Right edge - moving down
        return { x: maxX, y: padding + currentProgress * (maxY - padding) };
      case 2: // Bottom edge - moving left
        return { x: maxX - currentProgress * (maxX - padding), y: maxY };
      case 3: // Left edge - moving up
        return { x: padding, y: maxY - currentProgress * (maxY - padding) };
      default:
        return { x: padding, y: padding };
    }
  };

  const [position, setPosition] = useState(() => getPosition(0, 0));

  useEffect(() => {
    const moveRobot = () => {
      setProgress(prev => {
        const newProgress = prev + 0.08;
        
        if (newProgress >= 1) {
          // Move to next edge
          setEdge(currentEdge => (currentEdge + 1) % 4);
          return 0;
        }
        
        return newProgress;
      });

      // Random jump
      if (Math.random() < 0.12) {
        setIsJumping(true);
        setTimeout(() => setIsJumping(false), 400);
      }
    };

    const interval = setInterval(moveRobot, 800);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setPosition(getPosition(edge, progress));
  }, [edge, progress]);

  // Direction robot faces based on edge
  const getDirection = () => {
    switch (edge) {
      case 0: return 1;  // Right
      case 1: return 1;  // Down (face right)
      case 2: return -1; // Left
      case 3: return -1; // Up (face left)
      default: return 1;
    }
  };

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