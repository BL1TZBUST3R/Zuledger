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
        Schema::create('entries', function (Blueprint $table) {
            $table->id();
            $table->integer('number')->nullable(); // Entry Number (e.g., #001)
            $table->date('date');
            $table->text('narration')->nullable(); // Description (e.g., "Payment for hosting")
            $table->integer('entrytype_id'); // 1=Receipt, 2=Payment, 3=Journal, etc.
            $table->timestamps();
        });
    }
    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('entries');
    }
};
