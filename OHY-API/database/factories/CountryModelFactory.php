<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<\App\Models\CountryModel>
 */
class CountryModelFactory extends Factory
{
    protected $model = \App\Models\CountryModel::class;

    public function definition(): array
    {
        return [
            'iso' => fake()->unique()->countryCode(),
            'name' => $name = fake()->country(),
            'nicename' => $name,
            'phonecode' => fake()->numberBetween(1, 999),
        ];
    }
}
