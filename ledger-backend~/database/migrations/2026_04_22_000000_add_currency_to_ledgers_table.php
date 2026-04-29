<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ledgers', function (Blueprint $table) {
            if (!Schema::hasColumn('ledgers', 'currency')) {
                $table->string('currency', 3)->default('USD')->after('date_format');
            }
        });
    }

    public function down(): void
    {
        Schema::table('ledgers', function (Blueprint $table) {
            if (Schema::hasColumn('ledgers', 'currency')) {
                $table->dropColumn('currency');
            }
        });
    }
};
