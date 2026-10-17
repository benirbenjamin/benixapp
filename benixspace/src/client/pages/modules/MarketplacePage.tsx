import React from 'react';
import { SeoHead } from '../../components/common/SeoHead';
import { MarketplaceSection } from '../../components/home/MarketplaceSection';
import { AdSenseUnit } from '../../components/common/AdSenseUnit';

export const MarketplacePage: React.FC = () => {
  return (
    <div className="py-8 bg-slate-50 min-h-screen">
      <SeoHead
        title="Umuguzi Marketplace — Digital Goods & Freelance Services"
        description="Buy and sell digital assets, ebooks, software, and book professional tech and creative services across Rwanda on BenixSpace."
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <MarketplaceSection />
        <div className="my-8">
          <AdSenseUnit />
        </div>
      </div>
    </div>
  );
};
