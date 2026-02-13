<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Ledger extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'owner_id'];

    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function authorizedUsers()
    {
        return $this->belongsToMany(User::class, 'ledger_user')
                    ->withPivot('permission_level')
                    ->withTimestamps();
    }

    public function groups()
    {
        return $this->hasMany(Group::class);
    }

    public function scopeForUser($query, $user)
    {
        return $query->where('owner_id', $user->id)
                     ->orWhereHas('authorizedUsers', function ($q) use ($user) {
                         $q->where('user_id', $user->id);
                     });
    }
}