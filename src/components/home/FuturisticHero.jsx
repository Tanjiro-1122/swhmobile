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

// S.A.L. Being Built Animation
const SALConstruction = () => {
  const [buildPhase, setBuildPhase] = useState(0);
  const [glitchText, setGlitchText] = useState('');
  const buildTexts = [
    'INITIALIZING NEURAL CORE...',
    'LOADING SPORTS ALGORITHMS...',
    'CALIBRATING PREDICTION ENGINE...',
    'ACTIVATING S.A.L. PROTOCOL...',
    'SYSTEM ONLINE'
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setBuildPhase(prev => (prev + 1) % 5);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let i = 0;
    const text = buildTexts[buildPhase];
    const typeInterval = setInterval(() => {
      setGlitchText(text.slice(0, i) + (i < text.length ? '█' : ''));
      i++;
      if (i > text.length) clearInterval(typeInterval);
    }, 50);
    return () => clearInterval(typeInterval);
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

        {/* S.A.L. Image with construction effect */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="relative"
            animate={{
              y: [0, -8, 0],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            {/* Glowing backdrop */}
            <motion.div
              className="absolute inset-0 rounded-3xl blur-2xl"
              style={{
                background: 'radial-gradient(circle, rgba(163, 230, 53, 0.4) 0%, rgba(168, 85, 247, 0.2) 50%, transparent 70%)',
              }}
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />

            {/* Construction wireframe effect */}
            <AnimatePresence mode="wait">
              <motion.div
                key={buildPhase}
                className="relative"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                transition={{ duration: 0.5 }}
              >
                {/* Wireframe overlay during construction */}
                {buildPhase < 4 && (
                  <motion.div
                    className="absolute inset-0 z-20 rounded-2xl overflow-hidden"
                    style={{
                      background: `repeating-linear-gradient(
                        0deg,
                        transparent,
                        transparent 8px,
                        rgba(163, 230, 53, 0.1) 8px,
                        rgba(163, 230, 53, 0.1) 9px
                      )`,
                    }}
                    animate={{
                      opacity: [0.8, 0.4, 0.8],
                    }}
                    transition={{
                      duration: 0.5,
                      repeat: Infinity,
                    }}
                  />
                )}

                <img
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f93544702b554e3e1f7297/e6d91dd0c_AfriendlyrobotowlmascotwithpurpleandlimegreenaccentswearingstylishglassesholdinganopenglowingbookwithalightbulbaboveitsheadSportswhistlearoundneckModernvectorstyledarkbackgrou.jpg"
                  alt="S.A.L. - Sports AI Librarian"
                  className="w-32 h-32 sm:w-40 sm:h-40 rounded-2xl relative z-10 object-cover"
                  style={{
                    filter: buildPhase < 4 ? `saturate(${0.3 + buildPhase * 0.2}) brightness(${0.7 + buildPhase * 0.1})` : 'none',
                    border: '2px solid rgba(163, 230, 53, 0.6)',
                    boxShadow: '0 0 40px rgba(163, 230, 53, 0.5), 0 0 80px rgba(168, 85, 247, 0.3)',
                  }}
                />
              </motion.div>
            </AnimatePresence>

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

// Floating Holographic Stats
const HolographicStats = () => {
  const stats = [
    { label: 'AI Accuracy', value: '94.2%', color: 'lime' },
    { label: 'Predictions', value: '15K+', color: 'purple' },
    { label: 'Live Data', value: 'SYNC', color: 'cyan' },
  ];

  return (
    <div className="flex flex-wrap justify-center gap-4 mt-8">
      {stats.map((stat, i) => (
        <motion.div
          key={i}
          className="relative px-6 py-3 rounded-lg"
          style={{
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.7) 100%)',
            border: `1px solid ${stat.color === 'lime' ? 'rgba(163, 230, 53, 0.4)' : stat.color === 'purple' ? 'rgba(168, 85, 247, 0.4)' : 'rgba(34, 211, 238, 0.4)'}`,
            boxShadow: `0 0 20px ${stat.color === 'lime' ? 'rgba(163, 230, 53, 0.2)' : stat.color === 'purple' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(34, 211, 238, 0.2)'}`,
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 + i * 0.2 }}
          whileHover={{ scale: 1.05, y: -5 }}
        >
          <div className={`text-2xl font-black ${stat.color === 'lime' ? 'text-lime-400' : stat.color === 'purple' ? 'text-purple-400' : 'text-cyan-400'}`}>
            {stat.value}
          </div>
          <div className="text-xs text-slate-400 uppercase tracking-wider">{stat.label}</div>
        </motion.div>
      ))}
    </div>
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

            {/* Social proof */}
            <div className="flex items-center justify-center lg:justify-start gap-3 mt-8">
              <div className="flex -space-x-2">
                {[
                  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&crop=face',
                  'https://images.unsplash.com/photo-1531746020798-1b1580858f91?w=64&h=64&fit=crop&crop=face',
                  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=64&h=64&fit=crop&crop=face',
                ].map((src, i) => (
                  <img
                    key={i}
                    className="w-8 h-8 rounded-full ring-2 ring-slate-900"
                    src={src}
                    alt=""
                  />
                ))}
              </div>
              <p className="text-sm text-slate-400">
                <span className="font-bold text-white">15,000+</span> Smart Money Bettors
              </p>
            </div>
          </motion.div>

          {/* Right side - S.A.L. Construction */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <SALConstruction />
            <HolographicStats />
          </motion.div>
        </div>
      </div>
    </div>
  );
}