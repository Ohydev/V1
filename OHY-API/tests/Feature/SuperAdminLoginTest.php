<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\SuperAdminModel;
use Laravel\Sanctum\PersonalAccessToken;
use Carbon\Carbon;

class SuperAdminLoginTest extends TestCase
{
    use RefreshDatabase;

    public function test_super_admin_can_login_with_valid_credentials(): void
    {
        $superAdmin = SuperAdminModel::create([
            'email' => 'owner@ohy.com',
            'first_name' => 'Platform',
            'last_name' => 'Owner',
            'phone_number' => '+1 555 0100',
            'profile_image' => null,
            'password' => 'SuperSecure@123',
        ]);

        $response = $this->postJson('/api/v1/super_admin_login', [
            'email' => 'owner@ohy.com',
            'password' => 'SuperSecure@123',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'super_admin_info' => [
                        'super_admin_id' => $superAdmin->super_admin_id,
                        'email' => 'owner@ohy.com',
                    ],
                ],
            ]);
    }

    public function test_super_admin_login_fails_with_invalid_email(): void
    {
        $response = $this->postJson('/api/v1/super_admin_login', [
            'email' => 'unknown@ohy.com',
            'password' => 'irrelevant',
        ]);

        $response->assertStatus(401)
            ->assertJson([
                'success' => false,
                'error' => [
                    'error_code' => 'E003',
                ],
            ]);
    }

    public function test_super_admin_login_fails_with_wrong_password(): void
    {
        SuperAdminModel::create([
            'email' => 'owner@ohy.com',
            'first_name' => 'Platform',
            'last_name' => 'Owner',
            'password' => 'SuperSecure@123',
        ]);

        $response = $this->postJson('/api/v1/super_admin_login', [
            'email' => 'owner@ohy.com',
            'password' => 'WrongPassword',
        ]);

        $response->assertStatus(401)
            ->assertJson([
                'success' => false,
                'error' => [
                    'error_code' => 'E003',
                ],
            ]);
    }

    public function test_remember_me_sets_token_expiration_to_thirty_days(): void
    {
        Carbon::setTestNow(Carbon::parse('2025-11-25 10:00:00'));

        $superAdmin = SuperAdminModel::create([
            'email' => 'owner@ohy.com',
            'first_name' => 'Platform',
            'last_name' => 'Owner',
            'password' => 'SuperSecure@123',
        ]);

        $response = $this->postJson('/api/v1/super_admin_login', [
            'email' => 'owner@ohy.com',
            'password' => 'SuperSecure@123',
            'remember_me' => true,
        ]);

        $response->assertStatus(200);

        $token = $response->json('data.token');
        $tokenId = intval(explode('|', $token)[0]);
        $storedToken = PersonalAccessToken::find($tokenId);

        $this->assertNotNull($storedToken);
        $this->assertTrue($storedToken->tokenable_id === $superAdmin->super_admin_id);
        $this->assertTrue($storedToken->expires_at->eq(Carbon::now()->addDays(30)));

        Carbon::setTestNow(); // Clear test now
    }
}

