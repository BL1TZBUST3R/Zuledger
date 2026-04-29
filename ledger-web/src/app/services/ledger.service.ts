import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api.config';

@Injectable({ providedIn: 'root' })
export class LedgerService {

  private apiUrl = `${API_BASE_URL}/ledgers`;

  constructor(private http: HttpClient) {}

  getLedgers(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }

  getLedger(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  createLedger(name: string, template: string = ''): Observable<any> {
    return this.http.post<any>(this.apiUrl, { name, template });
  }

  authorizeUser(ledgerId: string, email: string, role: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${ledgerId}/authorize`, { email, role });
  }

  renameLedger(id: string, name: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, { name });
  }

  deleteLedger(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  removeUser(ledgerId: string, userId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${ledgerId}/users`, { body: { user_id: userId } });
  }
}
