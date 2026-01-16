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
            $table->unsignedBigInteger('parent_id')->nullable(); // Allows sub-groups
            $table->string('name');
            $table->string('code')->nullable(); // Account Code (e.g., 1000)
            $table->timestamps();

            // This tells the DB that parent_id points to another group
            $table->foreign('parent_id')->references('id')->on('groups'); 
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
