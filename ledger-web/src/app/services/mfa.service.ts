import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api.config';

export interface MfaStatus {
  mfa_enabled: boolean;
  trusted_devices: TrustedDevice[];
}

export interface TrustedDevice {
  id: number;
  label: string | null;
  user_agent: string | null;
  ip_address: string | null;
  last_used_at: string | null;
  expires_at: string;
  created_at: string;
}

export interface MfaVerifyResponse {
  user: any;
  token: string;
  trust_token?: string;
}

const TRUST_TOKEN_KEY = 'mfa_trust_token';

@Injectable({ providedIn: 'root' })
export class MfaService {

  constructor(private http: HttpClient) {}

  // ── Login flow (public) ─────────────────────────────────────────────
  verify(challenge: string, code: string, rememberDevice: boolean): Observable<MfaVerifyResponse> {
    return this.http.post<MfaVerifyResponse>(`${API_BASE_URL}/mfa/verify`, {
      challenge,
      code,
      remember_device: rememberDevice,
    });
  }

  resend(challenge: string): Observable<{ message: string; challenge: string }> {
    return this.http.post<{ message: string; challenge: string }>(
      `${API_BASE_URL}/mfa/resend`,
      { challenge }
    );
  }

  // ── Settings (auth required) ────────────────────────────────────────
  status(): Observable<MfaStatus> {
    return this.http.get<MfaStatus>(`${API_BASE_URL}/mfa/status`);
  }

  enable(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${API_BASE_URL}/mfa/enable`, {});
  }

  confirmEnable(code: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${API_BASE_URL}/mfa/confirm-enable`, { code });
  }

  disable(password: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${API_BASE_URL}/mfa/disable`, { password });
  }

  revokeDevice(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${API_BASE_URL}/mfa/trusted-devices/${id}`);
  }

  // ── Trust token storage helpers ─────────────────────────────────────
  getTrustToken(): string | null {
    return localStorage.getItem(TRUST_TOKEN_KEY);
  }

  setTrustToken(token: string): void {
    localStorage.setItem(TRUST_TOKEN_KEY, token);
  }

  clearTrustToken(): void {
    localStorage.removeItem(TRUST_TOKEN_KEY);
  }
}
