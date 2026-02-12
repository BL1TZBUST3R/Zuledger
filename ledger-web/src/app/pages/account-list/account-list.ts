import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

interface Group {
  id: number;
  name: string;
  code: string;
  children?: Group[];
}

@Component({
  selector: 'app-account-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './account-list.html',
})
export class AccountListComponent implements OnInit {
  
  groups: Group[] = [];
  isLoading: boolean = true;
  showModal: boolean = false;
  isSaving: boolean = false;

  // Updated to your Render backend URL
  private apiUrl = 'https://zuledger.onrender.com/api/groups';

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
    this.http.get<Group[]>(this.apiUrl)
      .subscribe({
        next: (data) => {
          this.groups = data;
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
  }

  // ✅ AUTOMATION LOGIC: Sugggests the next available code
  onParentChange() {
    const parentId = Number(this.newAccount.parent_id);
    const selectedParent = this.groups.find(g => g.id === parentId);

    if (selectedParent) {
      if (selectedParent.children && selectedParent.children.length > 0) {
        // If accounts exist in this group, find the highest code and add 1
        const existingCodes = selectedParent.children.map(c => parseInt(c.code)).filter(code => !isNaN(code));
        const maxCode = Math.max(...existingCodes);
        this.newAccount.code = (maxCode + 1).toString();
      } else {
        // If this is the first account, take parent code (e.g., 1000) and add 1
        const baseCode = parseInt(selectedParent.code);
        this.newAccount.code = (baseCode + 1).toString();
      }
    }
  }

  openCreateModal() {
    this.showModal = true;
    this.newAccount = { parent_id: '', name: '', code: '' };
  }

  closeModal() {
    this.showModal = false;
  }

  createAccount() {
    if (!this.newAccount.parent_id || !this.newAccount.name || !this.newAccount.code) return;

    this.isSaving = true;

    this.http.post(this.apiUrl, this.newAccount)
      .subscribe({
        next: () => {
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