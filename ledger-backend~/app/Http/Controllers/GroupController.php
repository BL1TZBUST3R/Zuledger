<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Group;
use App\Models\Ledger;

class GroupController extends Controller
{
    public function index($ledgerId)
    {
        $ledger = Ledger::findOrFail($ledgerId);

        $this->authorize('view', $ledger);


        return Group::where('ledger_id', $ledgerId)
                    ->whereNull('parent_id')
                    ->with('children') 
                    ->orderBy('code', 'asc')
                    ->get();
    }

  
    public function store(Request $request, $ledgerId)
    {
        $ledger = Ledger::findOrFail($ledgerId);

        // 🛡️ Security: Only owners or editors can add accounts
        $this->authorize('update', $ledger);

        $request->validate([
            'name' => 'required|string',
            'code' => 'required|string',
            'parent_id' => 'nullable|exists:groups,id'
        ]);

        // Validation: Ensure parent belongs to the SAME ledger
        if ($request->parent_id) {
            $parent = Group::find($request->parent_id);
            if ($parent->ledger_id != $ledgerId) {
                return response()->json(['message' => 'Parent account must belong to the same ledger'], 422);
            }
        }

        $group = Group::create([
            'user_id' => Auth::id(),   // Who created it (Audit trail)
            'ledger_id' => $ledgerId,  // 👈 IMPORTANT: Link to the specific ledger
            'parent_id' => $request->parent_id,
            'name' => $request->name,
            'code' => $request->code,
            'affects_gross' => 0, 
        ]);

        return response()->json($group, 201);
    }
}