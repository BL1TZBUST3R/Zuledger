import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from './api.config';

export interface Currency {
  code: string;
  name: string;
  symbol: string;
}

export interface RatesPayload {
  base: string;
  rates: Record<string, number>;
  source: string;
  updated: string;
  live: boolean;
}

export type RefreshIntervalMs = 0 | 30000 | 60000 | 300000 | 900000 | 3600000;

export const REFRESH_OPTIONS: { value: RefreshIntervalMs; label: string }[] = [
  { value: 0,        label: 'Off' },
  { value: 30000,    label: 'Every 30 seconds' },
  { value: 60000,    label: 'Every 1 minute' },
  { value: 300000,   label: 'Every 5 minutes' },
  { value: 900000,   label: 'Every 15 minutes' },
  { value: 3600000,  label: 'Every 1 hour' },
];

@Injectable({ providedIn: 'root' })
export class CurrencyService {

  private readonly STORAGE_KEY_INTERVAL = 'fx_refresh_interval_ms';

  readonly activeCurrency = signal<string>(localStorage.getItem('active_currency') || 'USD');

  // Live rates pulled from the backend (USD-based). Empty until first fetch.
  readonly liveRates = signal<Record<string, number>>({});
  readonly lastUpdated = signal<string | null>(null);
  readonly source = signal<string>('static');
  readonly isLive = signal<boolean>(false);
  readonly isFetching = signal<boolean>(false);
  readonly fetchError = signal<string | null>(null);

  readonly refreshIntervalMs = signal<RefreshIntervalMs>(
    (Number(localStorage.getItem(this.STORAGE_KEY_INTERVAL)) || 0) as RefreshIntervalMs
  );

  // True when at least one successful fetch has happened.
  readonly hasLiveRates = computed(() => Object.keys(this.liveRates()).length > 0);

  private pollHandle: any = null;

  readonly currencies: Currency[] = [
    { code: 'USD', name: 'US Dollar',          symbol: '$' },
    { code: 'EUR', name: 'Euro',               symbol: '€' },
    { code: 'GBP', name: 'British Pound',      symbol: '£' },
    { code: 'AUD', name: 'Australian Dollar',  symbol: 'A$' },
    { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$' },
    { code: 'CAD', name: 'Canadian Dollar',    symbol: 'C$' },
    { code: 'JPY', name: 'Japanese Yen',       symbol: '¥' },
    { code: 'CNY', name: 'Chinese Yuan',       symbol: '¥' },
    { code: 'HKD', name: 'Hong Kong Dollar',   symbol: 'HK$' },
    { code: 'SGD', name: 'Singapore Dollar',   symbol: 'S$' },
    { code: 'INR', name: 'Indian Rupee',       symbol: '₹' },
    { code: 'PHP', name: 'Philippine Peso',    symbol: '₱' },
    { code: 'IDR', name: 'Indonesian Rupiah',  symbol: 'Rp' },
    { code: 'THB', name: 'Thai Baht',          symbol: '฿' },
    { code: 'MYR', name: 'Malaysian Ringgit',  symbol: 'RM' },
    { code: 'KRW', name: 'South Korean Won',   symbol: '₩' },
    { code: 'CHF', name: 'Swiss Franc',        symbol: 'CHF' },
    { code: 'SEK', name: 'Swedish Krona',      symbol: 'kr' },
    { code: 'NOK', name: 'Norwegian Krone',    symbol: 'kr' },
    { code: 'DKK', name: 'Danish Krone',       symbol: 'kr' },
    { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
    { code: 'MXN', name: 'Mexican Peso',       symbol: 'Mex$' },
    { code: 'BRL', name: 'Brazilian Real',     symbol: 'R$' },
    { code: 'AED', name: 'UAE Dirham',         symbol: 'د.إ' },
    { code: 'SAR', name: 'Saudi Riyal',        symbol: 'ر.س' },
  ];

  // Static reference rates relative to 1 USD. Used as a fallback before
  // live rates have loaded or if the upstream provider is unreachable.
  private readonly baseRatesToUSD: Record<string, number> = {
    USD: 1,
    EUR: 0.92,
    GBP: 0.79,
    AUD: 1.52,
    NZD: 1.65,
    CAD: 1.36,
    JPY: 151.0,
    CNY: 7.24,
    HKD: 7.82,
    SGD: 1.34,
    INR: 83.3,
    PHP: 56.5,
    IDR: 15780,
    THB: 36.2,
    MYR: 4.72,
    KRW: 1340,
    CHF: 0.89,
    SEK: 10.5,
    NOK: 10.7,
    DKK: 6.87,
    ZAR: 18.7,
    MXN: 17.1,
    BRL: 5.05,
    AED: 3.67,
    SAR: 3.75,
  };

  constructor(private http: HttpClient) {
    // Kick off an initial fetch and resume any saved auto-refresh interval.
    this.fetchRates(false);
    this.applyRefreshInterval(this.refreshIntervalMs());
  }

  setActive(code: string) {
    this.activeCurrency.set(code);
    localStorage.setItem('active_currency', code);
  }

  getCurrency(code: string): Currency | undefined {
    return this.currencies.find(c => c.code === code);
  }

  getSymbol(code: string): string {
    return this.getCurrency(code)?.symbol ?? code;
  }

  format(amount: number | null | undefined, code?: string, decimals = 2): string {
    const c = code || this.activeCurrency();
    const n = Number(amount ?? 0);
    const formatted = n.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    const symbol = this.getSymbol(c);
    if (n < 0) {
      return `-${symbol}${formatted.replace('-', '')}`;
    }
    return `${symbol}${formatted}`;
  }

  /**
   * Convert an amount from one currency to another. Uses live rates when
   * available, otherwise falls back to the built-in static reference rates.
   */
  convert(amount: number, from: string, to: string, customRates?: Record<string, number>): number {
    const live = this.liveRates();
    const baseRates = Object.keys(live).length > 0 ? live : this.baseRatesToUSD;
    const rates = { ...baseRates, ...(customRates || {}) };
    const fromRate = rates[from];
    const toRate = rates[to];
    if (!fromRate || !toRate) return NaN;
    const amountInUSD = amount / fromRate;
    return amountInUSD * toRate;
  }

  getDefaultRates(): Record<string, number> {
    return { ...this.baseRatesToUSD };
  }

  /**
   * Fetch the latest USD-based rates from the backend. Pass force=true
   * to bypass the backend's cache (used by the manual refresh button).
   */
  fetchRates(force = false): void {
    if (this.isFetching()) return;
    this.isFetching.set(true);
    this.fetchError.set(null);

    const url = `${API_BASE_URL}/currency/rates${force ? '?refresh=true' : ''}`;
    this.http.get<RatesPayload>(url).subscribe({
      next: (data) => {
        if (data?.rates && typeof data.rates === 'object') {
          this.liveRates.set(data.rates);
          this.lastUpdated.set(data.updated || new Date().toISOString());
          this.source.set(data.source || 'unknown');
          this.isLive.set(!!data.live);
        }
        this.isFetching.set(false);
      },
      error: (err) => {
        this.fetchError.set(err?.message || 'Failed to fetch rates');
        this.isFetching.set(false);
      }
    });
  }

  /**
   * Set the auto-refresh interval. Pass 0 to turn auto-refresh off.
   */
  setRefreshInterval(ms: RefreshIntervalMs): void {
    this.refreshIntervalMs.set(ms);
    localStorage.setItem(this.STORAGE_KEY_INTERVAL, String(ms));
    this.applyRefreshInterval(ms);
  }

  private applyRefreshInterval(ms: RefreshIntervalMs): void {
    if (this.pollHandle) {
      clearInterval(this.pollHandle);
      this.pollHandle = null;
    }
    if (ms > 0) {
      this.pollHandle = setInterval(() => this.fetchRates(true), ms);
    }
  }
}
