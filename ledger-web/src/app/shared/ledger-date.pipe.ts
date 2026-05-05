import { Pipe, PipeTransform } from '@angular/core';
import { ActiveLedgerService } from '../services/active-ledger.service';

@Pipe({ name: 'ledgerDate', standalone: true, pure: false })
export class LedgerDatePipe implements PipeTransform {
  constructor(private active: ActiveLedgerService) {}

  transform(value: string | Date | null | undefined): string {
    if (value === null || value === undefined || value === '') return '';
    const d = value instanceof Date ? value : new Date(value);
    if (isNaN(d.getTime())) return String(value);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return this.active.dateFormat() === 'MM/DD/YYYY'
      ? `${mm}/${dd}/${yyyy}`
      : `${dd}/${mm}/${yyyy}`;
  }
}
