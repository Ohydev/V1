<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Adds stripe_account_id column to host_users table to store Stripe Connected Account ID
     * for Express accounts. This field is nullable to support existing records and unique
     * to ensure one Stripe account per host user.
     */
    public function up(): void
    {
        Schema::table('host_users', function (Blueprint $table) {
            // Stripe account ID: Stripe Connected Account ID for Express accounts, nullable, unique
            // unique() constraint automatically creates an index for lookup performance
            $table->string('stripe_account_id')->nullable()->unique()->after('paypal_email');
        });
    }

    /**
     * Reverse the migrations.
     * 
     * Removes stripe_account_id column from host_users table.
     */
    public function down(): void
    {
        Schema::table('host_users', function (Blueprint $table) {
            // Drop unique constraint (which includes the index)
            $table->dropUnique(['stripe_account_id']);
            
            // Drop column
            $table->dropColumn('stripe_account_id');
        });
    }
};
