import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth'; 

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
  showPassword = false; // ✅ Restored for the eye icon toggle

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
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

    // ✅ Cleaned up: Only one login call now
    this.authService.login(this.loginForm.value).subscribe({
      next: (response: any) => {
        // 1. Save authentication token
        localStorage.setItem('token', response.token);
        
        // 2. Save User details (Important for the Sidebar name/avatar)
        localStorage.setItem('user', JSON.stringify(response.user));

        // 3. Redirect to the Dashboard
        this.router.navigate(['/dashboard']); 
      },
      error: (error) => {
        console.error('Login Failed:', error);
        this.errorMessage = 'Invalid email or password';
        this.isLoading = false;
      }
    });
  }
}