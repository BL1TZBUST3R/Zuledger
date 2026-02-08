<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Group;
use App\Models\EntryItem;

class LedgerController extends Controller
{
    public function show($id)
    {
        // 1. Get the Account Info
        $group = Group::findOrFail($id);

        // 2. Get all transactions for this account
        // We join with the 'entries' table to get the Date and Number
        $items = EntryItem::where('group_id', $id)
            ->join('entries', 'entry_items.entry_id', '=', 'entries.id')
            ->select('entry_items.*', 'entries.date', 'entries.number', 'entries.narration')
            ->orderBy('entries.date', 'asc')
            ->orderBy('entries.id', 'asc')
            ->get();

        // 3. Calculate Running Balance
        // (Assets/Expenses increase with Debit, others increase with Credit)
        $isDebitSide = in_array(substr($group->code, 0, 1), ['1', '5']); // 1=Asset, 5=Expense
        $balance = 0;

        $formattedItems = $items->map(function ($item) use (&$balance, $isDebitSide) {
            $amount = $item->amount;
            
            if ($isDebitSide) {
                // Asset: Dr adds, Cr subtracts
                $balance += ($item->dc === 'D' ? $amount : -$amount);
            } else {
                // Liability: Cr adds, Dr subtracts
                $balance += ($item->dc === 'C' ? $amount : -$amount);
            }

            $item->running_balance = $balance;
            return $item;
        });

        return response()->json([
            'account' => $group,
            'entries' => $formattedItems,
            'current_balance' => $balance
        ]);
    }
}