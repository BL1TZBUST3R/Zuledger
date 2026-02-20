import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd, Event } from '@angular/router'; // 👈 Added NavigationEnd & Event
import { filter } from 'rxjs/operators'; // 👈 Added filter
import { LedgerService } from '../../services/ledger.service'; // 👈 Added LedgerService

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.html',
})
export class SidebarComponent implements OnInit {
  
  isExpanded = true;
  userName = 'User';
  userEmail = '';

  // 👇 NEW: State to store the active ledger details
  ledgerId: string | null = null;
  activeLedgerName: string = '';

  constructor(
    public router: Router,
    private ledgerService: LedgerService // 👈 Inject the service
  ) {
    // 👇 NEW: Listen to URL changes to detect if we entered or left a ledger
    this.router.events.pipe(
      filter((event: Event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.checkLedgerContext();
    });
  } 

  ngOnInit() {
    // 1. Get the raw string from storage
    const userString = localStorage.getItem('user');
    
    if (userString) {
      try {
        // 2. Parse it back into an object
        const user = JSON.parse(userString);
        this.userName = user.name || 'Accountant';
        this.userEmail = user.email || '';
      } catch (e) {
        console.error('Error parsing user data', e);
      }
    }

    // 👇 NEW: Check the URL immediately when the sidebar loads
    this.checkLedgerContext();
  }

  // 👇 NEW: Extract the ID from the URL (e.g., /ledgers/5)
  checkLedgerContext() {
    const url = this.router.url;
    const match = url.match(/\/ledgers\/(\d+)/);
    
    if (match) {
      const newId = match[1];
      // Only fetch from the database if the ID actually changed
      if (this.ledgerId !== newId) {
          this.ledgerId = newId;
          this.fetchLedgerName(newId);
      }
    } else {
      // We are not in a ledger (e.g., on the Dashboard)
      this.ledgerId = null; 
      this.activeLedgerName = '';
    }
  }

  fetchLedgerName(id: string) {
      this.ledgerService.getCompanyInfo(id).subscribe({
          next: (ledger: any) => {
              this.activeLedgerName = ledger.name;
          },
          error: () => this.activeLedgerName = 'Ledger' // Fallback name
      });
  }
  

  toggleSidebar() {
    this.isExpanded = !this.isExpanded;
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }
}