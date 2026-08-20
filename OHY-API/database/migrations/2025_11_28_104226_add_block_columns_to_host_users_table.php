<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('host_users', function (Blueprint $table) {
            // Add boolean column to flag whether a host is blocked by super admin
            $table->boolean('is_blocked')->default(false)->after('paypal_email');
            // Add nullable string column to capture block reason provided by super admin
            $table->string('blocked_reason')->nullable()->after('is_blocked');
            // Add nullable foreign key column to track which super admin performed the block action
            $table->unsignedBigInteger('blocked_by_super_admin_id')->nullable()->after('blocked_reason');
            // Add nullable timestamp column to capture when the block action occurred
            $table->timestamp('blocked_at')->nullable()->after('blocked_by_super_admin_id');

            // Define foreign key constraint linking to super_admins table for audit trail
            $table->foreign('blocked_by_super_admin_id')
                ->references('super_admin_id')
                ->on('super_admins')
                ->onDelete('set null')
                ->onUpdate('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('host_users', function (Blueprint $table) {
            // Drop foreign key constraint before removing the referencing column
            $table->dropForeign(['blocked_by_super_admin_id']);

            // Remove the block metadata columns added in the up() migration
            $table->dropColumn([
                'is_blocked',
                'blocked_reason',
                'blocked_by_super_admin_id',
                'blocked_at',
            ]);
        });
    }
};
