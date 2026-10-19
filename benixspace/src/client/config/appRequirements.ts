export interface AppRequirementField {
  name: string;
  label: string;
  type: 'text' | 'select' | 'multiselect' | 'textarea' | 'checkbox' | 'radio' | 'number';
  options?: string[];
  placeholder?: string;
  required?: boolean;
  defaultValue?: any;
}

export interface AppRequirementConfig {
  appKey: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  route: string;
  fields: AppRequirementField[];
}

export const APP_REQUIREMENTS: Record<string, AppRequirementConfig> = {
  kunda: {
    appKey: 'kunda',
    title: 'Kunda Space Dating',
    subtitle: 'Complete your dating profile to discover verified matches in your area.',
    icon: 'Heart',
    color: 'from-rose-500 to-pink-600',
    route: '/dating',
    fields: [
      {
        name: 'gender',
        label: 'Your Gender',
        type: 'select',
        options: ['Female', 'Male', 'Non-Binary', 'Prefer not to say'],
        required: true
      },
      {
        name: 'interested_in',
        label: 'Interested In Meeting',
        type: 'select',
        options: ['Men', 'Women', 'Everyone'],
        required: true
      },
      {
        name: 'age',
        label: 'Your Age (Must be 18+)',
        type: 'number',
        placeholder: 'e.g. 24',
        required: true
      },
      {
        name: 'city',
        label: 'City / Province',
        type: 'select',
        options: ['Kigali', 'Rubavu', 'Huye', 'Musanze', 'Nyagatare', 'Rusizi', 'Other International'],
        required: true
      },
      {
        name: 'intentions',
        label: 'Relationship Goals',
        type: 'select',
        options: ['Serious Relationship', 'Marriage Oriented', 'Casual Dating', 'Friendship & Networking'],
        required: true
      },
      {
        name: 'bio',
        label: 'Short Bio & Hobbies',
        type: 'textarea',
        placeholder: 'Tell potential matches about your passions, music taste, and what you enjoy doing...',
        required: false
      }
    ]
  },

  voxify: {
    appKey: 'voxify',
    title: 'Voxify Choir & Music Hub',
    subtitle: 'Set up your vocal classification and choir preferences for practice parts and sheet music.',
    icon: 'Music',
    color: 'from-emerald-500 to-teal-600',
    route: '/music',
    fields: [
      {
        name: 'voice_part',
        label: 'Voice Classification',
        type: 'select',
        options: ['Soprano (Voice 1)', 'Alto (Voice 2)', 'Tenor (Voice 3)', 'Bass (Voice 4)', 'Choir Director / Maestro', 'Pianist / Organist', 'Listener / Solo Artist'],
        required: true
      },
      {
        name: 'choir_name',
        label: 'Choir / Church / Band Name',
        type: 'text',
        placeholder: 'e.g. Choeur International de Kigali, Regina Pacis, St. Famille...',
        required: false
      },
      {
        name: 'experience_level',
        label: 'Musical Experience',
        type: 'select',
        options: ['Beginner (Learning Solfa & Notation)', 'Intermediate (Active Choir Member)', 'Advanced (Sight Reader)', 'Professional Musician'],
        required: true
      },
      {
        name: 'primary_genre',
        label: 'Primary Repertoire',
        type: 'select',
        options: ['Gospel & Hymns', 'Classical Liturgical (Bach, Handel, Mozart)', 'Contemporary African Worship', 'Traditional Rwandan Polyphony'],
        required: true
      }
    ]
  },

  marketplace: {
    appKey: 'marketplace',
    title: 'Benix Marketplace',
    subtitle: 'Personalize your marketplace delivery location and seller preferences.',
    icon: 'ShoppingBag',
    color: 'from-amber-500 to-orange-600',
    route: '/marketplace',
    fields: [
      {
        name: 'account_role',
        label: 'Your Primary Marketplace Activity',
        type: 'select',
        options: ['Buyer Only (Browse and purchase products)', 'Seller / Verified Merchant (List and sell items)', 'Both Buyer & Seller'],
        required: true
      },
      {
        name: 'delivery_city',
        label: 'Default Delivery City / District',
        type: 'text',
        placeholder: 'e.g. Kigali - Kicukiro / Gasabo / Nyarugenge',
        required: true
      },
      {
        name: 'preferred_payment',
        label: 'Preferred Payment Method',
        type: 'select',
        options: ['MTN Mobile Money (MoMo)', 'Airtel Money', 'Benix Central Wallet', 'Bank Transfer / Card'],
        required: true
      },
      {
        name: 'store_name',
        label: 'Store / Business Name (If Selling)',
        type: 'text',
        placeholder: 'Leave blank if browsing as buyer',
        required: false
      }
    ]
  },

  tv: {
    appKey: 'tv',
    title: 'Benix TV & Video Streaming',
    subtitle: 'Configure your favorite TV channels and streaming quality.',
    icon: 'Tv',
    color: 'from-blue-600 to-indigo-700',
    route: '/tv',
    fields: [
      {
        name: 'favorite_content',
        label: 'Preferred Broadcast Genres (Choose Multiple)',
        type: 'multiselect',
        options: [
          'Live News & Tele-Amakuru',
          'Live Sports & Highlights',
          'Local Movies & Series',
          'Gospel & Choir Worship',
          'Music Videos & Youth Shows',
          'Documentaries & Rwandan History',
          'Business, Tech & Innovation',
          'Kids & Educational TV'
        ],
        required: true,
        defaultValue: ['Live News & Tele-Amakuru', 'Live Sports & Highlights', 'Local Movies & Series']
      },
      {
        name: 'streaming_quality',
        label: 'Default Streaming Quality',
        type: 'select',
        options: ['Auto Quality (Recommended)', '1080p FHD (High-Speed Wi-Fi)', '720p HD', 'Data Saver (Low Mobile Bandwidth)'],
        required: true,
        defaultValue: 'Auto Quality (Recommended)'
      },
      {
        name: 'preferred_language',
        label: 'Primary Audio Language',
        type: 'select',
        options: ['Kinyarwanda & English', 'Kinyarwanda Only', 'English Only', 'French', 'Swahili'],
        required: true,
        defaultValue: 'Kinyarwanda & English'
      }
    ]
  },

  radio: {
    appKey: 'radio',
    title: 'Benix Radio Live 24/7',
    subtitle: 'Choose your default radio broadcast region and genre preferences.',
    icon: 'Radio',
    color: 'from-cyan-500 to-blue-600',
    route: '/radio',
    fields: [
      {
        name: 'primary_station',
        label: 'Favorite Primary Radio Station',
        type: 'select',
        options: ['Radio Rwanda 100.7 FM (National Flagship)', 'Magic FM 90.7 FM (Urban Youth & Music)', 'Kigali Wave 94.7 FM (Afrobeats & Hits)', 'Radio Rubavu 105.1 FM', 'Radio Musanze 90.0 FM', 'Radio Huye 100.4 FM', 'Radio Nyagatare 96.6 FM', 'Radio Inteko 89.6 FM (Parliamentary)'],
        required: true
      },
      {
        name: 'music_preference',
        label: 'Favorite Radio Music Style',
        type: 'select',
        options: ['Afrobeats & Pop', 'Gospel & Spiritual', 'Oldies & Traditional Rwandan Music', 'Talk Radio & Live Sports Commentary', 'Hip Hop & RnB'],
        required: true
      }
    ]
  },

  games: {
    appKey: 'games',
    title: 'Benix Games & RollDice',
    subtitle: 'Verify your age and gaming preferences for interactive wallet wagering.',
    icon: 'Gamepad2',
    color: 'from-purple-600 to-indigo-800',
    route: '/games',
    fields: [
      {
        name: 'gamer_tag',
        label: 'Player GamerTag / Nickname',
        type: 'text',
        placeholder: 'e.g. KigaliKing250',
        required: true
      },
      {
        name: 'default_bet',
        label: 'Default Wagering Unit',
        type: 'select',
        options: ['100 RWF', '250 RWF', '500 RWF', '1,000 RWF', '5,000 RWF'],
        required: true
      },
      {
        name: 'age_confirmed',
        label: 'I confirm that I am at least 18 years of age and agree to fair play policies.',
        type: 'checkbox',
        required: true
      }
    ]
  },

  calc: {
    appKey: 'calc',
    title: 'Benix Easy Calc Suite',
    subtitle: 'Select your default calculator workspace and business tools.',
    icon: 'Calculator',
    color: 'from-teal-600 to-emerald-700',
    route: '/calc',
    fields: [
      {
        name: 'primary_tool',
        label: 'Most Used Calculator Tool',
        type: 'select',
        options: ['Business & 18% VAT Tax Calculator', 'Loan & Mortgage Amortization', 'Currency Exchange Converter', 'Salary & PAYE Net Estimator', 'Scientific & Engineering Calculator'],
        required: true
      },
      {
        name: 'default_currency',
        label: 'Default Base Currency',
        type: 'select',
        options: ['RWF (Rwandan Franc)', 'USD (US Dollar)', 'EUR (Euro)', 'UGX (Ugandan Shilling)', 'KES (Kenyan Shilling)'],
        required: true
      }
    ]
  }
};

// Aliases for seamless route / feature mapping so APP_REQUIREMENTS[key] is never undefined
APP_REQUIREMENTS.dating = APP_REQUIREMENTS.kunda;
APP_REQUIREMENTS.music = APP_REQUIREMENTS.voxify;
APP_REQUIREMENTS.videos = APP_REQUIREMENTS.tv;
