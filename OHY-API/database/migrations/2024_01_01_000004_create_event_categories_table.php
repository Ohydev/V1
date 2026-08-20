<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Creates the event_categories table to store all available event categories.
     * Used in dropdowns during event creation and filtering.
     */
    public function up(): void
    {
        // Create event_categories table with InnoDB storage engine
        Schema::create('event_categories', function (Blueprint $table) {
            // Set storage engine to InnoDB for transaction support and foreign keys
            $table->engine = 'InnoDB';

            // Primary key: Unique identifier for each category
            $table->id('event_category_id');

            // Category name: Category name (e.g., "Technology", "Music", "Sports"), must be unique
            $table->string('category_name')->unique();

            // Timestamps: Laravel standard created_at and updated_at fields
            $table->timestamps();

            // Index on category_name for search/filtering
            $table->index('category_name');
        });
    }

    /**
     * Reverse the migrations.
     *
     * Drops the event_categories table if migration is rolled back.
     */
    public function down(): void
    {
        // Drop event_categories table if migration is rolled back
        Schema::dropIfExists('event_categories');
    }
};
