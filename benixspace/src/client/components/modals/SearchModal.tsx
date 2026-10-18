import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Search,
  Tv,
  Radio,
  ShoppingBag,
  Newspaper,
  ArrowRight,
  Heart,
  Music,
  Calculator,
  Gamepad2,
  Wallet,
  Film,
  Sparkles,
  ExternalLink
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchItem {
  id: string;
  module: 'tv' | 'radio' | 'music' | 'marketplace' | 'calc' | 'blog' | 'games' | 'dating' | 'wallet' | 'videos';
  title: string;
  description: string;
  url: string;
  category?: string;
  keywords?: string[];
}

const CLIENT_CATALOG: SearchItem[] = [
  // Videos & Shows
  {
    id: 'vid-kwetu',
    module: 'videos',
    title: 'Kwetu Pazuri — Ambassadors of Christ Choir Live',
    description: 'Iconic Rwandan choir performance in concert 4K.',
    url: '/videos?v=vid-01',
    category: 'Gospel & Choirs',
    keywords: ['ambassadors', 'choir', 'kwetu', 'pazuri', 'gospel', 'video', 'music']
  },
  {
    id: 'vid-mbonyi',
    module: 'videos',
    title: 'Israel Mbonyi — Nina Siri Live BK Arena',
    description: 'Acoustic live praise & worship concert in Kigali.',
    url: '/videos?v=vid-02',
    category: 'Gospel & Choirs',
    keywords: ['israel', 'mbonyi', 'nina', 'siri', 'bk arena', 'gospel', 'video']
  },
  {
    id: 'vid-seburikoko',
    module: 'videos',
    title: 'Seburikoko Season 18 — Afrifame Pictures',
    description: 'Rwanda most popular comedy series full episode.',
    url: '/videos?v=vid-03',
    category: 'Series & Comedy',
    keywords: ['seburikoko', 'afrifame', 'comedy', 'series', 'film', 'video', 'nyarwanda']
  },
  {
    id: 'vid-bamenya',
    module: 'videos',
    title: 'Bamenya Series — Zacu TV',
    description: 'City life comedy drama starring Denis Nsanzimahoro.',
    url: '/videos?v=vid-04',
    category: 'Series & Comedy',
    keywords: ['bamenya', 'zacu', 'comedy', 'series', 'film', 'video']
  },
  {
    id: 'vid-citymaid',
    module: 'videos',
    title: 'City Maid Season Finale — Zacu Entertainment',
    description: 'Emotional drama series exploring urban youth life.',
    url: '/videos?v=vid-05',
    category: 'Series & Comedy',
    keywords: ['city maid', 'citymaid', 'zacu', 'drama', 'series', 'video']
  },

  // TV Channels
  {
    id: 'tv-rtv',
    module: 'tv',
    title: 'RTV Live (Rwanda Television)',
    description: 'Official national public broadcaster in 1080p HD.',
    url: '/tv?station=rtv',
    category: 'Live TV',
    keywords: ['rtv', 'rwanda television', 'live tv', 'news', 'amakuru', 'channel']
  },
  {
    id: 'tv-kc2',
    module: 'tv',
    title: 'KC2 Television Live',
    description: 'Youth entertainment, education, and sports.',
    url: '/tv?station=kc2',
    category: 'Live TV',
    keywords: ['kc2', 'youth', 'sports', 'live tv', 'channel']
  },
  {
    id: 'tv-btn',
    module: 'tv',
    title: 'BTN TV Rwanda Live',
    description: 'Live broadcast entertainment and regional news.',
    url: '/tv?station=btn-tv',
    category: 'Live TV',
    keywords: ['btn', 'btn tv', 'live tv', 'channel']
  },
  {
    id: 'tv-tv10',
    module: 'tv',
    title: 'TV10 Rwanda Live',
    description: 'Current affairs, sports, politics, and music in Kigali.',
    url: '/tv?station=tv10',
    category: 'Live TV',
    keywords: ['tv10', 'live tv', 'channel']
  },
  {
    id: 'tv-isibo',
    module: 'tv',
    title: 'Isibo TV Live',
    description: 'Urban youth music, celebrity interviews, and lifestyle.',
    url: '/tv?station=isibo-tv',
    category: 'Live TV',
    keywords: ['isibo', 'isibo tv', 'celebrity', 'music', 'live tv']
  },
  {
    id: 'tv-france24',
    module: 'tv',
    title: 'France 24 Live (Français & English)',
    description: 'International 24/7 world news network.',
    url: '/tv?station=france-24',
    category: 'International News',
    keywords: ['france 24', 'news', 'international', 'live tv']
  },
  {
    id: 'tv-cbs',
    module: 'tv',
    title: 'CBS News 24/7 Live Stream',
    description: 'Global breaking news and prime time investigative reports.',
    url: '/tv?station=cbs-news',
    category: 'International News',
    keywords: ['cbs', 'cbs news', 'news', 'live tv']
  },

  // Radio Stations
  {
    id: 'radio-rwanda',
    module: 'radio',
    title: 'Radio Rwanda (100.7 FM)',
    description: 'National public radio with nationwide coverage in 4 languages.',
    url: '/radio?station=radio-rwanda',
    category: 'Live Radio',
    keywords: ['radio rwanda', '100.7', 'rba', 'radio', 'fm']
  },
  {
    id: 'radio-kiss',
    module: 'radio',
    title: 'Kiss FM 102.3 Kigali',
    description: 'The Beat of Kigali. Playing top African hits & talk shows.',
    url: '/radio?station=kiss-fm',
    category: 'Live Radio',
    keywords: ['kiss fm', 'kiss', '102.3', 'kigali', 'radio', 'fm']
  },
  {
    id: 'radio-flash',
    module: 'radio',
    title: 'Flash FM 89.2 Kigali',
    description: 'Live urban radio hits, sports, and entertainment.',
    url: '/radio?station=flash-fm-rwanda',
    category: 'Live Radio',
    keywords: ['flash', 'flash fm', '89.2', 'radio', 'fm']
  },
  {
    id: 'radio-magic',
    module: 'radio',
    title: 'Magic FM 90.7 Kigali',
    description: 'Urban youth contemporary radio music.',
    url: '/radio?station=magic-fm',
    category: 'Live Radio',
    keywords: ['magic', 'magic fm', '90.7', 'radio', 'fm']
  },
  {
    id: 'radio-royal',
    module: 'radio',
    title: 'Royal FM 94.3 Kigali',
    description: 'Connecting Kigali with English & Kinyarwanda shows.',
    url: '/radio?station=royal-fm-943',
    category: 'Live Radio',
    keywords: ['royal', 'royal fm', '94.3', 'radio', 'fm']
  },
  {
    id: 'radio-isango',
    module: 'radio',
    title: 'Radio Isango Star 91.5 FM',
    description: 'Trustworthy source of information and entertainment.',
    url: '/radio?station=isango-star-radio',
    category: 'Live Radio',
    keywords: ['isango', 'isango star', '91.5', 'radio', 'fm']
  },
  {
    id: 'radio-kt',
    module: 'radio',
    title: 'KT Radio 96.7 FM (Kigali Today)',
    description: 'Fastest breaking news, debates, and regional talk.',
    url: '/radio?station=kt-radio',
    category: 'Live Radio',
    keywords: ['kt radio', 'kt', 'kigali today', '96.7', 'radio', 'fm']
  },

  // Marketplace Products
  {
    id: 'mp-app-template',
    module: 'marketplace',
    title: 'Modern Super-App React & Vite Template',
    description: 'Production-ready starter repository with Tailwind CSS & DB.',
    url: '/marketplace',
    category: 'Software & Code',
    keywords: ['template', 'react', 'vite', 'software', 'code', 'marketplace', 'shop']
  },
  {
    id: 'mp-ui-kit',
    module: 'marketplace',
    title: 'Rwandan High-Resolution UI Kit',
    description: 'Figma component library tailored for East African apps.',
    url: '/marketplace',
    category: 'Design & Graphics',
    keywords: ['figma', 'ui kit', 'design', 'graphics', 'marketplace', 'shop']
  },
  {
    id: 'mp-dev-sprint',
    module: 'marketplace',
    title: 'Full-Stack Web App Development (1 Week Sprint)',
    description: 'Custom React & Node.js development service delivered with tested APIs.',
    url: '/marketplace',
    category: 'Tech Services',
    keywords: ['developer', 'freelance', 'development', 'software', 'services', 'marketplace']
  },
  {
    id: 'mp-audio-mix',
    module: 'marketplace',
    title: 'Professional Audio Mixing & Gospel Mastering',
    description: 'Studio acoustic master for choir performances and vocal tracks.',
    url: '/marketplace',
    category: 'Creative Audio',
    keywords: ['audio', 'mixing', 'mastering', 'studio', 'music', 'marketplace']
  },
  {
    id: 'mp-tax-toolkit',
    module: 'marketplace',
    title: 'Rwanda Small Business Tax & Accounting Toolkit',
    description: 'PAYE payroll, VAT declaration, and cash flow spreadsheet models.',
    url: '/marketplace',
    category: 'Business Tools',
    keywords: ['tax', 'accounting', 'vat', 'paye', 'excel', 'finance', 'marketplace']
  },

  // Calculators
  {
    id: 'calc-loan',
    module: 'calc',
    title: 'Rwanda Loan & Mortgage Calculator',
    description: 'Calculate monthly payments, interest amortization, and total cost.',
    url: '/calculators?cat=finance',
    category: 'Financial Calculator',
    keywords: ['loan', 'mortgage', 'interest', 'bank', 'calc', 'calculator']
  },
  {
    id: 'calc-vat',
    module: 'calc',
    title: 'Rwanda 18% VAT & Tax Calculator',
    description: 'Compute inclusive and exclusive Value Added Tax.',
    url: '/calculators?cat=business',
    category: 'Tax Calculator',
    keywords: ['vat', 'tax', '18%', 'rra', 'calculator', 'calc']
  },
  {
    id: 'calc-bmi',
    module: 'calc',
    title: 'BMI Body Mass Index & Health Calculator',
    description: 'Check healthy weight ranges, body metrics, and caloric targets.',
    url: '/calculators?cat=health',
    category: 'Health Calculator',
    keywords: ['bmi', 'health', 'weight', 'calculator', 'calc']
  },

  // Games / RollDice
  {
    id: 'games-dice',
    module: 'games',
    title: 'RollDice Interactive Arena (1.9x Multiplier)',
    description: 'Fast PvP & AI dice wager game with instant wallet settlement.',
    url: '/games',
    category: 'Interactive Games',
    keywords: ['dice', 'rolldice', 'game', 'bet', 'wager', 'play', 'win', 'games']
  },

  // Voxify Music
  {
    id: 'voxify-music',
    module: 'music',
    title: 'Voxify Gospel & East African Choir Hub',
    description: 'Stream traditional choirs, praise hymns, and sacred tracks.',
    url: '/music',
    category: 'Music & Audio',
    keywords: ['music', 'voxify', 'songs', 'choir', 'hymns', 'audio']
  },

  // Kunda Space
  {
    id: 'kunda-space',
    module: 'dating',
    title: 'Kunda Space Verified Rwandan Matchmaking',
    description: 'Find authentic local connections, chat, and date safely.',
    url: '/dating',
    category: 'Dating & Social',
    keywords: ['kunda', 'dating', 'love', 'match', 'chat', 'friends', 'social']
  },

  // Central Wallet
  {
    id: 'central-wallet',
    module: 'wallet',
    title: 'Central Multi-Currency Wallet & Bonus Account',
    description: 'View real balance, claim daily 200 RWF login bonus, deposit & withdraw.',
    url: '/dashboard',
    category: 'Finance & Wallet',
    keywords: ['wallet', 'money', 'balance', 'bonus', 'deposit', 'withdraw', 'transfer', 'rwf']
  }
];

export const SearchModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [apiResults, setApiResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Search through client catalog using flexible regex / token matching
  const clientFilteredResults = useMemo(() => {
    if (!query.trim()) return [];
    const cleanTokens = query
      .toLowerCase()
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    return CLIENT_CATALOG.filter((item) => {
      const searchSpace = `${item.title} ${item.description} ${item.category || ''} ${(item.keywords || []).join(' ')}`.toLowerCase();
      return cleanTokens.some((token) => searchSpace.includes(token));
    });
  }, [query]);

  // Query backend search API and merge
  useEffect(() => {
    if (!query.trim()) {
      setApiResults([]);
      return;
    }

    const timer = setTimeout(() => {
      setLoading(true);
      fetch(`/api/search?q=${encodeURIComponent(query)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data?.results && Array.isArray(data.results)) {
            setApiResults(data.results);
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 150);

    return () => clearTimeout(timer);
  }, [query]);

  // Combined and deduplicated results list
  const combinedResults = useMemo(() => {
    const seen = new Set<string>();
    const list: any[] = [];

    // Prioritize client filtered results
    clientFilteredResults.forEach((item) => {
      if (!seen.has(item.url)) {
        seen.add(item.url);
        list.push(item);
      }
    });

    // Merge backend API results
    apiResults.forEach((item) => {
      if (!seen.has(item.url)) {
        seen.add(item.url);
        list.push(item);
      }
    });

    return list;
  }, [clientFilteredResults, apiResults]);

  if (!isOpen) return null;

  const handleSelect = (url: string) => {
    onClose();
    navigate(url);
  };

  const getModuleIcon = (mod: string) => {
    switch (mod) {
      case 'videos':
        return <Film className="w-4 h-4 text-purple-400" />;
      case 'tv':
        return <Tv className="w-4 h-4 text-sky-400" />;
      case 'radio':
        return <Radio className="w-4 h-4 text-cyan-400" />;
      case 'marketplace':
        return <ShoppingBag className="w-4 h-4 text-emerald-400" />;
      case 'dating':
        return <Heart className="w-4 h-4 text-rose-400" />;
      case 'music':
        return <Music className="w-4 h-4 text-violet-400" />;
      case 'calc':
        return <Calculator className="w-4 h-4 text-amber-400" />;
      case 'games':
        return <Gamepad2 className="w-4 h-4 text-indigo-400" />;
      case 'wallet':
        return <Wallet className="w-4 h-4 text-emerald-400" />;
      default:
        return <Newspaper className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="bg-[#121824] rounded-3xl shadow-2xl border border-slate-700/80 w-full max-w-xl overflow-hidden flex flex-col max-h-[80vh] text-slate-100">
        
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-3 bg-[#151D2C]">
          <Search className="w-5 h-5 text-blue-400 shrink-0 ml-1" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search TV, radio, videos, market, calculators, songs..."
            className="w-full bg-transparent text-sm font-semibold text-white placeholder-slate-400 outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-white rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-xs font-bold text-slate-400 hover:text-white px-2 py-1 bg-slate-800 rounded-lg border border-slate-700 transition-colors"
          >
            ESC
          </button>
        </div>

        {/* Results List */}
        <div className="p-3 overflow-y-auto flex-1 space-y-2 divide-y divide-slate-800/40">
          {loading && combinedResults.length === 0 && (
            <div className="text-center py-10 text-xs text-slate-400 flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
              <span>Searching across all 9 BenixSpace platforms...</span>
            </div>
          )}

          {!query && (
            <div className="text-center py-10 text-xs text-slate-400 space-y-2">
              <div className="text-sm font-bold text-slate-300">Quick Ecosystem Search</div>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                Type keywords like "RTV", "Seburikoko", "Kiss FM", "VAT", "Dice", "Loan", or "Music" to jump directly to any stream or tool.
              </p>
            </div>
          )}

          {query && combinedResults.length === 0 && !loading && (
            <div className="text-center py-10 text-xs text-slate-400">
              No matching items found for "<span className="text-white font-bold">{query}</span>"
            </div>
          )}

          {combinedResults.map((r) => (
            <div
              key={r.id}
              onClick={() => handleSelect(r.url)}
              className="p-3 pt-3.5 rounded-2xl hover:bg-[#1A2536] border border-transparent hover:border-slate-700/60 cursor-pointer transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-[#0B0E14] border border-slate-800 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                  {getModuleIcon(r.module)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-black text-white truncate group-hover:text-blue-400 transition-colors">
                      {r.title}
                    </h4>
                    <span className="text-[9px] font-black uppercase text-blue-300 bg-blue-500/15 border border-blue-500/25 px-2 py-0.5 rounded-full shrink-0">
                      {r.category || r.module}
                    </span>
                  </div>
                  {r.description && (
                    <p className="text-[11px] text-slate-400 truncate mt-0.5 leading-relaxed">
                      {r.description}
                    </p>
                  )}
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all shrink-0 ml-3" />
            </div>
          ))}
        </div>

        {/* Footer info */}
        {combinedResults.length > 0 && (
          <div className="px-4 py-2.5 bg-[#0F141F] border-t border-slate-800 text-[10px] text-slate-500 flex items-center justify-between">
            <span>Found {combinedResults.length} matching ecosystem results</span>
            <span>Click any result to jump instantly</span>
          </div>
        )}

      </div>
    </div>
  );
};
