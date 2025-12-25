import React from 'react';
import { motion } from 'framer-motion';
import { Search, FileSearch, Lightbulb, CheckCircle, Loader2 } from 'lucide-react';

const ANIMATED_OWL_VIDEO = 'https://i.imgur.com/U6Qr1lM.mp4';

const steps = [
  { id: 'searching', label: 'Searching the archives...', icon: Search, doneLabel: 'Data retrieved!', phrase: '🔍 The game is afoot!' },
  { id: 'examining', label: 'Examining the clues...', icon: FileSearch, doneLabel: 'Clue found!', phrase: '🧐 Aha! A clue emerges...' },
  { id: 'deducing', label: 'Forming deduction...', icon: Lightbulb, doneLabel: 'Eureka!', phrase: '💡 Elementary, my dear!' },
];

export default function ProcessingSteps({ currentStep }) {
  // currentStep: 'searching' | 'examining' | 'deducing' | 'complete'
  
  const getStepStatus = (stepId) => {
    if (currentStep === 'complete') return 'done';
    const stepIndex = steps.findIndex(s => s.id === stepId);
    const currentIndex = steps.findIndex(s => s.id === currentStep);
    
    if (stepIndex < currentIndex) return 'done';
    if (stepIndex === currentIndex) return 'active';
    return 'pending';
  };

  const getProgress = () => {
    if (currentStep === 'searching') return 20;
    if (currentStep === 'examining') return 55;
    if (currentStep === 'deducing') return 85;
    if (currentStep === 'complete') return 100;
    return 0;
  };
  
  const getCurrentPhrase = () => {
    const step = steps.find(s => s.id === currentStep);
    return step?.phrase || '✅ Case closed!';
  };

  return (
    <div className="flex flex-col items-center gap-4 py-6">
      {/* Owl with speech bubble */}
      <div className="flex items-start gap-4">
        <motion.div
          className="relative flex-shrink-0"
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 via-cyan-500 to-lime-500 rounded-2xl blur-sm opacity-60" />
          <video 
            src={ANIMATED_OWL_VIDEO}
            autoPlay
            loop
            muted
            playsInline
            className="relative w-20 h-20 rounded-2xl object-cover border-2 border-purple-400/50"
          />
        </motion.div>

        <div className="flex flex-col gap-3 max-w-xs">
          {steps.map((step, index) => {
            const status = getStepStatus(step.id);
            const Icon = step.icon;
            
            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.2 }}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all ${
                  status === 'active' 
                    ? 'bg-purple-500/20 border-purple-500/50 text-white' 
                    : status === 'done'
                    ? 'bg-green-500/20 border-green-500/50 text-green-300'
                    : 'bg-slate-800/50 border-white/10 text-slate-500'
                }`}
              >
                {status === 'active' ? (
                  <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
                ) : status === 'done' ? (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                ) : (
                  <Icon className="w-5 h-5" />
                )}
                <span className="text-sm font-medium">
                  {status === 'done' ? step.doneLabel : step.label}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-sm">
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-purple-500 via-cyan-500 to-lime-500"
            initial={{ width: '0%' }}
            animate={{ width: `${getProgress()}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
        <p className="text-center text-xs text-slate-400 mt-2">
          {currentStep === 'gathering' && "🔍 The game is afoot! Searching the archives..."}
          {currentStep === 'analyzing' && "🧠 Elementary! Deducing the evidence..."}
          {currentStep === 'complete' && "✅ Case closed!"}
        </p>
      </div>
    </div>
  );
}