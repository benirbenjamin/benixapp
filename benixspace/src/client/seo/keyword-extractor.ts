export interface InternalLinkSuggestion {
  text: string;
  url: string;
  description: string;
}

export const INTERNAL_LINK_SUGGESTIONS: InternalLinkSuggestion[] = [
  { text: 'NebeluRw Services', url: '/services', description: 'Link to software development & digital marketing services' },
  { text: 'BenixSpace Projects', url: '/projects', description: 'Link to full ecosystem project portfolio' },
  { text: 'Benix Space TV', url: '/projects/benix-space-tv', description: 'Link to online TV streaming platform' },
  { text: 'Benix Radio', url: '/projects/radio', description: 'Link to 24/7 digital radio station' },
  { text: 'Voxify Platform', url: '/projects/voxify', description: 'Link to digital choir & music platform' },
  { text: 'Benix Easy Calc', url: '/projects/easy-calc', description: 'Link to calculator utilities' },
  { text: 'Contact NebeluRw', url: '/contact', description: 'Link to contact form & consultations' }
];

export function extractSuggestedKeywords(title: string, content: string): string[] {
  const combined = (title + ' ' + content.replace(/<[^>]+>/g, '')).toLowerCase();
  
  const commonKeywords = [
    'rwanda', 'software development', 'nebelurw', 'benixspace',
    'web applications', 'digital streaming', 'seo optimization',
    'benix space tv', 'benix radio', 'voxify', 'easy calc',
    'digital marketing', 'music distribution', 'video production',
    'gospel music', 'kigali tech', 'media platform', 'web development'
  ];

  const matched = commonKeywords.filter((kwd) => combined.includes(kwd));

  if (matched.length === 0) {
    return ['NebeluRw', 'BenixSpace', 'Software Development', 'Rwanda Tech'];
  }

  return Array.from(new Set(matched)).slice(0, 8);
}
