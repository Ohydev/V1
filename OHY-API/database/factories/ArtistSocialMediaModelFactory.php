<?php

namespace Database\Factories;

use App\Models\EventArtistModel;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<\App\Models\ArtistSocialMediaModel>
 */
class ArtistSocialMediaModelFactory extends Factory
{
    protected $model = \App\Models\ArtistSocialMediaModel::class;

    public function definition(): array
    {
        return [
            'event_artist_id' => EventArtistModel::factory(),
            'platform' => 'instagram',
            'url' => fake()->url(),
        ];
    }
}
