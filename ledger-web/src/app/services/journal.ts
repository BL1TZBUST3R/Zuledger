import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api.config';

@Injectable({ providedIn: 'root' })
export class JournalService {

  constructor(private http: HttpClient) {}

  getJournals(ledgerId: string): Observable<any> {
    return this.http.get(`${API_BASE_URL}/ledgers/${ledgerId}/journals`);
  }

  getJournal(ledgerId: string, journalId: string): Observable<any> {
    return this.http.get(`${API_BASE_URL}/ledgers/${ledgerId}/journals/${journalId}`);
  }

  createJournal(ledgerId: string, data: any): Observable<any> {
    return this.http.post(`${API_BASE_URL}/ledgers/${ledgerId}/journals`, data);
  }

  updateJournal(ledgerId: string, journalId: string, data: any): Observable<any> {
    return this.http.put(`${API_BASE_URL}/ledgers/${ledgerId}/journals/${journalId}`, data);
  }

  postJournal(ledgerId: string, journalId: string): Observable<any> {
    return this.http.patch(`${API_BASE_URL}/ledgers/${ledgerId}/journals/${journalId}/post`, {});
  }

  reverseJournal(ledgerId: string, journalId: string): Observable<any> {
    return this.http.patch(`${API_BASE_URL}/ledgers/${ledgerId}/journals/${journalId}/reverse`, {});
  }

  deleteJournal(ledgerId: string, journalId: string): Observable<any> {
    return this.http.delete(`${API_BASE_URL}/ledgers/${ledgerId}/journals/${journalId}`);
  }
}
