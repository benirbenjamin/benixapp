/**
 * BenixSpace Multilingual Moderation & Anti-Contact Leak Engine
 * Supports Kinyarwanda, English, and French vulgarity moderation,
 * leetspeak normalization, and strict contact/phone filtering (from Kunda & BenixTV).
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

// Spelled-out numbers in English, Kinyarwanda, and French for contact-leak detection
const EN_NUMBER_WORDS: Record<string, string> = {
  zero: '0', oh: '0', one: '1', two: '2', three: '3', four: '4', five: '5',
  six: '6', seven: '7', eight: '8', nine: '9', ten: '10'
};

const RW_NUMBER_WORDS: Record<string, string> = {
  zeru: '0', zero: '0', rimwe: '1', kabiri: '2', gatatu: '3', kane: '4',
  gatanu: '5', gatandatu: '6', karindwi: '7', umunani: '8', icyenda: '9', icumi: '10'
};

const FR_NUMBER_WORDS: Record<string, string> = {
  zero: '0', zéro: '0', un: '1', une: '1', deux: '2', trois: '3',
  quatre: '4', cinq: '5', six: '6', sept: '7', huit: '8', neuf: '9', dix: '10'
};

const SOCIAL_MEDIA_KEYWORDS = [
  'whatsapp', 'whatsap', 'whats app', 'wa.me', 'watsapp',
  'instagram', 'insta', 'ig:', 'ig :', 'ig handle',
  'telegram', 't.me', 'tele:',
  'snapchat', 'snap:', 'snapchat:',
  'facebook', 'fb:', 'fb :',
  'tiktok', 'tik tok',
  'call me on', 'reach me at', 'text me on', 'hit me on',
  'hamagara kuri', 'unyandikire kuri', 'nimero yanjye', 'nimero ya telefone',
  'appelle moi sur', 'mon numero est', 'ecris moi sur'
];

/**
 * Normalizes input text by mapping leetspeak characters, removing diacritics/accents,
 * and collapsing repeated letters.
 */
export function normalizeText(raw: string): string {
  if (!raw) return '';

  let text = raw.toLowerCase();

  // Strip diacritics / accents
  text = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Leetspeak substitutions
  text = text
    .replace(/[@4]/g, 'a')
    .replace(/[0]/g, 'o')
    .replace(/[1!|]/g, 'i')
    .replace(/[$5]/g, 's')
    .replace(/[3]/g, 'e')
    .replace(/[7+]/g, 't')
    .replace(/[8]/g, 'b');

  // Strip non-alphanumeric
  const strippedSymbols = text.replace(/[^a-z0-9]/g, '');

  // Collapse 3+ repeating characters
  return strippedSymbols.replace(/(.)\1{2,}/g, '$1$1');
}

export interface ModerationResult {
  isInappropriate: boolean;
  flaggedWord?: string;
  category?: 'Kinyarwanda' | 'English' | 'French' | 'Custom';
  reason?: string;
}

/**
 * Validates whether a username, video title, or comment contains prohibited offensive words.
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
    .split(/[\s,.\-_/:;!?()]+/);

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
        reason: 'Contains inappropriate Kinyarwanda language or vulgar slang.',
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
        reason: 'Contains prohibited offensive English terms.',
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
        reason: 'Contains prohibited offensive French terms.',
      };
    }
  }

  return { isInappropriate: false };
}

/**
 * Validates chat messages against direct contact leakage (phone numbers, spelled numbers, social handles)
 */
export interface ContactModerationResult {
  isViolation: boolean;
  violationType?: 'phone_digits' | 'phone_words' | 'social_media';
  reason?: string;
  matchedPattern?: string;
}

export function checkContactModeration(message: string): ContactModerationResult {
  if (!message || typeof message !== 'string') {
    return { isViolation: false };
  }

  // 1. Phone digits (7+ digits)
  const cleaned = message.replace(/[\s.\-()+_]/g, '');
  const digitMatch = cleaned.match(/\d{7,15}/);
  if (digitMatch) {
    return {
      isViolation: true,
      violationType: 'phone_digits',
      reason: 'Sharing phone numbers directly in chat is restricted for community safety.',
      matchedPattern: digitMatch[0],
    };
  }

  // Interspersed digits
  const interspersed = message.match(/(?:\d[\s.\-_*#@]{0,3}){7,15}\d/);
  if (interspersed) {
    return {
      isViolation: true,
      violationType: 'phone_digits',
      reason: 'Sharing phone numbers directly in chat is restricted for community safety.',
      matchedPattern: interspersed[0],
    };
  }

  // 2. Spelled out numbers (min 4 in sequence)
  const normWords = message.toLowerCase().split(/[\s,.;:!?\-/]+/);
  let count = 0;
  const seq: string[] = [];
  for (const w of normWords) {
    if (EN_NUMBER_WORDS[w] || RW_NUMBER_WORDS[w] || FR_NUMBER_WORDS[w]) {
      count++;
      seq.push(w);
      if (count >= 4) {
        return {
          isViolation: true,
          violationType: 'phone_words',
          reason: 'Spelling out phone numbers in words is detected and restricted.',
          matchedPattern: seq.join(' '),
        };
      }
    } else if (count > 0 && w !== 'and' && w !== 'na' && w !== 'et') {
      count = 0;
      seq.length = 0;
    }
  }

  // 3. Social media handles
  const lowerMsg = message.toLowerCase();
  for (const kw of SOCIAL_MEDIA_KEYWORDS) {
    if (lowerMsg.includes(kw)) {
      return {
        isViolation: true,
        violationType: 'social_media',
        reason: `Sharing external contact platforms (${kw}) is restricted. You can use Direct Contact Unlock once mutual interest is established.`,
        matchedPattern: kw,
      };
    }
  }

  return { isViolation: false };
}

export function containsProfanity(text: string): boolean {
  return checkInappropriateLanguage(text).isInappropriate;
}

export function getDetectedProfaneWords(text: string): string[] {
  const res = checkInappropriateLanguage(text);
  return res.flaggedWord ? [res.flaggedWord] : [];
}

