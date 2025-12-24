import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const SAL_OWL_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f93544702b554e3e1f7297/e6d91dd0c_AfriendlyrobotowlmascotwithpurpleandlimegreenaccentswearingstylishglassesholdinganopenglowingbookwithalightbulbaboveitsheadSportswhistlearoundneckModernvectorstyledarkbackgrou.jpg";

export default function WalkingRobot() {
  const [edge, setEdge] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isJumping, setIsJumping] = useState(false);
  const [walkCycle, setWalkCycle] = useState(0);

  const getPosition = (currentEdge, currentProgress) => {
    if (typeof window === 'undefined') return { x: 80, y: 80 };
    const padding = 80;
    const maxX = window.innerWidth - 100;
    const maxY = window.innerHeight - 100;

    switch (currentEdge) {
      case 0: return { x: padding + currentProgress * (maxX - padding), y: padding };
      case 1: return { x: maxX, y: padding + currentProgress * (maxY - padding) };
      case 2: return { x: maxX - currentProgress * (maxX - padding), y: maxY };
      case 3: return { x: padding, y: maxY - currentProgress * (maxY - padding) };
      default: return { x: padding, y: padding };
    }
  };

  const [position, setPosition] = useState({ x: 80, y: 80 });
  
  useEffect(() => {
    setPosition(getPosition(0, 0));
  }, []);

  // Smooth walking animation at 60fps feel
  useEffect(() => {
    const walkAnimation = setInterval(() => {
      setWalkCycle(prev => (prev + 1) % 8);
    }, 100);
    return () => clearInterval(walkAnimation);
  }, []);

  useEffect(() => {
    const moveRobot = () => {
      setProgress(prev => {
        const newProgress = prev + 0.025;
        if (newProgress >= 1) {
          setEdge(currentEdge => (currentEdge + 1) % 4);
          return 0;
        }
        return newProgress;
      });

      if (Math.random() < 0.05) {
        setIsJumping(true);
        setTimeout(() => setIsJumping(false), 400);
      }
    };

    const interval = setInterval(moveRobot, 150);
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

  // Smooth leg rotation based on walk cycle
  const leftLegRotation = Math.sin(walkCycle * Math.PI / 4) * 35;
  const rightLegRotation = Math.sin((walkCycle + 4) * Math.PI / 4) * 35;
  const bodyBob = Math.abs(Math.sin(walkCycle * Math.PI / 4)) * 4;
  const bodyTilt = Math.sin(walkCycle * Math.PI / 4) * 3;

  return (
    <motion.div
      className="fixed z-30 pointer-events-none select-none"
      animate={{
        x: position.x,
        y: position.y,
        scaleX: getDirection(),
      }}
      transition={{
        x: { duration: 0.14, ease: "linear" },
        y: { duration: 0.14, ease: "linear" },
        scaleX: { duration: 0.2 },
      }}
    >
      <div className="relative">
        <motion.div
          animate={{ 
            y: isJumping ? -30 : 0,
            rotate: isJumping ? 10 : 0,
          }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="relative"
        >
          {/* Shadow on ground */}
          <motion.div 
            className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-14 h-4 bg-black/30 rounded-full blur-md"
            animate={{
              scale: isJumping ? 0.6 : 1,
              opacity: isJumping ? 0.3 : 0.5,
            }}
          />

          {/* Glow effect */}
          <div className="absolute -inset-3 bg-gradient-to-r from-purple-500/30 to-lime-400/30 rounded-full blur-xl animate-pulse" />
          
          {/* Main owl body with walking bob */}
          <motion.div
            animate={{ 
              y: -bodyBob,
              rotate: bodyTilt,
            }}
            transition={{ duration: 0.08, ease: "linear" }}
            className="relative"
          >
            <img 
              src={SAL_OWL_URL}
              alt="S.A.L. the Owl"
              className="w-20 h-20 rounded-2xl object-cover shadow-2xl shadow-purple-500/60 border-2 border-purple-400/70"
            />
            
            {/* Eye blink overlay */}
            <motion.div
              animate={{ scaleY: walkCycle === 0 ? 0.1 : 1 }}
              transition={{ duration: 0.05 }}
              className="absolute top-4 left-3 right-3 h-3 bg-transparent"
            />
          </motion.div>

          {/* Animated walking legs */}
          <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 flex gap-3">
            {/* Left leg with foot */}
            <div className="relative">
              <motion.div
                animate={{ rotate: leftLegRotation }}
                transition={{ duration: 0.08, ease: "linear" }}
                style={{ transformOrigin: 'top center' }}
                className="relative"
              >
                {/* Thigh */}
                <div className="w-3 h-6 bg-gradient-to-b from-amber-400 to-amber-600 rounded-full shadow-lg" />
                {/* Foot */}
                <motion.div
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-5 h-2 bg-gradient-to-b from-orange-500 to-orange-700 rounded-full shadow-md"
                  animate={{ rotate: -leftLegRotation * 0.5 }}
                  style={{ transformOrigin: 'center top' }}
                />
              </motion.div>
            </div>
            
            {/* Right leg with foot */}
            <div className="relative">
              <motion.div
                animate={{ rotate: rightLegRotation }}
                transition={{ duration: 0.08, ease: "linear" }}
                style={{ transformOrigin: 'top center' }}
                className="relative"
              >
                {/* Thigh */}
                <div className="w-3 h-6 bg-gradient-to-b from-amber-400 to-amber-600 rounded-full shadow-lg" />
                {/* Foot */}
                <motion.div
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-5 h-2 bg-gradient-to-b from-orange-500 to-orange-700 rounded-full shadow-md"
                  animate={{ rotate: -rightLegRotation * 0.5 }}
                  style={{ transformOrigin: 'center top' }}
                />
              </motion.div>
            </div>
          </div>

          {/* Dust puffs when walking */}
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ 
                opacity: [0.5, 0], 
                scale: [0.3, 1], 
                x: getDirection() === 1 ? [-5 - i * 8, -15 - i * 12] : [5 + i * 8, 15 + i * 12],
                y: [0, -5]
              }}
              transition={{ 
                duration: 0.5, 
                repeat: Infinity, 
                delay: i * 0.15,
                ease: "easeOut"
              }}
              className="absolute -bottom-1 left-1/2 w-2 h-2 bg-slate-300/50 rounded-full blur-sm"
            />
          ))}
        </motion.div>

        {/* Speech bubble on jump */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ 
            opacity: isJumping ? 1 : 0, 
            scale: isJumping ? 1 : 0,
            y: isJumping ? -10 : 0,
          }}
          transition={{ duration: 0.15 }}
          className="absolute -top-14 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-bold px-4 py-2 rounded-2xl whitespace-nowrap shadow-xl border border-white/30"
        >
          Whoo-hoo! 🦉💫
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-indigo-600 rotate-45 rounded-sm" />
        </motion.div>
      </div>
    </motion.div>
  );
}