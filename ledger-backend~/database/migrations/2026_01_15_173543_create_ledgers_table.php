<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 👇 THIS IS THE FIX:
        // Forcefully delete the old "bad" table if it exists.
        // We disable foreign keys first to prevent "Integrity Constraint" crashes.
        Schema::disableForeignKeyConstraints();
        Schema::dropIfExists('ledgers');
        Schema::enableForeignKeyConstraints();

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
        Schema::dropIfExists('ledgers');
    }
};