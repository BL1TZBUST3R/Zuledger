import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LedgerService {
  // ⚠️ Update this URL if you are testing locally
  private apiUrl = 'https://zuledger.onrender.com/api/ledgers'; 

  constructor(private http: HttpClient) { }

  private getHeaders() {
    // Make sure this matches how you save the token in login ('token' or 'auth_token')
    const token = localStorage.getItem('token') || localStorage.getItem('auth_token'); 
    return {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${token}`
      })
    };
  }

  getLedgers(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl, this.getHeaders());
  }

  // Used for fetching transactions
  getLedger(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`, this.getHeaders());
  }

  createLedger(name: string): Observable<any> {
    return this.http.post<any>(this.apiUrl, { name }, this.getHeaders());
  }

  authorizeUser(ledgerId: number, email: string, role: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${ledgerId}/authorize`, { email, role }, this.getHeaders());
  }

  // ==========================================
  // 👇 NEW METHODS TO FIX YOUR ERROR
  // ==========================================

  // Used by Sidebar to get the Company Name
  getCompanyInfo(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}/info`, this.getHeaders());
  }

  // Used by Dashboard to Rename
  updateLedger(id: number, name: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, { name }, this.getHeaders());
  }

  // Used by Dashboard to Delete
  deleteLedger(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`, this.getHeaders());
  }
}