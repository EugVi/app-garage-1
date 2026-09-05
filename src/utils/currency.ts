import type { CurrencyCode, Settings } from '../types';
import { CURRENCY_META } from '../constants';

export function convertFromNAD(nad: number, currency: CurrencyCode, rates: Settings['rates']): number {
  if (currency === 'NAD') return nad;
  if (currency === 'USD') return nad / rates.USD_TO_NAD;
  // AOA
  return nad * rates.NAD_TO_AOA;
}

export function convertToNAD(value: number, currency: CurrencyCode, rates: Settings['rates']): number {
  if (currency === 'NAD') return value;
  if (currency === 'USD') return value * rates.USD_TO_NAD;
  return value / rates.NAD_TO_AOA;
}

export function formatMoney(
  nad: number,
  settings: Settings,
  opts: { decimals?: number; compact?: boolean; withSymbol?: boolean } = {},
): string {
  const { decimals, compact, withSymbol = true } = opts;
  const converted = convertFromNAD(nad, settings.currency, settings.rates);
  const meta = CURRENCY_META[settings.currency];

  let dec: number;
  if (decimals !== undefined) dec = decimals;
  else dec = settings.currency === 'AOA' ? 0 : 0; // keep whole numbers for cleanliness

  let str: string;
  if (compact && Math.abs(converted) >= 1000) {
    str = formatCompact(converted);
  } else {
    str = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: dec,
      maximumFractionDigits: dec,
    }).format(converted);
  }

  return withSymbol ? `${meta.symbol}${str}` : str;
}

function formatCompact(n: number): string {
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (Math.abs(n) >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return Math.round(n).toString();
}

export function formatMoneyWithSign(
  nad: number,
  settings: Settings,
  isPositive: boolean,
): string {
  const meta = CURRENCY_META[settings.currency];
  const converted = Math.abs(convertFromNAD(nad, settings.currency, settings.rates));
  const str = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(converted);
  const sign = isPositive ? '+' : '−';
  return `${sign}${meta.symbol}${str}`;
}
