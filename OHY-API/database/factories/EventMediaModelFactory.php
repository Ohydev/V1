<?php

namespace Database\Factories;

use App\Models\EventModel;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<\App\Models\EventMediaModel>
 */
class EventMediaModelFactory extends Factory
{
    protected $model = \App\Models\EventMediaModel::class;

    public function definition(): array
    {
        return [
            'event_id' => EventModel::factory(),
            'media_type' => 'thumbnail',
            'file_path' => 'events/test/'.($file = fake()->uuid().'.jpg'),
            'file_name' => $file,
        ];
    }
}
