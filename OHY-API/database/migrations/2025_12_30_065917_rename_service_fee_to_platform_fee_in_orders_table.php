<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Renames service_fee column to platform_fee in orders table.
     * This better reflects that the fee is a platform fee deducted from host payout.
     */
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            // Rename service_fee column to platform_fee
            // Using raw SQL as Laravel's renameColumn may not work in all MySQL versions
            DB::statement("ALTER TABLE orders CHANGE service_fee platform_fee DECIMAL(10,2) NULL");
        });
    }

    /**
     * Reverse the migrations.
     * 
     * Renames platform_fee column back to service_fee.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            // Rename platform_fee column back to service_fee
            DB::statement("ALTER TABLE orders CHANGE platform_fee service_fee DECIMAL(10,2) NULL");
        });
    }
};
