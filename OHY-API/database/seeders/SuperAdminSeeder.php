<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use App\Models\SuperAdminModel;

class SuperAdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        SuperAdminModel::firstOrCreate(
            [
                'email' => 'owner@ohy.com',
            ],
            [
                'first_name' => 'Platform',
                'last_name' => 'Owner',
                'phone_number' => '+1 555 0100',
                'profile_image' => null,
                'password' => Hash::make('SuperSecure@123'),
                'remember_token' => Str::random(10),
            ]
        );
    }
}

