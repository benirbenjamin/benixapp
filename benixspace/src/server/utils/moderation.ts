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

export function checkContactModeration(message: string) {
  if (!message || typeof message !== 'string') return { isViolation: false };

  const cleaned = message.replace(/[\s.\-()+_]/g, '');
  if (cleaned.match(/\d{7,15}/)) {
    return { isViolation: true, reason: 'Sharing phone numbers directly in chat is restricted.' };
  }

  const normWords = message.toLowerCase().split(/[\s,.;:!?\-/]+/);
  let count = 0;
  for (const w of normWords) {
    if (EN_NUMBER_WORDS[w] || RW_NUMBER_WORDS[w] || FR_NUMBER_WORDS[w]) {
      count++;
      if (count >= 4) {
        return { isViolation: true, reason: 'Spelling out phone numbers is restricted.' };
      }
    } else if (count > 0 && w !== 'and' && w !== 'na' && w !== 'et') {
      count = 0;
    }
  }

  const lower = message.toLowerCase();
  for (const kw of SOCIAL_MEDIA_KEYWORDS) {
    if (lower.includes(kw)) {
      return { isViolation: true, reason: `External platform redirection (${kw}) is restricted.` };
    }
  }

  return { isViolation: false };
}
