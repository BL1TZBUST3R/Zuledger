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
    Schema::create('groups', function (Blueprint $table) {
        $table->id();
        $table->foreignId('user_id')->constrained()->onDelete('cascade'); // Multi-user support
        
        // Parent ID allows infinite nesting (Assets -> Current Assets -> Cash)
        $table->foreignId('parent_id')->nullable()->constrained('groups')->onDelete('cascade');
        
        $table->string('name', 255);
        $table->string('code', 255)->nullable();
        
        // Webzash Logic: 1 = Affects Gross Profit (Trading), 0 = Affects Net Profit (P&L)
        $table->boolean('affects_gross')->default(0);
        
        $table->timestamps();
        
        // Prevent duplicate Group names for the same user
        $table->unique(['user_id', 'name']);
    });
}
    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('groups');
    }
};
