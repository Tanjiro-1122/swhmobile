import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { createPageUrl } from '@/utils';
import { ArrowRight, Zap } from 'lucide-react';
import FuturisticButton from '@/components/ui/FuturisticButton';

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

// S.A.L. Computer Boot Sequence Animation
const BUILD_TEXTS = [
  'INITIALIZING NEURAL CORE...',
  'LOADING SPORTS DATABASE...',
  'CALIBRATING PREDICTION ENGINE...',
  'CONNECTING TO S.A.L....',
  'S.A.L. ONLINE'
];

const SALConstruction = () => {
  const [buildPhase, setBuildPhase] = useState(0);
  const [glitchText, setGlitchText] = useState('');
  const [eyesAwake, setEyesAwake] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setBuildPhase(prev => {
        const next = (prev + 1) % 5;
        if (next === 4) {
          // When reaching "S.A.L. ONLINE", trigger eye awakening after text finishes
          setTimeout(() => setEyesAwake(true), 1500);
        }
        if (next === 0) {
          setEyesAwake(false); // Reset for next cycle
        }
        return next;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let charIdx = 0;
    const text = BUILD_TEXTS[buildPhase];
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

  const isOnline = buildPhase === 4;

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

        {/* Main Display Area */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="relative w-44 h-44 sm:w-52 sm:h-52"
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <svg viewBox="0 0 120 120" className="w-full h-full relative z-10">
              {/* Computer Monitor Frame */}
              <motion.rect
                x="15"
                y="10"
                width="90"
                height="70"
                rx="4"
                fill="rgba(15, 23, 42, 0.95)"
                stroke="rgba(163, 230, 53, 0.8)"
                strokeWidth="2"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              />
              
              {/* Monitor inner screen */}
              <motion.rect
                x="20"
                y="15"
                width="80"
                height="60"
                rx="2"
                fill="rgba(30, 41, 59, 0.9)"
                stroke="rgba(168, 85, 247, 0.5)"
                strokeWidth="1"
              />
              
              {/* Monitor stand */}
              <motion.rect
                x="50"
                y="80"
                width="20"
                height="12"
                fill="rgba(30, 41, 59, 0.9)"
                stroke="rgba(163, 230, 53, 0.6)"
                strokeWidth="1"
              />
              <motion.rect
                x="40"
                y="92"
                width="40"
                height="6"
                rx="2"
                fill="rgba(30, 41, 59, 0.9)"
                stroke="rgba(163, 230, 53, 0.6)"
                strokeWidth="1"
              />
              
              {/* Cable connecting to S.A.L. */}
              <motion.path
                d="M 105 45 Q 115 45 115 55 Q 115 65 105 70"
                fill="none"
                stroke="rgba(168, 85, 247, 0.8)"
                strokeWidth="2"
                strokeDasharray="4 2"
                animate={{ strokeDashoffset: [0, -12] }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
              
              {/* Data pulse through cable */}
              <motion.circle
                r="3"
                fill="rgba(34, 211, 238, 0.9)"
                animate={{
                  offsetDistance: ['0%', '100%'],
                  opacity: [0, 1, 1, 0],
                }}
                style={{
                  offsetPath: 'path("M 105 45 Q 115 45 115 55 Q 115 65 105 70")',
                }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              />

              {/* S.A.L. Owl - Initially dim, wakes up when online */}
              <motion.g
                initial={{ opacity: 0.3 }}
                animate={{ opacity: eyesAwake ? 1 : 0.4 }}
                transition={{ duration: 0.5 }}
              >
                {/* Owl body silhouette in screen */}
                <motion.ellipse
                  cx="60"
                  cy="52"
                  rx="22"
                  ry="20"
                  fill="rgba(15, 23, 42, 0.8)"
                  stroke={eyesAwake ? "rgba(163, 230, 53, 0.9)" : "rgba(100, 100, 100, 0.5)"}
                  strokeWidth="1.5"
                  animate={{
                    stroke: eyesAwake 
                      ? ["rgba(163, 230, 53, 0.9)", "rgba(168, 85, 247, 0.9)", "rgba(163, 230, 53, 0.9)"]
                      : "rgba(100, 100, 100, 0.5)"
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                
                {/* Ear tufts */}
                <path 
                  d="M 42 38 L 46 48 L 38 44 Z" 
                  fill="none" 
                  stroke={eyesAwake ? "rgba(163, 230, 53, 0.8)" : "rgba(100, 100, 100, 0.4)"} 
                  strokeWidth="1.5" 
                />
                <path 
                  d="M 78 38 L 74 48 L 82 44 Z" 
                  fill="none" 
                  stroke={eyesAwake ? "rgba(163, 230, 53, 0.8)" : "rgba(100, 100, 100, 0.4)"} 
                  strokeWidth="1.5" 
                />
                
                {/* Left eye socket */}
                <circle 
                  cx="50" 
                  cy="48" 
                  r="8" 
                  fill="none" 
                  stroke={eyesAwake ? "rgba(34, 211, 238, 0.9)" : "rgba(60, 60, 60, 0.5)"} 
                  strokeWidth="1.5" 
                />
                {/* Left eye - awakens */}
                <motion.circle 
                  cx="50" 
                  cy="48" 
                  r="4"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ 
                    scale: eyesAwake ? 1 : 0,
                    opacity: eyesAwake ? 1 : 0,
                    fill: eyesAwake 
                      ? ["rgba(34, 211, 238, 0.6)", "rgba(34, 211, 238, 1)", "rgba(34, 211, 238, 0.6)"]
                      : "rgba(34, 211, 238, 0)"
                  }}
                  transition={{ 
                    scale: { duration: 0.3, type: 'spring' },
                    fill: { duration: 1.5, repeat: Infinity, delay: 0.3 }
                  }}
                />
                {/* Left eye glow */}
                {eyesAwake && (
                  <motion.circle 
                    cx="50" 
                    cy="48" 
                    r="6"
                    fill="none"
                    stroke="rgba(34, 211, 238, 0.5)"
                    strokeWidth="2"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: [1, 1.5, 1], opacity: [0.8, 0, 0.8] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
                
                {/* Right eye socket */}
                <circle 
                  cx="70" 
                  cy="48" 
                  r="8" 
                  fill="none" 
                  stroke={eyesAwake ? "rgba(34, 211, 238, 0.9)" : "rgba(60, 60, 60, 0.5)"} 
                  strokeWidth="1.5" 
                />
                {/* Right eye - awakens */}
                <motion.circle 
                  cx="70" 
                  cy="48" 
                  r="4"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ 
                    scale: eyesAwake ? 1 : 0,
                    opacity: eyesAwake ? 1 : 0,
                    fill: eyesAwake 
                      ? ["rgba(34, 211, 238, 0.6)", "rgba(34, 211, 238, 1)", "rgba(34, 211, 238, 0.6)"]
                      : "rgba(34, 211, 238, 0)"
                  }}
                  transition={{ 
                    scale: { duration: 0.3, type: 'spring', delay: 0.1 },
                    fill: { duration: 1.5, repeat: Infinity, delay: 0.5 }
                  }}
                />
                {/* Right eye glow */}
                {eyesAwake && (
                  <motion.circle 
                    cx="70" 
                    cy="48" 
                    r="6"
                    fill="none"
                    stroke="rgba(34, 211, 238, 0.5)"
                    strokeWidth="2"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: [1, 1.5, 1], opacity: [0.8, 0, 0.8] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.2 }}
                  />
                )}
                
                {/* Beak */}
                <path 
                  d="M 57 56 L 60 63 L 63 56 Z" 
                  fill={eyesAwake ? "rgba(251, 191, 36, 0.8)" : "rgba(100, 100, 100, 0.4)"}
                  stroke={eyesAwake ? "rgba(251, 191, 36, 1)" : "rgba(100, 100, 100, 0.5)"} 
                  strokeWidth="0.5" 
                />
                
                {/* Glasses bridge */}
                <line 
                  x1="58" 
                  y1="48" 
                  x2="62" 
                  y2="48" 
                  stroke={eyesAwake ? "rgba(168, 85, 247, 0.9)" : "rgba(80, 80, 80, 0.4)"} 
                  strokeWidth="1.5" 
                />
              </motion.g>
              
              {/* Power indicator LED on monitor */}
              <motion.circle
                cx="100"
                cy="75"
                r="2"
                fill={isOnline ? "rgba(163, 230, 53, 1)" : "rgba(251, 191, 36, 0.8)"}
                animate={{
                  opacity: isOnline ? 1 : [0.5, 1, 0.5],
                  boxShadow: isOnline 
                    ? "0 0 10px rgba(163, 230, 53, 0.8)" 
                    : "0 0 5px rgba(251, 191, 36, 0.5)"
                }}
                transition={{ duration: 1, repeat: isOnline ? 0 : Infinity }}
              />
              
              {/* "S.A.L." label when online */}
              {eyesAwake && (
                <motion.text
                  x="60"
                  y="18"
                  textAnchor="middle"
                  fill="rgba(163, 230, 53, 0.9)"
                  fontSize="6"
                  fontFamily="monospace"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  S.A.L. ACTIVE
                </motion.text>
              )}
              
              {/* Energy burst when coming online */}
              {eyesAwake && [...Array(8)].map((_, i) => (
                <motion.line
                  key={i}
                  x1="60"
                  y1="50"
                  x2={60 + Math.cos((i * Math.PI * 2) / 8) * 35}
                  y2={50 + Math.sin((i * Math.PI * 2) / 8) * 35}
                  stroke="rgba(163, 230, 53, 0.6)"
                  strokeWidth="1"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: [0, 1, 0], opacity: [0, 0.8, 0] }}
                  transition={{ duration: 1, delay: i * 0.05 }}
                />
              ))}
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
        </div>

        {/* Status text at bottom */}
        <div className="absolute bottom-4 left-4 right-4">
          <motion.div
            className="font-mono text-xs sm:text-sm text-center"
            style={{ 
              color: isOnline && eyesAwake ? '#a3e635' : '#94a3b8',
              textShadow: isOnline && eyesAwake ? '0 0 15px rgba(163, 230, 53, 1)' : '0 0 5px rgba(163, 230, 53, 0.5)'
            }}
          >
            {glitchText}
          </motion.div>
          
          {/* Progress bar */}
          <div className="mt-2 h-1 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full"
              style={{
                background: isOnline 
                  ? 'linear-gradient(90deg, #a3e635, #22d3ee, #a855f7)' 
                  : 'linear-gradient(90deg, #475569, #64748b)'
              }}
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
  const [_isTyping, setIsTyping] = useState(true);
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
              <span className="text-sm font-medium text-lime-300">THE EVOLUTION IN SPORTS BETTING</span>
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
              <FuturisticButton
                to={createPageUrl('Pricing')}
                size="lg"
                variant="primary"
                icon={<ArrowRight className="w-5 h-5" />}
              >
                Get Started
              </FuturisticButton>
              
              <FuturisticButton
                href="#free-search"
                size="lg"
                variant="cyber"
              >
                Try Free Search
              </FuturisticButton>
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