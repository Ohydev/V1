<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Creates the wishlists table to store wishlist items for logged-in End Users.
     * Allows users to save events they're interested in for later viewing.
     */
    public function up(): void
    {
        // Create wishlists table with InnoDB storage engine
        Schema::create('wishlists', function (Blueprint $table) {
            // Set storage engine to InnoDB for transaction support and foreign keys
            $table->engine = 'InnoDB';
            
            // Primary key: Unique identifier for each wishlist item
            $table->id('wishlist_id');
            
            // User ID: Foreign key to users table (End User who owns the wishlist), required
            // Links wishlist to logged-in user
            $table->unsignedBigInteger('user_id');
            
            // Event ID: Foreign key to events table (Event in wishlist), required
            // References the event being added to wishlist
            $table->unsignedBigInteger('event_id');
            
            // Timestamps: Laravel standard created_at and updated_at fields
            $table->timestamps();
            
            // Foreign key constraint: user_id references users.user_id
            // onDelete cascade: If user is deleted, delete all associated wishlist items
            $table->foreign('user_id')
                ->references('user_id')
                ->on('users')
                ->onDelete('cascade')
                ->onUpdate('cascade');
            
            // Foreign key constraint: event_id references events.event_id
            // onDelete cascade: If event is deleted, delete all associated wishlist items
            $table->foreign('event_id')
                ->references('event_id')
                ->on('events')
                ->onDelete('cascade')
                ->onUpdate('cascade');
            
            // Index on user_id for user's wishlist queries
            $table->index('user_id');
            
            // Index on event_id for foreign key queries
            $table->index('event_id');
            
            // Unique constraint on (user_id, event_id) to prevent duplicate wishlist items
            // If same event is added multiple times, prevent duplicate records
            $table->unique(['user_id', 'event_id']);
        });
    }

    /**
     * Reverse the migrations.
     * 
     * Drops the wishlists table if migration is rolled back.
     */
    public function down(): void
    {
        // Drop wishlists table if migration is rolled back
        Schema::dropIfExists('wishlists');
    }
};
