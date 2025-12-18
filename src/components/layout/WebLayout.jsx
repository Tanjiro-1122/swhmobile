import React from 'react';
import AgeGate from '../auth/AgeGate';
import DomainChangeBanner from '../DomainChangeBanner';
import TopBar from '../navigation/TopBar';
import { motion } from 'framer-motion';

export default function WebLayout({ children, currentPageName }) {
  if (currentPageName === 'Home') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen w-full bg-slate-900 text-white font-sans isolate">
      {/* Fancy background */}
      <div className="absolute inset-0 -z-10 h-full w-full bg-slate-900 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-10"></div>
      <div 
        className="absolute bottom-0 left-0 right-0 top-0 bg-[radial-gradient(circle_500px_at_50%_200px,#3e3e5b,transparent)] opacity-50 -z-10"
      ></div>

      <TopBar />
      <motion.main 
        key={currentPageName}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="pt-16"
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