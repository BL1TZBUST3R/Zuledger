<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\User; // 👈 Make sure this is imported!
use App\Models\Group;

class GroupSeeder extends Seeder
{
    public function run()
    {
        // 1. Get the first user, OR create one if the DB is empty
        $user = User::first();

        if (!$user) {
            $user = User::create([
                'name' => 'Admin User',
                'email' => 'admin@zuledger.com',
                'password' => bcrypt('password'), // default password
            ]);
        }

        // 2. The Standard Accounting Tree (Webzash Style)
        $groups = [
            ['name' => 'Assets',      'code' => '1000', 'affects_gross' => 0],
            ['name' => 'Liabilities', 'code' => '2000', 'affects_gross' => 0],
            ['name' => 'Income',      'code' => '3000', 'affects_gross' => 1],
            ['name' => 'Expenses',    'code' => '4000', 'affects_gross' => 1],
        ];

        // 3. Insert them using the User ID we just found/created
        foreach ($groups as $group) {
            Group::create([
                'user_id' => $user->id, // 👈 This fixes the error!
                'name' => $group['name'],
                'code' => $group['code'],
                'affects_gross' => $group['affects_gross'],
            ]);
        }
    }
}