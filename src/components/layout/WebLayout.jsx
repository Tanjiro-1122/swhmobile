import React, { useEffect, useRef } from 'react';
import AgeGate from '../auth/AgeGate';
import DomainChangeBanner from '../DomainChangeBanner';
import TopBar from '../navigation/TopBar';
import SportsTicker from '../widgets/SportsTicker';
import { motion } from 'framer-motion';

const AuroraBackground = () => {
  const ref = useRef(null);

  useEffect(() => {
    const onMouseMove = (e) => {
      if (ref.current) {
        ref.current.style.setProperty('--x', `${e.clientX}px`);
        ref.current.style.setProperty('--y', `${e.clientY}px`);
      }
    };

    window.addEventListener('mousemove', onMouseMove);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  return <div ref={ref} className="aurora-background absolute inset-0 -z-10 transition-all"></div>;
};

export default function WebLayout({ children, currentPageName }) {
  if (currentPageName === 'Home') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen w-full bg-black text-white font-sans isolate">
      <AuroraBackground />
      <TopBar />
      <SportsTicker />
      <motion.main 
        key={currentPageName}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="pt-6"
      >
        <AgeGate />
        <DomainChangeBanner />
        <div className="p-4 sm:p-6 lg:p-8 max-w-screen-2xl mx-auto">
          {children}
        </div>
      </motion.main>
    </div>
  );
}