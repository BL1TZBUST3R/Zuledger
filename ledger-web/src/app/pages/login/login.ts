import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router'; // Import Router
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { AuthService } from '../../services/auth'; // Import your service

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, HttpClientModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {

  credentials = {
    email: '',
    password: ''
  };

  constructor(private authService: AuthService, private router: Router) {}

  onLogin() {
    this.authService.login(this.credentials).subscribe({
      next: (response: any) => {
        console.log('Login Success:', response);
        
        // 1. Save the token (The "Key" to the dashboard)
        localStorage.setItem('auth_token', response.token);
        
        // 2. Go to Dashboard
        this.router.navigate(['/dashboard']);
      },
      error: (error: any) => {
        console.error('Login Failed:', error);
        alert('Login Failed: ' + (error.error?.message || 'Check your email/password'));
      }
    });
  }
}