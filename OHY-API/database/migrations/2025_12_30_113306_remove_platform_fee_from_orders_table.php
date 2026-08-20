<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Removes platform_fee column from orders table.
     * Platform fee is now calculated on-the-fly during settlement based on net amount after Stripe fees.
     */
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn('platform_fee');
        });
    }

    /**
     * Reverse the migrations.
     *
     * Restores platform_fee column to orders table.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->decimal('platform_fee', 10, 2)->nullable()->after('subtotal');
        });
    }
};
