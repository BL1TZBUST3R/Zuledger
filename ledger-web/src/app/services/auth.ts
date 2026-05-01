import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api.config';

@Injectable({ providedIn: 'root' })
export class AuthService {

  constructor(private http: HttpClient) {}

  register(userData: any): Observable<any> {
    return this.http.post(`${API_BASE_URL}/register`, userData);
  }

  login(credentials: any): Observable<any> {
    const trustToken = localStorage.getItem('mfa_trust_token');
    const payload = trustToken ? { ...credentials, trust_token: trustToken } : credentials;
    return this.http.post(`${API_BASE_URL}/login`, payload);
  }

  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
}