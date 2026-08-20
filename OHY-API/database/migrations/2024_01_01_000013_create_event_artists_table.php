<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Creates the event_artists table to store artist/speaker information for events.
     * Each event can have multiple artists.
     */
    public function up(): void
    {
        // Create event_artists table with InnoDB storage engine
        Schema::create('event_artists', function (Blueprint $table) {
            // Set storage engine to InnoDB for transaction support and foreign keys
            $table->engine = 'InnoDB';

            // Primary key: Unique identifier for each artist
            $table->id('event_artist_id');

            // Event ID: Foreign key to events table, required
            $table->unsignedBigInteger('event_id');

            // Artist name: Name of the artist/speaker, required
            $table->string('artist_name');

            // Artist image: File path to artist image, nullable
            $table->string('artist_image')->nullable();

            // Timestamps: Laravel standard created_at and updated_at fields
            $table->timestamps();

            // Foreign key constraint: event_id references events.event_id
            // onDelete cascade: If event is deleted, delete all associated artists
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
     * Drops the event_artists table if migration is rolled back.
     */
    public function down(): void
    {
        // Drop event_artists table if migration is rolled back
        Schema::dropIfExists('event_artists');
    }
};
