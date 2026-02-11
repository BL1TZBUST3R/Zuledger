<?php

use Illuminate\Support\Facades\File;

Route::fallback(function () {
    return File::get(public_path('index.html'));
});
Route::get('/log-test', function () {
    \Illuminate\Support\Facades\Log::error('TEST ERROR: If you see this, logs are fixed!');
    return 'Check your Render logs now.';
});