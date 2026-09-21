<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    // Pure API — no frontend is served from here (the 3 React apps deploy
    // separately). The default Laravel welcome view needs a Vite build
    // this repo never runs against OHY-API, so return plain API info
    // instead of a broken/missing-manifest error.
    return response()->json([
        'name' => config('app.name'),
        'status' => 'ok',
    ]);
});
