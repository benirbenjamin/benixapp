/**
 * Multilingual Moderation Engine (Kinyarwanda, English, French)
 * Normalizes text, handles leetspeak and symbols, and checks against prohibited dictionaries.
 */

export const DEFAULT_KINYARWANDA_BLOCKED: string[] = [
  'igituba',
  'igisundi',
  'imboro',
  'amabyi',
  'amabya',
  'guswera',
  'waswera',
  'nyoko',
  'nyokombwa',
  'umusino',
  'umukondo',
  'indaya',
  'ikibuno',
  'imbwa',
  'ikimanyi',
  'umuswere',
  'gucumita',
  'igitoki',
  'gaswerwe',
  'guca inyuma',
  'uburozi',
  'kazana',
  'icyomanzi',
  'umushino',
  'umusinzi',
  'umukobwa gito',
  'icyihebe',
  'amatama yigituba',
  'kwinjira',
  'ikiroryi',
  'gupfusha',
  'amangwe',
];

export const DEFAULT_ENGLISH_BLOCKED: string[] = [
  'fuck',
  'fucking',
  'fucker',
  'bitch',
  'shit',
  'dick',
  'pussy',
  'asshole',
  'slut',
  'cunt',
  'whore',
  'bastard',
  'faggot',
  'nigger',
  'nigga',
  'porn',
  'boobs',
  'rape',
  'dumbass',
  'motherfucker',
  'cock',
  'twat',
  'retard',
  'wanker',
  'blowjob',
  'penis',
  'vagina',
];

export const DEFAULT_FRENCH_BLOCKED: string[] = [
  'merde',
  'putain',
  'con',
  'connard',
  'connasse',
  'salope',
  'bite',
  'chatte',
  'encule',
  'enculee',
  'batard',
  'nique',
  'niquer',
  'baise',
  'baiser',
  'fdp',
  'chienne',
  'couille',
  'bordel',
  'foutre',
  'gueule',
  'abruti',
];

export const ALL_DEFAULT_BLOCKED_WORDS: string[] = [
  ...DEFAULT_KINYARWANDA_BLOCKED,
  ...DEFAULT_ENGLISH_BLOCKED,
  ...DEFAULT_FRENCH_BLOCKED,
];

/**
 * Normalizes input text by mapping common leetspeak characters, removing accents,
 * and collapsing repeated characters.
 */
export function normalizeText(raw: string): string {
  if (!raw) return '';

  let text = raw.toLowerCase();

  // Strip diacritics/accents
  text = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Leetspeak substitutions
  text = text
    .replace(/[@4]/g, 'a')
    .replace(/[0]/g, 'o')
    .replace(/[1!|]/g, 'i')
    .replace(/[]/g, 's')
    .replace(/[3]/g, 'e')
    .replace(/[7+]/g, 't')
    .replace(/[8]/g, 'b');

  // Remove internal spacing or symbols between letters (e.g., f.u.c.k, i-m-b-o-r-o)
  const strippedSymbols = text.replace(/[^a-z0-9]/g, '');

  // Collapse 3+ repeating letters (e.g. iiiimmmbooorrro -> imboro)
  const collapsed = strippedSymbols.replace(/(.)\1{2,}/g, '');

  return collapsed;
}

export interface ModerationResult {
  isInappropriate: boolean;
  flaggedWord?: string;
  category?: 'Kinyarwanda' | 'English' | 'French' | 'Custom';
  reason?: string;
}

/**
 * Validates whether a given username or comment contains sensitive or offensive terms.
 */
export function checkInappropriateLanguage(
  input: string,
  customBlockedWords: string[] = []
): ModerationResult {
  if (!input || !input.trim()) {
    return { isInappropriate: false };
  }

  const normalizedInput = normalizeText(input);
  const wordsInRaw = input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/[\s,\.\-_/:;!?()]+/);

  // Check Custom words first
  for (const customWord of customBlockedWords) {
    const norm = normalizeText(customWord);
    if (!norm) continue;
    if (normalizedInput.includes(norm) || wordsInRaw.includes(customWord.toLowerCase())) {
      return {
        isInappropriate: true,
        flaggedWord: customWord,
        category: 'Custom',
        reason: `Contains prohibited custom term: "${customWord}"`,
      };
    }
  }

 // Check Kinyarwanda
 for (const word of DEFAULT_KINYARWANDA_BLOCKED) {
 const norm = normalizeText(word);
 if (normalizedInput.includes(norm) || wordsInRaw.includes(word)) {
 return {
 isInappropriate: true,
 flaggedWord: word,
 category: 'Kinyarwanda',
 reason: 'Contains inappropriate Kinyarwanda language or slang.',
 };
 }
 }

 // Check English
 for (const word of DEFAULT_ENGLISH_BLOCKED) {
 const norm = normalizeText(word);
 if (normalizedInput.includes(norm) || wordsInRaw.includes(word)) {
 return {
 isInappropriate: true,
 flaggedWord: word,
 category: 'English',
 reason: 'Contains prohibited English offensive language.',
 };
 }
 }

 // Check French
 for (const word of DEFAULT_FRENCH_BLOCKED) {
 const norm = normalizeText(word);
 if (normalizedInput.includes(norm) || wordsInRaw.includes(word)) {
 return {
 isInappropriate: true,
 flaggedWord: word,
 category: 'French',
 reason: 'Contains prohibited French offensive language.',
 };
 }
 }

 return { isInappropriate: false };
}

/**
 * Replaces any detected offensive words with asterisks.
 */
export function censorText(text: string, customWords: string[] = []): string {
 if (!text) return '';
 const allWords = [...ALL_DEFAULT_BLOCKED_WORDS, ...customWords];
 let censored = text;

  allWords.forEach((word) => {
    if (!word) return;
    try {
      const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
      censored = censored.replace(regex, (match) => '*'.repeat(match.length));
    } catch (e) {}
  });

 return censored;
}
