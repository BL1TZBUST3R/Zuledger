<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use App\Models\Ledger;

class SettingsController extends Controller
{
    use AuthorizesRequests;

    /**
     * GET /api/ledgers/{id}/settings
     * Return current settings for this ledger
     */
    public function show($id)
    {
        $ledger = Ledger::findOrFail($id);
        $this->authorize('view', $ledger);

        return response()->json([
            'fiscal_year_end_month' => $ledger->fiscal_year_end_month ?? 12,
            'timezone'              => $ledger->timezone ?? 'UTC',
            'date_format'           => $ledger->date_format ?? 'DD/MM/YYYY',
            'lock_date'             => $ledger->lock_date ? $ledger->lock_date->format('Y-m-d') : null,
        ]);
    }

    /**
     * PUT /api/ledgers/{id}/settings
     * Save settings — only the ledger owner can do this
     */
    public function update(Request $request, $id)
    {
        $ledger = Ledger::findOrFail($id);
        $this->authorize('update', $ledger); // owner only

        $request->validate([
            'fiscal_year_end_month' => 'required|integer|min:1|max:12',
            'timezone'              => 'required|string|timezone',
            'date_format'           => 'required|in:DD/MM/YYYY,MM/DD/YYYY',
            'lock_date'             => 'nullable|date',
        ]);

        $ledger->update([
            'fiscal_year_end_month' => $request->fiscal_year_end_month,
            'timezone'              => $request->timezone,
            'date_format'           => $request->date_format,
            'lock_date'             => $request->lock_date,
        ]);

        return response()->json(['message' => 'Settings saved successfully.']);
    }
}
