<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Group;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index()
    {
        $user_id = Auth::id();

        // 1. Count your accounts (Structure)
        $totalGroups = Group::where('user_id', $user_id)->whereNull('parent_id')->count();
        $totalSubAccounts = Group::where('user_id', $user_id)->whereNotNull('parent_id')->count();

        // 2. Calculate Totals from Journal Entries (The Real Math)
        // We join 'entry_items' with 'groups' to check the account code (1xxx, 2xxx, etc.)
        $items = DB::table('entry_items')
            ->join('groups', 'entry_items.ledger_id', '=', 'groups.id')
            ->where('groups.user_id', $user_id)
            ->select('groups.code', 'entry_items.dc', 'entry_items.amount')
            ->get();

        $assets = 0;
        $liabilities = 0;
        $income = 0;
        $expenses = 0;

        foreach ($items as $item) {
            $firstDigit = substr($item->code, 0, 1); // Get "1" from "1001"
            $amount = $item->amount;
            $isDebit = $item->dc === 'D';

            // ASSETS (1xxx) - Debit increases (+), Credit decreases (-)
            if ($firstDigit == '1') {
                $assets += $isDebit ? $amount : -$amount;
            }
            // LIABILITIES (2xxx) - Credit increases (+), Debit decreases (-)
            elseif ($firstDigit == '2') {
                $liabilities += $isDebit ? -$amount : $amount;
            }
            // INCOME (3xxx) - Credit increases (+), Debit decreases (-)
            elseif ($firstDigit == '3') {
                $income += $isDebit ? -$amount : $amount;
            }
            // EXPENSES (4xxx) - Debit increases (+), Credit decreases (-)
            elseif ($firstDigit == '4') {
                $expenses += $isDebit ? $amount : -$amount;
            }
        }

        // Net Income = Income - Expenses
        $netIncome = $income - $expenses;

        return response()->json([
            'total_assets' => $assets,
            'total_liabilities' => $liabilities,
            'total_income' => $income,
            'total_expenses' => $expenses,
            'net_income' => $netIncome,
            'account_stats' => [
                'main_groups' => $totalGroups,
                'sub_accounts' => $totalSubAccounts
            ]
        ]);
    }
}