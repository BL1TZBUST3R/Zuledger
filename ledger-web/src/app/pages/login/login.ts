import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth'; // 👈 Import AuthService

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
showPassword = false;
  constructor(
    private fb: FormBuilder,
    private authService: AuthService, // 👈 Inject Service
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

    // 👇 Use authService.login() instead of http.post()
    this.authService.login(this.loginForm.value).subscribe({
        next: (response: any) => {
          // 1. Save Token
          localStorage.setItem('token', response.token);
          
          // 2. ✅ SAVE USER DATA (The sidebar needs this!)
          localStorage.setItem('user', JSON.stringify(response.user));

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