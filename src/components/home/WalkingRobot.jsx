import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const SAL_OWL_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f93544702b554e3e1f7297/e6d91dd0c_AfriendlyrobotowlmascotwithpurpleandlimegreenaccentswearingstylishglassesholdinganopenglowingbookwithalightbulbaboveitsheadSportswhistlearoundneckModernvectorstyledarkbackgrou.jpg";

export default function WalkingRobot() {
  const [edge, setEdge] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isJumping, setIsJumping] = useState(false);
  const [walkFrame, setWalkFrame] = useState(0);

  const getPosition = (currentEdge, currentProgress) => {
    const padding = 30;
    const maxX = window.innerWidth - 80;
    const maxY = window.innerHeight - 80;

    switch (currentEdge) {
      case 0: return { x: padding + currentProgress * (maxX - padding), y: padding };
      case 1: return { x: maxX, y: padding + currentProgress * (maxY - padding) };
      case 2: return { x: maxX - currentProgress * (maxX - padding), y: maxY };
      case 3: return { x: padding, y: maxY - currentProgress * (maxY - padding) };
      default: return { x: padding, y: padding };
    }
  };

  const [position, setPosition] = useState(() => getPosition(0, 0));

  useEffect(() => {
    const moveRobot = () => {
      setProgress(prev => {
        const newProgress = prev + 0.06;
        if (newProgress >= 1) {
          setEdge(currentEdge => (currentEdge + 1) % 4);
          return 0;
        }
        return newProgress;
      });

      // Toggle walk frame for animation
      setWalkFrame(f => (f + 1) % 2);

      // Random jump
      if (Math.random() < 0.08) {
        setIsJumping(true);
        setTimeout(() => setIsJumping(false), 350);
      }
    };

    const interval = setInterval(moveRobot, 600);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setPosition(getPosition(edge, progress));
  }, [edge, progress]);

  const getDirection = () => {
    switch (edge) {
      case 0: return 1;
      case 1: return 1;
      case 2: return -1;
      case 3: return -1;
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
      }}
      transition={{
        x: { duration: 0.55, ease: "linear" },
        y: { duration: 0.55, ease: "linear" },
        scaleX: { duration: 0.15 },
      }}
    >
      <div className="relative">
        {/* S.A.L. Owl Body */}
        <motion.div
          animate={{ 
            y: isJumping ? -20 : 0,
            rotate: isJumping ? 5 : 0,
          }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative"
        >
          {/* Glow behind owl */}
          <div className="absolute -inset-2 bg-gradient-to-r from-purple-500/40 to-lime-400/40 rounded-full blur-lg animate-pulse" />
          
          {/* Main owl image with bobbing */}
          <motion.div
            animate={{ 
              y: walkFrame === 0 ? -2 : 2,
              rotate: walkFrame === 0 ? -2 : 2,
            }}
            transition={{ duration: 0.15 }}
            className="relative"
          >
            <img 
              src={SAL_OWL_URL}
              alt="S.A.L. the Owl"
              className="w-16 h-16 rounded-2xl object-cover shadow-xl shadow-purple-500/50 border-2 border-purple-400/60"
            />
          </motion.div>

          {/* Walking legs */}
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
            {/* Left leg */}
            <motion.div
              animate={{ 
                rotate: walkFrame === 0 ? -25 : 25,
                y: walkFrame === 0 ? 0 : -2,
              }}
              transition={{ duration: 0.15 }}
              style={{ transformOrigin: 'top center' }}
              className="w-2 h-5 bg-gradient-to-b from-amber-500 to-orange-600 rounded-full shadow-md"
            />
            {/* Right leg */}
            <motion.div
              animate={{ 
                rotate: walkFrame === 0 ? 25 : -25,
                y: walkFrame === 0 ? -2 : 0,
              }}
              transition={{ duration: 0.15 }}
              style={{ transformOrigin: 'top center' }}
              className="w-2 h-5 bg-gradient-to-b from-amber-500 to-orange-600 rounded-full shadow-md"
            />
          </div>

          {/* Dust/motion trail */}
          <motion.div
            animate={{ opacity: [0.6, 0], scale: [0.5, 1.5], x: getDirection() === 1 ? -20 : 20 }}
            transition={{ duration: 0.4, repeat: Infinity }}
            className="absolute bottom-0 left-1/2 w-3 h-3 bg-slate-400/40 rounded-full blur-sm"
          />
        </motion.div>

        {/* Speech bubble */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ 
            opacity: isJumping ? 1 : 0, 
            scale: isJumping ? 1 : 0,
            y: isJumping ? -5 : 0,
          }}
          className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl whitespace-nowrap shadow-lg border border-white/20"
        >
          Hoot hoot! 🦉✨
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-indigo-500 rotate-45" />
        </motion.div>
      </div>
    </motion.div>
  );
}