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
    Schema::create('ledgers', function (Blueprint $table) {
        $table->id();
        
        // 1. Owner (Makes it easier to secure)
        $table->foreignId('user_id')->constrained()->onDelete('cascade');
        
        // 2. Parent Group (If the Group is deleted, delete these ledgers too)
        $table->foreignId('group_id')->constrained('groups')->onDelete('cascade');
        
        $table->string('name');
        $table->string('code')->nullable();
        
        // Opening Balance
        $table->decimal('op_balance', 25, 2)->default(0); 
        $table->char('op_balance_dc', 1)->default('D'); // D/C
        
        // Webzash Feature: Useful for "Bank" type ledgers later
        $table->boolean('reconciliation')->default(0);
        
        $table->timestamps();
        
        // 3. Prevent duplicate codes for the same user
        $table->unique(['user_id', 'code']);
    });
}
    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ledgers');
    }
};
