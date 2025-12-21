import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const SAPL_OWL_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f93544702b554e3e1f7297/e6d91dd0c_AfriendlyrobotowlmascotwithpurpleandlimegreenaccentswearingstylishglassesholdinganopenglowingbookwithalightbulbaboveitsheadSportswhistlearoundneckModernvectorstyledarkbackgrou.jpg";

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
        scaleX: getDirection(),
        translateY: isJumping ? -15 : 0,
      }}
      transition={{
        x: { duration: 1.2, ease: "easeInOut" },
        y: { duration: 1.2, ease: "easeInOut" },
        scaleX: { duration: 0.2 },
        translateY: { duration: 0.2, ease: "easeOut" },
      }}
    >
      <div className="relative">
        {/* SAPL Owl */}
        <motion.div
          animate={{ rotate: [0, -3, 3, -3, 0] }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
          className="relative"
        >
          <img 
            src={SAPL_OWL_URL}
            alt="SAPL"
            className="w-14 h-14 rounded-xl object-cover shadow-lg shadow-purple-500/40 border-2 border-purple-500/50"
          />
          
          {/* Glowing effect */}
          <div className="absolute inset-0 rounded-xl bg-lime-400/20 animate-pulse" />
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
          Hoot! 🦉
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white rotate-45" />
        </motion.div>
      </div>
    </motion.div>
  );
}