<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Entry extends Model
{
    use HasFactory;

    protected $guarded = []; // Allow mass assignment

    // An Entry has many Items (Rows)
    public function items()
    {
        return $this->hasMany(EntryItem::class);
    }
}