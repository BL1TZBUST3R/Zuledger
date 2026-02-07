<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Entry;
use App\Models\EntryItem;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class EntryController extends Controller
{
    public function store(Request $request)
    {
        // 1. Validate the Input
        $request->validate([
            'date' => 'required|date',
            'narration' => 'nullable|string',
            'items' => 'required|array|min:2', // Must have at least a Debit and a Credit
            'items.*.group_id' => 'required|exists:groups,id',
            'items.*.dc' => 'required|in:D,C',
            'items.*.amount' => 'required|numeric|min:0.01',
        ]);

        // 2. Check if Balanced (Dr == Cr)
        $drTotal = 0;
        $crTotal = 0;

        foreach ($request->items as $item) {
            if ($item['dc'] === 'D') $drTotal += $item['amount'];
            if ($item['dc'] === 'C') $crTotal += $item['amount'];
        }

        // Force slight precision correction (floating point math)
        if (abs($drTotal - $crTotal) > 0.01) {
            return response()->json(['message' => 'Entry is not balanced. Debits: ' . $drTotal . ' Credits: ' . $crTotal], 422);
        }

        // 3. Save to Database (Using a Transaction for safety)
        return DB::transaction(function () use ($request, $drTotal, $crTotal) {
            
            // A. Create the Header
            $entry = Entry::create([
                'user_id' => Auth::id(),
                'number' => 'JRNL-' . time(), // Simple auto-numbering for now
                'date' => $request->date,
                'narration' => $request->narration,
                'dr_total' => $drTotal,
                'cr_total' => $crTotal,
            ]);

            // B. Create the Rows
            foreach ($request->items as $item) {
                EntryItem::create([
                    'entry_id' => $entry->id,
                    'group_id' => $item['group_id'], // Account ID
                    'dc' => $item['dc'],             // D or C
                    'amount' => $item['amount'],
                ]);
            }

            return $entry->load('items');
        });
    }
}