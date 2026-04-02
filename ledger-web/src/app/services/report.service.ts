import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ReportService {

  private apiUrl = 'https://zuledger.onrender.com/api';

  constructor(private http: HttpClient) {}

  private getHeaders() {
    const token = localStorage.getItem('auth_token');
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }

  getTrialBalance(ledgerId: string, asAt: string): Observable<any> {
    const params = new HttpParams().set('as_at', asAt);
    return this.http.get(`${this.apiUrl}/ledgers/${ledgerId}/reports/trial-balance`, { headers: this.getHeaders(), params });
  }

  getProfitAndLoss(ledgerId: string, from: string, to: string): Observable<any> {
    const params = new HttpParams().set('from', from).set('to', to);
    return this.http.get(`${this.apiUrl}/ledgers/${ledgerId}/reports/profit-and-loss`, { headers: this.getHeaders(), params });
  }

  getBalanceSheet(ledgerId: string, asAt: string): Observable<any> {
    const params = new HttpParams().set('as_at', asAt);
    return this.http.get(`${this.apiUrl}/ledgers/${ledgerId}/reports/balance-sheet`, { headers: this.getHeaders(), params });
  }

  getCashFlow(ledgerId: string, from: string, to: string): Observable<any> {
    const params = new HttpParams().set('from', from).set('to', to);
    return this.http.get(`${this.apiUrl}/ledgers/${ledgerId}/reports/cash-flow`, { headers: this.getHeaders(), params });
  }

  getGeneralLedger(ledgerId: string, from: string, to: string, accountId?: string): Observable<any> {
    let params = new HttpParams().set('from', from).set('to', to);
    if (accountId) params = params.set('account_id', accountId);
    return this.http.get(`${this.apiUrl}/ledgers/${ledgerId}/reports/general-ledger`, { headers: this.getHeaders(), params });
  }

  getJournalReport(ledgerId: string, from: string, to: string, status?: string): Observable<any> {
    let params = new HttpParams().set('from', from).set('to', to);
    if (status) params = params.set('status', status);
    return this.http.get(`${this.apiUrl}/ledgers/${ledgerId}/reports/journal-report`, { headers: this.getHeaders(), params });
  }
}
