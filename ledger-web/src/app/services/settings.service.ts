import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api.config';

export interface LedgerSettings {
  fiscal_year_end_month: number;  // 1–12
  timezone: string;               // IANA timezone e.g. 'Australia/Sydney'
  date_format: 'DD/MM/YYYY' | 'MM/DD/YYYY';
  lock_date: string | null;       // ISO date string e.g. '2025-12-31' or null
  currency: string;               // ISO 4217 code e.g. 'USD', 'AUD', 'EUR'
}

@Injectable({ providedIn: 'root' })
export class SettingsService {

  constructor(private http: HttpClient) {}

  getSettings(ledgerId: string): Observable<LedgerSettings> {
    return this.http.get<LedgerSettings>(`${API_BASE_URL}/ledgers/${ledgerId}/settings`);
  }

  saveSettings(ledgerId: string, settings: LedgerSettings): Observable<any> {
    return this.http.put(`${API_BASE_URL}/ledgers/${ledgerId}/settings`, settings);
  }
}
