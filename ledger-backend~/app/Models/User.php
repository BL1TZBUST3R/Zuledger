<?php

namespace App\Models;

// 👇 1. ADD THIS IMPORT
use Laravel\Sanctum\HasApiTokens; 

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    public function ledgers()
{
    return $this->belongsToMany(Ledger::class)->withPivot('permission_level');
}

public function ownedLedgers()
{
    return $this->hasMany(Ledger::class, 'owner_id');
}

    use HasApiTokens, HasFactory, Notifiable;

    
    protected $fillable = [
        'name',
        'email',
        'password',
    ];

  
    protected $hidden = [
        'password',
        'remember_token',
    ];

   
    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
    ];
}