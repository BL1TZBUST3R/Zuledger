<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Group;
use App\Models\User;

class GroupSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * Use this to seed groups for a SPECIFIC user.
     */
    public function run(User $user = null): void
    {
        // If no user is passed, don't run (safety check)
        if (!$user) return;

        // 1. ASSETS
        $assets = Group::create([
            'user_id' => $user->id,
            'name' => 'Assets',
            'code' => '1000',
            'affects_gross' => 0
        ]);
        
        // 2. LIABILITIES
        $liabilities = Group::create([
            'user_id' => $user->id,
            'name' => 'Liabilities',
            'code' => '2000',
            'affects_gross' => 0
        ]);

        // 3. EQUITY
        $equity = Group::create([
            'user_id' => $user->id,
            'name' => 'Equity',
            'code' => '3000',
            'affects_gross' => 0
        ]);

        // 4. INCOME
        $income = Group::create([
            'user_id' => $user->id,
            'name' => 'Income',
            'code' => '4000',
            'affects_gross' => 0
        ]);

        // 5. EXPENSES
        $expenses = Group::create([
            'user_id' => $user->id,
            'name' => 'Expenses',
            'code' => '5000',
            'affects_gross' => 0
        ]);

        // --- SUB-GROUPS (The "Children") ---

        // Current Assets (Child of Assets)
        Group::create([
            'user_id' => $user->id,
            'parent_id' => $assets->id,
            'name' => 'Current Assets',
            'code' => '1100'
        ]);

        // Fixed Assets (Child of Assets)
        Group::create([
            'user_id' => $user->id,
            'parent_id' => $assets->id,
            'name' => 'Fixed Assets',
            'code' => '1200'
        ]);

        // Direct Income (Child of Income) - Affects Gross Profit!
        Group::create([
            'user_id' => $user->id,
            'parent_id' => $income->id,
            'name' => 'Direct Income',
            'code' => '4100',
            'affects_gross' => 1
        ]);

        // Direct Expenses (Child of Expenses) - Affects Gross Profit!
        Group::create([
            'user_id' => $user->id,
            'parent_id' => $expenses->id,
            'name' => 'Direct Expenses',
            'code' => '5100',
            'affects_gross' => 1
        ]);
    }
}