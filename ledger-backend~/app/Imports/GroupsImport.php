<?php

namespace App\Imports;

use App\Models\Group;
use Illuminate\Support\Facades\Auth;
use PhpOffice\PhpSpreadsheet\IOFactory;

class GroupsImport
{
    protected int $ledgerId;
    protected array $errors = [];

    public function __construct(int $ledgerId)
    {
        $this->ledgerId = $ledgerId;
    }

    public function import(string $filePath, string $mode = 'add'): array
    {
        $spreadsheet = IOFactory::load($filePath);
        $sheet = $spreadsheet->getActiveSheet();
        $rows = $sheet->toArray(null, true, true, true);

        // Remove header row
        $header = array_shift($rows);

        if (!$header || !$this->validateHeader($header)) {
            return [
                'success' => false,
                'errors'  => ['Invalid file format. Expected columns: Code, Account Name, Account Type, Subtype, Cash Flow Type, Normal Balance, Parent Code'],
                'imported' => 0,
            ];
        }

        // Validate all rows first
        $parsed = [];
        $rowNum = 2; // starts at 2 because row 1 is header

        foreach ($rows as $row) {
            $code         = trim($row['A'] ?? '');
            $name         = trim($row['B'] ?? '');
            $accountType  = strtolower(trim($row['C'] ?? ''));
            $subtype      = strtolower(trim($row['D'] ?? '')) ?: null;
            $cashflow     = strtolower(trim($row['E'] ?? '')) ?: null;
            $normalBal    = strtoupper(trim($row['F'] ?? ''));
            $parentCode   = trim($row['G'] ?? '');

            // Skip completely empty rows
            if ($code === '' && $name === '') {
                $rowNum++;
                continue;
            }

            // Validate required fields
            if ($code === '') {
                $this->errors[] = "Row {$rowNum}: Code is required.";
            }
            if ($name === '') {
                $this->errors[] = "Row {$rowNum}: Account Name is required.";
            }
            if (!in_array($accountType, ['asset', 'liability', 'equity', 'revenue', 'expense'])) {
                $this->errors[] = "Row {$rowNum}: Invalid Account Type '{$accountType}'.";
            }
            if ($subtype && !in_array($subtype, ['current', 'non-current', 'direct', 'indirect'])) {
                $this->errors[] = "Row {$rowNum}: Invalid Subtype '{$subtype}'.";
            }
            if ($cashflow && !in_array($cashflow, ['operating', 'investing', 'financing'])) {
                $this->errors[] = "Row {$rowNum}: Invalid Cash Flow Type '{$cashflow}'.";
            }
            if (!in_array($normalBal, ['DR', 'CR'])) {
                $this->errors[] = "Row {$rowNum}: Normal Balance must be DR or CR.";
            }

            $parsed[] = [
                'row'          => $rowNum,
                'code'         => $code,
                'name'         => $name,
                'account_type' => $accountType,
                'subtype'      => $subtype,
                'cashflow'     => $cashflow,
                'normal_bal'   => $normalBal,
                'parent_code'  => $parentCode,
            ];

            $rowNum++;
        }

        if (!empty($this->errors)) {
            return [
                'success'  => false,
                'errors'   => $this->errors,
                'imported' => 0,
            ];
        }

        // If replace mode, delete existing groups for this ledger
        if ($mode === 'replace') {
            Group::where('ledger_id', $this->ledgerId)->delete();
        }

        // Check for duplicate codes within the file
        $codes = array_column($parsed, 'code');
        $duplicates = array_diff_key($codes, array_unique($codes));
        if (!empty($duplicates)) {
            return [
                'success'  => false,
                'errors'   => ['Duplicate codes found in file: ' . implode(', ', array_unique($duplicates))],
                'imported' => 0,
            ];
        }

        // First pass: create parent accounts (no parent_code)
        $codeToId = [];
        $childRows = [];

        foreach ($parsed as $item) {
            if ($item['parent_code'] === '') {
                // Check for existing code in this ledger (in add mode)
                if ($mode === 'add') {
                    $exists = Group::where('ledger_id', $this->ledgerId)
                        ->where('code', $item['code'])->exists();
                    if ($exists) {
                        $this->errors[] = "Row {$item['row']}: Code '{$item['code']}' already exists in this ledger.";
                        continue;
                    }
                }

                $group = Group::create([
                    'user_id'         => Auth::id(),
                    'ledger_id'       => $this->ledgerId,
                    'parent_id'       => null,
                    'name'            => $item['name'],
                    'code'            => $item['code'],
                    'affects_gross'   => 0,
                    'account_type'    => $item['account_type'],
                    'account_subtype' => $item['subtype'],
                    'cashflow_type'   => $item['cashflow'],
                    'normal_balance'  => $item['normal_bal'],
                ]);

                $codeToId[$item['code']] = $group->id;
            } else {
                $childRows[] = $item;
            }
        }

        if (!empty($this->errors)) {
            return [
                'success'  => false,
                'errors'   => $this->errors,
                'imported' => 0,
            ];
        }

        // Also map existing parent codes (for add mode)
        if ($mode === 'add') {
            $existingParents = Group::where('ledger_id', $this->ledgerId)
                ->whereNull('parent_id')
                ->pluck('id', 'code')
                ->toArray();
            $codeToId = array_merge($existingParents, $codeToId);
        }

        // Second pass: create child accounts
        $imported = count($codeToId);

        foreach ($childRows as $item) {
            $parentId = $codeToId[$item['parent_code']] ?? null;

            if (!$parentId) {
                $this->errors[] = "Row {$item['row']}: Parent code '{$item['parent_code']}' not found.";
                continue;
            }

            if ($mode === 'add') {
                $exists = Group::where('ledger_id', $this->ledgerId)
                    ->where('code', $item['code'])->exists();
                if ($exists) {
                    $this->errors[] = "Row {$item['row']}: Code '{$item['code']}' already exists in this ledger.";
                    continue;
                }
            }

            Group::create([
                'user_id'         => Auth::id(),
                'ledger_id'       => $this->ledgerId,
                'parent_id'       => $parentId,
                'name'            => $item['name'],
                'code'            => $item['code'],
                'affects_gross'   => 0,
                'account_type'    => $item['account_type'],
                'account_subtype' => $item['subtype'],
                'cashflow_type'   => $item['cashflow'],
                'normal_balance'  => $item['normal_bal'],
            ]);

            $imported++;
        }

        if (!empty($this->errors)) {
            return [
                'success'  => false,
                'errors'   => $this->errors,
                'imported' => $imported,
            ];
        }

        return [
            'success'  => true,
            'errors'   => [],
            'imported' => $imported,
        ];
    }

    protected function validateHeader(array $header): bool
    {
        $expected = ['Code', 'Account Name', 'Account Type', 'Subtype', 'Cash Flow Type', 'Normal Balance', 'Parent Code'];
        $actual = array_values(array_map('trim', $header));

        // Check first 7 columns match (case-insensitive)
        for ($i = 0; $i < count($expected); $i++) {
            if (strtolower($actual[$i] ?? '') !== strtolower($expected[$i])) {
                return false;
            }
        }

        return true;
    }
}