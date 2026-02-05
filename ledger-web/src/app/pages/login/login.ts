import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';

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

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
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

    // 1. Send Login Request
    this.http.post<any>('http://localhost:8000/api/login', this.loginForm.value)
      .subscribe({
        next: (response) => {
          console.log('Login Success:', response);

          // 👇 THIS IS THE MISSING MAGIC LINE!
          // We must save the token so the Interceptor can find it later.
          localStorage.setItem('token', response.token);

          // 2. Navigate to Dashboard
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