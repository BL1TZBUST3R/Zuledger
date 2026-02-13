import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AccountService {

  // ⚠️ Change to http://localhost:8000/api if testing locally
  private apiUrl = 'https://zuledger.onrender.com/api'; 

  constructor(private http: HttpClient) { }

  // Helper to manually attach the token (if not using an Interceptor)
  private getHeaders() {
    const token = localStorage.getItem('auth_token');
    return {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${token}`
      })
    };
  }

  // 1. Get Groups for a specific Ledger
  // GET /api/ledgers/{id}/groups
  getGroups(ledgerId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/ledgers/${ledgerId}/groups`, this.getHeaders());
  }

  // 2. Create a Group inside a specific Ledger
  // POST /api/ledgers/{id}/groups
  createGroup(ledgerId: string, data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/ledgers/${ledgerId}/groups`, data, this.getHeaders());
  }
}