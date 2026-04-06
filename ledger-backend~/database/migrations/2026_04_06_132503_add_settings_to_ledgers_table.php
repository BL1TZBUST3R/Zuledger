<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('ledgers', function (Blueprint $table) {
            $table->unsignedTinyInteger('fiscal_year_end_month')->default(12); // 1–12, default December
            $table->string('timezone')->default('UTC');
            $table->string('date_format')->default('DD/MM/YYYY'); // or MM/DD/YYYY
            $table->date('lock_date')->nullable(); // Journals cannot be saved/posted on or before this date
        });
    }

    public function down(): void
    {
        Schema::table('ledgers', function (Blueprint $table) {
            $table->dropColumn(['fiscal_year_end_month', 'timezone', 'date_format', 'lock_date']);
        });
    }
};
