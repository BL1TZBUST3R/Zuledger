<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use App\Models\Group;
use App\Models\Ledger;

class GroupController extends Controller
{
    use AuthorizesRequests;
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
    $this->authorize('update', $ledger);

    $request->validate([
        'name'          => 'required|string',
        'code'          => 'required|string',
        'parent_id'     => 'nullable|exists:groups,id',
        'account_type'  => 'required|in:asset,liability,equity,revenue,expense',
        'account_subtype' => 'nullable|in:current,non-current,direct,indirect',
        'cashflow_type' => 'nullable|in:operating,investing,financing',
        'normal_balance' => 'required|in:DR,CR',
    ]);

    if ($request->parent_id) {
        $parent = Group::find($request->parent_id);
        if ($parent->ledger_id != $ledgerId) {
            return response()->json(['message' => 'Parent account must belong to the same ledger'], 422);
        }
    }

    $group = Group::create([
        'user_id'         => Auth::id(),
        'ledger_id'       => $ledgerId,
        'parent_id'       => $request->parent_id,
        'name'            => $request->name,
        'code'            => $request->code,
        'affects_gross'   => 0,
        'account_type'    => $request->account_type,
        'account_subtype' => $request->account_subtype,
        'cashflow_type'   => $request->cashflow_type,
        'normal_balance'  => $request->normal_balance,
    ]);

    return response()->json($group, 201);
}
}