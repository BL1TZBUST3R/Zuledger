<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\GroupController;
use App\Http\Controllers\LedgerController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Public
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Protected
Route::group(['middleware' => ['auth:sanctum']], function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    
    // Ledger Management
    Route::get('/ledgers', [LedgerController::class, 'index']);
    Route::post('/ledgers', [LedgerController::class, 'store']);
    Route::get('/ledgers/{id}', [LedgerController::class, 'show']);
    
    // 👇 NEW ROUTES FOR RENAME/DELETE
    Route::put('/ledgers/{id}', [LedgerController::class, 'update']); 
    Route::delete('/ledgers/{id}', [LedgerController::class, 'destroy']); 
    
    Route::post('/ledgers/{id}/authorize', [LedgerController::class, 'authorizeUser']);

    // Accounts
    Route::get('/ledgers/{id}/groups', [GroupController::class, 'index']); 
    Route::post('/ledgers/{id}/groups', [GroupController::class, 'store']);

    // Dashboard
    Route::get('/dashboard', [App\Http\Controllers\DashboardController::class, 'index']);
});