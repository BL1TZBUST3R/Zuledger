<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class JournalLine extends Model
{
    use HasFactory;

    protected $fillable = [
        'journal_id',
        'group_id',
        'amount',
        'type',
    ];

    public function journal()
    {
        return $this->belongsTo(Journal::class);
    }

    public function account()
    {
        return $this->belongsTo(Group::class, 'group_id');
    }
}