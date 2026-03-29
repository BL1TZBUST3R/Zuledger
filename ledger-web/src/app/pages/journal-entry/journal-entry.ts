import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { JournalService } from '../../services/journal';
import { AccountService } from '../../services/account';

interface JournalLine {
  group_id: number;
  amount: number;
  type: string;
  account?: { id: number; name: string; code: string };
}

interface Journal {
  id: number;
  journal_number: number;
  description: string;
  date: string;
  status: string;
  lines: JournalLine[];
  user?: { name: string };
}

interface Account {
  id: number;
  name: string;
  code: string;
  children?: Account[];
}

@Component({
  selector: 'app-journal-entry',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './journal-entry.html',
})
export class JournalEntryComponent implements OnInit {

  journals: Journal[] = [];
  accounts: Account[] = [];
  flatAccounts: Account[] = [];
  isLoading: boolean = true;
  ledgerId: string | null = null;

  showModal: boolean = false;
  isEditing: boolean = false;
  isSaving: boolean = false;
  editingJournalId: string | null = null;

  newJournal = {
    description: '',
    date: '',
    lines: [
      { group_id: '', amount: '', type: 'DR' },
      { group_id: '', amount: '', type: 'CR' },
    ] as any[]
  };

  get totalDR(): number {
    return this.newJournal.lines
      .filter((l: any) => l.type === 'DR')
      .reduce((sum: number, l: any) => sum + (parseFloat(l.amount) || 0), 0);
  }

  get totalCR(): number {
    return this.newJournal.lines
      .filter((l: any) => l.type === 'CR')
      .reduce((sum: number, l: any) => sum + (parseFloat(l.amount) || 0), 0);
  }

  get isBalanced(): boolean {
    return Math.abs(this.totalDR - this.totalCR) < 0.01 && this.totalDR > 0;
  }

  get difference(): number {
    return Math.abs(this.totalDR - this.totalCR);
  }

  constructor(
    private journalService: JournalService,
    private accountService: AccountService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.ledgerId = this.route.snapshot.paramMap.get('id');
    if (this.ledgerId) {
      this.fetchJournals();
      this.fetchAccounts();
    }
  }

  fetchJournals() {
    if (!this.ledgerId) return;
    this.journalService.getJournals(this.ledgerId).subscribe({
      next: (data: any) => {
        this.journals = data;
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error(err);
        this.isLoading = false;
      }
    });
  }

  fetchAccounts() {
    if (!this.ledgerId) return;
    this.accountService.getGroups(this.ledgerId).subscribe({
      next: (data: any) => {
        this.accounts = data;
        this.flatAccounts = [];
        data.forEach((group: any) => {
          if (group.children && group.children.length > 0) {
            group.children.forEach((child: any) => {
              this.flatAccounts.push(child);
            });
          } else {
            this.flatAccounts.push(group);
          }
        });
      },
      error: (err: any) => console.error(err)
    });
  }

  openCreateModal() {
    this.showModal = true;
    this.isEditing = false;
    this.editingJournalId = null;
    this.newJournal = {
      description: '',
      date: new Date().toISOString().split('T')[0],
      lines: [
        { group_id: '', amount: '', type: 'DR' },
        { group_id: '', amount: '', type: 'CR' },
      ]
    };
  }

  openEditModal(journal: Journal) {
    if (journal.status === 'posted') return;

    this.showModal = true;
    this.isEditing = true;
    this.editingJournalId = journal.id.toString();
    this.newJournal = {
      description: journal.description || '',
      date: journal.date.split('T')[0],
      lines: journal.lines.map((l: any) => ({
        group_id: l.group_id || (l.account ? l.account.id : ''),
        amount: l.amount.toString(),
        type: l.type
      }))
    };
  }

  closeModal() {
    this.showModal = false;
  }

  addLine() {
    this.newJournal.lines.push({ group_id: '', amount: '', type: 'DR' });
  }

  removeLine(index: number) {
    if (this.newJournal.lines.length > 2) {
      this.newJournal.lines.splice(index, 1);
    }
  }

  saveJournal() {
    if (!this.ledgerId || !this.isBalanced) return;

    this.isSaving = true;

    const payload = {
      description: this.newJournal.description,
      date: this.newJournal.date,
      lines: this.newJournal.lines.map((l: any) => ({
        group_id: parseInt(l.group_id),
        amount: parseFloat(l.amount),
        type: l.type
      }))
    };

    const request = this.isEditing && this.editingJournalId
      ? this.journalService.updateJournal(this.ledgerId, this.editingJournalId, payload)
      : this.journalService.createJournal(this.ledgerId, payload);

    request.subscribe({
      next: () => {
        this.fetchJournals();
        this.closeModal();
        this.isSaving = false;
      },
      error: (err: any) => {
        console.error(err);
        alert(err.error?.message || 'Failed to save journal.');
        this.isSaving = false;
      }
    });
  }

  postJournal(journal: Journal) {
    if (!this.ledgerId) return;
    this.journalService.postJournal(this.ledgerId, journal.id.toString()).subscribe({
      next: () => this.fetchJournals(),
      error: (err: any) => alert(err.error?.message || 'Failed to post journal.')
    });
  }

 reverseJournal(journal: Journal) {
    if (!this.ledgerId) return;
    if (!confirm('This will create a new reversal journal with flipped debits and credits. Continue?')) return;

    this.journalService.reverseJournal(this.ledgerId, journal.id.toString()).subscribe({
      next: () => this.fetchJournals(),
      error: (err: any) => alert(err.error?.message || 'Failed to reverse journal.')
    });
  }

  deleteJournal(journal: Journal) {
    if (!this.ledgerId || journal.status === 'posted') return;
    if (!confirm('Are you sure you want to delete this journal entry?')) return;

    this.journalService.deleteJournal(this.ledgerId, journal.id.toString()).subscribe({
      next: () => this.fetchJournals(),
      error: (err: any) => alert(err.error?.message || 'Failed to delete journal.')
    });
  }

  getLineSummary(journal: Journal): string {
    const totalDR = journal.lines
      .filter((l: any) => l.type === 'DR')
      .reduce((sum: number, l: any) => sum + parseFloat(l.amount), 0);
    return totalDR.toFixed(2);
  }

  getAccountName(line: JournalLine): string {
    if (line.account) return `${line.account.code} - ${line.account.name}`;
    const found = this.flatAccounts.find((a: any) => a.id === line.group_id);
    return found ? `${found.code} - ${found.name}` : 'Unknown';
  }
}