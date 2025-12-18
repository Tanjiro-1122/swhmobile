import React from 'react';
import AgeGate from '../auth/AgeGate';
import DomainChangeBanner from '../DomainChangeBanner';
import TopBar from '../navigation/TopBar';

export default function WebLayout({ children, currentPageName }) {
  if (currentPageName === 'Home') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen w-full bg-slate-900 text-white font-sans">
      <TopBar />
      <main className="pt-16">
          <AgeGate />
          <DomainChangeBanner />
          <div className="p-4 sm:p-6 lg:p-8 max-w-screen-2xl mx-auto">
            {children}
          </div>
      </main>
    </div>
  );
}