<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Makes description optional (nullable) on support_requests.
     */
    public function up(): void
    {
        DB::statement('ALTER TABLE support_requests MODIFY description TEXT NULL');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement('ALTER TABLE support_requests MODIFY description TEXT NOT NULL');
    }
};
