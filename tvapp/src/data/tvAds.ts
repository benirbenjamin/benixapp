export interface TVAd {
  id: string;
  sponsor: string;
  category: string;
  title: string;
  tagline: string;
  description: string;
  ctaText: string;
  ctaUrl: string;
  bgGradient: string;
  accentColor: string;
  badgeText: string;
  iconName: 'momo' | 'bk' | 'rwanda' | 'rwandair' | 'airtel' | 'inyange';
  highlights: string[];
}

export const TV_SPONSORED_ADS: TVAd[] = [
  {
    id: 'ad-momo',
    sponsor: 'MTN Rwanda',
    category: 'Mobile Financial Services',
    title: 'MTN MoMo • Cashless Living Across Rwanda',
    tagline: 'Together in Progress • Quick, Secure, Everywhere',
    description: 'Pay bills, send money to family, and purchase with MoMoPay at zero merchant transaction fee anywhere across Rwanda.',
    ctaText: 'Discover MoMo • Dial *182#',
    ctaUrl: 'https://www.mtn.co.rw',
    bgGradient: 'from-amber-600/90 via-yellow-500/85 to-amber-700/90',
    accentColor: '#ffcc00',
    badgeText: 'Official Partner',
    iconName: 'momo',
    highlights: ['Instant *182# transfers', 'Zero fee MoMoPay at shops', '24/7 nationwide coverage'],
  },
  {
    id: 'ad-bk',
    sponsor: 'Bank of Kigali',
    category: 'Banking & Financial Security',
    title: 'BK Mobile Banking • Growth In Your Pocket',
    tagline: 'Financially Transforming Rwanda For Generations',
    description: 'Access instant loans, open digital savings accounts, and transfer funds in seconds with the award-winning Bank of Kigali app.',
    ctaText: 'Explore BK Digital Services',
    ctaUrl: 'https://www.bk.rw',
    bgGradient: 'from-blue-900/95 via-blue-800/90 to-sky-900/95',
    accentColor: '#38bdf8',
    badgeText: 'Premier Sponsor',
    iconName: 'bk',
    highlights: ['Instant collateral-free loans', 'Secure biometric login', 'Zero maintenance savings'],
  },
  {
    id: 'ad-visit-rwanda',
    sponsor: 'Visit Rwanda',
    category: 'Tourism & Wildlife Conservation',
    title: 'Visit Rwanda • Land of a Thousand Hills',
    tagline: 'Remarkable Journeys, Majestic Wildlife, Endless Green',
    description: 'Immerse yourself in world-class gorilla trekking in Volcanoes National Park, scenic Lake Kivu shores, and pristine Nyungwe canopy walks.',
    ctaText: 'Plan Your Experience',
    ctaUrl: 'https://www.visitrwanda.com',
    bgGradient: 'from-emerald-900/95 via-green-800/90 to-teal-950/95',
    accentColor: '#34d399',
    badgeText: 'National Heritage',
    iconName: 'rwanda',
    highlights: ['Volcanoes gorilla trekking', 'Akagera Big Five safaris', 'Eco-luxury hospitality'],
  },
  {
    id: 'ad-rwandair',
    sponsor: 'RwandAir',
    category: 'National Flag Carrier Airline',
    title: 'RwandAir • Fly the Dream of Africa',
    tagline: 'Connecting Kigali Directly to 30+ Global Destinations',
    description: 'Fly directly from Kigali to London Heathrow, Paris CDG, Dubai, Johannesburg, Lagos, and Brussels with signature Rwandan hospitality.',
    ctaText: 'Book Flights Online',
    ctaUrl: 'https://www.rwandair.com',
    bgGradient: 'from-sky-900/95 via-indigo-900/90 to-slate-950/95',
    accentColor: '#60a5fa',
    badgeText: 'Official Airline',
    iconName: 'rwandair',
    highlights: ['Direct flights to Europe & Middle East', 'State-of-the-art Airbus fleet', 'Free extra baggage allowance'],
  },
  {
    id: 'ad-airtel',
    sponsor: 'Airtel Rwanda',
    category: 'Telecommunications & 4G',
    title: 'Airtel Rwanda • A Reason to Imagine',
    tagline: 'Fastest 4G Internet & Best Value Smartphone Deals',
    description: 'Stay connected with blazing-fast 4G streaming, affordable internet packs, and seamless mobile banking with Airtel Money.',
    ctaText: 'View 4G Bundles • Dial *151#',
    ctaUrl: 'https://www.airtel.co.rw',
    bgGradient: 'from-rose-950/95 via-red-900/90 to-amber-950/95',
    accentColor: '#f43f5e',
    badgeText: 'Network Sponsor',
    iconName: 'airtel',
    highlights: ['Ultra-speed 4G coverage', 'Special daily streaming bundles', 'Airtel Money zero fee'],
  },
  {
    id: 'ad-inyange',
    sponsor: 'Inyange Industries',
    category: 'Fresh Food & Beverages',
    title: 'Inyange Rwanda • Pure Quality Every Day',
    tagline: 'Farm-Fresh Milk, Natural Mineral Water & Fruit Juices',
    description: 'Crafted with 100% natural ingredients from Rwandan dairy farms and orchards. Trusted quality nourishing families across the country.',
    ctaText: 'Taste The Refreshment',
    ctaUrl: 'https://www.inyangeindustries.com',
    bgGradient: 'from-teal-900/95 via-emerald-800/90 to-cyan-950/95',
    accentColor: '#2dd4bf',
    badgeText: 'Quality Assured',
    iconName: 'inyange',
    highlights: ['100% fresh cow milk', 'Natural mineral bottled water', 'Refreshing tropical juices'],
  },
];
