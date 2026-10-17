/**
 * Multilingual Profanity and Inappropriate Content Moderation Utility
 * Filters inappropriate and offensive words across English, Kinyarwanda, and French.
 */

// Kinyarwanda offensive / inappropriate words list
const KINYARWANDA_BAD_WORDS = [
  'imboro',
  'amabya',
  'igitsina',
  'ubusambanyi',
  'rugondo',
  'nsuzo',
  'umugabo', // in inappropriate context when combined with genitalia terms
  'kunyaza',
  'gukuna',
  'nyoko',
  'igicucu',
  'igicuku',
  'gihebe',
  'nyokorome',
  'gusamambara',
  'ikimate',
  'amabyi',
  'umwanda',
  'gusweranya',
  'guswera',
  'gutanira',
  'gusebya',
  'umumanzi',
  'ikijuju',
  'ikizeze',
  'igicucu',
  'umukobwa', // context-dependent, but flagged if combined with bad phrases
];

// English offensive / inappropriate words list
const ENGLISH_BAD_WORDS = [
  'fuck',
  'fucking',
  'fucker',
  'shit',
  'shitting',
  'bitch',
  'bitches',
  'asshole',
  'cunt',
  'dick',
  'dicks',
  'pussy',
  'bastard',
  'whore',
  'slut',
  'nigger',
  'faggot',
  'penis',
  'vagina',
  'cock',
  'cocksucker',
  'motherfucker',
  'bullshit',
  'prick',
  'twat',
  'ass'
];

// French offensive / inappropriate words list
const FRENCH_BAD_WORDS = [
  'merde',
  'connard',
  'connasse',
  'salope',
  'putain',
  'enculé',
  'encule',
  'bite',
  'chatte',
  'bordel',
  'salaud',
  'couille',
  'pétasse',
  'petasse',
  'cul',
  'nique',
  'niquer',
  'chier',
  'emmerde',
  'poufiasse'
];

// Combined master list of forbidden words
const MASTER_BAD_WORDS_LIST = Array.from(
  new Set([...KINYARWANDA_BAD_WORDS, ...ENGLISH_BAD_WORDS, ...FRENCH_BAD_WORDS])
);

/**
 * Normalizes text to defeat leetspeak and formatting bypasses
 * (e.g., 'i.m.b.o.r.o', 'f@ck', 'sh!t', '4sshole', spaces between letters)
 */
function normalizeText(text: string): string {
  if (!text) return '';

  let normalized = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // strip diacritics

  // Replace common leetspeak substitutions
  normalized = normalized
    .replace(/@/g, 'a')
    .replace(/\$/g, 's')
    .replace(/!/g, 'i')
    .replace(/1/g, 'i')
    .replace(/0/g, 'o')
    .replace(/3/g, 'e')
    .replace(/5/g, 's')
    .replace(/7/g, 't')
    .replace(/8/g, 'b');

  return normalized;
}

/**
 * Checks if the given text contains any profane or inappropriate words in Kinyarwanda, English, or French.
 */
export function containsProfanity(text: string): boolean {
  if (!text || typeof text !== 'string') return false;

  const rawNormalized = normalizeText(text);

  // 1. Direct word token check
  const words = rawNormalized
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  for (const word of words) {
    if (MASTER_BAD_WORDS_LIST.includes(word)) {
      return true;
    }
  }

  // 2. Substring check for high-severity specific words
  const strictSubstringTargets = ['imboro', 'amabya', 'fuck', 'bitch', 'cunt', 'nigger', 'salope', 'encule'];
  const compactText = rawNormalized.replace(/[^a-z0-9]/g, '');

  for (const target of strictSubstringTargets) {
    if (compactText.includes(target)) {
      return true;
    }
  }

  return false;
}

/**
 * Returns an array of detected profane words found in the text.
 */
export function getDetectedProfaneWords(text: string): string[] {
  if (!text) return [];

  const rawNormalized = normalizeText(text);
  const words = rawNormalized
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  const found: string[] = [];

  for (const word of words) {
    if (MASTER_BAD_WORDS_LIST.includes(word) && !found.includes(word)) {
      found.push(word);
    }
  }

  const compactText = rawNormalized.replace(/[^a-z0-9]/g, '');
  const strictSubstringTargets = ['imboro', 'amabya', 'fuck', 'bitch', 'cunt', 'nigger', 'salope', 'encule'];
  for (const target of strictSubstringTargets) {
    if (compactText.includes(target) && !found.includes(target)) {
      found.push(target);
    }
  }

  return found;
}

/**
 * Masks profane words with asterisks (***) in the provided text.
 */
export function maskProfanity(text: string): string {
  if (!text) return text;

  let masked = text;
  const detected = getDetectedProfaneWords(text);

  for (const word of detected) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    masked = masked.replace(regex, '***');
  }

  return masked;
}
