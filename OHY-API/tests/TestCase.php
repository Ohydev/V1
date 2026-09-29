<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    /**
     * Authenticate like the real frontends do: issue a Sanctum token and
     * send it as a Bearer header. Sanctum::actingAs() isn't enough here —
     * AuthenticateApiToken looks the token up in personal_access_tokens.
     */
    protected function withApiToken($tokenable): static
    {
        return $this->withToken($tokenable->createToken('test-token')->plainTextToken);
    }
}
