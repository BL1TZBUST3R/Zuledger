<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('users')->where('mfa_enabled', false)->update(['mfa_enabled' => true]);
    }

    public function down(): void
    {
        // Intentionally a no-op — we don't want to silently turn MFA off for
        // accounts whose owners have since enrolled.
    }
};
