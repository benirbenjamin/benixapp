import { query } from '../db/db';

export interface SearchResult {
  id: string;
  module: 'tv' | 'radio' | 'music' | 'marketplace' | 'calc' | 'blog' | 'games' | 'dating' | 'wallet' | 'videos';
  title: string;
  description: string;
  url: string;
  thumbnail?: string;
  category?: string;
}

// Built-in catalog of all Benix.Space ecosystem services, channels, and apps
const ECOSYSTEM_CATALOG: SearchResult[] = [
  // TV Channels & Streams
  {
    id: 'tv-rtv',
    module: 'tv',
    title: 'RTV Live (Rwanda Television)',
    description: 'National public broadcaster delivering 24/7 HD news, cultural programs, and live sports.',
    url: '/tv?station=rtv',
    category: 'Live TV & News'
  },
  {
    id: 'tv-kc2',
    module: 'tv',
    title: 'KC2 Television',
    description: 'Youth entertainment, sports, education, and creative talent discovery.',
    url: '/tv?station=kc2',
    category: 'Live TV & Youth'
  },
  {
    id: 'tv-btn',
    module: 'tv',
    title: 'BTN TV Rwanda',
    description: 'Private broadcast channel with live entertainment and community stories.',
    url: '/tv?station=btn-tv',
    category: 'Live TV'
  },
  {
    id: 'tv-tv10',
    module: 'tv',
    title: 'TV10 Rwanda',
    description: 'Live Rwandan television covering politics, business, and entertainment.',
    url: '/tv?station=tv10',
    category: 'Live TV'
  },
  {
    id: 'tv-isibo',
    module: 'tv',
    title: 'Isibo TV',
    description: 'Leading urban lifestyle, music videos, and celebrity talk shows in Rwanda.',
    url: '/tv?station=isibo-tv',
    category: 'Live TV & Entertainment'
  },
  {
    id: 'tv-tv1',
    module: 'tv',
    title: 'TV1 Rwanda',
    description: 'Popular national television channel with live interactive programming.',
    url: '/tv?station=tv1-rwanda',
    category: 'Live TV'
  },
  {
    id: 'tv-africa24',
    module: 'tv',
    title: 'Africa 24',
    description: 'Pan-African international news network broadcasting 24/7 across the continent.',
    url: '/tv?station=africa-24',
    category: 'Pan-African News'
  },
  {
    id: 'tv-isango',
    module: 'tv',
    title: 'Isango Star TV',
    description: 'Live news, current affairs, and local programming from Kigali.',
    url: '/tv?station=isango-star-tv',
    category: 'Live TV'
  },

  // Radio Stations
  {
    id: 'radio-rwanda',
    module: 'radio',
    title: 'Radio Rwanda (100.7 FM)',
    description: 'National public radio broadcasting nationwide in Kinyarwanda, French, English, and Swahili.',
    url: '/radio?station=radio-rwanda',
    category: 'Live Radio'
  },
  {
    id: 'radio-kissfm',
    module: 'radio',
    title: 'Kiss FM 102.3 Kigali',
    description: 'The Beat of Kigali. Playing top African hits, RnB, Pop, and live morning talk shows.',
    url: '/radio?station=kiss-fm',
    category: 'Live Radio & Music'
  },
  {
    id: 'radio-magic',
    module: 'radio',
    title: 'Magic FM (90.7 FM)',
    description: 'Urban youth contemporary radio with Afrobeats, modern pop, and lifestyle discussions.',
    url: '/radio?station=magic-fm',
    category: 'Live Radio'
  },
  {
    id: 'radio-isango',
    module: 'radio',
    title: 'Isango Star Radio (91.5 FM)',
    description: 'Trustworthy source of news, sports commentary, and music in Rwanda.',
    url: '/radio?station=isango-star-radio',
    category: 'Live Radio'
  },
  {
    id: 'radio-10',
    module: 'radio',
    title: 'Radio 10 (87.6 FM)',
    description: 'Simply Rwandafull. Long-standing private broadcaster with premier sports and news.',
    url: '/radio?station=radio-10',
    category: 'Live Radio'
  },
  {
    id: 'radio-royal',
    module: 'radio',
    title: 'Royal FM 94.3',
    description: 'Connecting Kigali with English and Kinyarwanda adult contemporary music and news.',
    url: '/radio?station=royal-fm-943',
    category: 'Live Radio'
  },
  {
    id: 'radio-flash',
    module: 'radio',
    title: 'Flash FM 89.2 FM',
    description: 'Live from Kigali featuring energetic hosts, trending topics, and top hit songs.',
    url: '/radio?station=flash-fm-rwanda',
    category: 'Live Radio'
  },
  {
    id: 'radio-kt',
    module: 'radio',
    title: 'KT Radio (96.7 FM)',
    description: 'Kigali Today radio station broadcasting insightful talk, business, and local news.',
    url: '/radio?station=kt-radio',
    category: 'Live Radio'
  },
  {
    id: 'radio-maria',
    module: 'radio',
    title: 'Radio Maria Rwanda (97.3 FM)',
    description: 'Catholic Christian devotional radio with daily prayers, mass, and gospel reflections.',
    url: '/radio?station=radio-maria-rwanda',
    category: 'Faith & Devotion'
  },

  // Kunda Space Dating
  {
    id: 'kunda-hub',
    module: 'dating',
    title: 'Kunda Space Matchmaking',
    description: 'Verified Rwandan dating platform. Find genuine connections, send crushes, and chat securely.',
    url: '/dating',
    category: 'Dating & Relationships'
  },
  {
    id: 'kunda-aline',
    module: 'dating',
    title: 'Aline M. — Kunda Dating Profile',
    description: '24 years old Software Designer in Kigali (Kacyiru). Interests: Design, Coffee, Music, Travel.',
    url: '/messages?user=k1&name=Aline%20M.',
    category: 'Verified Singles'
  },
  {
    id: 'kunda-christian',
    module: 'dating',
    title: 'Christian K. — Kunda Dating Profile',
    description: '28 years old Fintech Specialist in Kigali (Kimihurura). Interests: Finance, Tennis, Books, Jazz.',
    url: '/messages?user=k2&name=Christian%20K.',
    category: 'Verified Singles'
  },
  {
    id: 'kunda-diane',
    module: 'dating',
    title: 'Diane U. — Kunda Dating Profile',
    description: '26 years old Hospitality & Eco-Tourism in Musanze. Interests: Hiking, Nature, Cooking.',
    url: '/messages?user=k3&name=Diane%20U.',
    category: 'Verified Singles'
  },
  {
    id: 'kunda-kevin',
    module: 'dating',
    title: 'Kevin N. — Kunda Dating Profile',
    description: '27 years old Civil Engineer in Rubavu. Interests: Photography, Water Sports, Architecture.',
    url: '/messages?user=k4&name=Kevin%20N.',
    category: 'Verified Singles'
  },

  // Voxify Music
  {
    id: 'music-voxify',
    module: 'music',
    title: 'Voxify Choir & Music Hub',
    description: 'Listen to Rwandan choir performances, acoustic melodies, and worship harmonies.',
    url: '/music',
    category: 'Gospel & Choral Music'
  },

  // EasyCalc
  {
    id: 'calc-vat',
    module: 'calc',
    title: 'VAT 18% Tax Calculator',
    description: 'Calculate Rwanda Value Added Tax (18% standard rate) inclusive and exclusive amounts.',
    url: '/calc?type=vat',
    category: 'Financial Calculators'
  },
  {
    id: 'calc-paye',
    module: 'calc',
    title: 'PAYE Salary Tax Calculator',
    description: 'Compute Rwanda Revenue Authority PAYE progressive salary brackets and net pay.',
    url: '/calc?type=paye',
    category: 'Financial Calculators'
  },
  {
    id: 'calc-loan',
    module: 'calc',
    title: 'Loan EMI & Interest Calculator',
    description: 'Calculate monthly loan repayments, interest schedules, and bank amortization.',
    url: '/calc?type=loan',
    category: 'Financial Calculators'
  },
  {
    id: 'calc-currency',
    module: 'calc',
    title: 'Currency Exchange Converter',
    description: 'Live exchange rates converting RWF to USD, EUR, GBP, KES, and UGX.',
    url: '/calc?type=currency',
    category: 'Financial Calculators'
  },

  // Games & RollDice
  {
    id: 'game-rolldice',
    module: 'games',
    title: 'RollDice Arena',
    description: 'Interactive dice rolling game. Play against the AI or challenge friends with wallet stakes.',
    url: '/games',
    category: 'Games & Contests'
  },

  // Marketplace
  {
    id: 'mkt-hub',
    module: 'marketplace',
    title: 'Benix Digital Marketplace',
    description: 'Discover verified software licenses, freelance services, and creative digital assets.',
    url: '/marketplace',
    category: 'Marketplace'
  },

  // Creator Videos & Studio Hub
  {
    id: 'vid-kwetu',
    module: 'videos',
    title: 'Kwetu Pazuri (Ambassadors of Christ Choir)',
    description: 'Iconic Rwandan choir music video with 4-part harmonies and cultural attire.',
    url: '/videos?v=vid-1',
    category: 'Gospel Choirs'
  },
  {
    id: 'vid-nina-siri',
    module: 'videos',
    title: 'Nina Siri (Israel Mbonyi)',
    description: 'Trending praise and worship live gospel song performed in Kigali by Israel Mbonyi.',
    url: '/videos?v=vid-2',
    category: 'Gospel Choirs'
  },
  {
    id: 'vid-seburikoko',
    module: 'videos',
    title: 'Seburikoko Episode 1 (Filime Nyarwanda)',
    description: 'Popular Rwandan comedy and drama television series by Afrifame Pictures.',
    url: '/videos?v=vid-3',
    category: 'Cinema & Films'
  },
  {
    id: 'vid-bamenya',
    module: 'videos',
    title: 'Bamenya Series Episode 1 (Zacu Entertainment)',
    description: 'Rwanda comedy drama starring Bamenya (Ramadhan).',
    url: '/videos?v=vid-4',
    category: 'Comedy & Skits'
  },
  {
    id: 'vid-city-maid',
    module: 'videos',
    title: 'City Maid Episode 1 (Afrifame Pictures)',
    description: 'Rwandan drama depicting urban life and romance in Kigali.',
    url: '/videos?v=vid-5',
    category: 'Cinema & Films'
  },
  {
    id: 'vid-bk-arena-concert',
    module: 'videos',
    title: 'Israel Mbonyi Live BK Arena VIP Concert',
    description: 'Full 2-hour VIP recorded concert live from BK Arena Kigali with multitrack sound.',
    url: '/videos?v=vid-9',
    category: 'Premium VIP Videos'
  },

  // Wallet
  {
    id: 'wallet-hub',
    module: 'wallet',
    title: 'Benix Central Wallet',
    description: 'Unified balance for TV, dating passes, dice wagers, deposits (MTN MoMo), and instant transfers.',
    url: '/dashboard#wallet',
    category: 'Central Wallet'
  }
];

export class SearchService {
  /**
   * Universal search across all active modules using Regex
   * Matches ANY word or token typed by the user
   */
  static async searchGlobal(keyword: string): Promise<SearchResult[]> {
    if (!keyword || !keyword.trim()) return [];

    const rawInput = keyword.trim();
    // Split into words so that every single word typed can match anything
    const tokens = rawInput
      .split(/\s+/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    if (tokens.length === 0) return [];

    // Escape special regex chars
    const escapedTokens = tokens.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const regexPattern = `(${escapedTokens.join('|')})`;
    const jsRegex = new RegExp(escapedTokens.join('|'), 'i');

    const results: SearchResult[] = [];
    const seenUrls = new Set<string>();

    const addResult = (res: SearchResult) => {
      if (!seenUrls.has(res.url)) {
        seenUrls.add(res.url);
        results.push(res);
      }
    };

    // 1. Query database: articles (blog)
    try {
      const artRes = await query(
        `SELECT id, title, slug, summary, featured_image_url, category 
         FROM articles 
         WHERE (title ~* $1 OR summary ~* $1) AND status = 'published' 
         ORDER BY published_at DESC LIMIT 6`,
        [regexPattern]
      );
      artRes.rows.forEach((r: any) => {
        addResult({
          id: 'art-' + r.id,
          module: 'blog',
          title: r.title,
          description: r.summary || '',
          url: `/blog/${r.slug}`,
          thumbnail: r.featured_image_url,
          category: r.category || 'Article'
        });
      });
    } catch (e) {
      try {
        const fallbackTerm = `%${tokens[0]}%`;
        const artRes = await query(
          `SELECT id, title, slug, summary, featured_image_url, category 
           FROM articles 
           WHERE (title ILIKE $1 OR summary ILIKE $1) AND status = 'published' 
           LIMIT 6`,
          [fallbackTerm]
        );
        artRes.rows.forEach((r: any) => {
          addResult({
            id: 'art-' + r.id,
            module: 'blog',
            title: r.title,
            description: r.summary || '',
            url: `/blog/${r.slug}`,
            thumbnail: r.featured_image_url,
            category: r.category || 'Article'
          });
        });
      } catch (err2) {}
    }

    // 2. Query database: stations (Real stations table with TV & Radio)
    try {
      const stRes = await query(
        `SELECT id, name, slug, description, logo_url, station_type
         FROM stations 
         WHERE (name ~* $1 OR description ~* $1 OR slug ~* $1)
         LIMIT 10`,
        [regexPattern]
      );
      stRes.rows.forEach((r: any) => {
        const isTv = (r.station_type || '').toUpperCase() === 'TV';
        addResult({
          id: 'st-' + r.id,
          module: isTv ? 'tv' : 'radio',
          title: r.name,
          description: r.description || (isTv ? 'Live Rwandan Television Broadcast' : 'Live FM Radio Station'),
          url: isTv ? `/tv?station=${r.slug}` : `/radio?station=${r.slug}`,
          thumbnail: r.logo_url,
          category: isTv ? 'Live TV' : 'Live Radio'
        });
      });
    } catch (e) {}

    // 3. Query database: user_videos (Real videos table)
    try {
      const vidRes = await query(
        `SELECT id, title, description, thumbnail_url, category, price
         FROM user_videos 
         WHERE (title ~* $1 OR description ~* $1)
         ORDER BY views DESC LIMIT 8`,
        [regexPattern]
      );
      vidRes.rows.forEach((r: any) => {
        addResult({
          id: 'vid-' + r.id,
          module: 'videos',
          title: r.title,
          description: r.description || 'BenixSpace Creator Video',
          url: `/videos?v=${r.id}`,
          thumbnail: r.thumbnail_url,
          category: r.category || 'Videos'
        });
      });
    } catch (e) {}

    // 4. Query database: mkt_products (Real marketplace products)
    try {
      const mktRes = await query(
        `SELECT id, title, description, price, category
         FROM mkt_products 
         WHERE (title ~* $1 OR description ~* $1)
         LIMIT 6`,
        [regexPattern]
      );
      mktRes.rows.forEach((r: any) => {
        addResult({
          id: 'mkt-' + r.id,
          module: 'marketplace',
          title: r.title,
          description: `${r.price} RWF • ${r.description || ''}`,
          url: `/marketplace?q=${encodeURIComponent(r.title)}&category=${encodeURIComponent(r.category || 'all')}`,
          category: r.category || 'Marketplace'
        });
      });
    } catch (e) {}

    // 5. Query database: voxify_songs (Real choir & artist songs)
    try {
      const songRes = await query(
        `SELECT id, title, artist_name, price, category
         FROM voxify_songs 
         WHERE (title ~* $1 OR artist_name ~* $1)
         LIMIT 6`,
        [regexPattern]
      );
      songRes.rows.forEach((r: any) => {
        addResult({
          id: 'song-' + r.id,
          module: 'music',
          title: r.title + (r.artist_name ? ` — ${r.artist_name}` : ''),
          description: `${r.price} RWF • Voxify Licensed Music`,
          url: `/music?tab=marketplace&song=${r.id}`,
          category: 'Voxify Music'
        });
      });
    } catch (e) {}

    // 6. Query database: core_users (Creators, Verified Members)
    try {
      const uRes = await query(
        `SELECT id, name, email, role 
         FROM core_users 
         WHERE (name ~* $1 OR email ~* $1) 
         LIMIT 6`,
        [regexPattern]
      );
      uRes.rows.forEach((r: any) => {
        addResult({
          id: 'usr-' + r.id,
          module: 'dating',
          title: `${r.name || r.email.split('@')[0]} (${r.role})`,
          description: `Benix Member • ${r.email}`,
          url: `/messages?user=${r.id}&name=${encodeURIComponent(r.name || r.email.split('@')[0])}`,
          category: 'Community Member'
        });
      });
    } catch (e) {}

    // 6. Match against built-in ecosystem catalog with JS Regex
    for (const item of ECOSYSTEM_CATALOG) {
      if (
        jsRegex.test(item.title) ||
        jsRegex.test(item.description) ||
        (item.category && jsRegex.test(item.category))
      ) {
        addResult(item);
      }
    }

    return results;
  }

  /**
   * Alias for searchGlobal
   */
  static async search(keyword: string): Promise<SearchResult[]> {
    return this.searchGlobal(keyword);
  }
}

