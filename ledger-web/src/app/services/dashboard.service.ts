import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
// 🚨 Ensure 'export' is here!
export class DashboardService {
  private apiUrl = 'https://zuledger.onrender.com/api/dashboard';

  constructor(private http: HttpClient) { }

  getStats(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }
}