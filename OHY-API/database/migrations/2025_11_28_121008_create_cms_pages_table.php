<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Creates the cms_pages table to store CMS content pages (Terms & Conditions,
     * Privacy Policy, Legal Terms, etc.) that appear in the footer of both
     * User (Event) Module and Event Host Module.
     */
    public function up(): void
    {
        // Create cms_pages table with InnoDB storage engine
        Schema::create('cms_pages', function (Blueprint $table) {
            // Set storage engine to InnoDB for transaction support
            $table->engine = 'InnoDB';

            // Primary key: Unique identifier for each CMS page
            $table->id('cms_page_id');

            // Title: CMS page title (e.g., "Terms & Conditions", "Privacy Policy")
            // Must be unique and not null
            $table->string('title', 255)->unique();

            // Slug: URL-friendly identifier (e.g., "terms-and-conditions", "privacy-policy")
            // Must be unique and not null
            $table->string('slug', 255)->unique();

            // Content: Rich text content from WYSIWYG editor (HTML format)
            // Stored as TEXT to support large content
            $table->text('content');

            // Is Active: Status flag to enable/disable page visibility
            // Default is true (active)
            $table->boolean('is_active')->default(true);

            // Timestamps: Laravel standard created_at and updated_at fields
            $table->timestamps();

            // Index on is_active for filtering active pages efficiently
            $table->index('is_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cms_pages');
    }
};
