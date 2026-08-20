<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Creates the countries table to store country information with ISO codes,
     * names, and flag icons. Used for address fields and location selection.
     */
    public function up(): void
    {
        // Create countries table with InnoDB storage engine
        Schema::create('countries', function (Blueprint $table) {
            // Set storage engine to InnoDB for transaction support and foreign keys
            $table->engine = 'InnoDB';
            
            // Primary key: Unique identifier for each country
            $table->id('country_id');
            
            // ISO code: Two-letter ISO country code (e.g., "US", "GB", "IN"), required and unique
            $table->char('iso', 2)->unique();
            
            // Name: Common country name (e.g., "United States"), required
            $table->string('name', 80);
            
            // Nicename: User-friendly country name (e.g., "United States of America"), required
            $table->string('nicename', 80);
            
            // Flag icon: Path/URL to country flag icon, nullable
            $table->string('flag_icon', 1000)->nullable();
            
            // ISO3: Three-letter ISO code (e.g., "USA", "GBR"), nullable
            $table->char('iso3', 3)->nullable();
            
            // Numcode: Numeric country code, nullable
            $table->smallInteger('numcode')->nullable();
            
            // Phonecode: International dialing code (e.g., 1 for USA, 44 for UK), required
            $table->integer('phonecode');
            
            // Is deleted: Soft delete flag (0 = active, 1 = deleted), default 0
            $table->tinyInteger('is_deleted')->nullable()->default(0);
            
            // Timestamps: Laravel standard created_at and updated_at fields
            $table->timestamps();
            
            // Index on name for search functionality
            $table->index('name');
            
            // Index on is_deleted for filtering active countries
            $table->index('is_deleted');
        });
    }

    /**
     * Reverse the migrations.
     * 
     * Drops the countries table if migration is rolled back.
     */
    public function down(): void
    {
        // Drop countries table if migration is rolled back
        Schema::dropIfExists('countries');
    }
};

