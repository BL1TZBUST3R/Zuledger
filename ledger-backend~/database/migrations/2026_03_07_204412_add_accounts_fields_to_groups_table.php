<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('groups', function (Blueprint $table) {
            $table->foreignId('ledger_id')->nullable()->constrained()->onDelete('cascade')->after('user_id');
            $table->string('account_type', 50)->nullable()->after('affects_gross');
            $table->string('account_subtype', 50)->nullable()->after('account_type');
            $table->string('cashflow_type', 50)->nullable()->after('account_subtype');
            $table->string('normal_balance', 2)->nullable()->after('cashflow_type');
        });
    }

    public function down(): void
    {
        Schema::table('groups', function (Blueprint $table) {
            $table->dropForeign(['ledger_id']);
            $table->dropColumn(['ledger_id', 'account_type', 'account_subtype', 'cashflow_type', 'normal_balance']);
        });
    }
};