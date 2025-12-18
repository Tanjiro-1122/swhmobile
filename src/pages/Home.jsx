import React from 'react';
import HeroSection from '../components/home/HeroSection';
import FeaturesSection from '../components/home/FeaturesSection';
import AccountTiersSection from '../components/home/AccountTiersSection';
import CtaSection from '../components/home/CtaSection';
import Footer from '../components/layout/Footer';

export default function Home() {
  return (
    <div className="bg-slate-900 text-white">
      <HeroSection />
      <FeaturesSection />
      <AccountTiersSection />
      <CtaSection />
      <Footer />
    </div>
  );
}