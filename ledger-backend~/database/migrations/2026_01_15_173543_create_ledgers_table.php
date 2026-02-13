<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB; // 👈 Import DB Facade

return new class extends Migration
{
    public function up(): void
    {
        // 👇 NUCLEAR FIX:
        // 'CASCADE' tells PostgreSQL to force-delete the table 
        // and automatically remove any links (Foreign Keys) from other tables.
        DB::statement('DROP TABLE IF EXISTS ledgers CASCADE');

        // Now create the correct "Company" table
        Schema::create('ledgers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('owner_id')->constrained('users')->onDelete('cascade');
            $table->string('name');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        // We use CASCADE here too, just in case
        DB::statement('DROP TABLE IF EXISTS ledgers CASCADE');
    }
};