import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { Bot, PlayCircle, Users, Star, TrendingUp, BarChart } from 'lucide-react';
import { Button } from '@/components/ui/button';

const HomeHeader = () => (
  <header className="absolute top-0 left-0 right-0 z-20 py-4 px-4 sm:px-6 lg:px-12">
    <div className="max-w-[1600px] mx-auto flex justify-between items-center">
      <Link to={createPageUrl('Home')} className="flex items-center gap-3">
        <div className="w-9 h-9 bg-[hsl(var(--brand-accent))] rounded-lg flex items-center justify-center">
            <BarChart className="w-6 h-6 text-black" />
        </div>
        <span className="font-bold text-xl text-white">SportWagerHelper</span>
      </Link>
      <nav className="hidden md:flex items-center gap-8">
        <Link to={createPageUrl('AnalysisHub')} className="text-slate-300 hover:text-white transition text-sm font-medium">Analysis</Link>
        <Link to={createPageUrl('DailyBriefs')} className="text-slate-300 hover:text-white transition text-sm font-medium">Predictions</Link>
        <Link to={createPageUrl('Pricing')} className="text-slate-300 hover:text-white transition text-sm font-medium">Pricing</Link>
      </nav>
      <div>
        <Link to={createPageUrl('Dashboard')}>
          <Button className="bg-[hsl(var(--brand-accent))] text-black font-bold hover:bg-[hsl(var(--brand-accent)/0.8)] transition-all duration-300 rounded-full px-6">Get Started</Button>
        </Link>
      </div>
    </div>
  </header>
);

const AnimatedBotCard = () => (
  <div className="relative w-full h-full flex items-center justify-center">
    <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
        className="relative w-[400px] h-[400px] lg:w-[500px] lg:h-[500px]"
    >
      {/* Main Glass Card */}
      <div className="absolute inset-0 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-2xl"></div>
      
      {/* Bot Icon */}
      <motion.div 
        className="absolute inset-0 flex items-center justify-center animate-float"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5}}
      >
        <Bot className="w-48 h-48 lg:w-64 lg:h-64 text-[hsl(var(--brand-accent))]" strokeWidth={1} />
      </motion.div>
      
       {/* Glowing effect */}
      <motion.div 
        className="absolute inset-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 lg:w-80 lg:h-80 bg-[hsl(var(--brand-accent))] rounded-full blur-[100px] lg:blur-[150px] lime-glow opacity-60"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        transition={{ delay: 0.5, duration: 1 }}
      >
      </motion.div>

      {/* Accuracy Card */}
      <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, type: 'spring', stiffness: 100 }}
          className="absolute bottom-10 -right-10 flex items-center gap-3 px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl"
      >
          <div className="w-10 h-10 rounded-full bg-[hsl(var(--brand-accent)/0.2)] flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-[hsl(var(--brand-accent))]" />
          </div>
          <div>
            <p className="text-white font-bold text-lg">+84.2%</p>
            <p className="text-slate-300 text-xs">Accuracy</p>
          </div>
      </motion.div>
    </motion.div>
  </div>
);


export default function HomePage() {
  return (
    <div className="relative min-h-screen w-full bg-black text-white overflow-hidden">
        <div className="absolute inset-0 bg-grid-dark [mask-image:linear-gradient(to_bottom,white_5%,transparent_100%)]"></div>
        <div 
            className="absolute inset-0 -z-10"
            style={{
                backgroundImage: 'radial-gradient(circle at 15% 25%, hsl(var(--brand-accent) / 0.1), transparent 30%), radial-gradient(circle at 85% 75%, hsl(240 100% 50% / 0.1), transparent 30%)'
            }}
        />
        <HomeHeader />

        <main className="relative z-10 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-40 pb-20">
            <div className="grid md:grid-cols-2 gap-12 items-center">
                {/* Left Side: Hero Text */}
                <motion.div 
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                >
                    <h1 className="text-5xl lg:text-7xl font-black tracking-tighter mb-6 leading-tight">
                        Bet Smarter with <br/>
                        <span className="text-[hsl(var(--brand-accent))]">Artificial Intelligence</span>
                    </h1>
                    <p className="text-lg lg:text-xl text-slate-300 max-w-lg mb-10">
                        Stop guessing. Our AI analyzes millions of data points, team history, and real-time odds to give you the mathematical edge in every wager.
                    </p>
                    <div className="flex flex-wrap items-center gap-4 mb-10">
                        <Link to={createPageUrl('Dashboard')}>
                            <Button size="lg" className="bg-[hsl(var(--brand-accent))] text-black font-bold hover:bg-[hsl(var(--brand-accent)/0.8)] transition-all duration-300 rounded-full px-8 py-6 text-base">
                                Start Winning Now
                            </Button>
                        </Link>
                        <Button variant="ghost" size="lg" className="flex items-center gap-2 text-slate-300 hover:text-white hover:bg-transparent px-8 py-6 text-base">
                            <PlayCircle className="w-6 h-6 text-[hsl(var(--brand-accent))]" />
                            How It Works
                        </Button>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex -space-x-2">
                            <img className="inline-block h-10 w-10 rounded-full ring-2 ring-slate-800" src="https://images.unsplash.com/photo-1491528323818-fdd1faba62cc?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="" />
                            <img className="inline-block h-10 w-10 rounded-full ring-2 ring-slate-800" src="https://images.unsplash.com/photo-1550525811-e5869dd03032?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="" />
                            <img className="inline-block h-10 w-10 rounded-full ring-2 ring-slate-800" src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2.25&w=256&h=256&q=80" alt="" />
                        </div>
                        <div>
                            <p className="font-bold text-white">15,000+ Active Users</p>
                            <div className="flex items-center">
                                {[...Array(5)].map((_,i) => <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />)}
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Right Side: Animated Bot */}
                <div className="hidden md:flex items-center justify-center">
                    <AnimatedBotCard />
                </div>
            </div>
        </main>
    </div>
  );
}