// Seed data definitions for BenixSpace auto-initialization

export const INITIAL_COMPANY_DATA = {
  company_name: 'NebeluRw Co. Ltd',
  company_description: 'NebeluRw Co. Ltd is a modern technology and digital services company developing digital platforms, web applications, streaming services, and professional media solutions.',
  history: 'Founded by Benir Benjamin, NebeluRw Co. Ltd started as an innovative technology venture aimed at delivering high-performance digital platforms and audio-visual services across Rwanda and internationally.',
  founder_name: 'Benir Benjamin',
  founder_bio: 'Benir Benjamin is the founder and lead developer behind NebeluRw Co. Ltd and the BenixSpace ecosystem, pioneering digital media, web platforms, and streaming solutions.',
  email: 'benirabok@gmail.com',
  phone: '0783987223',
  address: 'Kigali, Rwanda',
  services_json: JSON.stringify([
    {
      id: 'web-dev',
      title: 'Software & Web Development',
      description: 'Custom websites, web applications, business platforms, management systems, and utility applications.',
      icon: 'Code'
    },
    {
      id: 'seo-marketing',
      title: 'Digital Marketing & SEO',
      description: 'Search engine optimization, content strategy, social media marketing, and online brand promotion.',
      icon: 'TrendingUp'
    },
    {
      id: 'social-mgmt',
      title: 'Social Media Management',
      description: 'Comprehensive social media management, content publishing, promotional campaigns, and brand visibility.',
      icon: 'Share2'
    },
    {
      id: 'youtube',
      title: 'YouTube Services',
      description: 'Channel creation, video optimization, publishing strategies, and subscriber growth management.',
      icon: 'Youtube'
    },
    {
      id: 'audio-music',
      title: 'Audio & Music Production',
      description: 'Music recording, professional audio mixing, gospel & commercial music projects, and studio production.',
      icon: 'Music'
    },
    {
      id: 'video-prod',
      title: 'Video Production',
      description: 'High-quality promotional videos, social media video content, event coverage, and music videos.',
      icon: 'Video'
    },
    {
      id: 'music-dist',
      title: 'Music Distribution',
      description: 'Global music distribution to platforms like Spotify, Deezer, Boomplay, Apple Music, and YouTube Music.',
      icon: 'Radio'
    },
    {
      id: 'design-photo',
      title: 'Photography & Graphic Design',
      description: 'Event photography, promotional artwork, digital flyers, logo design, and corporate branding.',
      icon: 'Camera'
    },
    {
      id: 'instruments',
      title: 'Musical Instruments Assistance',
      description: 'Connecting customers with reliable vendors to source and purchase quality musical instruments.',
      icon: 'Sliders'
    }
  ])
};

export const INITIAL_SOCIAL_LINKS = [
  { platform: 'Facebook', handle: 'benir.thegeneral', custom_url: 'https://facebook.com/benir.thegeneral', sort_order: 1 },
  { platform: 'Instagram', handle: 'benirbenjamin', custom_url: 'https://instagram.com/benirbenjamin', sort_order: 2 },
  { platform: 'X', handle: 'benirbenjamin', custom_url: 'https://x.com/benirbenjamin', sort_order: 3 },
  { platform: 'TikTok', handle: 'benir250', custom_url: 'https://tiktok.com/@benir250', sort_order: 4 },
  { platform: 'YouTube', handle: 'nebelurw', custom_url: 'https://youtube.com/@nebelurw', sort_order: 5 },
];

export const INITIAL_PROJECTS = [
  {
    name: 'Benix Space TV',
    slug: 'benix-space-tv',
    url: 'https://tv.benix.space',
    short_description: 'An online digital TV and radio streaming platform bringing entertainment, news, and live media.',
    full_description: 'Benix Space TV is an online television and radio streaming platform developed by NebeluRw Co. Ltd. It delivers high-quality live video streaming, scheduled broadcasts, and interactive digital media channels accessible seamlessly across desktop and mobile devices.',
    image_url: '/benix tv.png',
    gallery_images: JSON.stringify(['/benix tv.png']),
    category: 'Streaming & Media',
    tags: JSON.stringify(['TV Streaming', 'Live Broadcast', 'NebeluRw', 'Media Platform']),
    technologies: JSON.stringify(['React', 'TypeScript', 'HLS Video', 'Node.js', 'PostgreSQL']),
    status: 'published',
    featured: true,
    embed_mode: 'both',
    sort_order: 1,
    seo_title: 'Benix Space TV — Live Streaming & Radio Platform by NebeluRw',
    seo_description: 'Watch live TV streaming, video broadcasts, and radio stations on Benix Space TV, developed by NebeluRw Co. Ltd.',
    seo_keywords: 'Benix Space TV, streaming Rwanda, online TV Rwanda, NebeluRw media, live radio streaming'
  },
  {
    name: 'Benix Games',
    slug: 'benix-games',
    url: 'https://games.benix.space',
    short_description: 'Interactive online gaming portal featuring HTML5 games, entertainment, and leaderboard challenges.',
    full_description: 'Benix Games is a digital gaming platform designed to provide instant online web games, interactive challenges, and engaging leisure activities for users across all browser platforms.',
    image_url: '/benix games.png',
    gallery_images: JSON.stringify(['/benix games.png']),
    category: 'Gaming & Entertainment',
    tags: JSON.stringify(['Games', 'Web Games', 'Interactive', 'NebeluRw']),
    technologies: JSON.stringify(['HTML5 Canvas', 'React', 'JavaScript', 'Tailwind CSS']),
    status: 'published',
    featured: true,
    embed_mode: 'both',
    sort_order: 2,
    seo_title: 'Benix Games — Instant Browser Games & Entertainment Portal',
    seo_description: 'Play fun online web games on Benix Games. Lightweight, fast, and entertaining games developed by NebeluRw.',
    seo_keywords: 'Benix Games, web games, browser gaming Rwanda, Benix space games, NebeluRw platforms'
  },
  {
    name: 'Benix Easy Calc',
    slug: 'easy-calc',
    url: 'https://easycalc.benix.space',
    short_description: 'A comprehensive collection of online calculators, converters, and smart digital utility tools.',
    full_description: 'Benix Easy Calc provides instant calculation utilities for business, finance, unit conversion, engineering math, and daily productivity. Designed for speed, precision, and mobile usability.',
    image_url: '/easy calc.png',
    gallery_images: JSON.stringify(['/easy calc.png']),
    category: 'Utility & Tools',
    tags: JSON.stringify(['Calculators', 'Productivity', 'Utilities', 'Math Tools']),
    technologies: JSON.stringify(['React', 'TypeScript', 'Tailwind CSS', 'Vite']),
    status: 'published',
    featured: true,
    embed_mode: 'both',
    sort_order: 3,
    seo_title: 'Benix Easy Calc — Online Calculators & Smart Utility Tools',
    seo_description: 'Use fast, accurate online calculators for finance, unit conversions, math, and business with Benix Easy Calc by NebeluRw.',
    seo_keywords: 'Easy Calc, online calculator, unit converter, Benix calculators, NebeluRw software'
  },
  {
    name: 'Benix Radio',
    slug: 'radio',
    url: 'https://radio.benix.space',
    short_description: 'Online digital radio and music streaming station broadcasting music, podcasts, and audio shows.',
    full_description: 'Benix Radio provides 24/7 digital audio streaming, live DJ sets, music podcasts, and news commentary with crystal clear sound quality and responsive audio player controls.',
    image_url: '/radio-icon.svg',
    gallery_images: JSON.stringify(['/radio-icon.svg']),
    category: 'Streaming & Media',
    tags: JSON.stringify(['Radio', 'Audio Streaming', 'Music Station', 'NebeluRw']),
    technologies: JSON.stringify(['React', 'Web Audio API', 'Node.js', 'PostgreSQL']),
    status: 'published',
    featured: true,
    embed_mode: 'both',
    sort_order: 4,
    seo_title: 'Benix Radio — 24/7 Digital Radio & Music Streaming Station',
    seo_description: 'Listen to live digital radio broadcasts, music playlists, and audio shows on Benix Radio by NebeluRw Co. Ltd.',
    seo_keywords: 'Benix Radio, online radio Rwanda, music streaming, digital radio station, NebeluRw audio'
  },
  {
    name: 'Voxify',
    slug: 'voxify',
    url: 'https://voxify.space',
    short_description: 'Digital platform for choirs, gospel artists, music distribution, and audio composition showcase.',
    full_description: 'Voxify is a dedicated music and choir ecosystem created by NebeluRw Co. Ltd to empower gospel choirs, independent vocalists, and musical groups with digital streaming, song catalogs, and distribution management.',
    image_url: '/voxify.png',
    gallery_images: JSON.stringify(['/voxify.png']),
    category: 'Music Ecosystem',
    tags: JSON.stringify(['Choirs', 'Gospel Music', 'Artists Platform', 'Music Hub']),
    technologies: JSON.stringify(['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Tailwind CSS']),
    status: 'published',
    featured: true,
    embed_mode: 'both',
    sort_order: 5,
    seo_title: 'Voxify — Digital Music & Choir Platform by NebeluRw',
    seo_description: 'Discover gospel music, choir catalogs, artist profiles, and song releases on Voxify platform.',
    seo_keywords: 'Voxify space, choir platform, gospel music Rwanda, choir digital library, NebeluRw music'
  }
];

export const INITIAL_CATEGORIES = [
  { name: 'Technology', slug: 'technology', type: 'article', description: 'Tech trends, software development, and innovations.' },
  { name: 'Software Development', slug: 'software-development', type: 'article', description: 'Web applications, APIs, and modern engineering.' },
  { name: 'Digital Marketing & SEO', slug: 'digital-marketing-seo', type: 'article', description: 'SEO optimization, growth strategies, and online marketing.' },
  { name: 'NebeluRw News', slug: 'nebelurw-news', type: 'article', description: 'Official announcements and platform updates from NebeluRw Co. Ltd.' },
  { name: 'Streaming & Media', slug: 'streaming-media', type: 'project', description: 'Live video and radio streaming platforms.' },
  { name: 'Utility & Tools', slug: 'utility-tools', type: 'project', description: 'Web productivity calculators and software tools.' },
];

export const INITIAL_BLOG_ARTICLES = [
  {
    title: 'Building Modern Web Applications for Rwanda’s Digital Ecosystem',
    slug: 'building-modern-web-applications-rwanda-digital-ecosystem',
    summary: 'An insight into how NebeluRw Co. Ltd designs scalable digital platforms, streaming services, and custom software solutions.',
    content: `<h2>The Rise of Rwanda's Digital Transformation</h2>
<p>Rwanda has rapidly emerged as a vibrant technology hub in East Africa. At <strong>NebeluRw Co. Ltd</strong>, led by Benir Benjamin, our primary mission is to build robust, scalable, and user-friendly digital platforms that empower local businesses, creators, and online communities.</p>

<h3>Key Pillars of NebeluRw Digital Ecosystem</h3>
<ul>
  <li><strong>BenixSpace Platform:</strong> The central digital portfolio and CMS engine.</li>
  <li><strong>Streaming Media:</strong> Benix Space TV & Benix Radio delivering 24/7 audio-visual content.</li>
  <li><strong>Productivity Utilities:</strong> Easy Calc bringing smart calculation tools to everyday users.</li>
  <li><strong>Music Ecosystem:</strong> Voxify providing dedicated spaces for gospel choirs and vocal artists.</li>
</ul>

<p>To learn more about our development services, check out <a href="/services">NebeluRw Services</a> or explore our live project portfolio at <a href="/projects">BenixSpace Projects</a>.</p>`,
    featured_image_url: 'https://i.postimg.cc/85zP6mK2/benix-tv-cover.jpg',
    category: 'Software Development',
    tags: JSON.stringify(['Web Development', 'NebeluRw', 'Tech Ecosystem', 'Rwanda']),
    author_name: 'Benir Benjamin',
    status: 'published',
    seo_title: 'Building Modern Web Applications for Rwanda — NebeluRw Blog',
    seo_description: 'Discover how NebeluRw Co. Ltd builds digital platforms, streaming TV, and web applications in Rwanda.',
    seo_keywords: 'Rwanda web development, NebeluRw Co Ltd, BenixSpace, software company Kigali'
  },
  {
    title: 'Essential SEO Strategies for Digital Platforms in 2026',
    slug: 'essential-seo-strategies-for-digital-platforms-2026',
    summary: 'Discover key search engine optimization techniques, dynamic metadata, structured JSON-LD data, and sitemap best practices.',
    content: `<h2>Why SEO is Crucial for Modern Platforms</h2>
<p>Search Engine Optimization is no longer just about repeating keywords. In 2026, search engines prioritize fast loading speeds, structured semantic markup, dynamic sitemap indexing, and search intent alignment.</p>

<h3>Our Approach at BenixSpace</h3>
<p>Every platform built by NebeluRw includes automated Schema.org JSON-LD structured data, clean canonical URLs, optimized OpenGraph visual cards, and real-time SEO scoring tools built into the CMS admin panel.</p>`,
    featured_image_url: 'https://i.postimg.cc/q79Rcx49/easy-calc-cover.jpg',
    category: 'Digital Marketing & SEO',
    tags: JSON.stringify(['SEO', 'Digital Marketing', 'Web Growth']),
    author_name: 'Benir Benjamin',
    status: 'published',
    seo_title: 'Essential SEO Strategies for 2026 — NebeluRw SEO Insights',
    seo_description: 'Learn modern SEO optimization methods with NebeluRw Co. Ltd SEO strategy guide.',
    seo_keywords: 'SEO 2026, digital marketing Rwanda, search engine optimization, NebeluRw SEO'
  }
];
