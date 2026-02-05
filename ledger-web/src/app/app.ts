import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router } from '@angular/router'; // Removed RouterLink/Active

// 👇 1. Import the Sidebar so we can use <app-sidebar>
import { SidebarComponent } from './components/sidebar/sidebar'; 

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, 
    RouterOutlet, 
    SidebarComponent // 👈 2. Register it here
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class AppComponent {
  title = 'ledger-web';

  // We only need the router here to check if we are on Login/Register page
  constructor(public router: Router) {} 
}