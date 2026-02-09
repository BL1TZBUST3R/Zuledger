import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-ledger',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './ledger.html',
})
export class LedgerComponent implements OnInit {
  
  account: any = null;
  entries: any[] = [];
  balance: number = 0;
  isLoading = true;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient
  ) {}

  ngOnInit() {
    // 1. Get the ID from the URL (e.g. /ledger/5)
    const accountId = this.route.snapshot.paramMap.get('id');
    
    if (accountId) {
      this.fetchLedger(accountId);
    }
  }

  fetchLedger(id: string) {
    this.http.get<any>(`http://localhost:8000/api/accounts/${id}/ledger`)
      .subscribe({
        next: (data) => {
          this.account = data.account;
          this.entries = data.entries;
          this.balance = data.current_balance;
          this.isLoading = false;
        },
        error: (err) => console.error(err)
      });
  }
}