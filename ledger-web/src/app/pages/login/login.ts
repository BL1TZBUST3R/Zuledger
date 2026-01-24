import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms'; // 👈 Necessary for the form to work

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule], 
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {

  credentials = {
    email: '',
    password: ''
  };

  onLogin() {
    console.log('Login Attempt:', this.credentials);
    alert('Login simulated! check console.');
  }
}