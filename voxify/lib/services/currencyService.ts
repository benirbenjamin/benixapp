export type SupportedCurrency = 'USD' | 'RWF' | 'UGX' | 'KES' | 'NGN';

export interface CurrencyRate {
  code: SupportedCurrency;
  symbol: string;
  name: string;
  rateFromUsd: number;
}

// Fallback rates if exchange rate API is unavailable
const DEFAULT_RATES: Record<SupportedCurrency, { symbol: string; name: string; rate: number }> = {
  USD: { symbol: '$', name: 'US Dollar (USD)', rate: 1.0 },
  RWF: { symbol: 'RWF ', name: 'Rwandan Franc (RWF)', rate: 1350.0 },
  UGX: { symbol: 'UGX ', name: 'Ugandan Shilling (UGX)', rate: 3700.0 },
  KES: { symbol: 'KSh ', name: 'Kenyan Shilling (KES)', rate: 130.0 },
  NGN: { symbol: '₦', name: 'Nigerian Naira (NGN)', rate: 1500.0 },
};

let cachedRates: Record<SupportedCurrency, number> | null = null;
let lastFetchTime = 0;
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour cache

export const currencyService = {
  async getExchangeRates(): Promise<Record<SupportedCurrency, number>> {
    const now = Date.now();
    if (cachedRates && now - lastFetchTime < CACHE_DURATION_MS) {
      return cachedRates;
    }

    try {
      const res = await fetch('https://open.er-api.com/v6/latest/USD', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        const rates = data?.rates;
        if (rates) {
          cachedRates = {
            USD: 1.0,
            RWF: rates.RWF || DEFAULT_RATES.RWF.rate,
            UGX: rates.UGX || DEFAULT_RATES.UGX.rate,
            KES: rates.KES || DEFAULT_RATES.KES.rate,
            NGN: rates.NGN || DEFAULT_RATES.NGN.rate,
          };
          lastFetchTime = now;
          return cachedRates;
        }
      }
    } catch (err) {
      console.warn('Live exchange rate API unavailable, using standard conversion rates:', err);
    }

    // Fallback to default rates
    return {
      USD: 1.0,
      RWF: DEFAULT_RATES.RWF.rate,
      UGX: DEFAULT_RATES.UGX.rate,
      KES: DEFAULT_RATES.KES.rate,
      NGN: DEFAULT_RATES.NGN.rate,
    };
  },

  convertAmount(amountInUsd: number, currency: SupportedCurrency, rate: number): number {
    if (currency === 'USD') return Number(amountInUsd.toFixed(2));
    const converted = amountInUsd * rate;
    // Round to nearest integer for African currencies (RWF, UGX, KES, NGN)
    return Math.round(converted);
  },

  getCurrencyMeta(code: SupportedCurrency) {
    return DEFAULT_RATES[code] || DEFAULT_RATES.USD;
  },
};
