<?php

use Illuminate\Support\Facades\File;

Route::fallback(function () {
    return File::get(public_path('index.html'));
});