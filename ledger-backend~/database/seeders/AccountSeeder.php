<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class AccountSeeder extends Seeder
{
    public function run(): void
    {
        $accounts = [
            // ASSETS (1000 series)
            ['code' => '1001', 'name' => 'Cash on Hand', 'type' => 'asset'],
            ['code' => '1002', 'name' => 'Bank Account', 'type' => 'asset'],
            ['code' => '1003', 'name' => 'Accounts Receivable', 'type' => 'asset'],

            // LIABILITIES (2000 series)
            ['code' => '2001', 'name' => 'Accounts Payable', 'type' => 'liability'],
            ['code' => '2002', 'name' => 'Credit Card', 'type' => 'liability'],

            // EQUITY (3000 series)
            ['code' => '3001', 'name' => 'Owner\'s Equity', 'type' => 'equity'],

            // INCOME (4000 series)
            ['code' => '4001', 'name' => 'Sales Revenue', 'type' => 'income'],
            ['code' => '4002', 'name' => 'Service Income', 'type' => 'income'],

            // EXPENSES (5000 series)
            ['code' => '5001', 'name' => 'Rent Expense', 'type' => 'expense'],
            ['code' => '5002', 'name' => 'Utilities', 'type' => 'expense'],
            ['code' => '5003', 'name' => 'Salaries', 'type' => 'expense'],
        ];

        foreach ($accounts as $account) {
            DB::table('accounts')->insert([
                'code' => $account['code'],
                'name' => $account['name'],
                'type' => $account['type'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}