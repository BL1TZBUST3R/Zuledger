import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth'; // Using standardised service

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.html',
})
export class LoginComponent {
  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  showPassword = false; // Tracks visibility

  constructor(
    private fb: FormBuilder,
    private authService: AuthService, // Using service for correct URL
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  onSubmit() {
    if (this.loginForm.invalid) return;

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(this.loginForm.value).subscribe({
        next: (response) => {
          console.log('Login Success:', response);
          localStorage.setItem('token', response.token);
          this.router.navigate(['/accounts']);
        },
        error: (error) => {
          console.error('Login Failed:', error);
          this.errorMessage = 'Invalid email or password';
          this.isLoading = false;
        }
      });
  }
}