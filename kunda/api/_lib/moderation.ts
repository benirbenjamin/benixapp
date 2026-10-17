// =====================================================================
// KUNDA SPACE: MULTILINGUAL CONTACT LEAK & SOCIAL MEDIA DETECTION
// =====================================================================

export interface ModerationResult {
  isViolation: boolean;
  violationType?: 'phone_digits' | 'phone_words_en' | 'phone_words_rw' | 'phone_words_fr' | 'social_media' | 'phone_request';
  reason?: string;
  matchedPattern?: string;
  safeSuggestion?: string;
}

// 1. Spelled out numbers in English
const EN_NUMBER_WORDS: Record<string, string> = {
  zero: '0', oh: '0', one: '1', two: '2', three: '3', four: '4', five: '5',
  six: '6', seven: '7', eight: '8', nine: '9', ten: '10'
};

// 2. Spelled out numbers in Kinyarwanda
const RW_NUMBER_WORDS: Record<string, string> = {
  zeru: '0', zero: '0', rimwe: '1', kabiri: '2', gatatu: '3', kane: '4',
  gatanu: '5', gatandatu: '6', karindwi: '7', umunani: '8', icyenda: '9', icumi: '10'
};

// 3. Spelled out numbers in French
const FR_NUMBER_WORDS: Record<string, string> = {
  zero: '0', zéro: '0', un: '1', une: '1', deux: '2', trois: '3',
  quatre: '4', cinq: '5', six: '6', sept: '7', huit: '8', neuf: '9', dix: '10'
};

// 4. Social media & messaging platforms keywords
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
 * Normalizes text: unicode lowercase, collapse spaces, remove accents for basic checks
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Checks for digit phone sequences (e.g. 0788123456, +250 788 123 456, 0-7-8-8-1-2-3-4-5-6)
 */
function detectPhoneDigits(text: string): { detected: boolean; match?: string } {
  // Strip out spaces, dots, dashes, parentheses and check for sequences of 7+ digits
  const cleaned = text.replace(/[\s\.\-\(\)\+_]/g, '');
  const digitMatch = cleaned.match(/\d{7,15}/);
  if (digitMatch) {
    return { detected: true, match: digitMatch[0] };
  }

  // Also check if text has interspersed digits like "0 7 8 8 1 2 3 4 5 6"
  const interspersed = text.match(/(?:\d[\s\.\-_*#@]{0,3}){7,15}\d/);
  if (interspersed) {
    return { detected: true, match: interspersed[0] };
  }

  return { detected: false };
}

/**
 * Detects spelled out numbers in a specific language dictionary
 */
function detectSpelledNumbers(
  normalizedText: string,
  dict: Record<string, string>,
  minSequence = 4
): { detected: boolean; matchedSequence?: string } {
  const words = normalizedText.split(/[\s,.;:!?\-\/]+/);
  let count = 0;
  const sequence: string[] = [];

  for (const word of words) {
    if (dict[word]) {
      count++;
      sequence.push(word);
      if (count >= minSequence) {
        return { detected: true, matchedSequence: sequence.join(' ') };
      }
    } else {
      // Allow single noise word between numbers (e.g. "seven and eight")
      if (count > 0 && word !== 'and' && word !== 'na' && word !== 'et') {
        count = 0;
        sequence.length = 0;
      }
    }
  }

  return { detected: false };
}

/**
 * Detects external handle mentions e.g. @username or platforms
 */
function detectSocialMedia(text: string): { detected: boolean; keyword?: string } {
  const normalized = normalizeText(text);

  for (const kw of SOCIAL_MEDIA_KEYWORDS) {
    if (normalized.includes(kw)) {
      return { detected: true, keyword: kw };
    }
  }

  // Check for handle pattern like "@john_doe" or "ig @john"
  const handleMatch = text.match(/@([a-zA-Z0-9_\.]{4,30})/);
  if (handleMatch) {
    return { detected: true, keyword: handleMatch[0] };
  }

  return { detected: false };
}

/**
 * Master moderation check function
 */
export function checkMessageModeration(message: string): ModerationResult {
  if (!message || typeof message !== 'string') {
    return { isViolation: false };
  }

  const normalized = normalizeText(message);

  // 1. Check raw/interspersed phone digits
  const digitCheck = detectPhoneDigits(message);
  if (digitCheck.detected) {
    return {
      isViolation: true,
      violationType: 'phone_digits',
      reason: 'Sharing phone numbers directly in chat is restricted for community safety.',
      matchedPattern: digitCheck.match,
      safeSuggestion: 'Get to know each other here first, or request a Direct Contact Unlock once mutual interest is established.',
    };
  }

  // 2. Check English spelled-out numbers
  const enCheck = detectSpelledNumbers(normalized, EN_NUMBER_WORDS, 4);
  if (enCheck.detected) {
    return {
      isViolation: true,
      violationType: 'phone_words_en',
      reason: 'Spelling out phone numbers in English is detected and restricted.',
      matchedPattern: enCheck.matchedSequence,
      safeSuggestion: 'Keep conversations inside Kunda Space to protect your privacy.',
    };
  }

  // 3. Check Kinyarwanda spelled-out numbers
  const rwCheck = detectSpelledNumbers(normalized, RW_NUMBER_WORDS, 4);
  if (rwCheck.detected) {
    return {
      isViolation: true,
      violationType: 'phone_words_rw',
      reason: 'Kwandika nimero ya telefone mu magambo birabujijwe ku mutekano wanyu.',
      matchedPattern: rwCheck.matchedSequence,
      safeSuggestion: 'Komeza kuganirira muri Kunda Space. Mwembi nimwemeranya muzakoresha Contact Unlock.',
    };
  }

  // 4. Check French spelled-out numbers
  const frCheck = detectSpelledNumbers(normalized, FR_NUMBER_WORDS, 4);
  if (frCheck.detected) {
    return {
      isViolation: true,
      violationType: 'phone_words_fr',
      reason: 'Le partage de numéros de téléphone en toutes lettres est restreint.',
      matchedPattern: frCheck.matchedSequence,
      safeSuggestion: 'Poursuivez vos échanges sur Kunda Space ou utilisez le Déblocage de Contact mutuel.',
    };
  }

  // 5. Check Social Media platforms & handles
  const socialCheck = detectSocialMedia(message);
  if (socialCheck.detected) {
    return {
      isViolation: true,
      violationType: 'social_media',
      reason: `Redirecting conversations to external platforms (${socialCheck.keyword}) is not permitted.`,
      matchedPattern: socialCheck.keyword,
      safeSuggestion: 'Build trust safely within Kunda Space before moving off-platform.',
    };
  }

  return { isViolation: false };
}

/**
 * Convenience wrapper returning boolean flags for clean/policy checks
 */
export function moderateMessageContent(text: string) {
  const result = checkMessageModeration(text);
  return {
    isClean: !result.isViolation,
    violatesContactPolicy: result.isViolation,
    ...result,
  };
}

