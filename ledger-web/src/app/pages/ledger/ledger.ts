import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { LedgerService } from '../../services/ledger.service'; // 👈 Switch to Service

@Component({
  selector: 'app-ledger',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './ledger.html',
})
export class LedgerComponent implements OnInit {
  
  ledger: any = null;
  entries: any[] = [];
  balance: number = 0;
  
  // 🔒 Permission Flag
  canEdit: boolean = false; 
  isLoading = true;

  constructor(
    private route: ActivatedRoute,
    private ledgerService: LedgerService
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.fetchLedger(id);
    }
  }

  fetchLedger(id: string) {
    this.ledgerService.getLedger(id).subscribe({
      next: (data) => {
        this.ledger = data.account; // Or data.ledger depending on your Controller response
        this.entries = data.entries;
        this.balance = data.current_balance;

        // 👇 PERMISSION LOGIC
        // Check if I am the owner OR if my pivot role is 'editor'
        const isOwner = data.is_owner; // (Make sure to send this from backend)
        const role = data.permission_level; // (From pivot)
        
        this.canEdit = isOwner || role === 'editor';
        
        this.isLoading = false;
      },
      error: (err) => console.error('Access Denied', err)
    });
  }
}