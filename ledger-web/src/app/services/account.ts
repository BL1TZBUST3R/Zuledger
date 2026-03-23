import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AccountService {

  private apiUrl = 'https://zuledger.onrender.com/api';

  constructor(private http: HttpClient) { }

  private getHeaders() {
    const token = localStorage.getItem('auth_token');
    return {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${token}`
      })
    };
  }

  getGroups(ledgerId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/ledgers/${ledgerId}/groups`, this.getHeaders());
  }

  createGroup(ledgerId: string, data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/ledgers/${ledgerId}/groups`, data, this.getHeaders());
  }

  exportGroups(ledgerId: string): Observable<Blob> {
    const token = localStorage.getItem('auth_token');
    return this.http.get(`${this.apiUrl}/ledgers/${ledgerId}/groups/export`, {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${token}`
      }),
      responseType: 'blob'
    });
  }

  importGroups(ledgerId: string, file: File, mode: string = 'add'): Observable<any> {
    const token = localStorage.getItem('auth_token');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('mode', mode);

    return this.http.post(`${this.apiUrl}/ledgers/${ledgerId}/groups/import`, formData, {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${token}`
      })
    });
  }
}