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
  
  // ✅ 1. Define the variables the HTML is looking for
  isExpanded = true;
  userName = 'User';
  userEmail = '';

  // ✅ 2. Change 'private' to 'public' so the HTML can check routes
  constructor(public router: Router) {} 

  ngOnInit() {
    // ✅ 3. Load user data on startup
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

  // ✅ 4. Define the toggle function
  toggleSidebar() {
    this.isExpanded = !this.isExpanded;
  }

  // ✅ 5. Define the logout function
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }
}