<?php

namespace Tests\Feature;

use App\Models\OrderModel;
use App\Models\SuperAdminModel;
use App\Models\UserModel;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SuperAdminRegisteredUsersListTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->artisan('migrate');
    }

    public function test_it_requires_authentication()
    {
        $response = $this->postJson('/api/v1/get_super_admin_registered_users_list', []);
        $response->assertStatus(401);
        $response->assertJson([
            'success' => false,
            'error' => [
                'error_code' => 'T001', // missing token is rejected by AuthenticateApiToken first
            ],
        ]);
    }

    public function test_it_returns_paginated_users()
    {
        $superAdmin = SuperAdminModel::factory()->create();
        $this->withApiToken($superAdmin);

        UserModel::factory()->count(15)->create();

        $response = $this->postJson('/api/v1/get_super_admin_registered_users_list', ['per_page' => 10]);
        $response->assertStatus(200);
        $response->assertJsonStructure([
            'success',
            'data' => [
                'message',
                'users',
                'pagination' => [
                    'total_records',
                    'current_page',
                    'total_pages',
                    'next_page',
                    'prev_page',
                ],
            ],
        ]);
        $response->assertJson([
            'data' => [
                'pagination' => [
                    'current_page' => 1,
                    'total_pages' => 2,
                    'next_page' => 2,
                    'prev_page' => null,
                ],
            ],
        ]);
    }

    public function test_it_applies_search_and_date_filters()
    {
        $superAdmin = SuperAdminModel::factory()->create();
        $this->withApiToken($superAdmin);

        $oldUser = UserModel::factory()->create([
            'first_name' => 'Alpha', 'last_name' => 'User',
            'email' => 'alpha@example.com',
            'created_at' => Carbon::now()->subDays(10),
        ]);

        $newUser = UserModel::factory()->create([
            'first_name' => 'Bravo', 'last_name' => 'User',
            'email' => 'bravo@example.com',
            'created_at' => Carbon::now()->subDays(2),
        ]);

        $start = Carbon::now()->subDays(5)->format('d-m-Y');
        $end = Carbon::now()->format('d-m-Y');

        $response = $this->postJson('/api/v1/get_super_admin_registered_users_list', [
            'search' => 'Bravo',
            'start_date' => $start,
            'end_date' => $end,
        ]);
        $response->assertStatus(200);
        $response->assertJsonCount(1, 'data.users');
        $response->assertJsonFragment([
            'email' => 'bravo@example.com',
        ]);
    }

    public function test_it_sorts_by_total_spend()
    {
        $superAdmin = SuperAdminModel::factory()->create();
        $this->withApiToken($superAdmin);

        $userHigh = UserModel::factory()->create(['first_name' => 'High', 'last_name' => 'Spender']);
        $userLow = UserModel::factory()->create(['first_name' => 'Low', 'last_name' => 'Spender']);

        OrderModel::factory()->create([
            'user_id' => $userHigh->user_id,
            'total_amount' => 500,
        ]);

        OrderModel::factory()->create([
            'user_id' => $userLow->user_id,
            'total_amount' => 100,
        ]);

        $response = $this->postJson('/api/v1/get_super_admin_registered_users_list', ['sort_by' => 'total_spend']);
        $response->assertStatus(200);
        $response->assertJsonPath('data.users.0.full_name', 'High Spender');
    }
}
