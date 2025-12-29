import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { ArrowRight, Zap } from 'lucide-react';

// Holographic Grid Background
const HolographicGrid = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;
    let time = 0;

    const resize = () => {
      canvas.width = canvas.offsetWidth * 2;
      canvas.height = canvas.offsetHeight * 2;
      ctx.scale(2, 2);
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);

      // Perspective grid
      const gridSize = 40;
      const horizon = h * 0.4;
      const vanishX = w / 2;

      ctx.strokeStyle = 'rgba(163, 230, 53, 0.15)';
      ctx.lineWidth = 0.5;

      // Horizontal lines with perspective
      for (let i = 0; i < 20; i++) {
        const y = horizon + (i * i * 2);
        if (y > h) break;
        const spread = (y - horizon) / (h - horizon);
        ctx.beginPath();
        ctx.moveTo(vanishX - w * spread, y);
        ctx.lineTo(vanishX + w * spread, y);
        ctx.stroke();
      }

      // Vertical lines converging to vanishing point
      for (let i = -10; i <= 10; i++) {
        ctx.beginPath();
        ctx.moveTo(vanishX + i * 100, h);
        ctx.lineTo(vanishX, horizon);
        ctx.stroke();
      }

      // Animated scan line
      const scanY = (time * 50) % h;
      const gradient = ctx.createLinearGradient(0, scanY - 20, 0, scanY + 20);
      gradient.addColorStop(0, 'transparent');
      gradient.addColorStop(0.5, 'rgba(163, 230, 53, 0.3)');
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, scanY - 20, w, 40);

      time += 0.016;
      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full opacity-60"
      style={{ background: 'transparent' }}
    />
  );
};

// S.A.L. Mechanical Assembly Animation
const SALConstruction = () => {
  const [buildPhase, setBuildPhase] = useState(0);
  const [glitchText, setGlitchText] = useState('');
  const buildTexts = [
    'INITIALIZING NEURAL CORE...',
    'ASSEMBLING OPTICAL SYSTEMS...',
    'CALIBRATING PREDICTION ENGINE...',
    'INSTALLING WISDOM PROTOCOLS...',
    'S.A.L. ONLINE'
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setBuildPhase(prev => (prev + 1) % 5);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let charIdx = 0;
    const text = buildTexts[buildPhase];
    let timer;
    
    const typeChar = () => {
      if (charIdx <= text.length) {
        setGlitchText(text.substring(0, charIdx) + (charIdx < text.length ? '█' : ''));
        charIdx++;
        timer = setTimeout(typeChar, 50);
      }
    };
    
    typeChar();
    return () => clearTimeout(timer);
  }, [buildPhase]);

  return (
    <div className="relative w-full max-w-md mx-auto aspect-square">
      {/* Outer holographic rings */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute inset-0 rounded-full"
          style={{
            border: '1px solid',
            borderColor: i === 0 ? 'rgba(163, 230, 53, 0.4)' : i === 1 ? 'rgba(168, 85, 247, 0.3)' : 'rgba(34, 211, 238, 0.2)',
          }}
          animate={{
            rotate: i % 2 === 0 ? 360 : -360,
            scale: [1, 1.05, 1],
          }}
          transition={{
            rotate: { duration: 20 + i * 5, repeat: Infinity, ease: 'linear' },
            scale: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
          }}
        />
      ))}

      {/* Holographic container */}
      <motion.div
        className="absolute inset-8 rounded-3xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.6) 100%)',
          border: '1px solid rgba(163, 230, 53, 0.3)',
          boxShadow: '0 0 60px rgba(163, 230, 53, 0.2), inset 0 0 60px rgba(163, 230, 53, 0.05)',
        }}
      >
        {/* Scan lines overlay */}
        <div 
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(163, 230, 53, 0.03) 2px, rgba(163, 230, 53, 0.03) 4px)',
          }}
        />

        {/* Data streams */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-px bg-gradient-to-b from-transparent via-lime-400/50 to-transparent"
            style={{
              left: `${10 + i * 12}%`,
              height: '100%',
            }}
            animate={{
              opacity: [0, 0.8, 0],
              y: ['-100%', '100%'],
            }}
            transition={{
              duration: 2 + Math.random(),
              delay: i * 0.3,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        ))}

        {/* S.A.L. Mechanical Robot Arm Assembly */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="relative w-40 h-40 sm:w-48 sm:h-48"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            {/* Glowing backdrop */}
            <motion.div
              className="absolute inset-0 rounded-full blur-3xl"
              style={{
                background: 'radial-gradient(circle, rgba(163, 230, 53, 0.5) 0%, rgba(168, 85, 247, 0.3) 40%, transparent 70%)',
              }}
              animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0.9, 0.6] }}
              transition={{ duration: 3, repeat: Infinity }}
            />

            {/* SVG Robot Arm Assembly */}
            <svg viewBox="0 0 120 120" className="w-full h-full relative z-10">
              {/* Base platform */}
              <motion.rect
                x="35"
                y="100"
                width="50"
                height="8"
                rx="2"
                fill="rgba(30, 41, 59, 0.9)"
                stroke="rgba(163, 230, 53, 0.8)"
                strokeWidth="1"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                style={{ transformOrigin: '60px 104px' }}
              />
              
              {/* Robot arm base joint */}
              <motion.circle
                cx="60"
                cy="95"
                r="8"
                fill="rgba(15, 23, 42, 0.9)"
                stroke="rgba(168, 85, 247, 0.9)"
                strokeWidth="1.5"
                initial={{ scale: 0 }}
                animate={{ scale: buildPhase >= 0 ? 1 : 0 }}
                transition={{ duration: 0.4, type: 'spring' }}
              />
              
              {/* Lower arm segment */}
              <motion.g
                initial={{ rotate: -30, opacity: 0 }}
                animate={{ 
                  rotate: buildPhase >= 1 ? 0 : -30,
                  opacity: buildPhase >= 1 ? 1 : 0
                }}
                transition={{ duration: 0.6, type: 'spring', stiffness: 100 }}
                style={{ transformOrigin: '60px 95px' }}
              >
                <rect
                  x="56"
                  y="55"
                  width="8"
                  height="40"
                  rx="3"
                  fill="rgba(30, 41, 59, 0.9)"
                  stroke="rgba(163, 230, 53, 0.8)"
                  strokeWidth="1"
                />
                {/* Hydraulic details */}
                <line x1="58" y1="60" x2="58" y2="90" stroke="rgba(34, 211, 238, 0.6)" strokeWidth="1" />
                <line x1="62" y1="60" x2="62" y2="90" stroke="rgba(34, 211, 238, 0.6)" strokeWidth="1" />
              </motion.g>
              
              {/* Middle joint */}
              <motion.circle
                cx="60"
                cy="55"
                r="6"
                fill="rgba(15, 23, 42, 0.9)"
                stroke="rgba(168, 85, 247, 0.9)"
                strokeWidth="1.5"
                initial={{ scale: 0 }}
                animate={{ scale: buildPhase >= 1 ? 1 : 0 }}
                transition={{ duration: 0.4, delay: 0.3, type: 'spring' }}
              />
              
              {/* Upper arm segment with rotation */}
              <motion.g
                initial={{ rotate: 45, opacity: 0 }}
                animate={{ 
                  rotate: buildPhase >= 2 ? -15 : 45,
                  opacity: buildPhase >= 2 ? 1 : 0
                }}
                transition={{ duration: 0.8, type: 'spring', stiffness: 80 }}
                style={{ transformOrigin: '60px 55px' }}
              >
                <rect
                  x="57"
                  y="25"
                  width="6"
                  height="30"
                  rx="2"
                  fill="rgba(30, 41, 59, 0.9)"
                  stroke="rgba(163, 230, 53, 0.8)"
                  strokeWidth="1"
                />
                {/* Wiring detail */}
                <motion.path
                  d="M 58 30 Q 55 40 58 50"
                  fill="none"
                  stroke="rgba(251, 191, 36, 0.6)"
                  strokeWidth="0.8"
                  strokeDasharray="2 2"
                  animate={{ strokeDashoffset: [0, -10] }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
              </motion.g>
              
              {/* Wrist joint */}
              <motion.circle
                cx="55"
                cy="22"
                r="5"
                fill="rgba(15, 23, 42, 0.9)"
                stroke="rgba(34, 211, 238, 0.9)"
                strokeWidth="1.5"
                initial={{ scale: 0 }}
                animate={{ scale: buildPhase >= 2 ? 1 : 0 }}
                transition={{ duration: 0.4, delay: 0.5, type: 'spring' }}
              />
              
              {/* Gripper / Claw holding S.A.L. */}
              <motion.g
                initial={{ scale: 0, rotate: 20 }}
                animate={{ 
                  scale: buildPhase >= 3 ? 1 : 0,
                  rotate: buildPhase >= 3 ? 0 : 20
                }}
                transition={{ duration: 0.6, type: 'spring', stiffness: 100 }}
                style={{ transformOrigin: '55px 22px' }}
              >
                {/* Left gripper finger */}
                <motion.path
                  d="M 48 18 L 42 8 L 45 6"
                  fill="none"
                  stroke="rgba(163, 230, 53, 0.9)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  animate={{ 
                    d: buildPhase >= 4 
                      ? "M 48 18 L 48 10 L 52 8" 
                      : "M 48 18 L 42 8 L 45 6"
                  }}
                  transition={{ duration: 0.5 }}
                />
                {/* Right gripper finger */}
                <motion.path
                  d="M 62 18 L 68 8 L 65 6"
                  fill="none"
                  stroke="rgba(163, 230, 53, 0.9)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  animate={{ 
                    d: buildPhase >= 4 
                      ? "M 62 18 L 62 10 L 58 8" 
                      : "M 62 18 L 68 8 L 65 6"
                  }}
                  transition={{ duration: 0.5 }}
                />
              </motion.g>
              
              {/* S.A.L. Owl being assembled/held */}
              <motion.g
                initial={{ y: -30, opacity: 0 }}
                animate={{ 
                  y: buildPhase >= 4 ? 0 : -30,
                  opacity: buildPhase >= 4 ? 1 : 0
                }}
                transition={{ duration: 0.8, type: 'spring', stiffness: 60 }}
              >
                {/* Owl head outline */}
                <motion.circle
                  cx="55"
                  cy="-5"
                  r="12"
                  fill="rgba(15, 23, 42, 0.8)"
                  stroke="rgba(168, 85, 247, 0.9)"
                  strokeWidth="1"
                />
                {/* Left eye */}
                <circle cx="50" cy="-6" r="4" fill="none" stroke="rgba(34, 211, 238, 0.9)" strokeWidth="1" />
                <motion.circle 
                  cx="50" 
                  cy="-6" 
                  r="2" 
                  fill="rgba(34, 211, 238, 0.8)"
                  animate={{ fill: ['rgba(34, 211, 238, 0.5)', 'rgba(34, 211, 238, 1)', 'rgba(34, 211, 238, 0.5)'] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                {/* Right eye */}
                <circle cx="60" cy="-6" r="4" fill="none" stroke="rgba(34, 211, 238, 0.9)" strokeWidth="1" />
                <motion.circle 
                  cx="60" 
                  cy="-6" 
                  r="2" 
                  fill="rgba(34, 211, 238, 0.8)"
                  animate={{ fill: ['rgba(34, 211, 238, 0.5)', 'rgba(34, 211, 238, 1)', 'rgba(34, 211, 238, 0.5)'] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                />
                {/* Beak */}
                <path d="M 53 -2 L 55 3 L 57 -2 Z" fill="rgba(251, 191, 36, 0.8)" stroke="rgba(251, 191, 36, 1)" strokeWidth="0.5" />
                {/* Ear tufts */}
                <path d="M 44 -12 L 47 -5 L 42 -8 Z" fill="none" stroke="rgba(163, 230, 53, 0.8)" strokeWidth="1" />
                <path d="M 66 -12 L 63 -5 L 68 -8 Z" fill="none" stroke="rgba(163, 230, 53, 0.8)" strokeWidth="1" />
              </motion.g>
              
              {/* Sparks and energy effects */}
              {buildPhase >= 3 && [...Array(4)].map((_, i) => (
                <motion.circle
                  key={i}
                  r="1.5"
                  fill={i % 2 === 0 ? 'rgba(163, 230, 53, 0.9)' : 'rgba(34, 211, 238, 0.9)'}
                  initial={{ cx: 55, cy: 22, opacity: 0 }}
                  animate={{
                    cx: [55, 55 + (Math.random() - 0.5) * 40],
                    cy: [22, 22 + (Math.random() - 0.5) * 40],
                    opacity: [0, 1, 0],
                    scale: [0.5, 1, 0],
                  }}
                  transition={{
                    duration: 1,
                    delay: i * 0.2,
                    repeat: Infinity,
                    repeatDelay: 1,
                  }}
                />
              ))}
              
              {/* Energy beam connecting arm to S.A.L. */}
              {buildPhase >= 4 && (
                <motion.line
                  x1="55"
                  y1="17"
                  x2="55"
                  y2="7"
                  stroke="url(#energyBeam)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                />
              )}
              
              {/* Gradient definitions */}
              <defs>
                <linearGradient id="energyBeam" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="rgba(163, 230, 53, 1)" />
                  <stop offset="50%" stopColor="rgba(168, 85, 247, 1)" />
                  <stop offset="100%" stopColor="rgba(34, 211, 238, 1)" />
                </linearGradient>
              </defs>
            </svg>
            
            {/* Holographic scan overlay */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(180deg, transparent 0%, rgba(163, 230, 53, 0.1) 50%, transparent 100%)',
                backgroundSize: '100% 30px',
              }}
              animate={{ backgroundPosition: ['0% 0%', '0% 100%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            />
          </motion.div>

            {/* Orbiting particles */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  background: i % 2 === 0 ? '#a3e635' : '#a855f7',
                  boxShadow: `0 0 10px ${i % 2 === 0 ? '#a3e635' : '#a855f7'}`,
                }}
                animate={{
                  rotate: 360,
                }}
                transition={{
                  duration: 4 + i,
                  repeat: Infinity,
                  ease: 'linear',
                }}
                initial={{
                  x: Math.cos((i * Math.PI * 2) / 6) * 80,
                  y: Math.sin((i * Math.PI * 2) / 6) * 80,
                }}
              />
            ))}
          </motion.div>
        </div>

        {/* Status text */}
        <div className="absolute bottom-4 left-4 right-4">
          <motion.div
            className="font-mono text-xs sm:text-sm text-lime-400 text-center"
            style={{ textShadow: '0 0 10px rgba(163, 230, 53, 0.8)' }}
          >
            {glitchText}
          </motion.div>
          
          {/* Progress bar */}
          <div className="mt-2 h-1 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-lime-400 via-purple-500 to-cyan-400"
              animate={{
                width: `${(buildPhase + 1) * 20}%`,
              }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </motion.div>

      {/* Corner decorations */}
      {['top-0 left-0', 'top-0 right-0', 'bottom-0 left-0', 'bottom-0 right-0'].map((pos, i) => (
        <div
          key={i}
          className={`absolute ${pos} w-8 h-8`}
          style={{
            borderTop: i < 2 ? '2px solid rgba(163, 230, 53, 0.5)' : 'none',
            borderBottom: i >= 2 ? '2px solid rgba(163, 230, 53, 0.5)' : 'none',
            borderLeft: i % 2 === 0 ? '2px solid rgba(163, 230, 53, 0.5)' : 'none',
            borderRight: i % 2 !== 0 ? '2px solid rgba(163, 230, 53, 0.5)' : 'none',
          }}
        />
      ))}
    </div>
  );
};

// Incoming Signal Transmission CTA
const IncomingSignal = () => {
  const [displayText, setDisplayText] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const [isTyping, setIsTyping] = useState(true);
  const fullText = 'COME TEST IT OUT AND WATCH THE POWER OF AI WORK FOR YOU';

  useEffect(() => {
    let charIndex = 0;
    let typeTimer;
    
    const typeNextChar = () => {
      if (charIndex <= fullText.length) {
        setDisplayText(fullText.substring(0, charIndex));
        charIndex++;
        typeTimer = setTimeout(typeNextChar, 60);
      } else {
        setIsTyping(false);
        // Reset after pause
        setTimeout(() => {
          charIndex = 0;
          setDisplayText('');
          setIsTyping(true);
          typeNextChar();
        }, 4000);
      }
    };
    
    typeNextChar();

    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500);

    return () => {
      clearTimeout(typeTimer);
      clearInterval(cursorInterval);
    };
  }, []);

  return (
    <motion.div 
      className="mt-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.2 }}
    >
      {/* Signal container */}
      <div className="relative">
        {/* Incoming signal waves */}
        <div className="absolute -left-8 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1 bg-gradient-to-t from-lime-400 to-cyan-400 rounded-full"
              animate={{
                height: ['8px', '20px', '8px'],
                opacity: [0.4, 1, 0.4],
              }}
              transition={{
                duration: 0.6,
                delay: i * 0.15,
                repeat: Infinity,
              }}
            />
          ))}
        </div>

        {/* Main transmission box */}
        <motion.div
          className="relative px-6 py-4 rounded-lg overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.8) 100%)',
            border: '1px solid rgba(163, 230, 53, 0.5)',
          }}
        >
          {/* Scan line effect */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(180deg, transparent 0%, rgba(163, 230, 53, 0.1) 50%, transparent 100%)',
              backgroundSize: '100% 20px',
            }}
            animate={{
              backgroundPosition: ['0% 0%', '0% 100%'],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'linear',
            }}
          />

          {/* Header */}
          <div className="flex items-center gap-2 mb-2">
            <motion.div
              className="w-2 h-2 rounded-full bg-lime-400"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
            <span className="text-xs font-mono text-lime-400/70 uppercase tracking-widest">
              Incoming Transmission
            </span>
            <div className="flex-1 h-px bg-gradient-to-r from-lime-400/50 to-transparent" />
          </div>

          {/* Message */}
          <div className="font-mono text-sm sm:text-base text-center">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-300 via-emerald-300 to-cyan-300">
              {displayText}
            </span>
            <span className={`text-lime-400 ${showCursor ? 'opacity-100' : 'opacity-0'}`}>█</span>
          </div>

          {/* Signal strength indicator */}
          <div className="flex items-center justify-center gap-1 mt-3">
            <span className="text-xs font-mono text-slate-500">SIGNAL</span>
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                className="w-1 rounded-sm bg-lime-400"
                style={{ height: `${6 + i * 3}px` }}
                animate={{
                  opacity: [0.3, 1, 0.3],
                }}
                transition={{
                  duration: 1.5,
                  delay: i * 0.1,
                  repeat: Infinity,
                }}
              />
            ))}
            <span className="text-xs font-mono text-lime-400 ml-1">STRONG</span>
          </div>
        </motion.div>

        {/* Outgoing signal waves */}
        <div className="absolute -right-8 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1 bg-gradient-to-t from-cyan-400 to-purple-400 rounded-full"
              animate={{
                height: ['8px', '20px', '8px'],
                opacity: [0.4, 1, 0.4],
              }}
              transition={{
                duration: 0.6,
                delay: i * 0.15 + 0.3,
                repeat: Infinity,
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
};

// Main Futuristic Hero Component
export default function FuturisticHero() {
  return (
    <div className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Holographic grid background */}
      <HolographicGrid />

      {/* Ambient glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-lime-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-3xl" />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Text content */}
          <motion.div
            className="text-center lg:text-left"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Holographic badge */}
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
              style={{
                background: 'linear-gradient(135deg, rgba(163, 230, 53, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)',
                border: '1px solid rgba(163, 230, 53, 0.3)',
                boxShadow: '0 0 30px rgba(163, 230, 53, 0.2)',
              }}
              animate={{
                boxShadow: ['0 0 30px rgba(163, 230, 53, 0.2)', '0 0 50px rgba(163, 230, 53, 0.4)', '0 0 30px rgba(163, 230, 53, 0.2)'],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Zap className="w-4 h-4 text-lime-400" />
              <span className="text-sm font-medium text-lime-300">NEXT-GEN AI SPORTS ANALYTICS</span>
            </motion.div>

            {/* Main headline with glow */}
            <h1 className="text-5xl md:text-7xl font-black leading-tight tracking-tighter mb-6">
              <span className="text-white">The Future</span>
              <br />
              <span className="text-white">of </span>
              <motion.span
                className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-lime-400 via-emerald-400 to-cyan-400"
                animate={{
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                }}
                style={{
                  backgroundSize: '200% 200%',
                  textShadow: '0 0 60px rgba(163, 230, 53, 0.5)',
                }}
                transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
              >
                Winning
              </motion.span>
            </h1>

            <p className="text-lg md:text-xl text-slate-300 max-w-xl mx-auto lg:mx-0 mb-8 leading-relaxed">
              Experience the power of <span className="text-purple-400 font-semibold">S.A.L.</span> - our Sports AI Librarian. 
              Advanced neural networks transform chaotic data into precise betting opportunities.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button
                asChild
                size="lg"
                className="group relative overflow-hidden bg-gradient-to-r from-lime-500 to-emerald-500 hover:from-lime-400 hover:to-emerald-400 text-slate-900 font-bold rounded-full px-8"
              >
                <Link to={createPageUrl('Pricing')}>
                  <span className="relative z-10 flex items-center gap-2">
                    Get Started
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>
              </Button>
              
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-purple-500/50 text-purple-300 hover:bg-purple-500/10 hover:text-purple-200 rounded-full px-8"
              >
                <a href="#free-search">
                  Try Free Search
                </a>
              </Button>
            </div>

          </motion.div>

          {/* Right side - S.A.L. Construction */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <SALConstruction />
            <IncomingSignal />
          </motion.div>
        </div>
      </div>
    </div>
  );
}