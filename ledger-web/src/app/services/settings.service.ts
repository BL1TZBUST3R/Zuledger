import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface LedgerSettings {
  fiscal_year_end_month: number;  // 1–12
  timezone: string;               // IANA timezone e.g. 'Australia/Sydney'
  date_format: 'DD/MM/YYYY' | 'MM/DD/YYYY';
  lock_date: string | null;       // ISO date string e.g. '2025-12-31' or null
}

@Injectable({
  providedIn: 'root'
})
export class SettingsService {

  private apiUrl = 'https://zuledger.onrender.com/api';

  constructor(private http: HttpClient) {}

  private getHeaders() {
    const token = localStorage.getItem('auth_token');
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }

  getSettings(ledgerId: string): Observable<LedgerSettings> {
    return this.http.get<LedgerSettings>(
      `${this.apiUrl}/ledgers/${ledgerId}/settings`,
      { headers: this.getHeaders() }
    );
  }

  saveSettings(ledgerId: string, settings: LedgerSettings): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/ledgers/${ledgerId}/settings`,
      settings,
      { headers: this.getHeaders() }
    );
  }
}
