<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Creates the event_social_media table to store social media links for events.
     * Each event can have links to multiple social platforms.
     */
    public function up(): void
    {
        // Create event_social_media table with InnoDB storage engine
        Schema::create('event_social_media', function (Blueprint $table) {
            // Set storage engine to InnoDB for transaction support and foreign keys
            $table->engine = 'InnoDB';
            
            // Primary key: Unique identifier for each social media link
            $table->id('event_social_media_id');
            
            // Event ID: Foreign key to events table, required
            $table->unsignedBigInteger('event_id');
            
            // Platform: Social media platform
            // ENUM: 'facebook', 'instagram', 'tiktok', 'linkedin', 'snapchat', 'twitter', 'youtube'
            $table->enum('platform', ['facebook', 'instagram', 'tiktok', 'linkedin', 'snapchat', 'twitter', 'youtube']);
            
            // URL: Full URL to social media profile/page
            $table->string('url');
            
            // Timestamps: Laravel standard created_at and updated_at fields
            $table->timestamps();
            
            // Foreign key constraint: event_id references events.event_id
            // onDelete cascade: If event is deleted, delete all associated social media links
            $table->foreign('event_id')
                ->references('event_id')
                ->on('events')
                ->onDelete('cascade')
                ->onUpdate('cascade');
            
            // Index on event_id for foreign key queries
            $table->index('event_id');
            
            // Unique constraint on (event_id, platform) to prevent duplicate platforms per event
            $table->unique(['event_id', 'platform']);
        });
    }

    /**
     * Reverse the migrations.
     * 
     * Drops the event_social_media table if migration is rolled back.
     */
    public function down(): void
    {
        // Drop event_social_media table if migration is rolled back
        Schema::dropIfExists('event_social_media');
    }
};

