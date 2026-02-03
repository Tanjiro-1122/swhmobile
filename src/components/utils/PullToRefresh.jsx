import React, { useState, useRef, useCallback } from "react";
import { RefreshCw } from "lucide-react";
import { motion, useAnimation } from "framer-motion";

const PULL_THRESHOLD = 80;
const MAX_PULL = 120;

export default function PullToRefresh({ onRefresh, children, className = "" }) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const containerRef = useRef(null);
  const controls = useAnimation();

  const handleTouchStart = useCallback((e) => {
    if (containerRef.current?.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
    }
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (isRefreshing) return;
    if (containerRef.current?.scrollTop > 0) {
      setPullDistance(0);
      return;
    }

    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;

    if (diff > 0) {
      // Apply resistance to make it feel more native
      const resistance = 0.4;
      const adjustedDiff = Math.min(diff * resistance, MAX_PULL);
      setPullDistance(adjustedDiff);
    }
  }, [isRefreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (isRefreshing) return;

    if (pullDistance >= PULL_THRESHOLD) {
      setIsRefreshing(true);
      controls.start({ rotate: 360 });
      
      try {
        await onRefresh?.();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
        controls.stop();
      }
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, isRefreshing, onRefresh, controls]);

  const progress = Math.min(pullDistance / PULL_THRESHOLD, 1);
  const showIndicator = pullDistance > 10 || isRefreshing;

  return (
    <div 
      ref={containerRef}
      className={`relative overflow-auto ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ 
        WebkitOverflowScrolling: "touch",
        overscrollBehavior: "contain"
      }}
    >
      {/* Pull indicator */}
      <motion.div
        className="absolute left-1/2 -translate-x-1/2 z-50 flex items-center justify-center"
        style={{
          top: Math.max(pullDistance - 40, -40),
          opacity: showIndicator ? 1 : 0,
        }}
        animate={{ 
          opacity: showIndicator ? 1 : 0,
          scale: isRefreshing ? 1 : progress 
        }}
        transition={{ duration: 0.2 }}
      >
        <motion.div
          className={`w-10 h-10 rounded-full flex items-center justify-center ${
            isRefreshing 
              ? "bg-purple-500" 
              : pullDistance >= PULL_THRESHOLD 
                ? "bg-purple-500" 
                : "bg-slate-700"
          }`}
          animate={isRefreshing ? { rotate: 360 } : { rotate: progress * 180 }}
          transition={isRefreshing ? { duration: 1, repeat: Infinity, ease: "linear" } : { duration: 0 }}
        >
          <RefreshCw className="w-5 h-5 text-white" />
        </motion.div>
      </motion.div>

      {/* Content with pull offset */}
      <motion.div
        animate={{ y: isRefreshing ? 50 : pullDistance > 0 ? pullDistance : 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      >
        {children}
      </motion.div>
    </div>
  );
}