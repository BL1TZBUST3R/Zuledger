import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true, // 👈 THIS WAS MISSING OR SET TO FALSE
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.html',
  // styleUrl: './sidebar.css' // Uncomment this if you have a css file
})
export class SidebarComponent {
  
  isCollapsed = false;

  constructor(private router: Router) {}

  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
  }

  getUserName(): string {
    // Check if running in browser to avoid errors during build
    if (typeof localStorage !== 'undefined') {
        const user = localStorage.getItem('user'); 
        return user ? JSON.parse(user).name : 'Accountant';
    }
    return 'Accountant';
  }

  onLogout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }
}