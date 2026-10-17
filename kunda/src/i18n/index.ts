// =====================================================================
// KUNDA SPACE: TRILINGUAL I18N SYSTEM (English, Kinyarwanda, French)
// =====================================================================
import en from './en.json';
import rw from './rw.json';
import fr from './fr.json';

export type LanguageCode = 'en' | 'rw' | 'fr';

export const translations: Record<LanguageCode, any> = {
  en,
  rw,
  fr,
};

export const LANGUAGE_LABELS: Record<LanguageCode, { label: string; flag: string }> = {
  rw: { label: 'Kinyarwanda', flag: '🇷🇼' },
  en: { label: 'English', flag: '🇬🇧' },
  fr: { label: 'Français', flag: '🇫🇷' },
};

/**
 * Nested key lookup with parameter interpolation
 * Example: t('nav.signIn', 'en') -> "Sign In"
 */
export function translate(
  key: string,
  lang: LanguageCode = 'en',
  params?: Record<string, string | number>
): string {
  const currentDict = translations[lang] || translations.en;
  const parts = key.split('.');

  let value: any = currentDict;
  for (const part of parts) {
    if (value && typeof value === 'object' && part in value) {
      value = value[part];
    } else {
      // Fallback to English dictionary if key is missing in selected language
      let fallbackVal: any = translations.en;
      for (const fPart of parts) {
        if (fallbackVal && typeof fallbackVal === 'object' && fPart in fallbackVal) {
          fallbackVal = fallbackVal[fPart];
        } else {
          return key; // return key if not found in any
        }
      }
      value = fallbackVal;
      break;
    }
  }

  if (typeof value !== 'string') {
    return key;
  }

  // Parameter replacement e.g. {{amount}}
  if (params) {
    let result = value;
    for (const [pKey, pVal] of Object.entries(params)) {
      result = result.replace(new RegExp(`{{${pKey}}}`, 'g'), String(pVal));
    }
    return result;
  }

  return value;
}
