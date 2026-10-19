/**
 * Compact currency formatter for BenixSpace header and UI components
 * Formats:
 * - < 1000: "999 RWF"
 * - >= 1000 and < 1,000,000: "1k RWF", "2.5k RWF", "139.5k RWF"
 * - >= 1,000,000: "1M RWF", "2.4M RWF"
 */
export const formatCurrencyCompact = (amount: number | string | null | undefined, currency: string = 'RWF'): string => {
  const num = Number(amount) || 0;
  if (num < 1000) {
    return `${num.toLocaleString()} ${currency}`;
  }
  if (num < 1_000_000) {
    const k = num / 1000;
    // Format to 1 decimal place, stripping .0
    const formatted = (k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)).replace(/\.0$/, '');
    return `${formatted}k ${currency}`;
  }
  const m = num / 1_000_000;
  const formattedM = (m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)).replace(/\.0$/, '');
  return `${formattedM}M ${currency}`;
};
