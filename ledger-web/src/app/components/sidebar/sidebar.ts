import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd, Event } from '@angular/router'; // 👈 Added NavigationEnd & Event
import { filter } from 'rxjs/operators'; // 👈 Added filter
import { ActiveLedgerService } from '../../services/active-ledger.service';
import { inject } from '@angular/core';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.html',
})
export class SidebarComponent implements OnInit {
  
  isExpanded = true;
  activeLedger = inject(ActiveLedgerService);
  isMobile = false;
  private urlLedgerId: string | null = null;

  get ledgerId(): string | null {
    return this.urlLedgerId ?? this.activeLedger.ledgerId();
  }
  
  userName = 'User';
  userEmail = '';

  constructor(public router: Router) {
    // 👇 SUBSCRIPTION: Listen for URL changes
    // This ensures that if you switch ledgers, the sidebar links update immediately.
    this.router.events.pipe(
      filter((event: Event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.checkLedgerContext();
    });
  } 

  ngOnInit() {
    this.loadUser();
    this.checkScreenSize();
    this.checkLedgerContext(); // Run check immediately on load
  }

  // 👇 LOGIC: Parse URL to find /ledgers/{id}
  checkLedgerContext() {
    const url = this.router.url;
    // Regex to find the ID after 'ledgers/'
    const match = url.match(/\/(ledger|accounts)\/(\d+)(?:\/|$)/);
    
    if (match) {
      this.urlLedgerId = match[2];
    } else {
      this.urlLedgerId = null;
    }
  }

  loadUser() {
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
  }

  // 👇 RESPONSIVE: Auto-collapse on mobile
  @HostListener('window:resize', [])
  onResize() {
    this.checkScreenSize();
  }

  checkScreenSize() {
    const wasMobile = this.isMobile;
    this.isMobile = window.innerWidth < 768; // Tailwind 'md' breakpoint

    // If we just switched TO mobile, collapse the sidebar
    if (this.isMobile && !wasMobile) {
        this.isExpanded = false;
    }
    // If we just switched TO desktop, expand it
    if (!this.isMobile && wasMobile) {
        this.isExpanded = true;
    }
  }

  toggleSidebar() {
    this.isExpanded = !this.isExpanded;
  }

  // Helper for HTML: Close sidebar when clicking a link on mobile
  closeOnMobile() {
    if (this.isMobile) {
        this.isExpanded = false;
    }
  }

  logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }
}