<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthRateLimitTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_is_throttled_after_five_attempts_per_account(): void
    {
        $payload = ['email' => 'attacker-target@example.com', 'password' => 'wrong-password'];

        for ($i = 0; $i < 5; $i++) {
            $this->assertNotEquals(429, $this->postJson('/api/v1/super_admin_login', $payload)->status());
        }

        $this->postJson('/api/v1/super_admin_login', $payload)
            ->assertStatus(429)
            ->assertHeader('Retry-After')
            ->assertJson([
                'success' => false,
                'error' => ['error_code' => 'R001'],
            ]);

        // A different account from the same IP still gets through.
        $this->assertNotEquals(429, $this->postJson('/api/v1/super_admin_login', ['email' => 'someone-else@example.com', 'password' => 'x'])->status());
    }

    public function test_otp_requests_are_throttled_per_email(): void
    {
        $payload = ['email' => 'inbox-owner@example.com'];

        for ($i = 0; $i < 3; $i++) {
            $this->assertNotEquals(429, $this->postJson('/api/v1/user_registration_otp_request', $payload)->status());
        }

        $this->postJson('/api/v1/user_registration_otp_request', $payload)
            ->assertStatus(429)
            ->assertJsonPath('error.error_code', 'R001');
    }
}
