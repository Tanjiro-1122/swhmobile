import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Loader2 } from 'lucide-react';
import Hero from '@/components/home/Hero';
import Stats from '@/components/home/Stats';
import Features from '@/components/home/Features';
import DashboardPromo from '@/components/home/DashboardPromo';
import FinalCTA from '@/components/home/FinalCTA';

const FullScreenLoader = () => (
  <div className="fixed inset-0 bg-slate-900 flex items-center justify-center">
    <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
  </div>
);

export default function HomePage() {
  const { data: user, isLoading } = useQuery({
    queryKey: ['currentUserHome'],
    queryFn: () => base44.auth.me().catch(() => null),
    retry: false,
  });

  useEffect(() => {
    if (!isLoading && user) {
      window.location.replace(createPageUrl('Dashboard'));
    }
  }, [user, isLoading]);

  if (isLoading || (!isLoading && user)) {
    return <FullScreenLoader />;
  }
  
  return (
    <>
      <Hero />
      <Stats />
      <Features />
      <DashboardPromo />
      <FinalCTA />
    </>
  );
}