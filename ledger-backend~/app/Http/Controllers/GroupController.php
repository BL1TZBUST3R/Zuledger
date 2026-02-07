<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Group;

class GroupController extends Controller
{
    // 👇 This function fetches the list
    public function index()
    {
        // 1. Get the currently logged-in user
        $user = Auth::user();

        // 2. Return ONLY their groups (with children accounts)
        //    We use 'with('children')' to get the sub-accounts too.
        return Group::where('user_id', $user->id)
                    ->whereNull('parent_id') // Only get top-level groups (Assets, Liabilities...)
                    ->with('children') 
                    ->get();
    }

    // 👇 This function creates a new group
   public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
            'code' => 'required|string',
            'parent_id' => 'required|exists:groups,id' // 👈 We force it to have a parent
        ]);

        $group = Group::create([
            'user_id' => Auth::id(),
            'parent_id' => $request->parent_id, // Save the relationship
            'name' => $request->name,
            'code' => $request->code,
            'affects_gross' => 0, 
        ]);

        return response()->json($group, 201);
    }
}