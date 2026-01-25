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
    Schema::create('accounts', function (Blueprint $table) {
        $table->id();

        // 1. 👇 CRITICAL: Link this account to a specific user
        $table->foreignId('user_id')->constrained()->onDelete('cascade');

        $table->string('name');
        
        // 2. 👇 CHANGED: Removed 'unique()' here. 
        // We will make it unique per user at the bottom.
        $table->string('code'); 

        $table->enum('type', [
            'asset', 
            'liability', 
            'equity', 
            'income', 
            'expense'
        ]);

        $table->text('description')->nullable();
        $table->decimal('opening_balance', 15, 2)->default(0.00);
        $table->timestamps();

        // 3. 👇 NEW RULE: The Code must be unique ONLY for this specific user.
        // (Accountant A can have '1001', and Accountant B can also have '1001')
        $table->unique(['user_id', 'code']);
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('accounts');
    }
};
