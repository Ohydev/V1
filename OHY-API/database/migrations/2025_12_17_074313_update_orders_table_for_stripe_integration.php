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
     * Updates orders table for Stripe integration:
     * 1. Migrates existing 'completed' orders to 'paid' status
     * 2. Modifies order_status enum to include new statuses
     * 3. Adds Stripe-related fields (checkout session, payment intent, transfer IDs, settled_at)
     * 4. Removes PCI-sensitive card fields (card_number, expiry_date, cvv)
     */
    public function up(): void
    {
        // Step 1: Migrate existing 'completed' orders to 'paid' status
        // This must be done before modifying the enum
        DB::table('orders')
            ->where('order_status', 'completed')
            ->update(['order_status' => 'paid']);
        
        // Step 2: Modify order_status enum to include new statuses
        // MySQL requires MODIFY COLUMN for enum changes
        DB::statement("ALTER TABLE orders MODIFY COLUMN order_status ENUM('pending_payment', 'paid', 'settled', 'failed') NOT NULL DEFAULT 'pending_payment'");
        
        // Step 3: Add new Stripe-related fields
        Schema::table('orders', function (Blueprint $table) {
            // Stripe checkout session ID: Session ID from Stripe Checkout, nullable, indexed
            $table->string('stripe_checkout_session_id')->nullable()->after('coupon_id');
            
            // Stripe payment intent ID: Payment Intent ID from Stripe, nullable, indexed
            $table->string('stripe_payment_intent_id')->nullable()->after('stripe_checkout_session_id');
            
            // Stripe transfer ID: Transfer ID for payouts to hosts, nullable, indexed
            $table->string('stripe_transfer_id')->nullable()->after('stripe_payment_intent_id');
            
            // Settled at: Timestamp when order was settled (payout completed), nullable
            $table->timestamp('settled_at')->nullable()->after('stripe_transfer_id');
            
            // Step 4: Remove PCI-sensitive card fields
            // These fields are no longer needed with Stripe handling payments
            $table->dropColumn(['card_number', 'expiry_date', 'cvv']);
        });
        
        // Add indexes for Stripe fields after columns are created
        Schema::table('orders', function (Blueprint $table) {
            // Index on stripe_checkout_session_id for webhook lookups
            $table->index('stripe_checkout_session_id');
            
            // Index on stripe_payment_intent_id for payment tracking
            $table->index('stripe_payment_intent_id');
            
            // Index on stripe_transfer_id for settlement tracking
            $table->index('stripe_transfer_id');
        });
    }

    /**
     * Reverse the migrations.
     * 
     * Restores orders table to original state:
     * 1. Restores original enum with 'completed' status
     * 2. Migrates 'paid' orders back to 'completed'
     * 3. Removes Stripe-related fields
     * 4. Adds back card fields (empty, nullable)
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            // Drop indexes first
            $table->dropIndex(['stripe_checkout_session_id']);
            $table->dropIndex(['stripe_payment_intent_id']);
            $table->dropIndex(['stripe_transfer_id']);
            
            // Remove Stripe-related fields
            $table->dropColumn([
                'stripe_checkout_session_id',
                'stripe_payment_intent_id',
                'stripe_transfer_id',
                'settled_at'
            ]);
            
            // Add back card fields (nullable for rollback safety)
            $table->string('card_number')->nullable()->after('country_id');
            $table->string('expiry_date')->nullable()->after('card_number');
            $table->string('cvv')->nullable()->after('expiry_date');
        });
        
        // Restore original enum and migrate data back
        // Migrate 'paid' orders back to 'completed' before enum change
        DB::table('orders')
            ->where('order_status', 'paid')
            ->update(['order_status' => 'completed']);
        
        // Restore original enum
        DB::statement("ALTER TABLE orders MODIFY COLUMN order_status ENUM('completed') NOT NULL DEFAULT 'completed'");
    }
};
