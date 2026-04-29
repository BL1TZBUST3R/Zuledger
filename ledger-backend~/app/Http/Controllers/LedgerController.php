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
    $request->validate([
        'name'     => 'required|string',
        'template' => 'nullable|in:company,trust,partnership,sole_trader'
    ]);

    $ledger = Ledger::create([
        'name'     => $request->name,
        'owner_id' => Auth::id(),
    ]);

  // Seed the chart of accounts (default to company template)
    $template = $request->template ?? 'company';
    $seeder = new \Database\Seeders\GroupSeeder();
    $seeder->run(Auth::user(), $ledger, $template);

    return response()->json($ledger, 201);
}
    public function show($id, Request $request)
{
    $ledger = Ledger::findOrFail($id);
    $this->authorize('view', $ledger);

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

    $limit = min((int) $request->query('limit', 500), 2000);
    if ($limit < 1) $limit = 500;

    // Total entry count — used to decide whether the running balance needs seeding.
    $totalCount = EntryItem::where('entry_items.ledger_id', $id)->count();

    // Most recent entries, capped, then re-ordered chronologically for display.
    $items = EntryItem::where('entry_items.ledger_id', $id)
        ->join('entries', 'entry_items.entry_id', '=', 'entries.id')
        ->select('entry_items.*', 'entries.date', 'entries.number', 'entries.narration')
        ->orderBy('entries.date', 'desc')
        ->orderBy('entry_items.id', 'desc')
        ->limit($limit)
        ->get()
        ->reverse()
        ->values();

    // If we truncated, seed the running balance with the cumulative total of the
    // older (non-returned) entries so the visible row balances reconcile to total.
    $startingBalance = 0.0;
    if ($totalCount > $items->count() && $items->isNotEmpty()) {
        $oldestReturnedId = $items->first()->id;
        $row = EntryItem::where('entry_items.ledger_id', $id)
            ->where('entry_items.id', '<', $oldestReturnedId)
            ->selectRaw("COALESCE(SUM(CASE WHEN dc = 'D' THEN amount ELSE -amount END), 0) as bal")
            ->first();
        $startingBalance = (float) ($row->bal ?? 0);
    }

    $balance = $startingBalance;
    $formattedItems = $items->map(function ($item) use (&$balance) {
        $balance += ($item->dc === 'D' ? (float) $item->amount : -(float) $item->amount);
        $item->running_balance = $balance;
        return $item;
    });

    return response()->json([
        'account' => $ledger,
        'entries' => $formattedItems,
        'current_balance' => $balance,
        'is_owner' => $isOwner,
        'permission_level' => $permissionLevel,
        'truncated' => $totalCount > $items->count(),
        'total_entries' => $totalCount,
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
public function removeUser(Request $request, $id)
{
    $ledger = Ledger::findOrFail($id);
    $this->authorize('delete', $ledger); // Only owner can remove users

    $request->validate([
        'user_id' => 'required|exists:users,id'
    ]);

    // Prevent owner from removing themselves
    if ($request->user_id == $ledger->owner_id) {
        return response()->json(['message' => 'Cannot remove the owner.'], 422);
    }

    $ledger->authorizedUsers()->detach($request->user_id);

    return response()->json(['message' => 'User removed successfully.']);
}
}