<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Group;

class GroupController extends Controller
{
    // GET /api/groups
    // Returns the full list of groups (Assets, Liabilities...)
    public function index()
    {
        return Group::where('user_id', auth()->id())
            ->with('children') // Also load sub-groups (e.g. Current Assets)
            ->get();
    }

    // POST /api/groups
    // Create a new folder (e.g. "Petty Cash Box")
    public function store(Request $request)
    {
        $fields = $request->validate([
            'name' => 'required|string',
            'parent_id' => 'nullable|exists:groups,id',
            'code' => 'nullable|string'
        ]);

        $group = Group::create([
            'user_id' => auth()->id(), // Auto-assign to current user
            'name' => $fields['name'],
            'parent_id' => $fields['parent_id'] ?? null,
            'code' => $fields['code'] ?? null,
            'affects_gross' => 0 // Default to 0 for now
        ]);

        return response()->json($group, 201);
    }
}