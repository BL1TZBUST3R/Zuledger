<?php

namespace App\Exports;

use App\Models\Group;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Border;

class GroupsExport
{
    protected int $ledgerId;

    public function __construct(int $ledgerId)
    {
        $this->ledgerId = $ledgerId;
    }

    public function export(): string
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Chart of Accounts');

        // Headers
        $headers = ['Code', 'Account Name', 'Account Type', 'Subtype', 'Cash Flow Type', 'Normal Balance', 'Parent Code'];
        $col = 'A';
        foreach ($headers as $header) {
            $sheet->setCellValue($col . '1', $header);
            $col++;
        }

        // Style headers
        $headerRange = 'A1:G1';
        $sheet->getStyle($headerRange)->getFont()->setBold(true);
        $sheet->getStyle($headerRange)->getFill()
            ->setFillType(Fill::FILL_SOLID)
            ->getStartColor()->setRGB('E2E8F0');
        $sheet->getStyle($headerRange)->getBorders()->getBottom()
            ->setBorderStyle(Border::BORDER_THIN);
        $sheet->getStyle($headerRange)->getAlignment()
            ->setHorizontal(Alignment::HORIZONTAL_CENTER);

        // Fetch parent groups with children
        $groups = Group::where('ledger_id', $this->ledgerId)
            ->whereNull('parent_id')
            ->with('children')
            ->orderBy('code', 'asc')
            ->get();

        // Populate rows
        $row = 2;
        foreach ($groups as $group) {
            // Parent row
            $sheet->setCellValueExplicit("A{$row}", $group->code, \PhpOffice\PhpSpreadsheet\Cell\DataType::TYPE_STRING);
            $sheet->setCellValue("B{$row}", $group->name);
            $sheet->setCellValue("C{$row}", $group->account_type);
            $sheet->setCellValue("D{$row}", $group->account_subtype ?? '');
            $sheet->setCellValue("E{$row}", $group->cashflow_type ?? '');
            $sheet->setCellValue("F{$row}", $group->normal_balance);
            $sheet->setCellValue("G{$row}", '');

            // Bold the parent row
            $sheet->getStyle("A{$row}:G{$row}")->getFont()->setBold(true);
            $row++;

            // Child rows
            foreach ($group->children as $child) {
                $sheet->setCellValueExplicit("A{$row}", $child->code, \PhpOffice\PhpSpreadsheet\Cell\DataType::TYPE_STRING);
                $sheet->setCellValue("B{$row}", $child->name);
                $sheet->setCellValue("C{$row}", $child->account_type);
                $sheet->setCellValue("D{$row}", $child->account_subtype ?? '');
                $sheet->setCellValue("E{$row}", $child->cashflow_type ?? '');
                $sheet->setCellValue("F{$row}", $child->normal_balance);
                $sheet->setCellValue("G{$row}", $group->code); // Parent's code
                $row++;
            }
        }

        // Auto-size columns
        foreach (range('A', 'G') as $colLetter) {
            $sheet->getColumnDimension($colLetter)->setAutoSize(true);
        }

        // Write to temp file
        $filePath = storage_path('app/temp_coa_export_' . $this->ledgerId . '.xlsx');
        $writer = new Xlsx($spreadsheet);
        $writer->save($filePath);

        return $filePath;
    }
}