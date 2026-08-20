<?php

namespace App\Documentation\Swagger;

/**
 * @OA\Info(
 *     title="OHY Events API",
 *     version="1.0.0",
 *     description="Comprehensive API documentation for OHY Events platform. This API enables Event Hosts to create, manage, and track events, as well as manage their profiles and view analytics. All authenticated endpoints require a Laravel Sanctum token in the request header.",
 *
 *     @OA\Contact(
 *         email="support@ohyevents.com"
 *     )
 * )
 *
 * @OA\Server(
 *     url="/api",
 *     description="OHY Events API Server"
 * )
 *
 * @OA\SecurityScheme(
 *     securityScheme="sanctum",
 *     type="apiKey",
 *     in="header",
 *     name="token",
 *     description="Laravel Sanctum authentication token. Required for all authenticated endpoints. Token is obtained after successful login."
 * )
 */
class BaseSwaggerInfo
{
    // Base Swagger information and security schemes
}
