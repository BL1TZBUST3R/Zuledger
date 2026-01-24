<?php

namespace App\Http\Controllers;

use App\Models\Account;
use Illuminate\Http\Request;

class AccountController extends Controller
{
    // GET /api/accounts
    public function index()
    {
        $accounts = Account::orderBy('code', 'asc')->get();
        return response()->json($accounts);
    }
}