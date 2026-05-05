import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ReportService } from '../../services/report.service';
import { SettingsService } from '../../services/settings.service';
import { CurrencyService } from '../../services/currency.service';
import { ActiveLedgerService, LedgerDateFormat } from '../../services/active-ledger.service';
import { LedgerDatePipe } from '../../shared/ledger-date.pipe';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type ReportTab = 'trial-balance' | 'profit-loss' | 'balance-sheet' | 'cash-flow' | 'general-ledger' | 'journal-report';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, LedgerDatePipe],
  providers: [LedgerDatePipe],
  templateUrl: './reports.html',
})
export class ReportsComponent implements OnInit {

  ledgerId: string | null = null;
  activeTab: ReportTab = 'trial-balance';
  isLoading = false;
  reportData: any = null;
  errorMessage = '';
  showAccountCodes = true;

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
    private currencyService: CurrencyService,
    private activeLedger: ActiveLedgerService,
    private datePipe: LedgerDatePipe
  ) {}

  ngOnInit() {
    this.ledgerId = this.route.snapshot.paramMap.get('id');
    this.currencyCode = this.currencyService.activeCurrency();
    if (this.ledgerId) {
      this.settingsService.getSettings(this.ledgerId).subscribe({
        next: (s) => {
          this.currencyCode = (s.currency || 'USD').toUpperCase();
          this.currencyService.setActive(this.currencyCode);
          this.activeLedger.setDateFormat(s.date_format as LedgerDateFormat);
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

  exportPdf() {
    if (!this.reportData) return;

    const landscape = ['general-ledger', 'cash-flow', 'journal-report'].includes(this.activeTab);
    const doc = new jsPDF({ unit: 'pt', format: 'a4', orientation: landscape ? 'landscape' : 'portrait' });

    const tabLabel = this.tabs.find(t => t.id === this.activeTab)?.label ?? 'Report';
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(tabLabel, 40, 40);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(this.reportPeriodLabel(), 40, 58);
    doc.text(`All amounts in ${this.currencyCode}`, 40, 72);

    let cursorY = 90;
    const showCodes = this.showAccountCodes;
    const fmtMoney = (n: number) => Number(n ?? 0).toFixed(2);
    const fmtDate = (v: string) => this.datePipe.transform(v);

    const drawTable = (head: any[][], body: any[][], foot?: any[][]) => {
      autoTable(doc, {
        startY: cursorY,
        head,
        body,
        foot,
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 4 },
        headStyles: { fillColor: [241, 245, 249], textColor: 30, fontStyle: 'bold' },
        footStyles: { fillColor: [241, 245, 249], textColor: 30, fontStyle: 'bold' },
        margin: { left: 40, right: 40 },
      });
      cursorY = (doc as any).lastAutoTable.finalY + 16;
    };

    const sectionTitle = (label: string) => {
      if (cursorY > doc.internal.pageSize.getHeight() - 80) { doc.addPage(); cursorY = 40; }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(label, 40, cursorY);
      cursorY += 6;
      doc.setFont('helvetica', 'normal');
    };

    const d = this.reportData;
    switch (this.activeTab) {
      case 'trial-balance': {
        const head = [showCodes
          ? ['Code', 'Account', 'Type', 'Debit', 'Credit']
          : ['Account', 'Type', 'Debit', 'Credit']];
        const body = d.rows.map((r: any) => showCodes
          ? [r.code, r.name, r.account_type, fmtMoney(r.debit), fmtMoney(r.credit)]
          : [r.name, r.account_type, fmtMoney(r.debit), fmtMoney(r.credit)]);
        const foot = [showCodes
          ? [{ content: 'Totals', colSpan: 3, styles: { halign: 'right' } }, fmtMoney(d.total_debit), fmtMoney(d.total_credit)]
          : [{ content: 'Totals', colSpan: 2, styles: { halign: 'right' } }, fmtMoney(d.total_debit), fmtMoney(d.total_credit)]];
        drawTable(head, body, foot);
        break;
      }
      case 'profit-loss': {
        const head = [showCodes ? ['Code', 'Account', 'Balance'] : ['Account', 'Balance']];
        sectionTitle('Revenue');
        drawTable(head,
          d.revenue.map((r: any) => showCodes ? [r.code, r.name, fmtMoney(r.balance)] : [r.name, fmtMoney(r.balance)]),
          [[{ content: 'Total Revenue', colSpan: showCodes ? 2 : 1, styles: { halign: 'right' } }, fmtMoney(d.total_revenue)]]);
        sectionTitle('Expenses');
        drawTable(head,
          d.expenses.map((r: any) => showCodes ? [r.code, r.name, fmtMoney(r.balance)] : [r.name, fmtMoney(r.balance)]),
          [[{ content: 'Total Expenses', colSpan: showCodes ? 2 : 1, styles: { halign: 'right' } }, fmtMoney(d.total_expenses)]]);
        sectionTitle(d.net_income >= 0 ? 'Net Income' : 'Net Loss');
        drawTable([[{ content: '', colSpan: showCodes ? 2 : 1 }, 'Amount']],
          [[{ content: d.net_income >= 0 ? 'Net Income' : 'Net Loss', colSpan: showCodes ? 2 : 1, styles: { halign: 'right', fontStyle: 'bold' } }, fmtMoney(d.net_income)]]);
        break;
      }
      case 'balance-sheet': {
        const head = [showCodes ? ['Code', 'Account', 'Balance'] : ['Account', 'Balance']];
        sectionTitle('Assets');
        drawTable(head,
          d.assets.map((r: any) => showCodes ? [r.code, r.name, fmtMoney(r.balance)] : [r.name, fmtMoney(r.balance)]),
          [[{ content: 'Total Assets', colSpan: showCodes ? 2 : 1, styles: { halign: 'right' } }, fmtMoney(d.total_assets)]]);
        sectionTitle('Liabilities');
        drawTable(head,
          d.liabilities.map((r: any) => showCodes ? [r.code, r.name, fmtMoney(r.balance)] : [r.name, fmtMoney(r.balance)]),
          [[{ content: 'Total Liabilities', colSpan: showCodes ? 2 : 1, styles: { halign: 'right' } }, fmtMoney(d.total_liabilities)]]);
        sectionTitle('Equity');
        const equityRows = d.equity.map((r: any) => showCodes ? [r.code, r.name, fmtMoney(r.balance)] : [r.name, fmtMoney(r.balance)]);
        equityRows.push(showCodes ? ['', 'Retained Earnings', fmtMoney(d.retained_earnings)] : ['Retained Earnings', fmtMoney(d.retained_earnings)]);
        drawTable(head, equityRows,
          [[{ content: 'Total Equity', colSpan: showCodes ? 2 : 1, styles: { halign: 'right' } }, fmtMoney(d.total_equity)]]);
        break;
      }
      case 'cash-flow': {
        const head = [showCodes
          ? ['Code', 'Account', 'Debit', 'Credit', 'Net']
          : ['Account', 'Debit', 'Credit', 'Net']];
        const drawSection = (label: string, rows: any[], total: number) => {
          sectionTitle(label);
          drawTable(head,
            rows.map((r: any) => showCodes
              ? [r.code, r.name, fmtMoney(r.debit), fmtMoney(r.credit), fmtMoney(r.net)]
              : [r.name, fmtMoney(r.debit), fmtMoney(r.credit), fmtMoney(r.net)]),
            [[{ content: `Net ${label}`, colSpan: showCodes ? 4 : 3, styles: { halign: 'right' } }, fmtMoney(total)]]);
        };
        drawSection('Operating Activities', d.operating, d.total_operating);
        drawSection('Investing Activities', d.investing, d.total_investing);
        drawSection('Financing Activities', d.financing, d.total_financing);
        sectionTitle('Net Cash Flow');
        drawTable([[{ content: 'Net Cash Flow' }, 'Amount']],
          [[{ content: 'Net Cash Flow', styles: { halign: 'right', fontStyle: 'bold' } }, fmtMoney(d.net_cash_flow)]]);
        break;
      }
      case 'general-ledger': {
        const head = [['Date', 'J#', 'Description', 'Debit', 'Credit', 'Balance']];
        for (const acc of d.accounts) {
          const title = showCodes ? `${acc.account_code} — ${acc.account_name}` : acc.account_name;
          sectionTitle(title);
          drawTable(head,
            acc.entries.map((e: any) => [
              fmtDate(e.date),
              e.journal_number,
              e.description || '',
              e.debit > 0 ? fmtMoney(e.debit) : '',
              e.credit > 0 ? fmtMoney(e.credit) : '',
              fmtMoney(e.balance),
            ]),
            [[{ content: 'Closing Balance', colSpan: 5, styles: { halign: 'right' } }, fmtMoney(acc.closing_balance)]]);
        }
        break;
      }
      case 'journal-report': {
        const head = [['J#', 'Date', 'Status', 'Account', 'Type', 'Amount']];
        const body: any[] = [];
        for (const j of d.journals) {
          for (const l of j.lines) {
            const acc = l.account
              ? (showCodes ? `${l.account.code} — ${l.account.name}` : l.account.name)
              : '';
            body.push([
              `J${j.journal_number}`,
              fmtDate(j.date),
              j.status,
              acc,
              l.type,
              fmtMoney(l.amount),
            ]);
          }
        }
        drawTable(head, body);
        break;
      }
    }

    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(120);
      const pageH = doc.internal.pageSize.getHeight();
      const pageW = doc.internal.pageSize.getWidth();
      doc.text(`Page ${i} of ${pageCount}`, pageW - 40, pageH - 20, { align: 'right' });
      doc.text(`Generated ${fmtDate(new Date().toISOString())}`, 40, pageH - 20);
    }

    doc.save(`${this.activeTab}-${this.today}.pdf`);
  }

  private reportPeriodLabel(): string {
    const fmt = (v: string) => this.datePipe.transform(v);
    const d = this.reportData;
    if (this.usesAsAt()) return `As at ${fmt(d.as_at)}`;
    if (this.usesDateRange()) return `${fmt(d.from)} — ${fmt(d.to)}`;
    return '';
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
