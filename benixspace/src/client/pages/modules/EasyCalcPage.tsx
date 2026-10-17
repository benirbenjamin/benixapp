import React from 'react';
import { SeoHead } from '../../components/common/SeoHead';
import { EasyCalcSection } from '../../components/home/EasyCalcSection';
import { AdSenseUnit } from '../../components/common/AdSenseUnit';

export const EasyCalcPage: React.FC = () => {
  return (
    <div className="py-8 bg-slate-50 min-h-screen">
      <SeoHead
        title="EasyCalc Smart Financial & Business Calculators — BenixSpace"
        description="Instant loan EMI calculations, compound interest, tax estimators, currency conversions, and scientific computations."
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <EasyCalcSection />
        <div className="my-8">
          <AdSenseUnit />
        </div>
      </div>
    </div>
  );
};
