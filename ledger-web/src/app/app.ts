import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
// 👇 1. Import your Auth Service (adjust path if needed, e.g. './services/auth')
import { AuthService } from './services/auth'; 

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class AppComponent {
  title = 'ledger-web';

  // 👇 2. Inject Auth Service in the constructor
  constructor(public router: Router, private auth: AuthService) {}

  // 👇 3. Add this function to read the name we saved
  getUserName(): string {
    return localStorage.getItem('user_name') || 'Accountant';
  }

  // 👇 4. Add this function to handle the click
  onLogout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}