import React from 'react';
import { motion } from 'framer-motion';

const AnimatedAIGraphic = () => {
  // Animated floating orbs/nodes representing AI neural network
  const nodes = [
    { x: '20%', y: '30%', size: 8, delay: 0 },
    { x: '80%', y: '25%', size: 6, delay: 0.5 },
    { x: '50%', y: '15%', size: 10, delay: 0.2 },
    { x: '30%', y: '70%', size: 7, delay: 0.7 },
    { x: '70%', y: '75%', size: 9, delay: 0.3 },
    { x: '15%', y: '50%', size: 5, delay: 0.9 },
    { x: '85%', y: '55%', size: 6, delay: 0.4 },
    { x: '50%', y: '50%', size: 14, delay: 0, isCenter: true },
  ];

  const connections = [
    { from: 0, to: 7 },
    { from: 1, to: 7 },
    { from: 2, to: 7 },
    { from: 3, to: 7 },
    { from: 4, to: 7 },
    { from: 5, to: 7 },
    { from: 6, to: 7 },
    { from: 0, to: 2 },
    { from: 1, to: 2 },
    { from: 3, to: 5 },
    { from: 4, to: 6 },
  ];

  return (
    <div className="relative w-full aspect-square max-w-lg mx-auto">
      {/* Outer glow ring */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(163, 230, 53, 0.15) 0%, transparent 70%)',
        }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Inner container with grid */}
      <div className="absolute inset-8 rounded-3xl bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 overflow-hidden">
        {/* Animated grid lines */}
        <svg className="absolute inset-0 w-full h-full opacity-20">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(163, 230, 53, 0.3)" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* Connection lines */}
        <svg className="absolute inset-0 w-full h-full">
          {connections.map((conn, i) => (
            <motion.line
              key={i}
              x1={nodes[conn.from].x}
              y1={nodes[conn.from].y}
              x2={nodes[conn.to].x}
              y2={nodes[conn.to].y}
              stroke="rgba(163, 230, 53, 0.3)"
              strokeWidth="1"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: [0.2, 0.5, 0.2] }}
              transition={{
                pathLength: { duration: 2, delay: i * 0.1 },
                opacity: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
              }}
            />
          ))}
        </svg>

        {/* Animated nodes */}
        {nodes.map((node, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              left: node.x,
              top: node.y,
              width: node.size * 2,
              height: node.size * 2,
              marginLeft: -node.size,
              marginTop: -node.size,
              background: node.isCenter
                ? 'linear-gradient(135deg, #a3e635, #65a30d)'
                : 'rgba(163, 230, 53, 0.8)',
              boxShadow: node.isCenter
                ? '0 0 30px rgba(163, 230, 53, 0.6), 0 0 60px rgba(163, 230, 53, 0.3)'
                : '0 0 10px rgba(163, 230, 53, 0.4)',
            }}
            animate={{
              scale: node.isCenter ? [1, 1.2, 1] : [1, 1.3, 1],
              opacity: [0.7, 1, 0.7],
              y: node.isCenter ? [0, -5, 0] : [0, -8, 0],
            }}
            transition={{
              duration: node.isCenter ? 3 : 2 + Math.random(),
              delay: node.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}

        {/* Center logo */}
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
          animate={{
            y: [0, -10, 0],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <div className="relative">
            <motion.div
              className="absolute inset-0 rounded-2xl bg-lime-400/20 blur-xl"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f93544702b554e3e1f7297/e6d91dd0c_AfriendlyrobotowlmascotwithpurpleandlimegreenaccentswearingstylishglassesholdinganopenglowingbookwithalightbulbaboveitsheadSportswhistlearoundneckModernvectorstyledarkbackgrou.jpg"
              alt="SAPL - Sports AI Prediction Librarian"
              className="w-24 h-24 rounded-2xl relative z-10 border-2 border-lime-400/50 object-cover"
            />
          </div>
        </motion.div>

        {/* Floating data points */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={`data-${i}`}
            className="absolute text-xs font-mono text-lime-400/60"
            style={{
              left: `${15 + Math.random() * 70}%`,
              top: `${15 + Math.random() * 70}%`,
            }}
            animate={{
              opacity: [0, 0.8, 0],
              y: [10, -20],
            }}
            transition={{
              duration: 3,
              delay: i * 0.8,
              repeat: Infinity,
              ease: 'easeOut',
            }}
          >
            {['94.2%', '+EV', 'LIVE', 'AI', '↑', '✓'][i]}
          </motion.div>
        ))}
      </div>

      {/* Pulsing rings */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={`ring-${i}`}
          className="absolute inset-0 rounded-full border border-lime-400/20"
          animate={{
            scale: [1, 1.5],
            opacity: [0.5, 0],
          }}
          transition={{
            duration: 3,
            delay: i * 1,
            repeat: Infinity,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  );
};

export default AnimatedAIGraphic;