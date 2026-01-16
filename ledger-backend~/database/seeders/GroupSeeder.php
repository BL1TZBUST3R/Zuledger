<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class GroupSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
public function run(): void
    {
        // 1. Assets
        \App\Models\Group::create([
            'id' => 1,
            'name' => 'Assets',
            'code' => 'A',
            'parent_id' => null
        ]);

        // 2. Liabilities
        \App\Models\Group::create([
            'id' => 2,
            'name' => 'Liabilities',
            'code' => 'L',
            'parent_id' => null
        ]);

        // 3. Income
        \App\Models\Group::create([
            'id' => 3,
            'name' => 'Income',
            'code' => 'I',
            'parent_id' => null
        ]);

        // 4. Expenses
        \App\Models\Group::create([
            'id' => 4,
            'name' => 'Expenses',
            'code' => 'E',
            'parent_id' => null
        ]);
    }
}
