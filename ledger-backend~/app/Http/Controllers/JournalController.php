<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use App\Models\Journal;
use App\Models\JournalLine;
use App\Models\JournalAuditLog;
use App\Models\Ledger;

class JournalController extends Controller
{
    use AuthorizesRequests;

    public function index($ledgerId)
    {
        $ledger = Ledger::findOrFail($ledgerId);
        $this->authorize('view', $ledger);

        $journals = Journal::where('ledger_id', $ledgerId)
            ->with(['lines.account', 'user', 'auditLogs.user'])
            ->orderBy('journal_number', 'desc')
            ->get();

        return response()->json($journals);
    }

    public function show($ledgerId, $journalId)
    {
        $ledger = Ledger::findOrFail($ledgerId);
        $this->authorize('view', $ledger);

        $journal = Journal::where('ledger_id', $ledgerId)
            ->where('id', $journalId)
            ->with(['lines.account', 'user', 'auditLogs.user'])
            ->firstOrFail();

        return response()->json($journal);
    }

    public function store(Request $request, $ledgerId)
    {
        $ledger = Ledger::findOrFail($ledgerId);
        $this->authorize('update', $ledger);

        $request->validate([
            'description'       => 'nullable|string|max:500',
            'date'              => 'required|date',
            'lines'             => 'required|array|min:2',
            'lines.*.group_id'  => 'required|exists:groups,id',
            'lines.*.amount'    => 'required|numeric|min:0.01',
            'lines.*.type'      => 'required|in:DR,CR',
        ]);

        $totalDR = 0;
        $totalCR = 0;
        foreach ($request->lines as $line) {
            if ($line['type'] === 'DR') {
                $totalDR += $line['amount'];
            } else {
                $totalCR += $line['amount'];
            }
        }

        if (round($totalDR, 2) !== round($totalCR, 2)) {
            return response()->json([
                'message' => 'Journal entry is not balanced. Total debits must equal total credits.',
                'total_dr' => round($totalDR, 2),
                'total_cr' => round($totalCR, 2),
            ], 422);
        }

        $groupIds = array_column($request->lines, 'group_id');
        $validCount = \App\Models\Group::where('ledger_id', $ledgerId)
            ->whereIn('id', $groupIds)
            ->count();

        if ($validCount !== count(array_unique($groupIds))) {
            return response()->json([
                'message' => 'One or more accounts do not belong to this ledger.',
            ], 422);
        }

        $nextNumber = Journal::where('ledger_id', $ledgerId)->max('journal_number') + 1;

        $journal = DB::transaction(function () use ($request, $ledgerId, $nextNumber) {
            $journal = Journal::create([
                'ledger_id'      => $ledgerId,
                'user_id'        => Auth::id(),
                'journal_number' => $nextNumber,
                'description'    => $request->description,
                'date'           => $request->date,
                'status'         => 'draft',
            ]);

            foreach ($request->lines as $line) {
                JournalLine::create([
                    'journal_id' => $journal->id,
                    'group_id'   => $line['group_id'],
                    'amount'     => $line['amount'],
                    'type'       => $line['type'],
                ]);
            }

            JournalAuditLog::create([
                'journal_id' => $journal->id,
                'user_id'    => Auth::id(),
                'action'     => 'created',
                'details'    => ['description' => $request->description, 'date' => $request->date],
            ]);

            return $journal;
        });

        return response()->json(
            $journal->load(['lines.account', 'user', 'auditLogs.user']),
            201
        );
    }

    public function update(Request $request, $ledgerId, $journalId)
    {
        $ledger = Ledger::findOrFail($ledgerId);
        $this->authorize('update', $ledger);

        $journal = Journal::where('ledger_id', $ledgerId)
            ->where('id', $journalId)
            ->firstOrFail();

        if ($journal->status === 'posted') {
            return response()->json([
                'message' => 'Cannot edit a posted journal entry.',
            ], 422);
        }

        $request->validate([
            'description'       => 'nullable|string|max:500',
            'date'              => 'required|date',
            'lines'             => 'required|array|min:2',
            'lines.*.group_id'  => 'required|exists:groups,id',
            'lines.*.amount'    => 'required|numeric|min:0.01',
            'lines.*.type'      => 'required|in:DR,CR',
        ]);

        $totalDR = 0;
        $totalCR = 0;
        foreach ($request->lines as $line) {
            if ($line['type'] === 'DR') {
                $totalDR += $line['amount'];
            } else {
                $totalCR += $line['amount'];
            }
        }

        if (round($totalDR, 2) !== round($totalCR, 2)) {
            return response()->json([
                'message' => 'Journal entry is not balanced. Total debits must equal total credits.',
                'total_dr' => round($totalDR, 2),
                'total_cr' => round($totalCR, 2),
            ], 422);
        }

        $groupIds = array_column($request->lines, 'group_id');
        $validCount = \App\Models\Group::where('ledger_id', $ledgerId)
            ->whereIn('id', $groupIds)
            ->count();

        if ($validCount !== count(array_unique($groupIds))) {
            return response()->json([
                'message' => 'One or more accounts do not belong to this ledger.',
            ], 422);
        }

        // Capture old state for audit
        $oldData = [
            'description' => $journal->description,
            'date' => $journal->date->toDateString(),
            'lines' => $journal->lines->map(function ($l) {
                return ['group_id' => $l->group_id, 'amount' => $l->amount, 'type' => $l->type];
            })->toArray(),
        ];

        DB::transaction(function () use ($request, $journal, $oldData) {
            $journal->update([
                'description' => $request->description,
                'date'        => $request->date,
            ]);

            $journal->lines()->delete();

            foreach ($request->lines as $line) {
                JournalLine::create([
                    'journal_id' => $journal->id,
                    'group_id'   => $line['group_id'],
                    'amount'     => $line['amount'],
                    'type'       => $line['type'],
                ]);
            }

            JournalAuditLog::create([
                'journal_id' => $journal->id,
                'user_id'    => Auth::id(),
                'action'     => 'edited',
                'details'    => ['before' => $oldData, 'after' => [
                    'description' => $request->description,
                    'date' => $request->date,
                    'lines' => $request->lines,
                ]],
            ]);
        });

        return response()->json(
            $journal->fresh()->load(['lines.account', 'user', 'auditLogs.user'])
        );
    }

    public function post($ledgerId, $journalId)
    {
        $ledger = Ledger::findOrFail($ledgerId);
        $this->authorize('update', $ledger);

        $journal = Journal::where('ledger_id', $ledgerId)
            ->where('id', $journalId)
            ->firstOrFail();

        if ($journal->status === 'posted') {
            return response()->json(['message' => 'Journal is already posted.'], 422);
        }

        $journal->update(['status' => 'posted']);

        JournalAuditLog::create([
            'journal_id' => $journal->id,
            'user_id'    => Auth::id(),
            'action'     => 'posted',
            'details'    => null,
        ]);

        return response()->json($journal->load(['lines.account', 'user', 'auditLogs.user']));
    }

    public function reverse($ledgerId, $journalId)
    {
        $ledger = Ledger::findOrFail($ledgerId);
        $this->authorize('update', $ledger);

        $journal = Journal::where('ledger_id', $ledgerId)
            ->where('id', $journalId)
            ->with('lines')
            ->firstOrFail();

        if ($journal->status !== 'posted') {
            return response()->json(['message' => 'Only posted journals can be reversed.'], 422);
        }

        $nextNumber = Journal::where('ledger_id', $ledgerId)->max('journal_number') + 1;

        $reversal = DB::transaction(function () use ($journal, $ledgerId, $nextNumber) {
            // Create a new reversal journal with flipped DR/CR
            $reversal = Journal::create([
                'ledger_id'      => $ledgerId,
                'user_id'        => Auth::id(),
                'journal_number' => $nextNumber,
                'description'    => 'Reversal of J#' . $journal->journal_number . ': ' . ($journal->description ?? ''),
                'date'           => now()->toDateString(),
                'status'         => 'posted',
            ]);

            foreach ($journal->lines as $line) {
                JournalLine::create([
                    'journal_id' => $reversal->id,
                    'group_id'   => $line->group_id,
                    'amount'     => $line->amount,
                    'type'       => $line->type === 'DR' ? 'CR' : 'DR',
                ]);
            }

            // Log audit on the original journal
            JournalAuditLog::create([
                'journal_id' => $journal->id,
                'user_id'    => Auth::id(),
                'action'     => 'reversed',
                'details'    => ['reversal_journal_id' => $reversal->id, 'reversal_journal_number' => $nextNumber],
            ]);

            // Log audit on the reversal journal
            JournalAuditLog::create([
                'journal_id' => $reversal->id,
                'user_id'    => Auth::id(),
                'action'     => 'created',
                'details'    => ['reversal_of_journal_id' => $journal->id, 'reversal_of_journal_number' => $journal->journal_number],
            ]);

            return $reversal;
        });

        return response()->json(
            $reversal->load(['lines.account', 'user', 'auditLogs.user']),
            201
        );
    }

    public function destroy($ledgerId, $journalId)
    {
        $ledger = Ledger::findOrFail($ledgerId);
        $this->authorize('update', $ledger);

        $journal = Journal::where('ledger_id', $ledgerId)
            ->where('id', $journalId)
            ->firstOrFail();

        if ($journal->status === 'posted') {
            return response()->json(['message' => 'Cannot delete a posted journal. Use reverse instead.'], 422);
        }

        JournalAuditLog::create([
            'journal_id' => $journal->id,
            'user_id'    => Auth::id(),
            'action'     => 'deleted',
            'details'    => null,
        ]);

        $journal->delete();

        return response()->json(['message' => 'Journal deleted.']);
    }
}