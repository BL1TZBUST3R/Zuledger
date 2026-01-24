import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
// 👇 IMPORTANT: This import is required for the "doorway" to work
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  // 👇 IMPORTANT: RouterOutlet must be in this list
 imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class AppComponent {
  title = 'ledger-web';
}