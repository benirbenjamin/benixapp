import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type CurrencyType = 'RWF' | 'USD';

interface CurrencyContextType {
  currency: CurrencyType;
  setCurrency: (c: CurrencyType) => void;
  toggleCurrency: () => void;
  exchangeRate: number; // RWF per 1 USD
  formatAmount: (
    amountRwf: number | string | null | undefined,
    options?: {
      compact?: boolean;
      hideSymbol?: boolean;
      decimals?: number;
    }
  ) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const DEFAULT_RWF_PER_USD = 1480.41;

export const CurrencyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState<CurrencyType>(() => {
    const saved = localStorage.getItem('benix_currency');
    return saved === 'USD' ? 'USD' : 'RWF';
  });

  const [exchangeRate, setExchangeRate] = useState<number>(DEFAULT_RWF_PER_USD);

  // Fetch live exchange rate from system settings
  useEffect(() => {
    fetch('/api/system/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data?.settings?.rwf_per_usd) {
          const parsed = parseFloat(data.settings.rwf_per_usd);
          if (!isNaN(parsed) && parsed > 0) {
            setExchangeRate(parsed);
          }
        }
      })
      .catch(() => {});
  }, []);

  const setCurrency = (c: CurrencyType) => {
    setCurrencyState(c);
    localStorage.setItem('benix_currency', c);
  };

  const toggleCurrency = () => {
    setCurrency(currency === 'RWF' ? 'USD' : 'RWF');
  };

  const formatAmount = (
    amountRwf: number | string | null | undefined,
    options?: {
      compact?: boolean;
      hideSymbol?: boolean;
      decimals?: number;
    }
  ): string => {
    const numRwf = Number(amountRwf) || 0;
    const { compact = false, hideSymbol = false, decimals } = options || {};

    if (currency === 'USD') {
      const usdVal = numRwf / exchangeRate;
      if (compact) {
        if (usdVal < 1000) {
          const dec = decimals !== undefined ? decimals : (usdVal < 10 ? 2 : 1);
          return hideSymbol ? usdVal.toFixed(dec) : `$${usdVal.toFixed(dec)}`;
        }
        const k = usdVal / 1000;
        const formatted = (k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)).replace(/\.0$/, '');
        return hideSymbol ? `${formatted}k` : `$${formatted}k`;
      }

      const dec = decimals !== undefined ? decimals : 2;
      const formatted = usdVal.toLocaleString('en-US', {
        minimumFractionDigits: dec,
        maximumFractionDigits: dec
      });
      return hideSymbol ? formatted : `$${formatted} USD`;
    }

    // Default: RWF
    if (compact) {
      if (numRwf < 1000) {
        return hideSymbol ? numRwf.toLocaleString() : `${numRwf.toLocaleString()} RWF`;
      }
      if (numRwf < 1_000_000) {
        const k = numRwf / 1000;
        const formatted = (k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)).replace(/\.0$/, '');
        return hideSymbol ? `${formatted}k` : `${formatted}k RWF`;
      }
      const m = numRwf / 1_000_000;
      const formattedM = (m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)).replace(/\.0$/, '');
      return hideSymbol ? `${formattedM}M` : `${formattedM}M RWF`;
    }

    const dec = decimals !== undefined ? decimals : (numRwf % 1 === 0 ? 0 : 2);
    const formatted = numRwf.toLocaleString('en-US', {
      minimumFractionDigits: dec,
      maximumFractionDigits: dec
    });
    return hideSymbol ? formatted : `${formatted} RWF`;
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        toggleCurrency,
        exchangeRate,
        formatAmount
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = (): CurrencyContextType => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};

/**
 * Reusable Currency Toggle Component (matching the sleek [ USD | RWF ] toggle pill)
 */
export const CurrencyToggle: React.FC<{ className?: string; size?: 'sm' | 'md' }> = ({
  className = '',
  size = 'sm'
}) => {
  const { currency, setCurrency } = useCurrency();

  const isSmall = size === 'sm';

  return (
    <div
      className={`inline-flex items-center rounded-xl bg-slate-900/90 border border-slate-700/80 p-0.5 shadow-inner select-none ${className}`}
      title="Switch platform currency display between USD and RWF"
    >
      <button
        type="button"
        onClick={() => setCurrency('USD')}
        className={`font-black rounded-lg transition-all ${
          isSmall ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1 text-xs'
        } ${
          currency === 'USD'
            ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
            : 'text-slate-400 hover:text-white'
        }`}
      >
        USD
      </button>
      <button
        type="button"
        onClick={() => setCurrency('RWF')}
        className={`font-black rounded-lg transition-all ${
          isSmall ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1 text-xs'
        } ${
          currency === 'RWF'
            ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
            : 'text-slate-400 hover:text-white'
        }`}
      >
        RWF
      </button>
    </div>
  );
};
