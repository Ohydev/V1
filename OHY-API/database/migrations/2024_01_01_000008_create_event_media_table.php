<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Creates the event_media table to store all media files associated with events
     * (thumbnails, banners, flyers, videos). Supports multiple files per media type.
     */
    public function up(): void
    {
        // Create event_media table with InnoDB storage engine
        Schema::create('event_media', function (Blueprint $table) {
            // Set storage engine to InnoDB for transaction support and foreign keys
            $table->engine = 'InnoDB';

            // Primary key: Unique identifier for each media file
            $table->id('event_media_id');

            // Event ID: Foreign key to events table, required
            $table->unsignedBigInteger('event_id');

            // Media type: Type of media
            // ENUM: 'thumbnail', 'banner', 'flyer', 'video'
            $table->enum('media_type', ['thumbnail', 'banner', 'flyer', 'video']);

            // File path: Path to file in storage/public directory
            $table->string('file_path');

            // File name: Original filename
            $table->string('file_name');

            // File size: File size in bytes, nullable
            $table->integer('file_size')->nullable();

            // Video duration: Video duration (format: "2:30"), nullable, only for videos
            $table->string('video_duration')->nullable();

            // Timestamps: Laravel standard created_at and updated_at fields
            $table->timestamps();

            // Foreign key constraint: event_id references events.event_id
            // onDelete cascade: If event is deleted, delete all associated media
            $table->foreign('event_id')
                ->references('event_id')
                ->on('events')
                ->onDelete('cascade')
                ->onUpdate('cascade');

            // Index on event_id for foreign key queries
            $table->index('event_id');

            // Composite index on (event_id, media_type) for filtering by type
            $table->index(['event_id', 'media_type']);
        });
    }

    /**
     * Reverse the migrations.
     *
     * Drops the event_media table if migration is rolled back.
     */
    public function down(): void
    {
        // Drop event_media table if migration is rolled back
        Schema::dropIfExists('event_media');
    }
};
