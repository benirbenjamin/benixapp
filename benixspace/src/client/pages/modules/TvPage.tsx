import React from 'react';
import { SeoHead } from '../../components/common/SeoHead';
import { TvSection } from '../../components/home/TvSection';
import { AdSenseUnit } from '../../components/common/AdSenseUnit';

export const TvPage: React.FC = () => {
  return (
    <div className="py-8 bg-slate-50 min-h-screen">
      <SeoHead
        title="Live TV & Video Broadcasts — BenixSpace"
        description="Stream live Rwandan television stations, news broadcasts, entertainment, and archived video content on BenixSpace."
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <TvSection />
        <div className="my-8">
          <AdSenseUnit />
        </div>
      </div>
    </div>
  );
};
