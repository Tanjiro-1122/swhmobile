import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { MoveRight } from 'lucide-react';

export default function HeroSection() {
  return (
    <div className="relative isolate overflow-hidden pt-14">
      <div 
        className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" 
        aria-hidden="true"
      >
        <div 
          className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#804dee] to-[#9089fc] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" 
          style={{
            clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
          }} 
        />
      </div>
      <div className="py-24 sm:py-32 lg:pb-40">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mx-auto max-w-3xl text-center"
          >
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl leading-tight">
              The Ultimate AI-Powered Sports Betting Companion
            </h1>
            <p className="mt-6 text-lg leading-8 text-slate-300">
              Leverage the power of data with our advanced AI analytics. Get comprehensive insights, track player performance, and make smarter betting decisions.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link to={createPageUrl('Dashboard')}>
                <Button size="lg" className="bg-indigo-500 hover:bg-indigo-400 text-white font-semibold shadow-lg">
                  Get started <MoveRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link to={createPageUrl('Pricing')}>
                <Button size="lg" variant="ghost" className="text-white hover:bg-white/10">
                  View pricing <span aria-hidden="true">→</span>
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}