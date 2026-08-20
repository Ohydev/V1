<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Adds stripe_fee column to orders table to store Stripe processing fees.
     */
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            // Stripe fee: Actual Stripe processing fee charged per order, nullable
            // Positioned after stripe_payment_intent_id
            $table->decimal('stripe_fee', 10, 2)->nullable()->after('stripe_payment_intent_id');
        });
    }

    /**
     * Reverse the migrations.
     *
     * Removes stripe_fee column from orders table.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn('stripe_fee');
        });
    }
};
