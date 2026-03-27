<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('groups', function (Blueprint $table) {
            if (!Schema::hasColumn('groups', 'ledger_id')) {
                $table->foreignId('ledger_id')->nullable()->constrained()->onDelete('cascade')->after('user_id');
            }
            if (!Schema::hasColumn('groups', 'account_type')) {
                $table->string('account_type', 50)->nullable()->after('affects_gross');
            }
            if (!Schema::hasColumn('groups', 'account_subtype')) {
                $table->string('account_subtype', 50)->nullable()->after('account_type');
            }
            if (!Schema::hasColumn('groups', 'cashflow_type')) {
                $table->string('cashflow_type', 50)->nullable()->after('account_subtype');
            }
            if (!Schema::hasColumn('groups', 'normal_balance')) {
                $table->string('normal_balance', 2)->nullable()->after('cashflow_type');
            }
        });

        try {
            Schema::table('groups', function (Blueprint $table) {
                $table->dropUnique('groups_user_id_name_unique');
            });
        } catch (\Exception $e) {
            // Constraint already dropped
        }

        try {
            Schema::table('groups', function (Blueprint $table) {
                $table->unique(['ledger_id', 'name']);
            });
        } catch (\Exception $e) {
            // Constraint already exists
        }
    }

    public function down(): void
    {
        Schema::table('groups', function (Blueprint $table) {
            $table->dropForeign(['ledger_id']);
            $table->dropColumn(['ledger_id', 'account_type', 'account_subtype', 'cashflow_type', 'normal_balance']);
        });
    }
};