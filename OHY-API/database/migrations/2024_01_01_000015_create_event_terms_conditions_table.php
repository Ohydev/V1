<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Creates the event_terms_conditions table to store terms and conditions for each event.
     * One terms document per event (one-to-one relationship).
     */
    public function up(): void
    {
        // Create event_terms_conditions table with InnoDB storage engine
        Schema::create('event_terms_conditions', function (Blueprint $table) {
            // Set storage engine to InnoDB for transaction support and foreign keys
            $table->engine = 'InnoDB';

            // Primary key: Unique identifier for each terms document
            $table->id('event_terms_id');

            // Event ID: Foreign key to events table, required and unique (one terms per event)
            $table->unsignedBigInteger('event_id')->unique();

            // Terms content: Rich text content (HTML/JSON format to preserve formatting), required
            $table->text('terms_content');

            // Timestamps: Laravel standard created_at and updated_at fields
            $table->timestamps();

            // Foreign key constraint: event_id references events.event_id
            // onDelete cascade: If event is deleted, delete associated terms
            $table->foreign('event_id')
                ->references('event_id')
                ->on('events')
                ->onDelete('cascade')
                ->onUpdate('cascade');
        });
    }

    /**
     * Reverse the migrations.
     *
     * Drops the event_terms_conditions table if migration is rolled back.
     */
    public function down(): void
    {
        // Drop event_terms_conditions table if migration is rolled back
        Schema::dropIfExists('event_terms_conditions');
    }
};
