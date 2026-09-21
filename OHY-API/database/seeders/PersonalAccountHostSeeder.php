<?php

namespace Database\Seeders;

use Faker\Factory as Faker;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class PersonalAccountHostSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * Creates a complete Personal account Event Host with full profile:
     * - Account creation (signup)
     * - Personal information
     * - Business information (Personal accounts can also have business info)
     * - Password change (simulated)
     * - Banking information
     */
    public function run(): void
    {
        // Initialize Faker instance for generating realistic data
        $faker = Faker::create();

        // Get a random country ID for business address
        $countryId = DB::table('countries')->where('is_deleted', 0)->inRandomOrder()->value('country_id');

        // Step 1: Create host_users record (Personal account signup)
        // Initialize with signup information only
        $hostUserId = DB::table('host_users')->insertGetId([
            'email' => $faker->unique()->safeEmail(), // Personal email for personal account
            'password' => Hash::make('Ohy@123456'), // Initial password (will be changed later)
            'first_name' => $faker->firstName(), // First name from signup
            'last_name' => $faker->lastName(), // Last name from signup
            'business_id' => null, // Will be set after business is created
            'is_primary' => false, // Will be set to true after business is created
            'created_at' => now(), // Account creation timestamp
            'updated_at' => now(), // Last update timestamp
        ]);

        // Step 2: Create businesses record
        // Business information added in profile (Business tab)
        // Note: Personal accounts can also have business information
        $businessId = DB::table('businesses')->insertGetId([
            'business_name' => $faker->company().' Events', // Realistic business name
            'account_type' => 'personal', // Tracks original signup type (personal)
            'business_type' => $faker->randomElement(['LLC', 'Corporation', 'Sole Proprietorship', 'Partnership']), // Business type
            'industry' => $faker->randomElement(['Events & Entertainment', 'Technology', 'Marketing', 'Hospitality']), // Industry category
            'company_size' => $faker->randomElement(['1-10 employees', '11-50 employees', '51-200 employees']), // Company size
            'tax_id' => $faker->numerify('##-#######'), // EIN format (e.g., 12-3456789)
            'business_street_address' => $faker->streetAddress(), // Business street address
            'business_city' => $faker->city(), // Business city
            'business_state' => $faker->state(), // Business state/province
            'business_zip_code' => $faker->postcode(), // Business ZIP/postal code
            'business_country_id' => $countryId, // Foreign key to countries table
            'created_at' => now(), // Business creation timestamp
            'updated_at' => now(), // Last update timestamp
        ]);

        // Step 3: Update host_users with business link and complete profile
        // Link business to host user and add personal/banking information
        DB::table('host_users')->where('host_user_id', $hostUserId)->update([
            // Business linking
            'business_id' => $businessId, // Link to business record
            'is_primary' => true, // User is the business owner

            // Personal information (added in profile - Personal Information tab)
            'profile_image' => "host_users/{$hostUserId}/profile_image_".time().'.jpg', // Profile image path
            'phone_number' => $faker->phoneNumber(), // Contact phone number
            'website' => $faker->url(), // Personal/business website URL
            'city' => $faker->city(), // City
            'state' => $faker->state(), // State/province
            'country' => 'United States', // Country
            'zipcode' => $faker->postcode(), // Postal/ZIP code

            // Banking information (added in profile - Banking tab)
            'account_holder_name' => $faker->name(), // Bank account holder name
            'bank_name' => $faker->randomElement(['Chase Bank', 'Bank of America', 'Wells Fargo', 'Citibank']), // Bank name
            'account_number' => Crypt::encrypt($faker->numerify('##########')), // Encrypted bank account number (must be decryptable)
            'routing_number' => $faker->numerify('#########'), // Bank routing number
            'paypal_email' => $faker->email(), // Alternative PayPal payment email

            // Password change (simulated - update to same password but represents a change)
            'password' => Hash::make('Ohy@123456'), // Updated password (simulating password change)

            'updated_at' => now(), // Update timestamp after profile completion
        ]);
    }
}
