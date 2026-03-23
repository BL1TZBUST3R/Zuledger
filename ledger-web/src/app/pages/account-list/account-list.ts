import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AccountService } from '../../services/account';

interface Group {
  id: number;
  name: string;
  code: string;
  account_type?: string;
  account_subtype?: string;
  cashflow_type?: string;
  normal_balance?: string;
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
  isExporting: boolean = false;
  showImportModal: boolean = false;
  isImporting: boolean = false;
  importMode: string = 'add';
  selectedFile: File | null = null;
  importErrors: string[] = [];
  importSuccess: boolean = false;
  importedCount: number = 0;
  showSubtype: boolean = false;
  ledgerId: string | null = null;

  newAccount = {
    parent_id: '',
    name: '',
    code: '',
    account_type: '',
    account_subtype: '',
    cashflow_type: '',
    normal_balance: ''
  };

  get normalBalanceHint(): string {
    switch (this.newAccount.account_type) {
      case 'asset':    return 'Assets normally have a Debit (DR) balance';
      case 'expense':  return 'Expenses normally have a Debit (DR) balance';
      case 'liability': return 'Liabilities normally have a Credit (CR) balance';
      case 'equity':   return 'Equity normally has a Credit (CR) balance';
      case 'revenue':  return 'Revenue normally has a Credit (CR) balance';
      default:         return 'Select an account type for guidance';
    }
  }

  constructor(
    private accountService: AccountService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.ledgerId = this.route.snapshot.paramMap.get('id');
    if (this.ledgerId) {
      this.fetchGroups(this.ledgerId);
    } else {
      console.error('No Ledger ID found!');
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

  onAccountTypeChange() {
    const type = this.newAccount.account_type;
    this.showSubtype = ['asset', 'liability', 'revenue', 'expense'].includes(type);
    this.newAccount.account_subtype = '';

    // Auto-set normal balance based on account type
    if (type === 'asset' || type === 'expense') {
      this.newAccount.normal_balance = 'DR';
    } else if (type === 'liability' || type === 'equity' || type === 'revenue') {
      this.newAccount.normal_balance = 'CR';
    }
  }

  openCreateModal() {
    this.showModal = true;
    this.showSubtype = false;
    this.newAccount = { parent_id: '', name: '', code: '', account_type: '', account_subtype: '', cashflow_type: '', normal_balance: '' };
  }

  closeModal() {
    this.showModal = false;
  }

  createAccount() {
    if (!this.newAccount.parent_id || !this.newAccount.name || !this.newAccount.code || 
        !this.newAccount.account_type || !this.newAccount.normal_balance || !this.ledgerId) return;

    this.isSaving = true;

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
  exportCOA() {
    if (!this.ledgerId) return;

    this.isExporting = true;

    this.accountService.exportGroups(this.ledgerId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'chart_of_accounts.xlsx';
        a.click();
        window.URL.revokeObjectURL(url);
        this.isExporting = false;
      },
      error: (err) => {
        console.error('Export failed', err);
        alert('Failed to export Chart of Accounts.');
        this.isExporting = false;
      }
    });
  }
  openImportModal() {
    this.showImportModal = true;
    this.selectedFile = null;
    this.importErrors = [];
    this.importSuccess = false;
    this.importedCount = 0;
    this.importMode = 'add';
  }

  closeImportModal() {
    this.showImportModal = false;
  }

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0] || null;
    this.importErrors = [];
    this.importSuccess = false;
  }

  importCOA() {
    if (!this.ledgerId || !this.selectedFile) return;

    this.isImporting = true;
    this.importErrors = [];
    this.importSuccess = false;

    this.accountService.importGroups(this.ledgerId, this.selectedFile, this.importMode).subscribe({
      next: (result) => {
        this.importSuccess = true;
        this.importedCount = result.imported;
        this.fetchGroups(this.ledgerId!);
        this.isImporting = false;
      },
      error: (err) => {
        if (err.error && err.error.errors) {
          this.importErrors = err.error.errors;
        } else {
          this.importErrors = ['An unexpected error occurred.'];
        }
        this.isImporting = false;
      }
    });
  }
}