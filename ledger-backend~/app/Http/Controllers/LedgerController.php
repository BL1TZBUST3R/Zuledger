<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Group;
use App\Models\EntryItem;
use App\Models\Ledger;
use Illuminate\Support\Facades\Auth;

class LedgerController extends Controller
{
    public function index()
    {
        $ledgers = Ledger::forUser(Auth::user())->get();
        return response()->json($ledgers);
    }

    public function store(Request $request)
    {
        $request->validate(['name' => 'required|string']);
        $ledger = Ledger::create([
            'name' => $request->name,
            'owner_id' => Auth::id(),
        ]);
        return response()->json($ledger, 201);
    }

    // ✅ YOUR ORIGINAL CODE (Untouched - Keeps Account Transactions working)
    public function show($id)
    {
        $group = Group::findOrFail($id);
        $ledger = $group->ledger;
        $this->authorize('view', $ledger);

        $user = Auth::user();
        $isOwner = $ledger->owner_id === $user->id;
        $permissionLevel = 'viewer'; 

        if ($isOwner) {
            $permissionLevel = 'owner';
        } else {
            $pivot = $ledger->authorizedUsers()->where('user_id', $user->id)->first();
            if ($pivot) {
                $permissionLevel = $pivot->pivot->permission_level;
            }
        }

        $items = EntryItem::where('group_id', $id)
            ->join('entries', 'entry_items.entry_id', '=', 'entries.id')
            ->select('entry_items.*', 'entries.date', 'entries.number', 'entries.narration')
            ->orderBy('entries.date', 'asc')
            ->get();

        $isDebitSide = in_array(substr($group->code, 0, 1), ['1', '5']);
        $balance = 0;

        $formattedItems = $items->map(function ($item) use (&$balance, $isDebitSide) {
            $amount = $item->amount;
            if ($isDebitSide) {
                $balance += ($item->dc === 'D' ? $amount : -$amount);
            } else {
                $balance += ($item->dc === 'C' ? $amount : -$amount);
            }
            $item->running_balance = $balance;
            return $item;
        });

        return response()->json([
            'account' => $group,
            'entries' => $formattedItems,
            'current_balance' => $balance,
            'is_owner' => $isOwner,
            'permission_level' => $permissionLevel
        ]);
    }

    public function authorizeUser(Request $request, $id)
    {
        $ledger = Ledger::findOrFail($id);
        $this->authorize('update', $ledger); 

        $request->validate([
            'email' => 'required|email|exists:users,email',
            'role' => 'required|in:viewer,editor'
        ]);

        $userToInvite = \App\Models\User::where('email', $request->email)->first();

        if ($userToInvite->id === $ledger->owner_id) {
            return response()->json(['message' => 'You cannot invite yourself.'], 422);
        }

        $ledger->authorizedUsers()->syncWithoutDetaching([
            $userToInvite->id => ['permission_level' => $request->role]
        ]);

        return response()->json(['message' => 'User authorized successfully.']);
    }

    // ==========================================
    // 👇 NEW METHODS ADDED BELOW
    // ==========================================

    // NEW: Get just the Company Info for the Sidebar (Does not touch groups)
    public function getInfo($id)
    {
        $ledger = Ledger::findOrFail($id);
        $this->authorize('view', $ledger);
        return response()->json($ledger);
    }

    // NEW: Rename the Company Ledger
    public function update(Request $request, $id)
    {
        $ledger = Ledger::findOrFail($id);
        $this->authorize('update', $ledger); // Only owners/editors

        $request->validate(['name' => 'required|string']);
        $ledger->update(['name' => $request->name]);
        
        return response()->json($ledger);
    }

    // NEW: Delete the Company Ledger
    public function destroy($id)
    {
        $ledger = Ledger::findOrFail($id);
        
        // Hardcheck: Only TRUE owners can delete a company
        if ($ledger->owner_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized. Only the owner can delete.'], 403);
        }

        $ledger->delete();
        return response()->json(['message' => 'Ledger deleted']);
    }
}