import React from 'react';
import { SeoHead } from '../../components/common/SeoHead';
import { VoxifySection } from '../../components/home/VoxifySection';
import { AdSenseUnit } from '../../components/common/AdSenseUnit';

export const VoxifyPage: React.FC = () => {
  return (
    <div className="py-8 bg-slate-50 min-h-screen">
      <SeoHead
        title="Voxify Music & Choirs — Gospel, Vocal Rehearsals & Releases"
        description="Stream choir songs, discover vocal parts (Soprano, Alto, Tenor, Bass), and enjoy Rwandan gospel music on Voxify."
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <VoxifySection />
        <div className="my-8">
          <AdSenseUnit />
        </div>
      </div>
    </div>
  );
};
