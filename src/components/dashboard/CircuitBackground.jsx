import { motion } from "framer-motion";

const CircuitLine = ({ path, delay = 0, duration = 3 }) => (
  <motion.div
    className="absolute"
    style={{ ...path }}
    initial={{ opacity: 0 }}
    animate={{ opacity: [0, 0.6, 0] }}
    transition={{ 
      duration, 
      delay, 
      repeat: Infinity,
      ease: "easeInOut"
    }}
  >
    <div className="w-full h-full bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
  </motion.div>
);

const GlowOrb = ({ position, color, size, delay }) => (
  <motion.div
    className="absolute rounded-full blur-3xl"
    style={{
      ...position,
      width: size,
      height: size,
      background: color,
    }}
    animate={{
      scale: [1, 1.2, 1],
      opacity: [0.2, 0.4, 0.2],
    }}
    transition={{
      duration: 4,
      delay,
      repeat: Infinity,
      ease: "easeInOut"
    }}
  />
);

const DataNode = ({ x, y, delay }) => (
  <motion.div
    className="absolute w-2 h-2"
    style={{ left: `${x}%`, top: `${y}%` }}
    initial={{ scale: 0, opacity: 0 }}
    animate={{ 
      scale: [0, 1, 1, 0],
      opacity: [0, 1, 1, 0]
    }}
    transition={{
      duration: 2,
      delay,
      repeat: Infinity,
      repeatDelay: 3,
    }}
  >
    <div className="w-full h-full rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
  </motion.div>
);

export default function CircuitBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
      
      {/* Animated gradient orbs */}
      <GlowOrb 
        position={{ top: '-10%', left: '-5%' }} 
        color="radial-gradient(circle, rgba(139,92,246,0.3) 0%, transparent 70%)" 
        size="600px" 
        delay={0} 
      />
      <GlowOrb 
        position={{ bottom: '-15%', right: '-10%' }} 
        color="radial-gradient(circle, rgba(6,182,212,0.25) 0%, transparent 70%)" 
        size="700px" 
        delay={1.5} 
      />
      <GlowOrb 
        position={{ top: '40%', left: '50%' }} 
        color="radial-gradient(circle, rgba(236,72,153,0.15) 0%, transparent 70%)" 
        size="500px" 
        delay={3} 
      />

      {/* Circuit grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(6,182,212,0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(6,182,212,0.5) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Animated horizontal circuit lines */}
      <CircuitLine path={{ top: '20%', left: 0, width: '100%', height: '1px' }} delay={0} duration={4} />
      <CircuitLine path={{ top: '45%', left: 0, width: '100%', height: '1px' }} delay={1.5} duration={5} />
      <CircuitLine path={{ top: '70%', left: 0, width: '100%', height: '1px' }} delay={3} duration={4.5} />

      {/* Animated vertical circuit lines */}
      <CircuitLine path={{ top: 0, left: '25%', width: '1px', height: '100%' }} delay={0.5} duration={4} />
      <CircuitLine path={{ top: 0, left: '75%', width: '1px', height: '100%' }} delay={2} duration={5} />

      {/* Data nodes */}
      <DataNode x={25} y={20} delay={0} />
      <DataNode x={75} y={45} delay={1} />
      <DataNode x={25} y={70} delay={2} />
      <DataNode x={75} y={20} delay={3} />
      <DataNode x={50} y={45} delay={4} />

      {/* Diagonal accent lines */}
      <motion.div
        className="absolute top-0 right-0 w-[600px] h-[1px] origin-top-right rotate-45 bg-gradient-to-r from-transparent via-purple-500/20 to-transparent"
        animate={{ opacity: [0.1, 0.3, 0.1] }}
        transition={{ duration: 3, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-0 left-0 w-[600px] h-[1px] origin-bottom-left -rotate-45 bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent"
        animate={{ opacity: [0.1, 0.3, 0.1] }}
        transition={{ duration: 3, delay: 1.5, repeat: Infinity }}
      />

      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-32 h-32">
        <svg className="w-full h-full text-cyan-500/20" viewBox="0 0 100 100">
          <path d="M0 30 L0 0 L30 0" fill="none" stroke="currentColor" strokeWidth="1" />
          <circle cx="0" cy="30" r="3" fill="currentColor" />
          <circle cx="30" cy="0" r="3" fill="currentColor" />
        </svg>
      </div>
      <div className="absolute bottom-0 right-0 w-32 h-32 rotate-180">
        <svg className="w-full h-full text-purple-500/20" viewBox="0 0 100 100">
          <path d="M0 30 L0 0 L30 0" fill="none" stroke="currentColor" strokeWidth="1" />
          <circle cx="0" cy="30" r="3" fill="currentColor" />
          <circle cx="30" cy="0" r="3" fill="currentColor" />
        </svg>
      </div>
    </div>
  );
}