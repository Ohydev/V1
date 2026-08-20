<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class BusinessIntersectionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * Seeds business_intersections lookup table. Last row is "Others".
     */
    public function run(): void
    {
        $intersections = [
            'Woman-owned',
            'Man-owned',
            'HBCU graduate or college association',
            'Greek organization affiliation',
            'LGBTQIA-owned',
            'Others',
        ];

        foreach ($intersections as $name) {
            DB::table('business_intersections')->insert([
                'name' => $name,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
