<?php

namespace Database\Seeders;

use Faker\Factory as Faker;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PersonalAccountEventsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * Creates 4 complete events for Personal account host:
     * - Live Event (current date/time between start and end)
     * - Upcoming Event (start date/time in future)
     * - Completed Event (end date/time has passed)
     * - Draft Event (is_draft = true, is_published = false)
     *
     * Each event includes all details: basic info, media, social links,
     * venue, ticket categories, tickets, artists, terms, and coupons.
     */
    public function run(): void
    {
        // Initialize Faker instance for generating realistic data
        $faker = Faker::create();

        // Get the Personal account host user ID
        // Qualify all column names with table prefixes to avoid ambiguity
        $hostUserId = DB::table('host_users')
            ->where('host_users.is_primary', true) // Qualify is_primary with table prefix
            ->whereNotNull('host_users.business_id') // Qualify business_id with table prefix to avoid ambiguity
            ->join('businesses', 'host_users.business_id', '=', 'businesses.business_id')
            ->where('businesses.account_type', 'personal')
            ->value('host_users.host_user_id');

        // Get event categories for random selection
        $categories = DB::table('event_categories')->pluck('event_category_id')->toArray();

        // Get countries for venue selection
        $countries = DB::table('countries')->where('is_deleted', 0)->pluck('country_id')->toArray();

        // Realistic event names pool
        $eventNames = [
            'Tech Summit 2024',
            'Summer Music Festival',
            'Business Networking Conference',
            'Art Exhibition Opening',
            'Food & Wine Tasting',
            'Innovation Forum',
            'Jazz Night Live',
            'Startup Pitch Competition',
            'Cultural Heritage Showcase',
            'Wellness & Mindfulness Retreat',
        ];

        // Realistic venue names pool
        $venueNames = [
            'Madison Square Garden',
            'Convention Center',
            'Grand Ballroom',
            'Exhibition Hall',
            'Conference Center',
            'Concert Hall',
            'Theater District',
            'Event Plaza',
            'Cultural Center',
            'Business Hub',
        ];

        // Define 4 event types with their configurations
        $eventConfigs = [
            [
                'type' => 'live',
                'start_date' => now()->subDay()->format('Y-m-d'),
                'end_date' => now()->addDays(2)->format('Y-m-d'),
                'start_time' => now()->subHours(2)->format('H:i:s'),
                'end_time' => now()->addHours(6)->format('H:i:s'),
                'is_draft' => false,
                'is_published' => true,
            ],
            [
                'type' => 'upcoming',
                'start_date' => now()->addDays(30)->format('Y-m-d'),
                'end_date' => now()->addDays(32)->format('Y-m-d'),
                'start_time' => '10:00:00',
                'end_time' => '18:00:00',
                'is_draft' => false,
                'is_published' => true,
            ],
            [
                'type' => 'completed',
                'start_date' => now()->subDays(60)->format('Y-m-d'),
                'end_date' => now()->subDays(58)->format('Y-m-d'),
                'start_time' => '10:00:00',
                'end_time' => '18:00:00',
                'is_draft' => false,
                'is_published' => true,
            ],
            [
                'type' => 'draft',
                'start_date' => now()->addDays(45)->format('Y-m-d'),
                'end_date' => now()->addDays(47)->format('Y-m-d'),
                'start_time' => '14:00:00',
                'end_time' => '20:00:00',
                'is_draft' => true,
                'is_published' => false,
            ],
        ];

        // Loop through each event configuration and create complete event
        foreach ($eventConfigs as $config) {
            // Create event basic information
            $eventId = DB::table('events')->insertGetId([
                'host_user_id' => $hostUserId, // Event creator/owner
                'event_title' => $faker->randomElement($eventNames), // Realistic event name
                'description' => '<p>'.$faker->paragraph(5).'</p><p><strong>What to expect:</strong></p><ul><li>'.implode('</li><li>', $faker->sentences(4)).'</li></ul>', // Rich text description
                'event_category_id' => $faker->randomElement($categories), // Random category
                'start_date' => $config['start_date'], // Event start date
                'end_date' => $config['end_date'], // Event end date
                'start_time' => $config['start_time'], // Event start time
                'end_time' => $config['end_time'], // Event end time
                'key_highlights' => '<ul><li>'.implode('</li><li>', $faker->sentences(3)).'</li></ul>', // Rich text highlights
                'is_draft' => $config['is_draft'], // Draft status flag
                'is_published' => $config['is_published'], // Published status flag
                'created_at' => now(), // Event creation timestamp
                'updated_at' => now(), // Last update timestamp
            ]);

            // Create event media (thumbnail, banner, flyers, videos)
            // Thumbnail (single file)
            DB::table('event_media')->insert([
                'event_id' => $eventId,
                'media_type' => 'thumbnail',
                'file_path' => "events/{$eventId}/thumbnail/event_thumbnail_".time().'.jpg',
                'file_name' => 'event_thumbnail.jpg',
                'file_size' => $faker->numberBetween(100000, 500000), // File size in bytes
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Banner (single file)
            DB::table('event_media')->insert([
                'event_id' => $eventId,
                'media_type' => 'banner',
                'file_path' => "events/{$eventId}/banner/event_banner_".time().'.jpg',
                'file_name' => 'event_banner.jpg',
                'file_size' => $faker->numberBetween(200000, 800000),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Flyers (2-3 files)
            $flyerCount = $faker->numberBetween(2, 3);
            for ($i = 1; $i <= $flyerCount; $i++) {
                DB::table('event_media')->insert([
                    'event_id' => $eventId,
                    'media_type' => 'flyer',
                    'file_path' => "events/{$eventId}/flyer/flyer_{$i}_".time().'.jpg',
                    'file_name' => "flyer_{$i}.jpg",
                    'file_size' => $faker->numberBetween(150000, 600000),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            // Videos (1-2 files)
            $videoCount = $faker->numberBetween(1, 2);
            for ($i = 1; $i <= $videoCount; $i++) {
                DB::table('event_media')->insert([
                    'event_id' => $eventId,
                    'media_type' => 'video',
                    'file_path' => "events/{$eventId}/video/event_video_{$i}_".time().'.mp4',
                    'file_name' => "event_video_{$i}.mp4",
                    'file_size' => $faker->numberBetween(5000000, 50000000), // 5MB to 50MB
                    'video_duration' => $faker->randomElement(['2:30', '3:45', '5:20', '4:15']), // Video duration format
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            // Create event social media links
            $socialPlatforms = [
                ['platform' => 'facebook', 'url' => 'https://facebook.com/'.$faker->slug()],
                ['platform' => 'instagram', 'url' => 'https://instagram.com/'.$faker->userName()],
                ['platform' => 'linkedin', 'url' => 'https://linkedin.com/company/'.$faker->slug()],
                ['platform' => 'twitter', 'url' => 'https://twitter.com/'.$faker->userName()],
                ['platform' => 'youtube', 'url' => 'https://youtube.com/@'.$faker->userName()],
            ];

            foreach ($socialPlatforms as $social) {
                DB::table('event_social_media')->insert([
                    'event_id' => $eventId,
                    'platform' => $social['platform'],
                    'url' => $social['url'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            // Create venue (one venue per event)
            $venueCountryId = $faker->randomElement($countries);
            DB::table('venues')->insert([
                'event_id' => $eventId, // One venue per event (unique)
                'venue_name' => $faker->randomElement($venueNames), // Realistic venue name
                'venue_address' => $faker->streetAddress(), // Full street address
                'city' => $faker->city(), // City name
                'state_province' => $faker->state(), // State or Province
                'postal_code' => $faker->postcode(), // ZIP/Postal code
                'country_id' => $venueCountryId, // Foreign key to countries
                'latitude' => $faker->latitude(), // Latitude for map pinning
                'longitude' => $faker->longitude(), // Longitude for map pinning
                'additional_details' => $faker->optional()->sentence(), // Room number, floor, parking details
                'maximum_attendees' => $faker->numberBetween(100, 5000), // Maximum number of attendees
                'venue_image' => "venues/{$eventId}/venue_image_".time().'.jpg', // Venue image path
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Create ticket categories (2-4 categories per event)
            $categoryNames = ['Early Bird', 'Regular', 'VIP', 'Premium'];
            $selectedCategories = $faker->randomElements($categoryNames, $faker->numberBetween(2, 4));
            $ticketCategoryIds = [];

            foreach ($selectedCategories as $categoryName) {
                $ticketCategoryId = DB::table('ticket_categories')->insertGetId([
                    'event_id' => $eventId,
                    'category_name' => $categoryName,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $ticketCategoryIds[] = $ticketCategoryId;
            }

            // Create tickets (2-4 ticket types per category)
            foreach ($ticketCategoryIds as $ticketCategoryId) {
                $ticketCount = $faker->numberBetween(2, 4);
                for ($i = 1; $i <= $ticketCount; $i++) {
                    DB::table('tickets')->insert([
                        'event_id' => $eventId,
                        'ticket_category_id' => $ticketCategoryId,
                        'ticket_type' => $faker->randomElement(['single_entry', 'multiple_entry']),
                        'description' => $faker->optional()->randomElement(['Limited time offer', 'Best value', 'Popular choice']),
                        'price' => $faker->randomFloat(2, 50, 500), // Price between $50 and $500
                        'total_available' => $faker->numberBetween(50, 500), // Total inventory
                        'sold_quantity' => 0, // Initially no tickets sold
                        'ticket_info' => '<p>'.$faker->paragraph(2).'</p>', // Rich text description
                        'max_per_user' => $faker->numberBetween(2, 10), // Maximum tickets per user
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }

            // Create event artists (2-4 artists per event)
            $artistCount = $faker->numberBetween(2, 4);
            for ($i = 1; $i <= $artistCount; $i++) {
                $artistName = $faker->name();
                $eventArtistId = DB::table('event_artists')->insertGetId([
                    'event_id' => $eventId,
                    'artist_name' => $artistName,
                    'artist_image' => "artists/{$eventId}/{$artistName}_".time().'.jpg',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                // Create artist social media links (random selection)
                $artistSocialPlatforms = $faker->randomElements(
                    ['facebook', 'instagram', 'tiktok', 'linkedin', 'twitter', 'youtube', 'spotify'],
                    $faker->numberBetween(2, 5)
                );

                foreach ($artistSocialPlatforms as $platform) {
                    DB::table('artist_social_media')->insert([
                        'event_artist_id' => $eventArtistId,
                        'platform' => $platform,
                        'url' => 'https://'.$platform.'.com/'.$faker->userName(),
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }

            // Create terms & conditions (one per event)
            DB::table('event_terms_conditions')->insert([
                'event_id' => $eventId, // One terms per event (unique)
                'terms_content' => '<h3>Terms and Conditions</h3><p>'.$faker->paragraph(5).'</p><ul><li>'.implode('</li><li>', $faker->sentences(6)).'</li></ul>', // Rich text terms
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Create coupons (1-3 coupons per event)
            $couponCount = $faker->numberBetween(1, 3);
            for ($i = 1; $i <= $couponCount; $i++) {
                $discountType = $faker->randomElement(['percentage', 'flat']);
                // Generate optional end date (can be null)
                $endDate = $faker->optional(0.7)->dateTimeBetween('now', '+90 days'); // 70% chance of having end date
                $endDateFormatted = $endDate ? $endDate->format('Y-m-d') : null; // Format only if not null

                $couponData = [
                    'event_id' => $eventId,
                    'coupon_code' => strtoupper($faker->bothify('???###')), // Random coupon code (e.g., EARLY20)
                    'discount_type' => $discountType,
                    'max_times_applicable' => $faker->numberBetween(10, 100), // Max times coupon can be used
                    'start_date' => now()->subDays($faker->numberBetween(0, 30))->format('Y-m-d'), // Start date
                    'end_date' => $endDateFormatted, // Optional end date (can be null)
                    'times_used' => 0, // Initially no usage
                    'created_at' => now(),
                    'updated_at' => now(),
                ];

                // Add discount fields based on type
                if ($discountType === 'percentage') {
                    $couponData['discount_percent'] = $faker->randomFloat(2, 10, 50); // 10% to 50%
                    $couponData['max_cap_discount'] = $faker->optional()->randomFloat(2, 50, 200); // Optional max cap
                    $couponData['flat_discount_amount'] = null;
                } else {
                    $couponData['flat_discount_amount'] = $faker->randomFloat(2, 20, 100); // $20 to $100 off
                    $couponData['discount_percent'] = null;
                    $couponData['max_cap_discount'] = null;
                }

                DB::table('coupons')->insert($couponData);
            }
        }
    }
}
