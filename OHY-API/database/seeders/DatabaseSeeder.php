<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     *
     * Orchestrates all seeders in the correct dependency order:
     * 1. Master data (countries, event categories)
     * 2. Event Host 1 - Business account (host, events)
     * 3. Event Host 2 - Personal account (host, events)
     * 4. End Users (users, orders, carts)
     */
    public function run(): void
    {
        // Phase 0: Super Admin
        // Ensure platform owner credentials exist for authentication
        $this->call(SuperAdminSeeder::class);

        // Phase 1: Master Data Seeders
        // Seed countries table with all country data from SQL file
        $this->call(CountriesSeeder::class);

        // Seed event categories table with common categories
        $this->call(EventCategoriesSeeder::class);

        // Seed business intersections lookup (e.g. Woman-owned, Others)
        $this->call(BusinessIntersectionsSeeder::class);

        // Phase 2: Event Host 1 - Business Account
        // Create Business account Event Host with complete profile
        $this->call(BusinessAccountHostSeeder::class);

        // Create 4 complete events for Business account host
        $this->call(BusinessAccountEventsSeeder::class);

        // Phase 3: Event Host 2 - Personal Account
        // Create Personal account Event Host with complete profile
        $this->call(PersonalAccountHostSeeder::class);

        // Create 4 complete events for Personal account host
        $this->call(PersonalAccountEventsSeeder::class);

        // Phase 4: End Users
        // Create 10 end users with profiles, orders, and cart items
        $this->call(EndUsersSeeder::class);
    }
}
