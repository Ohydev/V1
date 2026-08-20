<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Creates the artist_social_media table to store social media links for artists/speakers.
     * Each artist can have links to multiple social platforms.
     */
    public function up(): void
    {
        // Create artist_social_media table with InnoDB storage engine
        Schema::create('artist_social_media', function (Blueprint $table) {
            // Set storage engine to InnoDB for transaction support and foreign keys
            $table->engine = 'InnoDB';

            // Primary key: Unique identifier for each social media link
            $table->id('artist_social_media_id');

            // Event artist ID: Foreign key to event_artists table, required
            $table->unsignedBigInteger('event_artist_id');

            // Platform: Social media platform
            // ENUM: 'facebook', 'instagram', 'tiktok', 'linkedin', 'snapchat', 'twitter', 'youtube', 'spotify'
            $table->enum('platform', ['facebook', 'instagram', 'tiktok', 'linkedin', 'snapchat', 'twitter', 'youtube', 'spotify']);

            // URL: Full URL to social media profile
            $table->string('url');

            // Timestamps: Laravel standard created_at and updated_at fields
            $table->timestamps();

            // Foreign key constraint: event_artist_id references event_artists.event_artist_id
            // onDelete cascade: If artist is deleted, delete all associated social media links
            $table->foreign('event_artist_id')
                ->references('event_artist_id')
                ->on('event_artists')
                ->onDelete('cascade')
                ->onUpdate('cascade');

            // Index on event_artist_id for foreign key queries
            $table->index('event_artist_id');

            // Unique constraint on (event_artist_id, platform) to prevent duplicate platforms per artist
            $table->unique(['event_artist_id', 'platform']);
        });
    }

    /**
     * Reverse the migrations.
     *
     * Drops the artist_social_media table if migration is rolled back.
     */
    public function down(): void
    {
        // Drop artist_social_media table if migration is rolled back
        Schema::dropIfExists('artist_social_media');
    }
};
