<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\GroupController;
use App\Http\Controllers\LedgerController;
use App\Http\Controllers\ReportController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Public Routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Currency rates (public, cached — used by the converter widget)
Route::get('/currency/rates', [App\Http\Controllers\CurrencyController::class, 'rates']);

// Protected Routes
Route::group(['middleware' => ['auth:sanctum']], function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    
    // Ledger Management Routes
    Route::get('/ledgers', [LedgerController::class, 'index']);      // List my ledgers
    Route::post('/ledgers', [LedgerController::class, 'store']);     // Create new ledger
    Route::get('/ledgers/{id}', [LedgerController::class, 'show']);  // View specific ledger
    Route::put('/ledgers/{id}', [LedgerController::class, 'update']);    // Rename ledger
    Route::delete('/ledgers/{id}', [LedgerController::class, 'destroy']); // Delete ledger
    Route::post('/ledgers/{id}/authorize', [LedgerController::class, 'authorizeUser']); // Invite user
    Route::delete('/ledgers/{id}/users', [LedgerController::class, 'removeUser']);

    // 👇 NEW: Ledger-Specific Account Routes
    // These allow fetching/creating accounts for a specific Company Ledger
    Route::get('/ledgers/{id}/groups', [GroupController::class, 'index']); 
    Route::post('/ledgers/{id}/groups', [GroupController::class, 'store']);
    Route::get('/ledgers/{id}/groups/export', [GroupController::class, 'exportExcel']);
    Route::post('/ledgers/{id}/groups/import', [GroupController::class, 'importExcel']);
     Route::get('/ledgers/{id}/journals', [App\Http\Controllers\JournalController::class, 'index']);
    Route::get('/ledgers/{id}/journals/{journalId}', [App\Http\Controllers\JournalController::class, 'show']);
    Route::post('/ledgers/{id}/journals', [App\Http\Controllers\JournalController::class, 'store']);
    Route::put('/ledgers/{id}/journals/{journalId}', [App\Http\Controllers\JournalController::class, 'update']);
    Route::patch('/ledgers/{id}/journals/{journalId}/post', [App\Http\Controllers\JournalController::class, 'post']);
    Route::patch('/ledgers/{id}/journals/{journalId}/reverse', [App\Http\Controllers\JournalController::class, 'reverse']);
    Route::delete('/ledgers/{id}/journals/{journalId}', [App\Http\Controllers\JournalController::class, 'destroy']);
    Route::get('/dashboard', [App\Http\Controllers\DashboardController::class, 'index']);
    Route::post('/entries', [App\Http\Controllers\EntryController::class, 'store']);

    // Settings
    Route::get('/ledgers/{id}/settings', [App\Http\Controllers\SettingsController::class, 'show']);
    Route::put('/ledgers/{id}/settings', [App\Http\Controllers\SettingsController::class, 'update']);

    // Reports
    Route::get('/ledgers/{id}/reports/trial-balance', [ReportController::class, 'trialBalance']);
    Route::get('/ledgers/{id}/reports/profit-and-loss', [ReportController::class, 'profitAndLoss']);
    Route::get('/ledgers/{id}/reports/balance-sheet', [ReportController::class, 'balanceSheet']);
    Route::get('/ledgers/{id}/reports/cash-flow', [ReportController::class, 'cashFlow']);
    Route::get('/ledgers/{id}/reports/general-ledger', [ReportController::class, 'generalLedger']);
    Route::get('/ledgers/{id}/reports/journal-report', [ReportController::class, 'journalReport']);
});