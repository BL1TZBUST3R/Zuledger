import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router'; // 👈 Import ActivatedRoute
import { FormsModule } from '@angular/forms';
import { AccountService } from '../../services/account'; // 👈 Use the Service

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
  ledgerId: string | null = null; // 👈 Store the ID

  newAccount = {
    parent_id: '',
    name: '',
    code: ''
  };

  constructor(
    private accountService: AccountService, // 👈 Inject Service
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute // 👈 Inject Route
  ) {}

  ngOnInit() {
    // 1. Get the ID from the URL (defined in app.routes.ts as 'ledgers/:ledgerId')
    this.ledgerId = this.route.snapshot.paramMap.get('ledgerId');
    
    if (this.ledgerId) {
      this.fetchGroups(this.ledgerId);
    } else {
        console.error("No Ledger ID found!");
        this.isLoading = false;
    }
  }

  fetchGroups(id: string) {
    this.accountService.getGroups(id).subscribe({
      next: (data) => {
        this.groups = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
      }
    });
  }

  // Automation Logic (Kept same)
  onParentChange() {
    const parentId = Number(this.newAccount.parent_id);
    const selectedParent = this.groups.find(g => g.id === parentId);

    if (selectedParent) {
      if (selectedParent.children && selectedParent.children.length > 0) {
        const existingCodes = selectedParent.children.map(c => parseInt(c.code)).filter(code => !isNaN(code));
        const maxCode = Math.max(...existingCodes);
        this.newAccount.code = (maxCode + 1).toString();
      } else {
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
    if (!this.newAccount.parent_id || !this.newAccount.name || !this.newAccount.code || !this.ledgerId) return;

    this.isSaving = true;

    // Use the Service to create
    this.accountService.createGroup(this.ledgerId, this.newAccount).subscribe({
      next: () => {
        this.fetchGroups(this.ledgerId!); 
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