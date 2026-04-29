import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ReportService } from '../../services/report.service';
import { SettingsService } from '../../services/settings.service';
import { CurrencyService } from '../../services/currency.service';

type ReportTab = 'trial-balance' | 'profit-loss' | 'balance-sheet' | 'cash-flow' | 'general-ledger' | 'journal-report';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './reports.html',
})
export class ReportsComponent implements OnInit {

  ledgerId: string | null = null;
  activeTab: ReportTab = 'trial-balance';
  isLoading = false;
  reportData: any = null;
  errorMessage = '';

  today = new Date().toISOString().split('T')[0];
  yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];

  // Filters
  asAt = this.today;
  from = this.yearStart;
  to = this.today;
  journalStatus = '';

  tabs: { id: ReportTab; label: string }[] = [
    { id: 'trial-balance',   label: 'Trial Balance' },
    { id: 'profit-loss',     label: 'Profit & Loss' },
    { id: 'balance-sheet',   label: 'Balance Sheet' },
    { id: 'cash-flow',       label: 'Cash Flow' },
    { id: 'general-ledger',  label: 'General Ledger' },
    { id: 'journal-report',  label: 'Journal Report' },
  ];

  currencyCode = 'USD';

  constructor(
    private route: ActivatedRoute,
    private reportService: ReportService,
    private settingsService: SettingsService,
    private currencyService: CurrencyService
  ) {}

  ngOnInit() {
    this.ledgerId = this.route.snapshot.paramMap.get('id');
    this.currencyCode = this.currencyService.activeCurrency();
    if (this.ledgerId) {
      this.settingsService.getSettings(this.ledgerId).subscribe({
        next: (s) => {
          this.currencyCode = (s.currency || 'USD').toUpperCase();
          this.currencyService.setActive(this.currencyCode);
        },
        error: () => { /* fall back to cached active currency */ }
      });
    }
  }

  money(amount: number | null | undefined): string {
    return this.currencyService.format(amount ?? 0, this.currencyCode);
  }

  setTab(tab: ReportTab) {
    this.activeTab = tab;
    this.reportData = null;
    this.errorMessage = '';
  }

  runReport() {
    if (!this.ledgerId) return;
    this.isLoading = true;
    this.reportData = null;
    this.errorMessage = '';

    let request$;
    switch (this.activeTab) {
      case 'trial-balance':
        request$ = this.reportService.getTrialBalance(this.ledgerId, this.asAt);
        break;
      case 'profit-loss':
        request$ = this.reportService.getProfitAndLoss(this.ledgerId, this.from, this.to);
        break;
      case 'balance-sheet':
        request$ = this.reportService.getBalanceSheet(this.ledgerId, this.asAt);
        break;
      case 'cash-flow':
        request$ = this.reportService.getCashFlow(this.ledgerId, this.from, this.to);
        break;
      case 'general-ledger':
        request$ = this.reportService.getGeneralLedger(this.ledgerId, this.from, this.to);
        break;
      case 'journal-report':
        request$ = this.reportService.getJournalReport(this.ledgerId, this.from, this.to, this.journalStatus || undefined);
        break;
    }

    request$.subscribe({
      next: (data: any) => {
        this.reportData = data;
        this.isLoading = false;
      },
      error: (err: any) => {
        this.errorMessage = err.error?.message || 'Failed to load report.';
        this.isLoading = false;
      }
    });
  }

  printReport() {
    window.print();
  }

  exportCsv() {
    if (!this.reportData) return;
    const csv = this.buildCsv();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.activeTab}-${this.today}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  private buildCsv(): string {
    const d = this.reportData;
    const lines: string[] = [];

    if (this.activeTab === 'trial-balance') {
      lines.push('Code,Account,Type,Debit,Credit');
      for (const r of d.rows) {
        lines.push(`"${r.code}","${r.name}","${r.account_type}",${r.debit},${r.credit}`);
      }
      lines.push(`,,,"Total",${d.total_debit},${d.total_credit}`);
    } else if (this.activeTab === 'profit-loss') {
      lines.push('Section,Code,Account,Balance');
      for (const r of d.revenue) lines.push(`"Revenue","${r.code}","${r.name}",${r.balance}`);
      lines.push(`"Revenue Total",,,${d.total_revenue}`);
      for (const r of d.expenses) lines.push(`"Expenses","${r.code}","${r.name}",${r.balance}`);
      lines.push(`"Expenses Total",,,${d.total_expenses}`);
      lines.push(`"Net Income",,,${d.net_income}`);
    } else if (this.activeTab === 'balance-sheet') {
      lines.push('Section,Code,Account,Balance');
      for (const r of d.assets) lines.push(`"Assets","${r.code}","${r.name}",${r.balance}`);
      lines.push(`"Total Assets",,,${d.total_assets}`);
      for (const r of d.liabilities) lines.push(`"Liabilities","${r.code}","${r.name}",${r.balance}`);
      lines.push(`"Total Liabilities",,,${d.total_liabilities}`);
      for (const r of d.equity) lines.push(`"Equity","${r.code}","${r.name}",${r.balance}`);
      lines.push(`"Retained Earnings",,,${d.retained_earnings}`);
      lines.push(`"Total Equity",,,${d.total_equity}`);
    } else if (this.activeTab === 'cash-flow') {
      lines.push('Section,Code,Account,Debit,Credit,Net');
      for (const r of d.operating) lines.push(`"Operating","${r.code}","${r.name}",${r.debit},${r.credit},${r.net}`);
      lines.push(`"Total Operating",,,,,${d.total_operating}`);
      for (const r of d.investing) lines.push(`"Investing","${r.code}","${r.name}",${r.debit},${r.credit},${r.net}`);
      lines.push(`"Total Investing",,,,,${d.total_investing}`);
      for (const r of d.financing) lines.push(`"Financing","${r.code}","${r.name}",${r.debit},${r.credit},${r.net}`);
      lines.push(`"Total Financing",,,,,${d.total_financing}`);
      lines.push(`"Net Cash Flow",,,,,${d.net_cash_flow}`);
    } else if (this.activeTab === 'general-ledger') {
      lines.push('Account,Date,Journal#,Description,Debit,Credit,Balance');
      for (const acc of d.accounts) {
        for (const e of acc.entries) {
          lines.push(`"${acc.account_code} - ${acc.account_name}","${e.date}","${e.journal_number}","${e.description}",${e.debit},${e.credit},${e.balance}`);
        }
        lines.push(`"Closing Balance: ${acc.account_code}",,,,,,${acc.closing_balance}`);
      }
    } else if (this.activeTab === 'journal-report') {
      lines.push('Journal#,Date,Description,Status,Account,Type,Amount');
      for (const j of d.journals) {
        for (const l of j.lines) {
          const acc = l.account ? `${l.account.code} - ${l.account.name}` : '';
          lines.push(`"${j.journal_number}","${j.date}","${j.description}","${j.status}","${acc}","${l.type}",${l.amount}`);
        }
      }
    }

    return lines.join('\n');
  }

  // Template helpers
  usesDateRange(): boolean {
    return ['profit-loss', 'cash-flow', 'general-ledger', 'journal-report'].includes(this.activeTab);
  }

  usesAsAt(): boolean {
    return ['trial-balance', 'balance-sheet'].includes(this.activeTab);
  }
}
