<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Updates the ticket_type ENUM in tickets table from 'table_ticket' to 'multiple_entry'.
     * This change reflects the updated ticket type naming convention.
     */
    public function up(): void
    {
        // Step 1: First, add 'multiple_entry' to the ENUM (keeping 'table_ticket' temporarily)
        // This allows us to update existing 'table_ticket' values to 'multiple_entry'
        // ENUM now includes: 'single_entry', 'table_ticket', 'multiple_entry'
        DB::statement("ALTER TABLE `tickets` MODIFY COLUMN `ticket_type` ENUM('single_entry', 'table_ticket', 'multiple_entry') NOT NULL");

        // Step 2: Update any existing records that have 'table_ticket' value to 'multiple_entry'
        // Now that 'multiple_entry' is in the ENUM, we can safely update the data
        DB::table('tickets')
            ->where('ticket_type', 'table_ticket')
            ->update(['ticket_type' => 'multiple_entry']);

        // Step 3: Remove 'table_ticket' from ENUM, keeping only 'single_entry' and 'multiple_entry'
        // All existing data now has valid values ('single_entry' or 'multiple_entry')
        DB::statement("ALTER TABLE `tickets` MODIFY COLUMN `ticket_type` ENUM('single_entry', 'multiple_entry') NOT NULL");
    }

    /**
     * Reverse the migrations.
     *
     * Reverts the ticket_type ENUM back to original values if migration is rolled back.
     */
    public function down(): void
    {
        // Revert ticket_type ENUM back to original values
        // First update any 'multiple_entry' records back to 'table_ticket'
        DB::table('tickets')
            ->where('ticket_type', 'multiple_entry')
            ->update(['ticket_type' => 'table_ticket']);

        // Revert ENUM definition back to original
        DB::statement("ALTER TABLE `tickets` MODIFY COLUMN `ticket_type` ENUM('single_entry', 'table_ticket') NOT NULL");
    }
};
