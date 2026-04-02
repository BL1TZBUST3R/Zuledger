<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use App\Models\Ledger;
use App\Models\Group;
use App\Models\Journal;
use App\Models\JournalLine;

class ReportController extends Controller
{
    use AuthorizesRequests;

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

        $rows = [];
        $totalDR = 0;
        $totalCR = 0;

        foreach ($accounts as $account) {
            $debits = JournalLine::where('group_id', $account->id)
                ->where('type', 'DR')
                ->whereHas('journal', function ($q) use ($ledgerId, $asAt) {
                    $q->where('ledger_id', $ledgerId)
                      ->where('status', 'posted')
                      ->where('date', '<=', $asAt);
                })->sum('amount');

            $credits = JournalLine::where('group_id', $account->id)
                ->where('type', 'CR')
                ->whereHas('journal', function ($q) use ($ledgerId, $asAt) {
                    $q->where('ledger_id', $ledgerId)
                      ->where('status', 'posted')
                      ->where('date', '<=', $asAt);
                })->sum('amount');

            $balance = $debits - $credits;
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

        $revenue = $this->sumByType($ledgerId, 'revenue', $from, $to);
        $expenses = $this->sumByType($ledgerId, 'expense', $from, $to);

        return response()->json([
            'report' => 'Profit & Loss',
            'from' => $from,
            'to' => $to,
            'revenue' => $revenue,
            'expenses' => $expenses,
            'total_revenue' => collect($revenue)->sum('balance'),
            'total_expenses' => collect($expenses)->sum('balance'),
            'net_income' => collect($revenue)->sum('balance') - collect($expenses)->sum('balance'),
        ]);
    }

    // Balance Sheet
    public function balanceSheet($ledgerId, Request $request)
    {
        $ledger = Ledger::findOrFail($ledgerId);
        $this->authorize('view', $ledger);

        $asAt = $request->query('as_at', now()->toDateString());

        $assets = $this->sumByType($ledgerId, 'asset', null, $asAt);
        $liabilities = $this->sumByType($ledgerId, 'liability', null, $asAt);
        $equity = $this->sumByType($ledgerId, 'equity', null, $asAt);

        $revenueTotal = collect($this->sumByType($ledgerId, 'revenue', null, $asAt))->sum('balance');
        $expenseTotal = collect($this->sumByType($ledgerId, 'expense', null, $asAt))->sum('balance');
        $retainedEarnings = $revenueTotal - $expenseTotal;

        $totalAssets = collect($assets)->sum('balance');
        $totalLiabilities = collect($liabilities)->sum('balance');
        $totalEquity = collect($equity)->sum('balance') + $retainedEarnings;

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

        $operating = $this->sumByCashflow($ledgerId, 'operating', $from, $to);
        $investing = $this->sumByCashflow($ledgerId, 'investing', $from, $to);
        $financing = $this->sumByCashflow($ledgerId, 'financing', $from, $to);

        return response()->json([
            'report' => 'Cash Flow Statement',
            'from' => $from,
            'to' => $to,
            'operating' => $operating,
            'investing' => $investing,
            'financing' => $financing,
            'total_operating' => collect($operating)->sum('net'),
            'total_investing' => collect($investing)->sum('net'),
            'total_financing' => collect($financing)->sum('net'),
            'net_cash_flow' => collect($operating)->sum('net') + collect($investing)->sum('net') + collect($financing)->sum('net'),
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

        $query = Group::where('ledger_id', $ledgerId)
            ->whereNotNull('parent_id')
            ->orderBy('code');

        if ($accountId) {
            $query->where('id', $accountId);
        }

        $accounts = $query->get();
        $result = [];

        foreach ($accounts as $account) {
            $lines = JournalLine::where('group_id', $account->id)
                ->whereHas('journal', function ($q) use ($ledgerId, $from, $to) {
                    $q->where('ledger_id', $ledgerId)
                      ->where('status', 'posted')
                      ->whereBetween('date', [$from, $to]);
                })
                ->with(['journal' => function ($q) {
                    $q->select('id', 'journal_number', 'date', 'description');
                }])
                ->get();

            if ($lines->isEmpty() && !$accountId) continue;

            $balance = 0;
            $entries = [];
            foreach ($lines as $line) {
                $amount = $line->type === 'DR' ? $line->amount : -$line->amount;
                $balance += $amount;
                $entries[] = [
                    'date' => $line->journal->date->toDateString(),
                    'journal_number' => $line->journal->journal_number,
                    'description' => $line->journal->description,
                    'debit' => $line->type === 'DR' ? round($line->amount, 2) : 0,
                    'credit' => $line->type === 'CR' ? round($line->amount, 2) : 0,
                    'balance' => round($balance, 2),
                ];
            }

            $result[] = [
                'account_code' => $account->code,
                'account_name' => $account->name,
                'account_type' => $account->account_type,
                'entries' => $entries,
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

    // Helper: Sum account balances by account type
    private function sumByType($ledgerId, $type, $from = null, $to = null)
    {
        $accounts = Group::where('ledger_id', $ledgerId)
            ->where('account_type', $type)
            ->whereNotNull('parent_id')
            ->orderBy('code')
            ->get();

        $result = [];
        foreach ($accounts as $account) {
            $query = JournalLine::where('group_id', $account->id)
                ->whereHas('journal', function ($q) use ($ledgerId, $from, $to) {
                    $q->where('ledger_id', $ledgerId)
                      ->where('status', 'posted');
                    if ($from) $q->where('date', '>=', $from);
                    if ($to) $q->where('date', '<=', $to);
                });

            $debits = (clone $query)->where('type', 'DR')->sum('amount');
            $credits = (clone $query)->where('type', 'CR')->sum('amount');

            $balance = $debits - $credits;
            if ($type === 'liability' || $type === 'equity' || $type === 'revenue') {
                $balance = $credits - $debits;
            }

            if (abs($balance) < 0.01) continue;

            $result[] = [
                'code' => $account->code,
                'name' => $account->name,
                'balance' => round($balance, 2),
            ];
        }

        return $result;
    }

    // Helper: Sum by cash flow type
    private function sumByCashflow($ledgerId, $cashflowType, $from, $to)
    {
        $accounts = Group::where('ledger_id', $ledgerId)
            ->where('cashflow_type', $cashflowType)
            ->whereNotNull('parent_id')
            ->orderBy('code')
            ->get();

        $result = [];
        foreach ($accounts as $account) {
            $query = JournalLine::where('group_id', $account->id)
                ->whereHas('journal', function ($q) use ($ledgerId, $from, $to) {
                    $q->where('ledger_id', $ledgerId)
                      ->where('status', 'posted')
                      ->whereBetween('date', [$from, $to]);
                });

            $debits = (clone $query)->where('type', 'DR')->sum('amount');
            $credits = (clone $query)->where('type', 'CR')->sum('amount');

            $net = $debits - $credits;
            if (abs($net) < 0.01) continue;

            $result[] = [
                'code' => $account->code,
                'name' => $account->name,
                'debit' => round($debits, 2),
                'credit' => round($credits, 2),
                'net' => round($net, 2),
            ];
        }

        return $result;
    }
}