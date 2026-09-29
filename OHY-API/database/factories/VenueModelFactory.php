<?php

namespace Database\Factories;

use App\Models\CountryModel;
use App\Models\EventModel;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<\App\Models\VenueModel>
 */
class VenueModelFactory extends Factory
{
    protected $model = \App\Models\VenueModel::class;

    public function definition(): array
    {
        return [
            'event_id' => EventModel::factory(),
            'venue_name' => fake()->company(),
            'venue_address' => fake()->streetAddress(),
            'city' => fake()->city(),
            'state_province' => fake()->state(),
            'postal_code' => fake()->postcode(),
            'country_id' => CountryModel::factory(),
            'latitude' => fake()->latitude(),
            'longitude' => fake()->longitude(),
            'maximum_attendees' => 500,
        ];
    }
}
