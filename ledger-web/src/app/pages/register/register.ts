import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

// 👇 CRITICAL FIX: We import from './auth' because your file is named auth.ts
import { AuthService } from '../../services/auth'; 

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, HttpClientModule],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class RegisterComponent {
  
  user = {
    name: '',
    email: '',
    password: '',
    password_confirmation: ''
  };

  constructor(private authService: AuthService, private router: Router) {}

  onRegister() {
    if (this.user.password !== this.user.password_confirmation) {
      alert('Passwords do not match!');
      return;
    }

    this.authService.register(this.user).subscribe({
      next: (response: any) => {
        console.log('Success:', response);
        alert('Account Created! Redirecting to login...');
        this.router.navigate(['/login']);
      },
      error: (error: any) => {
        console.error('Error:', error);
        alert('Registration Failed: ' + (error.error?.message || 'Server Error'));
      }
    });
  }
}