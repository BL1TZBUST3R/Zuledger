<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'mfa_enabled')) {
                $table->boolean('mfa_enabled')->default(false)->after('password');
            }
            if (!Schema::hasColumn('users', 'mfa_code_hash')) {
                $table->string('mfa_code_hash')->nullable()->after('mfa_enabled');
            }
            if (!Schema::hasColumn('users', 'mfa_code_expires_at')) {
                $table->timestamp('mfa_code_expires_at')->nullable()->after('mfa_code_hash');
            }
            if (!Schema::hasColumn('users', 'mfa_challenge')) {
                $table->string('mfa_challenge', 64)->nullable()->unique()->after('mfa_code_expires_at');
            }
            if (!Schema::hasColumn('users', 'mfa_attempts')) {
                $table->unsignedTinyInteger('mfa_attempts')->default(0)->after('mfa_challenge');
            }
            if (!Schema::hasColumn('users', 'mfa_code_sent_at')) {
                $table->timestamp('mfa_code_sent_at')->nullable()->after('mfa_attempts');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            foreach (['mfa_code_sent_at', 'mfa_attempts', 'mfa_challenge', 'mfa_code_expires_at', 'mfa_code_hash', 'mfa_enabled'] as $col) {
                if (Schema::hasColumn('users', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
