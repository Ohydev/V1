<?php

namespace Database\Factories;

use App\Models\CountryModel;
use App\Models\UserModel;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<\App\Models\OrderModel>
 */
class OrderModelFactory extends Factory
{
    protected $model = \App\Models\OrderModel::class;

    public function definition(): array
    {
        return [
            'order_number' => 'ORD-'.fake()->unique()->numerify('########'),
            'user_id' => UserModel::factory(),
            'order_date' => now()->toDateString(),
            'full_name' => fake()->name(),
            'email' => fake()->safeEmail(),
            'phone_number' => fake()->numerify('##########'),
            'street_address' => fake()->streetAddress(),
            'city' => fake()->city(),
            'state' => fake()->state(),
            'zip_code' => fake()->postcode(),
            'country_id' => CountryModel::factory(),
            'subtotal' => 100,
            'total_amount' => 100,
            'order_status' => 'paid',
        ];
    }
}
