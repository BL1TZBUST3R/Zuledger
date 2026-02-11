import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

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

  constructor(public router: Router) {} 

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