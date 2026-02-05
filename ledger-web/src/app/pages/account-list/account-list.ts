import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms'; // 👈 IMPORT THIS!

interface Group {
  id: number;
  name: string;
  code: string;
  children?: Group[];
}

@Component({
  selector: 'app-account-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule], // 👈 ADD IT HERE TOO
  templateUrl: './account-list.html',
})
export class AccountListComponent implements OnInit {
  
  groups: Group[] = [];
  isLoading: boolean = true;
  showModal: boolean = false; // Controls the popup visibility
  isSaving: boolean = false;

  // The form data
  newAccount = {
    parent_id: '',
    name: '',
    code: ''
  };

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.fetchGroups();
  }

  fetchGroups() {
    this.http.get<Group[]>('http://localhost:8000/api/groups')
      .subscribe({
        next: (data) => {
          this.groups = data;
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
  }

  // 👇 OPEN THE POPUP
  openCreateModal() {
    this.showModal = true;
    // Reset form
    this.newAccount = { parent_id: '', name: '', code: '' };
  }

  // 👇 CLOSE THE POPUP
  closeModal() {
    this.showModal = false;
  }

  // 👇 SEND DATA TO BACKEND
  createAccount() {
    if (!this.newAccount.parent_id || !this.newAccount.name || !this.newAccount.code) return;

    this.isSaving = true;

    this.http.post('http://localhost:8000/api/groups', this.newAccount)
      .subscribe({
        next: () => {
          // Success! Reload the list and close modal
          this.fetchGroups(); 
          this.closeModal();
          this.isSaving = false;
        },
        error: (err) => {
          console.error(err);
          alert('Failed to create account.');
          this.isSaving = false;
        }
      });
  }
}