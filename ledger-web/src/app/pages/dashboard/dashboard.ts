import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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
  newLedgerTemplate: string = '';
  inviteEmail: string = '';
  
  isLoading = true;
  currentUserId: number = 0;

 constructor(
  private dashboardService: DashboardService,
  private ledgerService: LedgerService,
  private cdr: ChangeDetectorRef
) {}

 ngOnInit() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  this.currentUserId = user.id || 0;
  this.loadData();
}

loadData() {
  this.isLoading = true;
  let statsLoaded = false;
  let ledgersLoaded = false;

  const checkDone = () => {
    if (statsLoaded && ledgersLoaded) {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  };

  this.dashboardService.getStats().subscribe({
    next: (data: any) => {
      this.stats = data;
      statsLoaded = true;
      checkDone();
    },
    error: (err: any) => {
      console.error('Stats error:', err);
      statsLoaded = true;
      checkDone();
    }
  });

  this.ledgerService.getLedgers().subscribe({
    next: (data: any[]) => {
      this.ledgers = data.map(l => ({ ...l, authorizedUsers: l.authorized_users || [] }));
      ledgersLoaded = true;
      checkDone();
    },
    error: (err: any) => {
      console.error('Ledgers error:', err);
      ledgersLoaded = true;
      checkDone();
    }
  });
}
  // 🆕 Create a new Ledger (Company)
 createLedger() {
  if (!this.newLedgerName.trim()) return;

  this.ledgerService.createLedger(this.newLedgerName, this.newLedgerTemplate).subscribe({
    next: (newLedger) => {
      this.ledgers.push({ ...newLedger, authorizedUsers: [] });
      this.newLedgerName = '';
      this.newLedgerTemplate = '';
      this.isLoading = false;
    },
    error: (err) => {
      this.isLoading = false;
      alert('Failed to create ledger: ' + (err.error?.message || err.message));
    }
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

  renameLedger(ledger: any) {
  const newName = prompt(`Rename "${ledger.name}" to:`, ledger.name);
  if (!newName || newName.trim() === ledger.name) return;

  this.ledgerService.renameLedger(ledger.id, newName.trim()).subscribe({
    next: (updated) => { ledger.name = updated.name; },
    error: (err) => alert('Rename failed: ' + (err.error?.message || err.message))
  });
}

deleteLedger(ledger: any) {
  const confirmed = confirm(
    `⚠️ Delete "${ledger.name}"?\n\nThis will permanently remove all accounts and transactions. This cannot be undone.`
  );
  if (!confirmed) return;

  this.ledgerService.deleteLedger(ledger.id).subscribe({
    next: () => { this.ledgers = this.ledgers.filter(l => l.id !== ledger.id); },
    error: (err) => alert('Delete failed: ' + (err.error?.message || err.message))
  });
}
removeUser(ledger: any, user: any) {
  const confirmed = confirm(`Remove ${user.email} from "${ledger.name}"?`);
  if (!confirmed) return;

  this.ledgerService.removeUser(ledger.id, user.id).subscribe({
    next: () => {
      ledger.authorizedUsers = ledger.authorizedUsers.filter((u: any) => u.id !== user.id);
    },
    error: (err) => alert('Failed to remove user: ' + (err.error?.message || err.message))
  });
}
}