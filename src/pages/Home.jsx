import React from 'react';
import Hero from '@/components/home/Hero';
import Stats from '@/components/home/Stats';
import Features from '@/components/home/Features';
import AIPicks from '@/components/home/AIPicks';
import DashboardPromo from '@/components/home/DashboardPromo';
import FinalCTA from '@/components/home/FinalCTA';

export default function HomePage() {
  return (
    <>
      <Hero />
      <Stats />
      <Features />
      <AIPicks />
      <DashboardPromo />
      <FinalCTA />
    </>
  );
}