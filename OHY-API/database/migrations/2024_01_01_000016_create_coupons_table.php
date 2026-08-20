<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Creates the coupons table to store discount coupons for events.
     * Coupons can be percentage-based or flat discount.
     */
    public function up(): void
    {
        // Create coupons table with InnoDB storage engine
        Schema::create('coupons', function (Blueprint $table) {
            // Set storage engine to InnoDB for transaction support and foreign keys
            $table->engine = 'InnoDB';
            
            // Primary key: Unique identifier for each coupon
            $table->id('coupon_id');
            
            // Event ID: Foreign key to events table, required
            $table->unsignedBigInteger('event_id');
            
            // Coupon code: Coupon code (e.g., "EARLY20", "STUDENT50"), required and globally unique
            $table->string('coupon_code')->unique();
            
            // Discount type: Type of discount
            // ENUM: 'percentage' or 'flat'
            $table->enum('discount_type', ['percentage', 'flat']);
            
            // Discount percent: Discount percentage (e.g., 20.00 for 20%), nullable (for percentage type)
            $table->decimal('discount_percent', 5, 2)->nullable();
            
            // Flat discount amount: Fixed discount amount (e.g., 50.00 for $50 off), nullable (for flat type)
            $table->decimal('flat_discount_amount', 10, 2)->nullable();
            
            // Max cap discount: Maximum discount amount cap, nullable (for percentage type)
            $table->decimal('max_cap_discount', 10, 2)->nullable();
            
            // Max times applicable: Maximum number of times coupon can be used, required
            $table->integer('max_times_applicable');
            
            // Start date: Coupon validity start date, required
            $table->date('start_date');
            
            // End date: Coupon validity end date, nullable (optional)
            $table->date('end_date')->nullable();
            
            // Times used: Number of times coupon has been used, default 0
            // Incremented atomically when coupon is applied successfully
            $table->integer('times_used')->default(0);
            
            // Timestamps: Laravel standard created_at and updated_at fields
            $table->timestamps();
            
            // Foreign key constraint: event_id references events.event_id
            // onDelete cascade: If event is deleted, delete all associated coupons
            $table->foreign('event_id')
                ->references('event_id')
                ->on('events')
                ->onDelete('cascade')
                ->onUpdate('cascade');
            
            // Index on event_id for foreign key queries
            $table->index('event_id');
            
            // Composite index on (start_date, end_date) for validity queries
            $table->index(['start_date', 'end_date']);
            
            // Composite index on (event_id, start_date, end_date, times_used) for validation queries
            $table->index(['event_id', 'start_date', 'end_date', 'times_used']);
        });
    }

    /**
     * Reverse the migrations.
     * 
     * Drops the coupons table if migration is rolled back.
     */
    public function down(): void
    {
        // Drop coupons table if migration is rolled back
        Schema::dropIfExists('coupons');
    }
};

