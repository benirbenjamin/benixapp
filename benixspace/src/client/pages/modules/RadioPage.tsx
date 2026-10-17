import React from 'react';
import { SeoHead } from '../../components/common/SeoHead';
import { RadioSection } from '../../components/home/RadioSection';
import { AdSenseUnit } from '../../components/common/AdSenseUnit';

export const RadioPage: React.FC = () => {
  return (
    <div className="py-8 bg-slate-50 min-h-screen">
      <SeoHead
        title="Live Radio & Audio Streams — BenixSpace"
        description="Listen to 24/7 live Rwandan radio stations, talk shows, DJ mixes, and breaking regional news on BenixSpace."
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <RadioSection />
        <div className="my-8">
          <AdSenseUnit />
        </div>
      </div>
    </div>
  );
};
