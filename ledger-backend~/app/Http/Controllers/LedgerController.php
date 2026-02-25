<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Group;
use App\Models\EntryItem;
use App\Models\Ledger;
use Illuminate\Support\Facades\Auth;

class LedgerController extends Controller
{
    use \Illuminate\Foundation\Auth\Access\AuthorizesRequests;
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

    public function show($id)
{
    // 1. Get the Ledger directly
    $ledger = Ledger::findOrFail($id);

    // 2. Check Permissions
    $this->authorize('view', $ledger);

    // 3. Permission Metadata
    $user = Auth::user();
    $isOwner = $ledger->owner_id === $user->id;
    $permissionLevel = 'viewer';

    if ($isOwner) {
        $permissionLevel = 'owner';
    } else {
        $pivot = $ledger->authorizedUsers()
                        ->where('user_id', $user->id)
                        ->first();
        if ($pivot) {
            $permissionLevel = $pivot->pivot->permission_level;
        }
    }

    // 4. Fetch Transactions
    $items = EntryItem::where('entry_items.ledger_id', $id)
        ->join('entries', 'entry_items.entry_id', '=', 'entries.id')
        ->select('entry_items.*', 'entries.date', 'entries.number', 'entries.narration')
        ->orderBy('entries.date', 'asc')
        ->get();

    // 5. Running Balance
    $balance = 0;
    $formattedItems = $items->map(function ($item) use (&$balance) {
        $balance += ($item->dc === 'D' ? $item->amount : -$item->amount);
        $item->running_balance = $balance;
        return $item;
    });

    // 6. Return
    return response()->json([
        'account' => $ledger,
        'entries' => $formattedItems,
        'current_balance' => $balance,
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
    public function update(Request $request, $id)
{
    $ledger = Ledger::findOrFail($id);
    $this->authorize('update', $ledger);
    $request->validate(['name' => 'required|string']);
    $ledger->update(['name' => $request->name]);
    return response()->json($ledger);
}

public function destroy($id)
{
    $ledger = Ledger::findOrFail($id);
    $this->authorize('delete', $ledger);
    $ledger->delete();
    return response()->json(['message' => 'Ledger deleted.']);
}
}