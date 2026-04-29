<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EntryItem extends Model
{
    use HasFactory;

    protected $guarded = [];


    public function entry()
    {
        return $this->belongsTo(Entry::class);
    }


    public function group()
    {
        return $this->belongsTo(Group::class);
    }
}