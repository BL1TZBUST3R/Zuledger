<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\GroupController;
use App\Http\Controllers\LedgerController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Public Routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Protected Routes
Route::group(['middleware' => ['auth:sanctum']], function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    
    // Ledger Management Routes
    Route::get('/ledgers', [LedgerController::class, 'index']);      // List my ledgers
    Route::post('/ledgers', [LedgerController::class, 'store']);     // Create new ledger
    Route::get('/ledgers/{id}', [LedgerController::class, 'show']);  // View specific ledger
    Route::post('/ledgers/{id}/authorize', [LedgerController::class, 'authorizeUser']); // Invite user

    // 👇 NEW: Ledger-Specific Account Routes
    // These allow fetching/creating accounts for a specific Company Ledger
    Route::get('/ledgers/{id}/groups', [GroupController::class, 'index']); 
    Route::post('/ledgers/{id}/groups', [GroupController::class, 'store']);

    // Dashboard & Entries
    Route::get('/dashboard', [App\Http\Controllers\DashboardController::class, 'index']);
    Route::post('/entries', [App\Http\Controllers\EntryController::class, 'store']);
});