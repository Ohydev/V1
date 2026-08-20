<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Creates the platform_fees table to store platform fee settings.
     * Supports global default fee (host_user_id = NULL) and host-specific fee overrides.
     */
    public function up(): void
    {
        // Create platform_fees table with InnoDB storage engine
        Schema::create('platform_fees', function (Blueprint $table) {
            // Set storage engine to InnoDB for transaction support and foreign keys
            $table->engine = 'InnoDB';
            
            // Primary key: Unique identifier for each platform fee record
            $table->id('id');
            
            // Host user ID: Foreign key to host_users table, nullable
            // NULL = Global/default platform fee (applies to all hosts without custom fees)
            // Has value = Host-specific fee override for that host
            $table->unsignedBigInteger('host_user_id')->nullable();
            
            // Fee type: Type of platform fee
            // ENUM: 'flat_rate' or 'percentage'
            $table->enum('fee_type', ['flat_rate', 'percentage']);
            
            // Fee value: Fee amount or percentage value
            // For flat_rate: Amount per ticket (e.g., 2.50 for $2.50 per ticket)
            // For percentage: Percentage value (e.g., 10.00 for 10%)
            $table->decimal('fee_value', 10, 2);
            
            // Updated by super admin ID: Foreign key to super_admins table, nullable
            // Tracks which super admin last updated this fee setting (audit trail)
            $table->unsignedBigInteger('updated_by_super_admin_id')->nullable();
            
            // Timestamps: Laravel standard created_at and updated_at fields
            $table->timestamps();
            
            // Foreign key constraint: host_user_id references host_users.host_user_id
            // onDelete set null: If host is deleted, set host_user_id to null (converts to global)
            // onUpdate cascade: If host_user_id changes, update this reference
            $table->foreign('host_user_id')
                ->references('host_user_id')
                ->on('host_users')
                ->onDelete('set null')
                ->onUpdate('cascade');
            
            // Foreign key constraint: updated_by_super_admin_id references super_admins.super_admin_id
            // onDelete set null: If super admin is deleted, set updated_by_super_admin_id to null
            // onUpdate cascade: If super_admin_id changes, update this reference
            $table->foreign('updated_by_super_admin_id')
                ->references('super_admin_id')
                ->on('super_admins')
                ->onDelete('set null')
                ->onUpdate('cascade');
            
            // Unique constraint on host_user_id
            // Allows one NULL value (global fee) and one row per host (host-specific fees)
            // MySQL allows multiple NULL values in unique constraints, but we'll only have one global fee
            $table->unique('host_user_id');
            
            // Index on host_user_id for lookup performance
            $table->index('host_user_id');
            
            // Index on updated_by_super_admin_id for audit queries
            $table->index('updated_by_super_admin_id');
        });
    }

    /**
     * Reverse the migrations.
     * 
     * Drops the platform_fees table if migration is rolled back.
     */
    public function down(): void
    {
        // Drop platform_fees table if migration is rolled back
        Schema::dropIfExists('platform_fees');
    }
};
