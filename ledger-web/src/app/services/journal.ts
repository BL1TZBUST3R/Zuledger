import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class JournalService {

  private apiUrl = 'https://zuledger.onrender.com/api';

  constructor(private http: HttpClient) {}

  private getHeaders() {
    const token = localStorage.getItem('auth_token');
    return {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${token}`
      })
    };
  }

  getJournals(ledgerId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/ledgers/${ledgerId}/journals`, this.getHeaders());
  }

  getJournal(ledgerId: string, journalId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/ledgers/${ledgerId}/journals/${journalId}`, this.getHeaders());
  }

  createJournal(ledgerId: string, data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/ledgers/${ledgerId}/journals`, data, this.getHeaders());
  }

  updateJournal(ledgerId: string, journalId: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/ledgers/${ledgerId}/journals/${journalId}`, data, this.getHeaders());
  }

  postJournal(ledgerId: string, journalId: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/ledgers/${ledgerId}/journals/${journalId}/post`, {}, this.getHeaders());
  }

  unpostJournal(ledgerId: string, journalId: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/ledgers/${ledgerId}/journals/${journalId}/unpost`, {}, this.getHeaders());
  }

  deleteJournal(ledgerId: string, journalId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/ledgers/${ledgerId}/journals/${journalId}`, this.getHeaders());
  }
}