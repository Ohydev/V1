<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Adds columns to track when events are marked as featured by super admin.
     * Featured events appear in a separate section on the End User homepage.
     */
    public function up(): void
    {
        Schema::table('events', function (Blueprint $table) {
            // Add boolean column to flag whether an event is featured by super admin
            $table->boolean('is_featured')->default(false)->after('is_hidden_by_admin');
            // Add nullable foreign key column to track which super admin performed the feature action
            $table->unsignedBigInteger('featured_by_super_admin_id')->nullable()->after('is_featured');
            // Add nullable timestamp column to capture when the feature action occurred
            $table->timestamp('featured_at')->nullable()->after('featured_by_super_admin_id');

            // Define foreign key constraint linking to super_admins table for audit trail
            $table->foreign('featured_by_super_admin_id')
                ->references('super_admin_id')
                ->on('super_admins')
                ->onDelete('set null')
                ->onUpdate('cascade');

            // Add index on is_featured for query performance when filtering featured events
            $table->index('is_featured');
        });
    }

    /**
     * Reverse the migrations.
     *
     * Removes the featured metadata columns from events table.
     */
    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            // Drop foreign key constraint before removing the referencing column
            $table->dropForeign(['featured_by_super_admin_id']);

            // Drop index on is_featured
            $table->dropIndex(['is_featured']);

            // Remove the featured metadata columns added in the up() migration
            $table->dropColumn([
                'is_featured',
                'featured_by_super_admin_id',
                'featured_at',
            ]);
        });
    }
};
