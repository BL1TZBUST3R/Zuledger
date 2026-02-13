<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Group;
use App\Models\EntryItem;
use App\Models\Ledger;
use Illuminate\Support\Facades\Auth;

class LedgerController extends Controller
{
    /**
     * GET /api/ledgers
     * List all ledgers the user has access to (Owned + Shared)
     */
    public function index()
    {
        // Use the scope we defined in the Model to fetch owned + invited ledgers
        $ledgers = Ledger::forUser(Auth::user())->get();
        return response()->json($ledgers);
    }

    /**
     * POST /api/ledgers
     * Create a new Ledger
     */
    public function store(Request $request)
    {
        $request->validate(['name' => 'required|string']);

        $ledger = Ledger::create([
            'name' => $request->name,
            'owner_id' => Auth::id(),
        ]);

        return response()->json($ledger, 201);
    }

    /**
     * GET /api/ledgers/{id}
     * Show a specific ledger with permissions
     */
    public function show($id)
    {
        // 1. Get the Account Group
        $group = Group::findOrFail($id);
        
        // 2. Get the Ledger it belongs to
        $ledger = $group->ledger;

        // 3. 🛡️ Check Permissions (Policy)
        $this->authorize('view', $ledger);

        // 4. Calculate Permission Metadata for Frontend
        $user = Auth::user();
        $isOwner = $ledger->owner_id === $user->id;
        $permissionLevel = 'viewer'; // Default

        if ($isOwner) {
            $permissionLevel = 'owner';
        } else {
            // Fetch permission from pivot table
            $pivot = $ledger->authorizedUsers()
                            ->where('user_id', $user->id)
                            ->first();
            if ($pivot) {
                $permissionLevel = $pivot->pivot->permission_level;
            }
        }

        // 5. Fetch Transactions
        $items = EntryItem::where('group_id', $id)
            ->join('entries', 'entry_items.entry_id', '=', 'entries.id')
            ->select('entry_items.*', 'entries.date', 'entries.number', 'entries.narration')
            ->orderBy('entries.date', 'asc')
            ->get();

        // 6. Calculate Running Balance
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

        // 7. Return Data + Permissions
        return response()->json([
            'account' => $group,
            'entries' => $formattedItems,
            'current_balance' => $balance,
            // 👇 THIS IS WHAT YOUR FRONTEND WAS MISSING
            'is_owner' => $isOwner,
            'permission_level' => $permissionLevel
        ]);
    }

    /**
     * POST /api/ledgers/{id}/authorize
     * Invite another user to this ledger
     */
    public function authorizeUser(Request $request, $id)
    {
        $ledger = Ledger::findOrFail($id);
        $this->authorize('update', $ledger); // Only owner can invite

        $request->validate([
            'email' => 'required|email|exists:users,email',
            'role' => 'required|in:viewer,editor'
        ]);

        $userToInvite = \App\Models\User::where('email', $request->email)->first();

        // Prevent adding yourself or duplicates
        if ($userToInvite->id === $ledger->owner_id) {
            return response()->json(['message' => 'You cannot invite yourself.'], 422);
        }

        // Sync without detaching (adds or updates role)
        $ledger->authorizedUsers()->syncWithoutDetaching([
            $userToInvite->id => ['permission_level' => $request->role]
        ]);

        return response()->json(['message' => 'User authorized successfully.']);
    }
}