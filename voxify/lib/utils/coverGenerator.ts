/**
 * Dynamic Audio Album Cover Art Generator
 * Creates an attractive, high-contrast SVG cover with acoustic textures,
 * harmonic gradients, and stylized song & artist typography.
 */

const GRADIENTS = [
  { from: '#1e1b4b', via: '#312e81', to: '#0f172a', accent: '#a855f7', text: '#ffffff' }, // Royal Indigo
  { from: '#022c22', via: '#064e3b', to: '#042f2e', accent: '#34d399', text: '#ffffff' }, // Deep Emerald
  { from: '#1e293b', via: '#0f172a', to: '#0284c7', accent: '#38bdf8', text: '#ffffff' }, // Ocean Blue
  { from: '#581c87', via: '#3b0764', to: '#18181b', accent: '#f472b6', text: '#ffffff' }, // Sunset Violet
  { from: '#1c1917', via: '#292524', to: '#431407', accent: '#fbbf24', text: '#ffffff' }, // Amber Gold
];

export function generateSongCover(options?: {
  title?: string | null;
  artistName?: string | null;
  genre?: string | null;
}): string {
  const rawTitle = (options?.title ? String(options.title).trim() : '') || 'Untitled Song';
  const rawArtist = (options?.artistName ? String(options.artistName).trim() : '') || 'Voxify Artist';
  const rawGenre = (options?.genre ? String(options.genre).trim() : '') || 'Original';

  // Pick deterministic gradient based on title length/character codes
  const charSum = rawTitle.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const theme = GRADIENTS[charSum % GRADIENTS.length];

  // Sanitize strings for SVG
  const safeTitle = rawTitle
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  const safeArtist = rawArtist
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  const safeGenre = rawGenre
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Break title into lines if long
  const words = safeTitle.split(' ');
  let line1 = words.slice(0, 3).join(' ');
  let line2 = words.slice(3, 6).join(' ');
  if (words.length > 6) line2 += '...';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="600" height="600">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.from}" />
      <stop offset="50%" stop-color="${theme.via}" />
      <stop offset="100%" stop-color="${theme.to}" />
    </linearGradient>

    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${theme.accent}" stop-opacity="0.35" />
      <stop offset="100%" stop-color="${theme.accent}" stop-opacity="0" />
    </radialGradient>

    <!-- Vinyl Groove Pattern -->
    <pattern id="grooves" width="20" height="20" patternUnits="userSpaceOnUse">
      <circle cx="10" cy="10" r="8" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="1" />
    </pattern>
  </defs>

  <!-- Background Base -->
  <rect width="600" height="600" fill="url(#bgGrad)" />
  <rect width="600" height="600" fill="url(#grooves)" />

  <!-- Ambient Glow -->
  <circle cx="450" cy="150" r="280" fill="url(#glow)" />
  <circle cx="150" cy="450" r="220" fill="url(#glow)" />

  <!-- Concentric Acoustic Wave Rings -->
  <circle cx="300" cy="240" r="160" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1.5" stroke-dasharray="4 8" />
  <circle cx="300" cy="240" r="120" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="2" />
  <circle cx="300" cy="240" r="80" fill="none" stroke="rgba(255,255,255,0.16)" stroke-width="2.5" />
  <circle cx="300" cy="240" r="40" fill="${theme.accent}" fill-opacity="0.2" stroke="${theme.accent}" stroke-width="3" />

  <!-- Central Musical Note Icon -->
  <g transform="translate(282, 218) scale(1.4)" fill="${theme.accent}">
    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
  </g>

  <!-- Soundwave Equalizer Texture Bars -->
  <g fill="${theme.accent}" opacity="0.75" transform="translate(140, 390)">
    <rect x="0" y="20" width="8" height="40" rx="4" />
    <rect x="18" y="10" width="8" height="60" rx="4" />
    <rect x="36" y="28" width="8" height="24" rx="4" />
    <rect x="54" y="5" width="8" height="70" rx="4" />
    <rect x="72" y="18" width="8" height="44" rx="4" />
    <rect x="90" y="32" width="8" height="16" rx="4" />
    <rect x="108" y="12" width="8" height="56" rx="4" />
    <rect x="126" y="2" width="8" height="76" rx="4" />
    <rect x="144" y="22" width="8" height="36" rx="4" />
    <rect x="162" y="8" width="8" height="64" rx="4" />
    <rect x="180" y="30" width="8" height="20" rx="4" />
    <rect x="198" y="15" width="8" height="50" rx="4" />
    <rect x="216" y="25" width="8" height="30" rx="4" />
    <rect x="234" y="4" width="8" height="72" rx="4" />
    <rect x="252" y="16" width="8" height="48" rx="4" />
    <rect x="270" y="26" width="8" height="28" rx="4" />
    <rect x="288" y="14" width="8" height="52" rx="4" />
    <rect x="306" y="20" width="8" height="40" rx="4" />
  </g>

  <!-- Genre Badge -->
  <g transform="translate(50, 48)">
    <rect x="0" y="0" width="${safeGenre.length * 9 + 30}" height="32" rx="16" fill="rgba(0,0,0,0.6)" stroke="${theme.accent}" stroke-width="1.5" />
    <text x="15" y="21" font-family="'Inter', -apple-system, sans-serif" font-size="12" font-weight="800" fill="#ffffff" letter-spacing="1.5">
      ${safeGenre.toUpperCase()}
    </text>
  </g>

  <!-- Voxify Brand Stamp -->
  <g transform="translate(480, 48)">
    <text x="0" y="22" font-family="'Inter', -apple-system, sans-serif" font-size="12" font-weight="900" fill="rgba(255,255,255,0.4)" letter-spacing="2">
      VOXIFY
    </text>
  </g>

  <!-- Song Title (High Contrast Bold) -->
  <text x="50" y="495" font-family="'Inter', system-ui, sans-serif" font-size="34" font-weight="900" fill="#ffffff" letter-spacing="-0.5">
    ${line1}
  </text>
  ${line2 ? `<text x="50" y="535" font-family="'Inter', system-ui, sans-serif" font-size="28" font-weight="900" fill="#ffffff" letter-spacing="-0.5">${line2}</text>` : ''}

  <!-- Artist Stage Name -->
  <text x="50" y="${line2 ? 568 : 538}" font-family="'Inter', system-ui, sans-serif" font-size="16" font-weight="700" fill="${theme.accent}" letter-spacing="0.5">
    ${safeArtist}
  </text>
</svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
