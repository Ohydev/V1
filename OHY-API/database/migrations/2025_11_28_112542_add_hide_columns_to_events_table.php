<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Adds columns to track when events are hidden by super admin.
     * Hidden events are excluded from public listings but remain visible to event hosts.
     */
    public function up(): void
    {
        Schema::table('events', function (Blueprint $table) {
            // Add boolean column to flag whether an event is hidden by super admin
            $table->boolean('is_hidden_by_admin')->default(false)->after('is_published');
            // Add nullable text column to capture hide reason provided by super admin
            $table->text('hidden_reason')->nullable()->after('is_hidden_by_admin');
            // Add nullable foreign key column to track which super admin performed the hide action
            $table->unsignedBigInteger('hidden_by_super_admin_id')->nullable()->after('hidden_reason');
            // Add nullable timestamp column to capture when the hide action occurred
            $table->timestamp('hidden_at')->nullable()->after('hidden_by_super_admin_id');

            // Define foreign key constraint linking to super_admins table for audit trail
            $table->foreign('hidden_by_super_admin_id')
                ->references('super_admin_id')
                ->on('super_admins')
                ->onDelete('set null')
                ->onUpdate('cascade');

            // Add index on is_hidden_by_admin for query performance when filtering public events
            $table->index('is_hidden_by_admin');
        });
    }

    /**
     * Reverse the migrations.
     * 
     * Removes the hide metadata columns from events table.
     */
    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            // Drop foreign key constraint before removing the referencing column
            $table->dropForeign(['hidden_by_super_admin_id']);

            // Drop index on is_hidden_by_admin
            $table->dropIndex(['is_hidden_by_admin']);

            // Remove the hide metadata columns added in the up() migration
            $table->dropColumn([
                'is_hidden_by_admin',
                'hidden_reason',
                'hidden_by_super_admin_id',
                'hidden_at',
            ]);
        });
    }
};
