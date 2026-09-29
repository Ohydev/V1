<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;

/**
 * @extends Factory<\App\Models\SuperAdminModel>
 */
class SuperAdminModelFactory extends Factory
{
    protected $model = \App\Models\SuperAdminModel::class;

    public function definition(): array
    {
        return [
            'email' => fake()->unique()->safeEmail(),
            'first_name' => fake()->firstName(),
            'last_name' => fake()->lastName(),
            'password' => Hash::make('password'),
        ];
    }
}
