<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use App\Models\Journal;
use App\Models\JournalLine;
use App\Models\Ledger;

class JournalController extends Controller
{
    use AuthorizesRequests;

    public function index($ledgerId)
    {
        $ledger = Ledger::findOrFail($ledgerId);
        $this->authorize('view', $ledger);

        $journals = Journal::where('ledger_id', $ledgerId)
            ->with(['lines.account', 'user'])
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
            ->with(['lines.account', 'user'])
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

            return $journal;
        });

        return response()->json(
            $journal->load(['lines.account', 'user']),
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

        DB::transaction(function () use ($request, $journal) {
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
        });

        return response()->json(
            $journal->fresh()->load(['lines.account', 'user'])
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

        return response()->json($journal->load(['lines.account', 'user']));
    }

    public function unpost($ledgerId, $journalId)
    {
        $ledger = Ledger::findOrFail($ledgerId);
        $this->authorize('update', $ledger);

        $journal = Journal::where('ledger_id', $ledgerId)
            ->where('id', $journalId)
            ->firstOrFail();

        if ($journal->status === 'draft') {
            return response()->json(['message' => 'Journal is already a draft.'], 422);
        }

        $journal->update(['status' => 'draft']);

        return response()->json($journal->load(['lines.account', 'user']));
    }

    public function destroy($ledgerId, $journalId)
    {
        $ledger = Ledger::findOrFail($ledgerId);
        $this->authorize('update', $ledger);

        $journal = Journal::where('ledger_id', $ledgerId)
            ->where('id', $journalId)
            ->firstOrFail();

        if ($journal->status === 'posted') {
            return response()->json(['message' => 'Cannot delete a posted journal entry.'], 422);
        }

        $journal->delete();

        return response()->json(['message' => 'Journal deleted.']);
    }
}