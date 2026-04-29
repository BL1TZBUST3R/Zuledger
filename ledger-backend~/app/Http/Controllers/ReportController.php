<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use App\Models\Ledger;
use App\Models\Group;
use App\Models\Journal;
use App\Models\JournalLine;
use Carbon\Carbon;

class ReportController extends Controller
{
    use AuthorizesRequests;

    /**
     * Aggregate posted DR/CR totals per group_id for a ledger and date window
     * in a SINGLE query. Returns array keyed by group_id with ['dr' => ..., 'cr' => ...].
     */
    private function postedTotalsByGroup($ledgerId, $from = null, $to = null): array
    {
        $rows = JournalLine::query()
            ->join('journals', 'journal_lines.journal_id', '=', 'journals.id')
            ->where('journals.ledger_id', $ledgerId)
            ->where('journals.status', 'posted')
            ->when($from, fn($q) => $q->where('journals.date', '>=', $from))
            ->when($to,   fn($q) => $q->where('journals.date', '<=', $to))
            ->groupBy('journal_lines.group_id')
            ->selectRaw('journal_lines.group_id as group_id')
            ->selectRaw("SUM(CASE WHEN journal_lines.type = 'DR' THEN journal_lines.amount ELSE 0 END) as dr_total")
            ->selectRaw("SUM(CASE WHEN journal_lines.type = 'CR' THEN journal_lines.amount ELSE 0 END) as cr_total")
            ->get();

        $totals = [];
        foreach ($rows as $r) {
            $totals[$r->group_id] = [
                'dr' => (float) $r->dr_total,
                'cr' => (float) $r->cr_total,
            ];
        }
        return $totals;
    }

    // Trial Balance
    public function trialBalance($ledgerId, Request $request)
    {
        $ledger = Ledger::findOrFail($ledgerId);
        $this->authorize('view', $ledger);

        $asAt = $request->query('as_at', now()->toDateString());

        $accounts = Group::where('ledger_id', $ledgerId)
            ->whereNotNull('parent_id')
            ->orderBy('code')
            ->get();

        $totals = $this->postedTotalsByGroup($ledgerId, null, $asAt);

        $rows = [];
        $totalDR = 0;
        $totalCR = 0;

        foreach ($accounts as $account) {
            $t = $totals[$account->id] ?? ['dr' => 0, 'cr' => 0];
            $balance = $t['dr'] - $t['cr'];
            if (abs($balance) < 0.01) continue;

            $row = [
                'code' => $account->code,
                'name' => $account->name,
                'account_type' => $account->account_type,
                'debit' => $balance > 0 ? round($balance, 2) : 0,
                'credit' => $balance < 0 ? round(abs($balance), 2) : 0,
            ];

            $totalDR += $row['debit'];
            $totalCR += $row['credit'];
            $rows[] = $row;
        }

        return response()->json([
            'report' => 'Trial Balance',
            'as_at' => $asAt,
            'rows' => $rows,
            'total_debit' => round($totalDR, 2),
            'total_credit' => round($totalCR, 2),
        ]);
    }

    // Profit & Loss
    public function profitAndLoss($ledgerId, Request $request)
    {
        $ledger = Ledger::findOrFail($ledgerId);
        $this->authorize('view', $ledger);

        $from = $request->query('from', now()->startOfYear()->toDateString());
        $to = $request->query('to', now()->toDateString());

        $totals = $this->postedTotalsByGroup($ledgerId, $from, $to);

        $revenue = $this->buildTypeRows($ledgerId, 'revenue', $totals);
        $expenses = $this->buildTypeRows($ledgerId, 'expense', $totals);

        $totalRevenue = array_sum(array_column($revenue, 'balance'));
        $totalExpenses = array_sum(array_column($expenses, 'balance'));

        return response()->json([
            'report' => 'Profit & Loss',
            'from' => $from,
            'to' => $to,
            'revenue' => $revenue,
            'expenses' => $expenses,
            'total_revenue' => round($totalRevenue, 2),
            'total_expenses' => round($totalExpenses, 2),
            'net_income' => round($totalRevenue - $totalExpenses, 2),
        ]);
    }

    // Balance Sheet
    public function balanceSheet($ledgerId, Request $request)
    {
        $ledger = Ledger::findOrFail($ledgerId);
        $this->authorize('view', $ledger);

        $asAt = $request->query('as_at', now()->toDateString());

        // One aggregate query covers every account type below.
        $totals = $this->postedTotalsByGroup($ledgerId, null, $asAt);

        $assets      = $this->buildTypeRows($ledgerId, 'asset',     $totals);
        $liabilities = $this->buildTypeRows($ledgerId, 'liability', $totals);
        $equity      = $this->buildTypeRows($ledgerId, 'equity',    $totals);
        $revenue     = $this->buildTypeRows($ledgerId, 'revenue',   $totals);
        $expenses    = $this->buildTypeRows($ledgerId, 'expense',   $totals);

        $revenueTotal     = array_sum(array_column($revenue, 'balance'));
        $expenseTotal     = array_sum(array_column($expenses, 'balance'));
        $retainedEarnings = $revenueTotal - $expenseTotal;

        $totalAssets      = array_sum(array_column($assets, 'balance'));
        $totalLiabilities = array_sum(array_column($liabilities, 'balance'));
        $totalEquity      = array_sum(array_column($equity, 'balance')) + $retainedEarnings;

        return response()->json([
            'report' => 'Balance Sheet',
            'as_at' => $asAt,
            'assets' => $assets,
            'liabilities' => $liabilities,
            'equity' => $equity,
            'retained_earnings' => round($retainedEarnings, 2),
            'total_assets' => round($totalAssets, 2),
            'total_liabilities' => round($totalLiabilities, 2),
            'total_equity' => round($totalEquity, 2),
        ]);
    }

    // Cash Flow Statement
    public function cashFlow($ledgerId, Request $request)
    {
        $ledger = Ledger::findOrFail($ledgerId);
        $this->authorize('view', $ledger);

        $from = $request->query('from', now()->startOfYear()->toDateString());
        $to = $request->query('to', now()->toDateString());

        $totals = $this->postedTotalsByGroup($ledgerId, $from, $to);

        $operating = $this->buildCashflowRows($ledgerId, 'operating', $totals);
        $investing = $this->buildCashflowRows($ledgerId, 'investing', $totals);
        $financing = $this->buildCashflowRows($ledgerId, 'financing', $totals);

        $totalOperating = array_sum(array_column($operating, 'net'));
        $totalInvesting = array_sum(array_column($investing, 'net'));
        $totalFinancing = array_sum(array_column($financing, 'net'));

        return response()->json([
            'report' => 'Cash Flow Statement',
            'from' => $from,
            'to' => $to,
            'operating' => $operating,
            'investing' => $investing,
            'financing' => $financing,
            'total_operating' => round($totalOperating, 2),
            'total_investing' => round($totalInvesting, 2),
            'total_financing' => round($totalFinancing, 2),
            'net_cash_flow' => round($totalOperating + $totalInvesting + $totalFinancing, 2),
        ]);
    }

    // General Ledger
    public function generalLedger($ledgerId, Request $request)
    {
        $ledger = Ledger::findOrFail($ledgerId);
        $this->authorize('view', $ledger);

        $from = $request->query('from', now()->startOfYear()->toDateString());
        $to = $request->query('to', now()->toDateString());
        $accountId = $request->query('account_id');

        $accountQuery = Group::where('ledger_id', $ledgerId)
            ->whereNotNull('parent_id')
            ->orderBy('code');
        if ($accountId) {
            $accountQuery->where('id', $accountId);
        }
        $accounts = $accountQuery->get();
        $accountById = $accounts->keyBy('id');

        // Single query — pull all relevant lines + journal info up front.
        $lines = JournalLine::query()
            ->join('journals', 'journal_lines.journal_id', '=', 'journals.id')
            ->where('journals.ledger_id', $ledgerId)
            ->where('journals.status', 'posted')
            ->whereBetween('journals.date', [$from, $to])
            ->whereIn('journal_lines.group_id', $accounts->pluck('id'))
            ->orderBy('journals.date')
            ->orderBy('journals.journal_number')
            ->select(
                'journal_lines.group_id',
                'journal_lines.amount',
                'journal_lines.type',
                'journals.journal_number',
                'journals.date',
                'journals.description'
            )
            ->get();

        // Bucket lines by account.
        $byAccount = [];
        foreach ($lines as $l) {
            $byAccount[$l->group_id][] = $l;
        }

        $result = [];
        foreach ($accounts as $account) {
            $accountLines = $byAccount[$account->id] ?? [];
            if (empty($accountLines) && !$accountId) continue;

            $balance = 0;
            $entries = [];
            foreach ($accountLines as $line) {
                $balance += $line->type === 'DR' ? $line->amount : -$line->amount;
                $entries[] = [
                    'date'           => Carbon::parse($line->date)->toDateString(),
                    'journal_number' => $line->journal_number,
                    'description'    => $line->description,
                    'debit'          => $line->type === 'DR' ? round($line->amount, 2) : 0,
                    'credit'         => $line->type === 'CR' ? round($line->amount, 2) : 0,
                    'balance'        => round($balance, 2),
                ];
            }

            $result[] = [
                'account_code' => $account->code,
                'account_name' => $account->name,
                'account_type' => $account->account_type,
                'entries'      => $entries,
                'closing_balance' => round($balance, 2),
            ];
        }

        return response()->json([
            'report' => 'General Ledger',
            'from' => $from,
            'to' => $to,
            'accounts' => $result,
        ]);
    }

    // Journal Report
    public function journalReport($ledgerId, Request $request)
    {
        $ledger = Ledger::findOrFail($ledgerId);
        $this->authorize('view', $ledger);

        $from = $request->query('from', now()->startOfYear()->toDateString());
        $to = $request->query('to', now()->toDateString());
        $status = $request->query('status');

        $query = Journal::where('ledger_id', $ledgerId)
            ->whereBetween('date', [$from, $to])
            ->with(['lines.account', 'user'])
            ->orderBy('journal_number', 'asc');

        if ($status) {
            $query->where('status', $status);
        }

        $journals = $query->get();

        return response()->json([
            'report' => 'Journal Report',
            'from' => $from,
            'to' => $to,
            'journals' => $journals,
            'total_entries' => $journals->count(),
        ]);
    }

    /**
     * Build P&L / Balance Sheet rows for a given account type using
     * pre-aggregated totals (one query) instead of per-account queries.
     */
    private function buildTypeRows($ledgerId, $type, array $totals): array
    {
        $accounts = Group::where('ledger_id', $ledgerId)
            ->where('account_type', $type)
            ->whereNotNull('parent_id')
            ->orderBy('code')
            ->get();

        $isCreditNormal = in_array($type, ['liability', 'equity', 'revenue'], true);

        $result = [];
        foreach ($accounts as $account) {
            $t = $totals[$account->id] ?? ['dr' => 0, 'cr' => 0];
            $balance = $isCreditNormal ? ($t['cr'] - $t['dr']) : ($t['dr'] - $t['cr']);
            if (abs($balance) < 0.01) continue;

            $result[] = [
                'code' => $account->code,
                'name' => $account->name,
                'balance' => round($balance, 2),
            ];
        }

        return $result;
    }

    private function buildCashflowRows($ledgerId, $cashflowType, array $totals): array
    {
        $accounts = Group::where('ledger_id', $ledgerId)
            ->where('cashflow_type', $cashflowType)
            ->whereNotNull('parent_id')
            ->orderBy('code')
            ->get();

        $result = [];
        foreach ($accounts as $account) {
            $t = $totals[$account->id] ?? ['dr' => 0, 'cr' => 0];
            $net = $t['dr'] - $t['cr'];
            if (abs($net) < 0.01) continue;

            $result[] = [
                'code'   => $account->code,
                'name'   => $account->name,
                'debit'  => round($t['dr'], 2),
                'credit' => round($t['cr'], 2),
                'net'    => round($net, 2),
            ];
        }

        return $result;
    }
}
