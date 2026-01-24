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
        $table->string('name');             // e.g. "Cash on Hand"
        $table->string('code')->unique();   // e.g. "1001" (Must be unique)
        $table->enum('type', [
            'asset', 
            'liability', 
            'equity', 
            'income', 
            'expense'
        ]);                                 // The 5 main accounting categories
        $table->text('description')->nullable();
        $table->decimal('opening_balance', 15, 2)->default(0.00); 
        $table->timestamps();
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
