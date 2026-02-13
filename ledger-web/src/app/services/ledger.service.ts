import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LedgerService {
  // Update this to your Render URL for production
  private apiUrl = 'https://zuledger.onrender.com/api/ledgers'; 

  constructor(private http: HttpClient) { }

  // 1. Get List of Ledgers (Owned + Shared)
  getLedgers(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }

  // 2. Get Single Ledger Details
  getLedger(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  // 3. Create a New Ledger
  createLedger(name: string): Observable<any> {
    return this.http.post<any>(this.apiUrl, { name });
  }

  // 4. Authorize / Invite User
  authorizeUser(ledgerId: string, email: string, role: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${ledgerId}/authorize`, { email, role });
  }
}