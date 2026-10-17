import React from 'react';
import { useStation } from '../../context/StationContext';
import { ThemeProvider } from '../../components/themes/ThemeProvider';
import { PublicNavbar } from '../../components/layout/PublicNavbar';
import { PublicFooter } from '../../components/layout/PublicFooter';
import { PersistentPlayerBar } from '../../components/player/PersistentPlayerBar';

import { Theme1Modern } from '../../components/themes/Theme1Modern';
import { Theme2Classic } from '../../components/themes/Theme2Classic';
import { Theme3Entertainment } from '../../components/themes/Theme3Entertainment';
import { Theme4NewsRadio } from '../../components/themes/Theme4NewsRadio';
import { Theme5Minimal } from '../../components/themes/Theme5Minimal';
import { AdSenseUnit } from '../../components/ads/AdSenseUnit';

export function StationHomePage() {
  const {
    station,
    branding,
    streams,
    programs,
    nowOnAir,
    comingNext,
    news,
    videos,
    sections,
    settings,
    loading,
    error
  } = useStation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold tracking-wide text-slate-400">Tuning in to station...</p>
        </div>
      </div>
    );
  }

  if (error || !station) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-6">
        <div className="max-w-md w-full text-center space-y-4 p-8 rounded-3xl bg-slate-800 border border-slate-700">
          <h2 className="text-2xl font-black text-red-400">Station Not Found</h2>
          <p className="text-sm text-slate-400">
            {error || 'This radio station does not exist or has been deactivated.'}
          </p>
          <a
            href="/"
            className="inline-block px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs uppercase tracking-wider hover:bg-indigo-700"
          >
            Explore All Stations
          </a>
        </div>
      </div>
    );
  }

  const currentTheme = branding?.theme || 'theme1_modern';

  const renderTheme = () => {
    const props = { station, branding, streams, programs, nowOnAir, comingNext, news, videos, sections, settings };

    switch (currentTheme) {
      case 'theme2_classic':
        return <Theme2Classic {...props} />;
      case 'theme3_entertainment':
        return <Theme3Entertainment {...props} />;
      case 'theme4_news':
        return <Theme4NewsRadio {...props} />;
      case 'theme5_minimal':
        return <Theme5Minimal {...props} />;
      case 'theme1_modern':
      default:
        return <Theme1Modern {...props} />;
    }
  };

  return (
    <ThemeProvider branding={branding}>
      <div className="min-h-screen flex flex-col justify-between">
        <div>
          <PublicNavbar />
          <main>{renderTheme()}</main>
          {/* Responsive AdSense Unit (Collapses to 0px if unfilled) */}
          <div className="max-w-5xl mx-auto px-4">
            <AdSenseUnit slot="7034214536" client="ca-pub-4078466828008985" className="my-6" />
          </div>
        </div>
        <PublicFooter />
        <PersistentPlayerBar />
      </div>
    </ThemeProvider>
  );
}
