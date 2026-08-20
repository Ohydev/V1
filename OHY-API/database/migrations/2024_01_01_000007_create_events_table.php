<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Creates the events table to store all event information. This is the main
     * entity that ties together all event-related data (tickets, venue, media, artists, etc.).
     */
    public function up(): void
    {
        // Create events table with InnoDB storage engine
        Schema::create('events', function (Blueprint $table) {
            // Set storage engine to InnoDB for transaction support and foreign keys
            $table->engine = 'InnoDB';

            // Primary key: Unique identifier for each event
            $table->id('event_id');

            // Host user ID: Foreign key to host_users table, required
            // Event creator/owner
            $table->unsignedBigInteger('host_user_id');

            // Event title: Event name/title
            $table->string('event_title');

            // Description: Rich text description (HTML/JSON format to preserve formatting)
            $table->text('description');

            // Event category ID: Foreign key to event_categories table, required
            $table->unsignedBigInteger('event_category_id');

            // Start date: Event start date, required
            $table->date('start_date');

            // End date: Event end date, required
            $table->date('end_date');

            // Start time: Event start time, required
            $table->time('start_time');

            // End time: Event end time, required
            $table->time('end_time');

            // Key highlights: Rich text field for event highlights/bullet points, nullable
            $table->text('key_highlights')->nullable();

            // Is draft: Draft status flag, default true
            // Draft: is_draft = true, is_published = false (only visible to Event Host)
            $table->boolean('is_draft')->default(true);

            // Is published: Published status flag, default false
            // Published: is_draft = false, is_published = true (visible to End Users)
            $table->boolean('is_published')->default(false);

            // Timestamps: Laravel standard created_at and updated_at fields
            $table->timestamps();

            // Foreign key constraint: host_user_id references host_users.host_user_id
            $table->foreign('host_user_id')
                ->references('host_user_id')
                ->on('host_users')
                ->onDelete('restrict')
                ->onUpdate('cascade');

            // Foreign key constraint: event_category_id references event_categories.event_category_id
            $table->foreign('event_category_id')
                ->references('event_category_id')
                ->on('event_categories')
                ->onDelete('restrict')
                ->onUpdate('cascade');

            // Index on host_user_id for filtering by host
            $table->index('host_user_id');

            // Composite index on (is_published, is_draft) for status filtering
            $table->index(['is_published', 'is_draft']);

            // Composite index on (start_date, end_date) for date range queries and status calculation
            $table->index(['start_date', 'end_date']);

            // Index on event_category_id for category filtering
            $table->index('event_category_id');

            // Fulltext index on (event_title, description) for search functionality
            $table->fullText(['event_title', 'description']);
        });
    }

    /**
     * Reverse the migrations.
     *
     * Drops the events table if migration is rolled back.
     */
    public function down(): void
    {
        // Drop events table if migration is rolled back
        Schema::dropIfExists('events');
    }
};
