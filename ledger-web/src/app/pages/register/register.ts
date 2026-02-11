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
  styleUrl: './register.css' // Make sure you have this file, or remove this line
})
export class RegisterComponent {
  
  user = {
    name: '',
    email: '',
    password: '',
    password_confirmation: ''
  };

  // Variables for the Eye Icons
  showPassword = false;
  showConfirmPassword = false;

  constructor(private authService: AuthService, private router: Router) {}

  // Helper to toggle visibility
  toggleVisibility(field: 'password' | 'confirm') {
    if (field === 'password') {
      this.showPassword = !this.showPassword;
    } else {
      this.showConfirmPassword = !this.showConfirmPassword;
    }
  }

  // Real-time check: Do they match?
  get passwordsMatch(): boolean {
    return this.user.password === this.user.password_confirmation;
  }

  // Real-time check: Is the form ready?
  get isFormValid(): boolean {
    return (
      this.user.name.length > 0 &&
      this.user.email.length > 0 &&
      this.user.password.length > 0 &&
      this.passwordsMatch
    );
  }

  onRegister() {
    if (!this.passwordsMatch) {
      alert('Passwords do not match!');
      return;
    }

    this.authService.register(this.user).subscribe({
      next: (response: any) => {
        alert('Account Created! Redirecting to login...');
        this.router.navigate(['/login']);
      },
      error: (error: any) => {
        alert('Registration Failed: ' + (error.error?.message || 'Server Error'));
      }
    });
  }
}