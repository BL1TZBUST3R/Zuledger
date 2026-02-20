import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd, Event } from '@angular/router';
import { filter } from 'rxjs/operators';
import { LedgerService } from '../../services/ledger.service';

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

  ledgerId: string | null = null;
  activeLedgerName: string = '';

  constructor(
    public router: Router,
    private ledgerService: LedgerService
  ) {
    this.router.events.pipe(
      filter((event: Event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.checkLedgerContext();
    });
  } 

  ngOnInit() {
    const userString = localStorage.getItem('user');
    
    if (userString) {
      try {
        const user = JSON.parse(userString);
        this.userName = user.name || 'Accountant';
        this.userEmail = user.email || '';
      } catch (e) {
        console.error('Error parsing user data', e);
      }
    }

    this.checkLedgerContext();
  }

  checkLedgerContext() {
    const url = this.router.url;
    const match = url.match(/\/ledgers\/(\d+)/);
    
    if (match) {
      const newId = match[1];
      if (this.ledgerId !== newId) {
          this.ledgerId = newId;
          this.fetchLedgerName(newId);
      }
    } else {
      this.ledgerId = null; 
      this.activeLedgerName = '';
    }
  }

  fetchLedgerName(id: string) {
      this.ledgerService.getCompanyInfo(id).subscribe({
          // Notice the ": any" is already here to fix your TS error!
          next: (ledger: any) => {
              this.activeLedgerName = ledger.name;
          },
          error: () => this.activeLedgerName = 'Ledger'
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