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
            $table->foreignId('group_id')->constrained(); // Must belong to a Group
            $table->string('name');
            $table->string('code')->nullable();
            $table->decimal('op_balance', 25, 2)->default(0); // Opening Balance
            $table->char('op_balance_dc', 1)->default('D'); // D = Debit, C = Credit
            $table->timestamps();
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
