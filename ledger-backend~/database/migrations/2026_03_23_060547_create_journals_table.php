<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('journals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ledger_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->integer('journal_number');
            $table->string('description')->nullable();
            $table->date('date');
            $table->enum('status', ['draft', 'posted'])->default('draft');
            $table->timestamps();

            $table->unique(['ledger_id', 'journal_number']);
        });

        Schema::create('journal_lines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('journal_id')->constrained()->onDelete('cascade');
            $table->foreignId('group_id')->constrained('groups')->onDelete('cascade');
            $table->decimal('amount', 25, 2);
            $table->char('type', 2); // DR or CR
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('journal_lines');
        Schema::dropIfExists('journals');
    }
};