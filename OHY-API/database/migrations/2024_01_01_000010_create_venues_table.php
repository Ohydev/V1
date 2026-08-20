<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Creates the venues table to store venue/location information for events.
     * One venue per event (one-to-one relationship).
     */
    public function up(): void
    {
        // Create venues table with InnoDB storage engine
        Schema::create('venues', function (Blueprint $table) {
            // Set storage engine to InnoDB for transaction support and foreign keys
            $table->engine = 'InnoDB';

            // Primary key: Unique identifier for each venue
            $table->id('venue_id');

            // Event ID: Foreign key to events table, required and unique (one venue per event)
            $table->unsignedBigInteger('event_id')->unique();

            // Venue name: Venue name (e.g., "Madison Square Garden"), required
            $table->string('venue_name');

            // Venue address: Full street address, required
            $table->string('venue_address');

            // City: City name, required
            $table->string('city');

            // State province: State or Province, required
            $table->string('state_province');

            // Postal code: ZIP/Postal code, required
            $table->string('postal_code');

            // Country ID: Foreign key to countries table, required
            $table->unsignedBigInteger('country_id');

            // Latitude: Latitude for map pinning, DECIMAL(10, 8) for precision
            // Range: -90 to 90
            $table->decimal('latitude', 10, 8);

            // Longitude: Longitude for map pinning, DECIMAL(11, 8) for precision
            // Range: -180 to 180
            $table->decimal('longitude', 11, 8);

            // Additional details: Room number, floor, parking, accessibility details, nullable
            $table->text('additional_details')->nullable();

            // Maximum attendees: Maximum number of people who can attend, required
            $table->integer('maximum_attendees');

            // Venue image: File path to venue image, nullable
            $table->string('venue_image')->nullable();

            // Timestamps: Laravel standard created_at and updated_at fields
            $table->timestamps();

            // Foreign key constraint: event_id references events.event_id
            // onDelete cascade: If event is deleted, delete associated venue
            $table->foreign('event_id')
                ->references('event_id')
                ->on('events')
                ->onDelete('cascade')
                ->onUpdate('cascade');

            // Foreign key constraint: country_id references countries.country_id
            $table->foreign('country_id')
                ->references('country_id')
                ->on('countries')
                ->onDelete('restrict')
                ->onUpdate('cascade');

            // Index on country_id for foreign key queries
            $table->index('country_id');

            // Composite index on (latitude, longitude) for location-based queries
            $table->index(['latitude', 'longitude']);
        });
    }

    /**
     * Reverse the migrations.
     *
     * Drops the venues table if migration is rolled back.
     */
    public function down(): void
    {
        // Drop venues table if migration is rolled back
        Schema::dropIfExists('venues');
    }
};
