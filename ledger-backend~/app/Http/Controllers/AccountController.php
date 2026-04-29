<?php

namespace App\Http\Controllers;

use App\Models\Account;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AccountController extends Controller
{
    // GET /api/accounts — scoped to the authenticated user.
    public function index()
    {
        $accounts = Account::where('user_id', Auth::id())
            ->orderBy('code', 'asc')
            ->get();
        return response()->json($accounts);
    }
}