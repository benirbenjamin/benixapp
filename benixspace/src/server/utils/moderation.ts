/**
 * BenixSpace Multilingual Moderation & Anti-Contact Leak Engine (Server-Side)
 */

export const DEFAULT_KINYARWANDA_BLOCKED: string[] = [
  'igituba', 'igisundi', 'imboro', 'amabyi', 'amabya', 'guswera', 'waswera',
  'nyoko', 'nyokombwa', 'umusino', 'umukondo', 'indaya', 'ikibuno', 'imbwa',
  'ikimanyi', 'umuswere', 'gucumita', 'igitoki', 'gaswerwe', 'guca inyuma',
  'uburozi', 'kazana', 'icyomanzi', 'umushino', 'umusinzi', 'umukobwa gito',
  'icyihebe', 'amatama yigituba', 'kwinjira', 'ikiroryi', 'gupfusha', 'amangwe'
];

export const DEFAULT_ENGLISH_BLOCKED: string[] = [
  'fuck', 'fucking', 'fucker', 'bitch', 'shit', 'dick', 'pussy', 'asshole',
  'slut', 'cunt', 'whore', 'bastard', 'faggot', 'nigger', 'nigga', 'porn',
  'boobs', 'rape', 'dumbass', 'motherfucker', 'cock', 'twat', 'retard',
  'wanker', 'blowjob', 'penis', 'vagina'
];

export const DEFAULT_FRENCH_BLOCKED: string[] = [
  'merde', 'putain', 'con', 'connard', 'connasse', 'salope', 'bite',
  'chatte', 'encule', 'enculee', 'batard', 'nique', 'niquer', 'baise',
  'baiser', 'fdp', 'chienne', 'couille', 'bordel', 'foutre', 'gueule', 'abruti'
];

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
  'instagram', 'insta', 'ig:', 'ig :',
  'telegram', 't.me', 'tele:',
  'snapchat', 'snap:',
  'facebook', 'fb:',
  'tiktok', 'tik tok',
  'call me on', 'reach me at', 'text me on',
  'hamagara kuri', 'unyandikire kuri', 'nimero yanjye',
  'appelle moi sur', 'mon numero est'
];

export function normalizeText(raw: string): string {
  if (!raw) return '';
  let text = raw.toLowerCase();
  text = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  text = text
    .replace(/[@4]/g, 'a')
    .replace(/[0]/g, 'o')
    .replace(/[1!|]/g, 'i')
    .replace(/[$5]/g, 's')
    .replace(/[3]/g, 'e')
    .replace(/[7+]/g, 't')
    .replace(/[8]/g, 'b');
  const strippedSymbols = text.replace(/[^a-z0-9]/g, '');
  return strippedSymbols.replace(/(.)\1{2,}/g, '$1$1');
}

export function checkInappropriateLanguage(input: string, customWords: string[] = []) {
  if (!input || !input.trim()) return { isInappropriate: false };
  const norm = normalizeText(input);
  const words = input.toLowerCase().split(/[\s,.\-_/:;!?()]+/);

  for (const w of customWords) {
    if (w && (norm.includes(normalizeText(w)) || words.includes(w.toLowerCase()))) {
      return { isInappropriate: true, flaggedWord: w, category: 'Custom' };
    }
  }
  for (const w of DEFAULT_KINYARWANDA_BLOCKED) {
    if (norm.includes(normalizeText(w)) || words.includes(w)) {
      return { isInappropriate: true, flaggedWord: w, category: 'Kinyarwanda' };
    }
  }
  for (const w of DEFAULT_ENGLISH_BLOCKED) {
    if (norm.includes(normalizeText(w)) || words.includes(w)) {
      return { isInappropriate: true, flaggedWord: w, category: 'English' };
    }
  }
  for (const w of DEFAULT_FRENCH_BLOCKED) {
    if (norm.includes(normalizeText(w)) || words.includes(w)) {
      return { isInappropriate: true, flaggedWord: w, category: 'French' };
    }
  }
  return { isInappropriate: false };
}

export const ALL_NUMBER_WORDS_MAP: Record<string, string> = {
  // English
  zero: '0', oh: '0', one: '1', two: '2', three: '3', four: '4', five: '5',
  six: '6', seven: '7', eight: '8', nine: '9', ten: '10',
  // Kinyarwanda
  zeru: '0', rimwe: '1', kabiri: '2', gatatu: '3', kane: '4',
  gatanu: '5', gatandatu: '6', karindwi: '7', umunani: '8', icyenda: '9', icumi: '10', mirongo: '',
  // French
  zéro: '0', un: '1', une: '1', deux: '2', trois: '3',
  quatre: '4', cinq: '5', sept: '7', huit: '8', neuf: '9', dix: '10',
  // Swahili
  sifuri: '0', moja: '1', mbili: '2', tatu: '3', nne: '4',
  tano: '5', sita: '6', saba: '7', nane: '8', tisa: '9', kumi: '10'
};

export function checkContactModeration(message: string): { isViolation: boolean; reason?: string } {
  if (!message || typeof message !== 'string') return { isViolation: false };

  const rawLower = message.toLowerCase();

  // 1. Check for external links or social redirection keywords
  for (const kw of SOCIAL_MEDIA_KEYWORDS) {
    if (rawLower.includes(kw)) {
      return {
        isViolation: true,
        reason: `Direct contact redirection (${kw}) is restricted. Use the official Unlock Phone button.`
      };
    }
  }

  // 2. Direct contiguous digits check (e.g. 0783987223, +250788123456)
  const cleanedDigits = message.replace(/[\s.\-()+_]/g, '');
  if (cleanedDigits.match(/\d{7,15}/)) {
    return {
      isViolation: true,
      reason: 'Sharing personal phone numbers directly in chat is restricted by Benix privacy policy. Use the Unlock Phone button to securely view verified contact information.'
    };
  }

  // 3. Robust Number Words & Spelled Digits Detection across all languages
  // Normalize punctuation and symbols to spaces
  const normalizedText = message
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s,.;:!?\-_/\\*~()+=@#]+/g, ' ')
    .trim();

  const tokens = normalizedText.split(' ').filter(Boolean);

  let numberWordsCount = 0;
  let translatedDigitStream = '';

  for (const token of tokens) {
    // If token is already numeric digits
    if (/^\d+$/.test(token)) {
      numberWordsCount++;
      translatedDigitStream += token;
    } else if (ALL_NUMBER_WORDS_MAP[token] !== undefined) {
      numberWordsCount++;
      translatedDigitStream += ALL_NUMBER_WORDS_MAP[token];
    }
  }

  // If 3 or more number words/digits appear anywhere in the message, flag violation!
  if (numberWordsCount >= 3) {
    return {
      isViolation: true,
      reason: 'Spelling out phone numbers in words or digits is prohibited. Please use the secure Unlock Contact Phone option.'
    };
  }

  // If translated stream contains 6 or more digits or matches Rwandan mobile patterns (07... / 2507...)
  if (translatedDigitStream.length >= 6 || /07\d{4,}/.test(translatedDigitStream) || /2507\d{4,}/.test(translatedDigitStream)) {
    return {
      isViolation: true,
      reason: 'Sharing contact information in words or digits is restricted. Please use the official Unlock Phone feature.'
    };
  }

  // 4. Contact solicitation keywords combined with any numbers
  const solicitationPhrases = [
    'call me', 'hamagara', 'reach me', 'unyandikire', 'nimero', 'numero', 'contact me', 'text me'
  ];
  for (const phrase of solicitationPhrases) {
    if (rawLower.includes(phrase) && (numberWordsCount >= 2 || /\d{2,}/.test(message))) {
      return {
        isViolation: true,
        reason: 'Sharing direct contact information is prohibited. Use the verified Unlock Phone feature.'
      };
    }
  }

  return { isViolation: false };
}
