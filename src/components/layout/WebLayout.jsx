import React from 'react';
import AgeGate from '../auth/AgeGate';
import DomainChangeBanner from '../DomainChangeBanner';
import TopBar from '../navigation/TopBar';
import SportsTicker from '../widgets/SportsTicker';
import { motion } from 'framer-motion';

export default function WebLayout({ children, currentPageName }) {
  if (currentPageName === 'Home') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen w-full bg-slate-900 text-white font-sans isolate">
      {/* Fancy background from screenshot */}
      <div className="absolute inset-0 -z-10 h-full w-full bg-[#0d1224] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>

      <TopBar />
      <SportsTicker />
      <motion.main 
        key={currentPageName}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="pt-4"
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