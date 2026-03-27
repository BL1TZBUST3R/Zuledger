import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { LedgerService } from '../../services/ledger.service';
import { ActiveLedgerService } from '../../services/active-ledger.service';

@Component({
  selector: 'app-ledger',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './ledger.html',
})
export class LedgerComponent implements OnInit, OnDestroy {
  
  // 👇 FIX: Renamed from 'ledger' to 'account' to match your HTML
  account: any = null; 
  entries: any[] = [];
  balance: number = 0;
  
  // Permission Flags
  canEdit: boolean = false; 
  isLoading = true;

 constructor(
  private route: ActivatedRoute,
  private ledgerService: LedgerService,
  private activeLedger: ActiveLedgerService
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
        // 👇 FIX: Assign data to 'this.account'
        this.account = data.account; 
        this.activeLedger.set(data.account.name);
        this.entries = data.entries;
        this.balance = data.current_balance;

        // Permissions
        const isOwner = data.is_owner;
        const role = data.permission_level;
        
        this.canEdit = isOwner || role === 'editor';
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Access Denied', err);
        this.isLoading = false;
      }
    });
  }
  ngOnDestroy() {
  this.activeLedger.clear();
}
}