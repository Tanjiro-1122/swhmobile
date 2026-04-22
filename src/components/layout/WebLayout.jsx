import { useEffect, useRef } from 'react';
import AgeGate from '../auth/AgeGate';
import DomainChangeBanner from '../DomainChangeBanner';
import TopBar from '../navigation/TopBar';
import { motion } from 'framer-motion';
import Footer from './Footer';
import SalFloatingButton from '../assistant/SalFloatingButton';
import WhatsAppButton from '../widgets/WhatsAppButton';

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
    return () => window.removeEventListener('mousemove', onMouseMove);
  }, []);
  return <div ref={ref} className="aurora-background absolute inset-0 -z-10 transition-all" />;
};

// Pages that manage their own full-screen layout (have sidebar built-in)
const FULL_SCREEN_PAGES = ['Dashboard', 'AskSAL', 'Home'];

export default function WebLayout({ children, currentPageName }) {
  const isHome = currentPageName === 'Home';
  const isFullScreen = FULL_SCREEN_PAGES.includes(currentPageName);
  const isSAL = currentPageName === 'AskSAL';

  return (
    <div className="min-h-screen w-full bg-slate-900 text-white font-sans isolate">
      {!isFullScreen && <AuroraBackground />}
      
      {/* TopBar only for non-full-screen pages */}
      {!isFullScreen && <TopBar />}

      <AgeGate />
      <DomainChangeBanner />

      <motion.main
        key={currentPageName}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className={isFullScreen ? 'block' : `block ${isHome ? 'pt-20' : 'pt-28 pb-12 container mx-auto px-4 sm:px-6 lg:px-8'}`}
      >
        {children}
      </motion.main>

      {!isFullScreen && !isHome && <Footer />}
      {!isFullScreen && !isSAL && <SalFloatingButton />}
      <WhatsAppButton />
    </div>
  );
}
