<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Ledger extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'owner_id'];

    // Relationship: A ledger belongs to an Owner
    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    // Relationship: A ledger has many Authorized Users (Many-to-Many)
    // This is the pivot table 'ledger_user' we discussed
    public function authorizedUsers()
    {
        return $this->belongsToMany(User::class, 'ledger_user')
                    ->withPivot('permission_level')
                    ->withTimestamps();
    }

    // Relationship: A ledger has many Groups (Accounts)
    // This allows $group->ledger to work in your Controller
    public function groups()
    {
        return $this->hasMany(Group::class);
    }

    /**
     * Scope: Filter ledgers for a specific user (Owned OR Invited)
     * usage: Ledger::forUser(Auth::user())->get();
     */
    public function scopeForUser($query, $user)
    {
        return $query->where('owner_id', $user->id)
                     ->orWhereHas('authorizedUsers', function ($q) use ($user) {
                         $q->where('user_id', $user->id);
                     });
    }
}