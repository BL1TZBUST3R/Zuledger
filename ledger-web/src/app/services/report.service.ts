import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api.config';

@Injectable({ providedIn: 'root' })
export class ReportService {

  constructor(private http: HttpClient) {}

  getTrialBalance(ledgerId: string, asAt: string): Observable<any> {
    const params = new HttpParams().set('as_at', asAt);
    return this.http.get(`${API_BASE_URL}/ledgers/${ledgerId}/reports/trial-balance`, { params });
  }

  getProfitAndLoss(ledgerId: string, from: string, to: string): Observable<any> {
    const params = new HttpParams().set('from', from).set('to', to);
    return this.http.get(`${API_BASE_URL}/ledgers/${ledgerId}/reports/profit-and-loss`, { params });
  }

  getBalanceSheet(ledgerId: string, asAt: string): Observable<any> {
    const params = new HttpParams().set('as_at', asAt);
    return this.http.get(`${API_BASE_URL}/ledgers/${ledgerId}/reports/balance-sheet`, { params });
  }

  getCashFlow(ledgerId: string, from: string, to: string): Observable<any> {
    const params = new HttpParams().set('from', from).set('to', to);
    return this.http.get(`${API_BASE_URL}/ledgers/${ledgerId}/reports/cash-flow`, { params });
  }

  getGeneralLedger(ledgerId: string, from: string, to: string, accountId?: string): Observable<any> {
    let params = new HttpParams().set('from', from).set('to', to);
    if (accountId) params = params.set('account_id', accountId);
    return this.http.get(`${API_BASE_URL}/ledgers/${ledgerId}/reports/general-ledger`, { params });
  }

  getJournalReport(ledgerId: string, from: string, to: string, status?: string): Observable<any> {
    let params = new HttpParams().set('from', from).set('to', to);
    if (status) params = params.set('status', status);
    return this.http.get(`${API_BASE_URL}/ledgers/${ledgerId}/reports/journal-report`, { params });
  }
}
