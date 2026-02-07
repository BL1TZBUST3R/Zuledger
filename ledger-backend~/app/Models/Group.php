<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Group extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'parent_id', // 👈 Ensure this is here too
        'name',
        'code',
        'affects_gross',
    ];

    // 👇 ADD THESE TWO FUNCTIONS
    public function parent()
    {
        return $this->belongsTo(Group::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(Group::class, 'parent_id');
    }
}