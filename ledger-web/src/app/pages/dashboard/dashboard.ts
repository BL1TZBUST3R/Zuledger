import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // 👈 Needed for inputs
import { RouterModule } from '@angular/router'; // 👈 Needed for links to ledgers
import { DashboardService } from '../../services/dashboard.service';
import { LedgerService } from '../../services/ledger.service'; // 👈 New Service

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule], 
  templateUrl: './dashboard.html',
})
export class DashboardComponent implements OnInit {
  
  // Existing Stats
  stats: any = {
    total_assets: 0,
    total_liabilities: 0,
    net_income: 0,
    account_stats: { main_groups: 0, sub_accounts: 0 }
  };

  // 🆕 Multi-Ledger State
  ledgers: any[] = [];
  newLedgerName: string = '';
  inviteEmail: string = '';
  
  isLoading = true;

  constructor(
    private dashboardService: DashboardService,
    private ledgerService: LedgerService // 👈 Inject the service
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoading = true;

    // 1. Fetch Stats (Existing)
    this.dashboardService.getStats().subscribe({
      next: (data: any) => this.stats = data,
      error: (err: any) => console.error('Stats error:', err)
    });

    // 2. Fetch Ledgers (New)
    this.ledgerService.getLedgers().subscribe({
      next: (data: any[]) => {
        this.ledgers = data;
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Ledgers error:', err);
        this.isLoading = false;
      }
    });
  }

  // 🆕 Create a new Ledger (Company)
  createLedger() {
    if (!this.newLedgerName.trim()) return;

    this.ledgerService.createLedger(this.newLedgerName).subscribe({
      next: (newLedger) => {
        this.ledgers.push(newLedger); // Update UI immediately
        this.newLedgerName = ''; // Clear input
        alert(`Ledger "${newLedger.name}" created!`);
      },
      error: (err) => alert('Failed to create ledger: ' + (err.error?.message || err.message))
    });
  }

  // 🆕 Invite User logic (The "Authorize Other Accounts" feature)
  inviteUser(ledger: any) {
    // We use a browser prompt for now to keep the UI simple without a custom modal
    const email = prompt(`Enter email to invite to ${ledger.name}:`);
    if (!email) return;

    this.ledgerService.authorizeUser(ledger.id, email, 'editor').subscribe({
      next: () => alert(`Invited ${email} successfully!`),
      error: (err) => alert('Invite failed: ' + (err.error?.message || err.message))
    });
  }
}