import React from 'react';
import { LiveMarketTicker } from '@/components/widgets/LiveMarketTicker';
import Hero from '@/components/home/Hero';
import Stats from '@/components/home/Stats';
import Features from '@/components/home/Features';
import DashboardPromo from '@/components/home/DashboardPromo';
import FinalCTA from '@/components/home/FinalCTA';

export default function HomePage() {
  return (
    <>
      <LiveMarketTicker />
      <Hero />
      <Stats />
      <Features />
      <DashboardPromo />
      <FinalCTA />
    </>
  );
}