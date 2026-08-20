<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class EventCategoriesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * Seeds common event categories that will be used in dropdowns
     * during event creation and for filtering events.
     */
    public function run(): void
    {
        // Define array of event categories to seed
        $categories = [
            'Technology',
            'Music',
            'Sports',
            'Business',
            'Education',
            'Entertainment',
            'Arts & Culture',
            'Food & Drink',
            'Health & Wellness',
            'Fashion',
        ];

        // Loop through each category and insert into database
        foreach ($categories as $categoryName) {
            // Insert category into event_categories table
            DB::table('event_categories')->insert([
                'category_name' => $categoryName,
                'created_at' => now(), // Set current timestamp for created_at
                'updated_at' => now(), // Set current timestamp for updated_at
            ]);
        }
    }
}
