import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ActiveLedgerService {
  readonly ledgerName = signal<string | null>(this.loadFromStorage());

  set(name: string) {
    this.ledgerName.set(name);
    localStorage.setItem('active_ledger_name', name);
  }

  clear() {
    this.ledgerName.set(null);
    localStorage.removeItem('active_ledger_name');
  }

  private loadFromStorage(): string | null {
    return localStorage.getItem('active_ledger_name');
  }
}