<?php

namespace Database\Factories;

use App\Models\EventModel;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<\App\Models\EventArtistModel>
 */
class EventArtistModelFactory extends Factory
{
    protected $model = \App\Models\EventArtistModel::class;

    public function definition(): array
    {
        return [
            'event_id' => EventModel::factory(),
            'artist_name' => fake()->name(),
        ];
    }
}
