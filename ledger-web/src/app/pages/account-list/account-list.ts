import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AccountService } from '../../services/account'; // 👈 Import the service

@Component({
  selector: 'app-account-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './account-list.html',
  styleUrl: './account-list.css'
})
export class AccountListComponent implements OnInit {

  groups: any[] = []; // Store the data here
  isLoading = true;   // Track if we are waiting for the server

  constructor(private accountService: AccountService) {}

  ngOnInit() {
    this.fetchGroups();
  }

  fetchGroups() {
    this.accountService.getGroups().subscribe({
      next: (data) => {
        console.log('Success:', data);
        this.groups = data; // Save the data to our list
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error:', err);
        this.isLoading = false;
      }
    });
  }
}