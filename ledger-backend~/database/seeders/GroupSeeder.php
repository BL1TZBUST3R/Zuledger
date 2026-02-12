<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\User;
use App\Models\Group;

class GroupSeeder extends Seeder
{
    
    public function run($user = null)
    {

        if (!$user) {
            $user = User::first();
        }

        if (!$user) {
            return;
        }

      
        $groups = [
            ['name' => 'Assets',      'code' => '1000', 'affects_gross' => 0],
            ['name' => 'Liabilities', 'code' => '2000', 'affects_gross' => 0],
            ['name' => 'Income',      'code' => '3000', 'affects_gross' => 1],
            ['name' => 'Expenses',    'code' => '4000', 'affects_gross' => 1],
        ];

    
        foreach ($groups as $group) {
            Group::create([
                'user_id' => $user->id, 
                'name' => $group['name'],
                'code' => $group['code'],
                'affects_gross' => $group['affects_gross'],
            ]);
        }
    }
}