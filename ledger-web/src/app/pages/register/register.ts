import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
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

// Track password visibility
showPassword = false;
showConfirmPassword = false;

constructor(private authService: AuthService, private router: Router) {}

  // Signal for password mismatch
  get passwordsMatch(): boolean {
    if (!this.user.password || !this.user.password_confirmation) return true;
    return this.user.password === this.user.password_confirmation;
  }

  // Logic to enable/disable Sign Up button
  get isFormValid(): boolean {
    return (
      this.user.name.length > 0 &&
      this.user.email.includes('@') &&
      this.user.password.length >= 8 &&
      this.user.password === this.user.password_confirmation
    );
  }

  onRegister() {
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