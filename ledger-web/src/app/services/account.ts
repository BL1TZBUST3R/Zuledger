import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api.config';

@Injectable({ providedIn: 'root' })
export class AccountService {

  constructor(private http: HttpClient) {}

  getGroups(ledgerId: string): Observable<any> {
    return this.http.get(`${API_BASE_URL}/ledgers/${ledgerId}/groups`);
  }

  createGroup(ledgerId: string, data: any): Observable<any> {
    return this.http.post(`${API_BASE_URL}/ledgers/${ledgerId}/groups`, data);
  }

  exportGroups(ledgerId: string): Observable<Blob> {
    return this.http.get(`${API_BASE_URL}/ledgers/${ledgerId}/groups/export`, {
      responseType: 'blob'
    });
  }

  importGroups(ledgerId: string, file: File, mode: string = 'add'): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('mode', mode);
    return this.http.post(`${API_BASE_URL}/ledgers/${ledgerId}/groups/import`, formData);
  }
}
