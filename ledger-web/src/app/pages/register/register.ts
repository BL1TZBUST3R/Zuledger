import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms'; // 👈 1. Import this tool

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule], // 👈 2. Add it to the toolbox
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class RegisterComponent {
  

  user = {
    name: '',
    email: '',
    password: ''
  };

  onRegister() {
    console.log('User Data:', this.user);
    alert('Registration simulated! check console for data.');
  }
}