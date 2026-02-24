import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ActiveLedgerService {
  readonly ledgerName = signal<string | null>(null);

  set(name: string) { this.ledgerName.set(name); }
  clear()           { this.ledgerName.set(null);  }
}