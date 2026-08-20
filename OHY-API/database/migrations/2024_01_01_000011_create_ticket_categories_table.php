<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Creates the ticket_categories table to store ticket categories for each event.
     * Categories are event-specific (not reusable across events).
     */
    public function up(): void
    {
        // Create ticket_categories table with InnoDB storage engine
        Schema::create('ticket_categories', function (Blueprint $table) {
            // Set storage engine to InnoDB for transaction support and foreign keys
            $table->engine = 'InnoDB';

            // Primary key: Unique identifier for each ticket category
            $table->id('ticket_category_id');

            // Event ID: Foreign key to events table, required
            $table->unsignedBigInteger('event_id');

            // Category name: Category name (e.g., "Early Bird", "Regular", "VIP"), required
            $table->string('category_name');

            // Timestamps: Laravel standard created_at and updated_at fields
            $table->timestamps();

            // Foreign key constraint: event_id references events.event_id
            // onDelete cascade: If event is deleted, delete all associated ticket categories
            $table->foreign('event_id')
                ->references('event_id')
                ->on('events')
                ->onDelete('cascade')
                ->onUpdate('cascade');

            // Index on event_id for foreign key queries
            $table->index('event_id');
        });
    }

    /**
     * Reverse the migrations.
     *
     * Drops the ticket_categories table if migration is rolled back.
     */
    public function down(): void
    {
        // Drop ticket_categories table if migration is rolled back
        Schema::dropIfExists('ticket_categories');
    }
};
