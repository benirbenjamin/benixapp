import { query } from '../db/db';
import crypto from 'crypto';
import https from 'https';

// Pre-compiled comprehensive local dictionary for instant zero-latency UI translations
const DICTIONARY: Record<string, Record<string, string>> = {
  rw: {
    'Home': 'Ahabanza',
    'Discover': 'Vumbura',
    'Search': 'Shakisha',
    'Videos': 'Amashusho',
    'TV & Streaming': 'Televiziyo & Amashusho',
    'Music': 'Umuziki',
    'Choirs': 'Amakorali',
    'Dating': 'Guhuza Imitima (Kunda)',
    'Marketplace': 'Isoko (Benix)',
    'Services': 'Serivisi',
    'Radio': 'Radiyo',
    'Games': 'Imikino',
    'Tools': 'Ibikoresho (EasyCalc)',
    'Calculators': 'Imibare & Kubara',
    'Blog': 'Amakuru & Inyandiko',
    'Wallet': 'Icyifuzo cyanjye / Umufuka',
    'Referrals': 'Ubutumire',
    'Notifications': 'Ubutumwa',
    'Profile': 'Umwirondoro',
    'Settings': 'Igenamiterere',
    'Login': 'Injira',
    'Sign Up': 'Iyandikishe',
    'Logout': 'Sohoka',
    'Admin Portal': 'Ibiro Bikuru',
    'Explore NebeluRw Digital Ecosystem': 'Vumbura Ikoranabuhanga rya BenixSpace',
    'Play Game': 'Kina Umukino',
    'Deposit': 'Kwishyura / Kubitsa',
    'Withdraw': 'Kubikuza',
    'Balance': 'Amafaranga asigaye',
    'Live Radio': 'Radiyo Imbonankubone',
    'Watch Live': 'Reba Ako Kanya'
  },
  fr: {
    'Home': 'Accueil',
    'Discover': 'Découvrir',
    'Search': 'Rechercher',
    'Videos': 'Vidéos',
    'TV & Streaming': 'TV & Diffusion',
    'Music': 'Musique',
    'Choirs': 'Chorales',
    'Dating': 'Rencontres (Kunda)',
    'Marketplace': 'Boutique (Benix)',
    'Services': 'Services',
    'Radio': 'Radio',
    'Games': 'Jeux',
    'Tools': 'Outils (EasyCalc)',
    'Calculators': 'Calculatrices',
    'Blog': 'Actualités & Blog',
    'Wallet': 'Portefeuille',
    'Referrals': 'Parrainage',
    'Notifications': 'Notifications',
    'Profile': 'Profil',
    'Settings': 'Paramètres',
    'Login': 'Connexion',
    'Sign Up': 'Inscription',
    'Logout': 'Déconnexion',
    'Admin Portal': 'Portail Admin',
    'Explore NebeluRw Digital Ecosystem': 'Explorez l’Écosystème Numérique BenixSpace',
    'Play Game': 'Jouer',
    'Deposit': 'Dépôt',
    'Withdraw': 'Retrait',
    'Balance': 'Solde',
    'Live Radio': 'Radio en direct',
    'Watch Live': 'Regarder en direct'
  },
  sw: {
    'Home': 'Nyumbani',
    'Discover': 'Gundua',
    'Search': 'Tafuta',
    'Videos': 'Video',
    'TV & Streaming': 'Runinga & Matangazo',
    'Music': 'Muziki',
    'Choirs': 'Kwaya',
    'Dating': 'Kuchumbiana (Kunda)',
    'Marketplace': 'Soko (Benix)',
    'Services': 'Huduma',
    'Radio': 'Redio',
    'Games': 'Michezo',
    'Tools': 'Zana (EasyCalc)',
    'Calculators': 'Vikokotoo',
    'Blog': 'Habari & Makala',
    'Wallet': 'Pochi / Mkoba',
    'Referrals': 'Mialiko',
    'Notifications': 'Arifa',
    'Profile': 'Wasifu',
    'Settings': 'Mipangilio',
    'Login': 'Ingia',
    'Sign Up': 'Jisajili',
    'Logout': 'Toka',
    'Admin Portal': 'Lango Kuu la Msimamizi',
    'Explore NebeluRw Digital Ecosystem': 'Gundua Mfumo wa Kidijitali wa BenixSpace',
    'Play Game': 'Cheza Mchezo',
    'Deposit': 'Weka Pesa',
    'Withdraw': 'Toa Pesa',
    'Balance': 'Salio',
    'Live Radio': 'Redio Moja kwa Moja',
    'Watch Live': 'Tazama Moja kwa Moja'
  }
};

export class TranslationService {
  /**
   * Translates a string or returns cached/dictionary value
   */
  static async translateText(
    text: string,
    targetLang: string = 'en',
    sourceLang: string = 'en'
  ): Promise<string> {
    if (!text || text.trim() === '' || targetLang === sourceLang) {
      return text;
    }

    const trimmed = text.trim();

    // 1. Check local pre-compiled dictionary
    if (DICTIONARY[targetLang] && DICTIONARY[targetLang][trimmed]) {
      return DICTIONARY[targetLang][trimmed];
    }

    // 2. Check Database Translation Cache
    const textHash = crypto.createHash('md5').update(trimmed).digest('hex');
    const cached = await query(
      'SELECT translated_text FROM core_translations_cache WHERE source_hash = $1 AND target_lang = $2',
      [textHash, targetLang]
    );

    if (cached.rowCount > 0 && cached.rows[0].translated_text) {
      return cached.rows[0].translated_text;
    }

    // 3. Fallback online translation via MyMemory API
    try {
      const translated = await this.fetchOnlineTranslation(trimmed, sourceLang, targetLang);
      if (translated && translated !== trimmed) {
        // Cache translated variant
        await query(
          `INSERT INTO core_translations_cache 
           (source_hash, source_lang, target_lang, source_text, translated_text, provider)
           VALUES ($1, $2, $3, $4, $5, 'mymemory')
           ON CONFLICT (source_hash, target_lang) DO NOTHING`,
          [textHash, sourceLang, targetLang, trimmed, translated]
        );
        return translated;
      }
    } catch (err) {
      console.warn('Online translation provider error, falling back to original:', err);
    }

    return trimmed;
  }

  /**
   * Batch Translate UI Strings
   */
  static async translateBatch(
    texts: string[],
    targetLang: string
  ): Promise<Record<string, string>> {
    const results: Record<string, string> = {};
    for (const t of texts) {
      results[t] = await this.translateText(t, targetLang);
    }
    return results;
  }

  /**
   * Helper to query free MyMemory Translation endpoint
   */
  private static fetchOnlineTranslation(text: string, from: string, to: string): Promise<string> {
    return new Promise((resolve) => {
      const encoded = encodeURIComponent(text.substring(0, 500));
      const url = `https://api.mymemory.translated.net/get?q=${encoded}&langpair=${from}|${to}`;

      const req = https.get(url, { timeout: 3000 }, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            const resText = parsed?.responseData?.translatedText;
            resolve(resText || text);
          } catch {
            resolve(text);
          }
        });
      });

      req.on('error', () => resolve(text));
      req.on('timeout', () => {
        req.destroy();
        resolve(text);
      });
    });
  }
}
