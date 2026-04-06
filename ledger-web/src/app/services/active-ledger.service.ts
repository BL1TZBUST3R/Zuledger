import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ActiveLedgerService {
  readonly ledgerName = signal<string | null>(localStorage.getItem('active_ledger_name'));
  readonly ledgerId = signal<string | null>(localStorage.getItem('active_ledger_id'));

  set(id: string, name: string) {
    this.ledgerId.set(id);
    this.ledgerName.set(name);
    localStorage.setItem('active_ledger_id', id);
    localStorage.setItem('active_ledger_name', name);
  }

  clear() {
    this.ledgerId.set(null);
    this.ledgerName.set(null);
    localStorage.removeItem('active_ledger_id');
    localStorage.removeItem('active_ledger_name');
  }
}