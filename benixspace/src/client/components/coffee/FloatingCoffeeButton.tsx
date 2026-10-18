import React from 'react';
import { Sparkles } from 'lucide-react';
import { useCoffee } from '../../context/CoffeeContext';

export const FloatingCoffeeButton: React.FC = () => {
  const { openCoffeeModal } = useCoffee();

  return (
    <div className="fixed right-4 bottom-20 sm:bottom-6 z-40 transition-all duration-300">
      <button
        onClick={() => openCoffeeModal(1)}
        className="group relative flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-xs sm:text-sm shadow-xl hover:shadow-2xl hover:shadow-amber-500/30 transition-all hover:scale-105 active:scale-95 border border-amber-300/40"
        title="Support Benix Space TV & Creators with a Coffee"
      >
        <span className="text-base sm:text-lg group-hover:rotate-12 transition-transform">☕</span>
        <span className="tracking-tight font-extrabold">Buy Us a Coffee</span>
        <Sparkles className="w-3.5 h-3.5 text-slate-950/80 animate-pulse hidden sm:inline" />
        <span className="absolute -inset-0.5 rounded-full bg-amber-400 opacity-30 group-hover:opacity-60 blur-md -z-10 transition-opacity" />
      </button>
    </div>
  );
};
