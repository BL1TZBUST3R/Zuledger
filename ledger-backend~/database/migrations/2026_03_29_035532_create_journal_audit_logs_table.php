<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('journal_audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('journal_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('action'); // created, edited, posted, unposted, reversed
            $table->text('details')->nullable(); // JSON of what changed
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('journal_audit_logs');
    }
};