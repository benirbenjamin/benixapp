import React from 'react';
import { SeoHead } from '../../components/common/SeoHead';
import { KundaSection } from '../../components/home/KundaSection';
import { AdSenseUnit } from '../../components/common/AdSenseUnit';

export const KundaPage: React.FC = () => {
  return (
    <div className="py-8 bg-slate-50 min-h-screen">
      <SeoHead
        title="Kunda Space Dating — Safe, Verified Matchmaking"
        description="Find meaningful relationships with verified profiles, shared interests, and secure privacy controls on Kunda Space."
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <KundaSection />
        <div className="my-8">
          <AdSenseUnit />
        </div>
      </div>
    </div>
  );
};
