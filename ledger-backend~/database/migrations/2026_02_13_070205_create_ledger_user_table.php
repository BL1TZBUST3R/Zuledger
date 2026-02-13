<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ledger_user', function (Blueprint $table) {
            $table->id();
            // Link to the Ledger
            $table->foreignId('ledger_id')->constrained()->onDelete('cascade');
            // Link to the User
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            // The Permission Level (e.g., 'viewer', 'editor')
            $table->string('permission_level')->default('viewer');
            $table->timestamps();
            
            // Prevent duplicate invites for the same user/ledger pair
            $table->unique(['ledger_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ledger_user');
    }
};