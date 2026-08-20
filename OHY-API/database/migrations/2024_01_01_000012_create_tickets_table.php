<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Creates the tickets table to store ticket type information for events.
     * Defines pricing, availability, and purchase limits for each ticket type.
     */
    public function up(): void
    {
        // Create tickets table with InnoDB storage engine
        Schema::create('tickets', function (Blueprint $table) {
            // Set storage engine to InnoDB for transaction support and foreign keys
            $table->engine = 'InnoDB';

            // Primary key: Unique identifier for each ticket type
            $table->id('ticket_id');

            // Event ID: Foreign key to events table, required
            $table->unsignedBigInteger('event_id');

            // Ticket category ID: Foreign key to ticket_categories table, required
            $table->unsignedBigInteger('ticket_category_id');

            // Ticket type: Type of ticket
            // ENUM: 'single_entry', 'multiple_entry'
            // Note: Updated via migration 2025_11_15_015444_update_tickets_table_ticket_type_enum.php
            $table->enum('ticket_type', ['single_entry', 'table_ticket']);

            // Description: Description/tag (e.g., "Limited time offer"), nullable
            $table->string('description')->nullable();

            // Price: Ticket price (includes all taxes), DECIMAL(10, 2) for precision
            $table->decimal('price', 10, 2);

            // Total available: Total inventory for this ticket type, required
            $table->integer('total_available');

            // Sold quantity: Number of tickets sold, default 0
            // Incremented atomically when tickets are purchased (prevents over-selling)
            $table->integer('sold_quantity')->default(0);

            // Ticket info: Rich text description of what's included, nullable
            $table->text('ticket_info')->nullable();

            // Max per user: Maximum tickets a single user can purchase, required
            $table->integer('max_per_user');

            // Timestamps: Laravel standard created_at and updated_at fields
            $table->timestamps();

            // Foreign key constraint: event_id references events.event_id
            // onDelete cascade: If event is deleted, delete all associated tickets
            $table->foreign('event_id')
                ->references('event_id')
                ->on('events')
                ->onDelete('cascade')
                ->onUpdate('cascade');

            // Foreign key constraint: ticket_category_id references ticket_categories.ticket_category_id
            // onDelete cascade: If ticket category is deleted, delete associated tickets
            $table->foreign('ticket_category_id')
                ->references('ticket_category_id')
                ->on('ticket_categories')
                ->onDelete('cascade')
                ->onUpdate('cascade');

            // Index on event_id for foreign key queries
            $table->index('event_id');

            // Index on ticket_category_id for foreign key queries
            $table->index('ticket_category_id');

            // Composite index on (total_available, sold_quantity) for availability queries
            $table->index(['total_available', 'sold_quantity']);
        });
    }

    /**
     * Reverse the migrations.
     *
     * Drops the tickets table if migration is rolled back.
     */
    public function down(): void
    {
        // Drop tickets table if migration is rolled back
        Schema::dropIfExists('tickets');
    }
};
