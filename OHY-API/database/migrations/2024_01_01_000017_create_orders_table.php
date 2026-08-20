<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Creates the orders table to store order/purchase information when End Users
     * complete ticket purchases. Contains contact, payment, and billing information.
     */
    public function up(): void
    {
        // Create orders table with InnoDB storage engine
        Schema::create('orders', function (Blueprint $table) {
            // Set storage engine to InnoDB for transaction support and foreign keys
            $table->engine = 'InnoDB';

            // Primary key: Unique identifier for each order
            $table->id('order_id');

            // Order number: Order number (e.g., "ORD-001" or "OHY1763043605664592"), unique
            $table->string('order_number')->unique();

            // User ID: Foreign key to users table (End User who made the purchase), required
            $table->unsignedBigInteger('user_id');

            // Order status: Order status, ENUM with only 'completed' status for now, default 'completed'
            $table->enum('order_status', ['completed'])->default('completed');

            // Order date: Order date (for filtering/sorting), required
            $table->date('order_date');

            // Full name: Purchaser's full name, required
            $table->string('full_name');

            // Email: Purchaser's email, required
            $table->string('email');

            // Phone number: Purchaser's phone number, required
            $table->string('phone_number');

            // Street address: Street address, required
            $table->string('street_address');

            // City: City, required
            $table->string('city');

            // State: State/Province, required
            $table->string('state');

            // Zip code: ZIP/Postal code, required
            $table->string('zip_code');

            // Country ID: Foreign key to countries table (billing address country), required
            $table->unsignedBigInteger('country_id');

            // Card number: Encrypted card number, stored as VARCHAR (encryption handled in application layer)
            $table->string('card_number');

            // Expiry date: Encrypted expiry date (MM/YY format), stored as VARCHAR
            $table->string('expiry_date');

            // CVV: Encrypted CVV code, stored as VARCHAR
            $table->string('cvv');

            // Subtotal: Sum of all ticket prices, DECIMAL(10, 2) for precision, required
            $table->decimal('subtotal', 10, 2);

            // Service fee: Service fee (10% - skip calculation for now), nullable
            $table->decimal('service_fee', 10, 2)->nullable();

            // Coupon discount: Discount amount from applied coupon, nullable
            $table->decimal('coupon_discount', 10, 2)->nullable();

            // Total amount: Final amount paid, DECIMAL(10, 2) for precision, required
            $table->decimal('total_amount', 10, 2);

            // Coupon ID: Foreign key to coupons table (applied coupon if any), nullable
            $table->unsignedBigInteger('coupon_id')->nullable();

            // Timestamps: Laravel standard created_at and updated_at fields
            $table->timestamps();

            // Foreign key constraint: user_id references users.user_id
            $table->foreign('user_id')
                ->references('user_id')
                ->on('users')
                ->onDelete('restrict')
                ->onUpdate('cascade');

            // Foreign key constraint: country_id references countries.country_id
            $table->foreign('country_id')
                ->references('country_id')
                ->on('countries')
                ->onDelete('restrict')
                ->onUpdate('cascade');

            // Foreign key constraint: coupon_id references coupons.coupon_id
            // onDelete set null: If coupon is deleted, set coupon_id to null
            $table->foreign('coupon_id')
                ->references('coupon_id')
                ->on('coupons')
                ->onDelete('set null')
                ->onUpdate('cascade');

            // Index on user_id for user's order history queries
            $table->index('user_id');

            // Composite index on (order_date, created_at) for sorting and filtering
            $table->index(['order_date', 'created_at']);

            // Index on order_status for status filtering
            $table->index('order_status');

            // Index on coupon_id for foreign key queries
            $table->index('coupon_id');

            // Index on country_id for foreign key queries
            $table->index('country_id');
        });
    }

    /**
     * Reverse the migrations.
     *
     * Drops the orders table if migration is rolled back.
     */
    public function down(): void
    {
        // Drop orders table if migration is rolled back
        Schema::dropIfExists('orders');
    }
};
