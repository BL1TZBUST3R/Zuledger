import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { FormsModule } from '@angular/forms'; 
import { RouterModule } from '@angular/router'; 
import { DashboardService } from '../../services/dashboard.service';
import { LedgerService } from '../../services/ledger.service'; 

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule], 
  templateUrl: './dashboard.html',
})
export class DashboardComponent implements OnInit {
  
  stats: any = {
    total_assets: 0,
    total_liabilities: 0,
    net_income: 0,
    account_stats: { main_groups: 0, sub_accounts: 0 }
  };

  ledgers: any[] = [];
  newLedgerName: string = '';
  isLoading = true;

  constructor(
    private dashboardService: DashboardService,
    private ledgerService: LedgerService
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoading = true;
    this.dashboardService.getStats().subscribe({
      next: (data: any) => this.stats = data,
      error: (err: any) => console.error(err)
    });

    this.ledgerService.getLedgers().subscribe({
      next: (data: any[]) => {
        this.ledgers = data.map(l => ({...l, inviteEmail: ''}));
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error(err);
        this.isLoading = false;
      }
    });
  }

  createLedger() {
    if (!this.newLedgerName.trim()) return;
    this.ledgerService.createLedger(this.newLedgerName).subscribe({
      next: (newLedger) => {
        this.ledgers.push({...newLedger, inviteEmail: ''}); 
        this.newLedgerName = ''; 
      },
      error: (err) => alert('Failed to create ledger')
    });
  }

  inviteUser(ledger: any) {
    if (!ledger.inviteEmail) return;
    this.ledgerService.authorizeUser(ledger.id, ledger.inviteEmail, 'editor').subscribe({
      next: () => {
          alert(`Invited ${ledger.inviteEmail}!`);
          ledger.inviteEmail = ''; 
      },
      error: (err) => alert('Invite failed')
    });
  }

  // 👇 NEW: Rename Logic
  renameLedger(ledger: any) {
    const newName = prompt("Enter new name for " + ledger.name, ledger.name);
    if (newName && newName !== ledger.name) {
        this.ledgerService.updateLedger(ledger.id, newName).subscribe({
            next: () => {
                ledger.name = newName; // Update UI
            },
            error: () => alert("Failed to rename ledger.")
        });
    }
  }

  // 👇 NEW: Delete Logic
  deleteLedger(ledger: any) {
    if (confirm(`⚠️ ARE YOU SURE?\n\nThis will delete "${ledger.name}" and ALL its accounts permanently.`)) {
        this.ledgerService.deleteLedger(ledger.id).subscribe({
            next: () => {
                // Remove from list
                this.ledgers = this.ledgers.filter(l => l.id !== ledger.id);
            },
            error: () => alert("Failed to delete ledger.")
        });
    }
  }
}