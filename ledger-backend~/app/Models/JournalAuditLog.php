<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class JournalAuditLog extends Model
{
    protected $fillable = [
        'journal_id',
        'user_id',
        'action',
        'details',
    ];

    protected $casts = [
        'details' => 'array',
    ];

    public function journal()
    {
        return $this->belongsTo(Journal::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}