<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Creates the businesses table to store business/company information for Event Hosts.
     * Both Business and Personal account types can have business information.
     */
    public function up(): void
    {
        // Create businesses table with InnoDB storage engine
        Schema::create('businesses', function (Blueprint $table) {
            // Set storage engine to InnoDB for transaction support and foreign keys
            $table->engine = 'InnoDB';
            
            // Primary key: Unique identifier for each business
            $table->id('business_id');
            
            // Business name: Business/company name, required
            $table->string('business_name');
            
            // Account type: Tracks original signup type of user who created this business
            // ENUM: 'business' or 'personal'
            $table->enum('account_type', ['business', 'personal']);
            
            // Business type: Type (e.g., "LLC", "Corporation", "Sole Proprietorship"), nullable
            $table->string('business_type')->nullable();
            
            // Industry: Industry category, nullable
            $table->string('industry')->nullable();
            
            // Company size: Company size (e.g., "1-10 employees", "11-50 employees"), nullable
            $table->string('company_size')->nullable();
            
            // Tax ID: Tax ID/EIN number, nullable
            $table->string('tax_id')->nullable();
            
            // Business street address: Street address, nullable
            $table->string('business_street_address')->nullable();
            
            // Business city: City, nullable
            $table->string('business_city')->nullable();
            
            // Business state: State/Province, nullable
            $table->string('business_state')->nullable();
            
            // Business zip code: ZIP/Postal code, nullable
            $table->string('business_zip_code')->nullable();
            
            // Business country ID: Foreign key to countries table, nullable
            $table->unsignedBigInteger('business_country_id')->nullable();
            
            // Timestamps: Laravel standard created_at and updated_at fields
            $table->timestamps();
            
            // Foreign key constraint: business_country_id references countries.country_id
            $table->foreign('business_country_id')
                ->references('country_id')
                ->on('countries')
                ->onDelete('restrict')
                ->onUpdate('cascade');
            
            // Index on business_country_id for foreign key queries
            $table->index('business_country_id');
            
            // Index on account_type for filtering by signup type
            $table->index('account_type');
        });
    }

    /**
     * Reverse the migrations.
     * 
     * Drops the businesses table if migration is rolled back.
     */
    public function down(): void
    {
        // Drop businesses table if migration is rolled back
        Schema::dropIfExists('businesses');
    }
};

