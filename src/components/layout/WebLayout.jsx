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
  const isHomePage = currentPageName === 'Home';

  return (
    <div className={`min-h-screen w-full bg-slate-900 text-white font-sans isolate ${isHomePage ? 'bg-grid-dark' : ''}`}>
      {!isHomePage && <AuroraBackground />}
      <TopBar />
      <SportsTicker />
      <AgeGate />
      <DomainChangeBanner />
      <motion.main
        key={currentPageName}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35, ease: 'easeInOut' }}
        className={`${isHomePage ? '' : 'pt-28 pb-12 container mx-auto px-4 sm:px-6 lg:px-8'}`} 
      >
        {children}
      </motion.main>
    </div>
  );
}