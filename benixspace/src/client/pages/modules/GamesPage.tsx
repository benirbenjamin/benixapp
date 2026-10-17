import React from 'react';
import { SeoHead } from '../../components/common/SeoHead';
import { RollDiceSection } from '../../components/home/RollDiceSection';
import { AdSenseUnit } from '../../components/common/AdSenseUnit';

export const GamesPage: React.FC = () => {
  return (
    <div className="py-8 bg-slate-50 min-h-screen">
      <SeoHead
        title="RollDice Games & Central Wallet Gaming — BenixSpace"
        description="Play multiplayer and AI RollDice challenges, wager with your unified BenixSpace wallet, and earn cash rewards."
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <RollDiceSection />
        <div className="my-8">
          <AdSenseUnit />
        </div>
      </div>
    </div>
  );
};
