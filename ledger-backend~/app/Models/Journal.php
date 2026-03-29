<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Journal extends Model
{
    use HasFactory;

    protected $fillable = [
        'ledger_id',
        'user_id',
        'journal_number',
        'description',
        'date',
        'status',
    ];

    protected $casts = [
        'date' => 'date',
    ];

    public function ledger()
    {
        return $this->belongsTo(Ledger::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function lines()
    {
        return $this->hasMany(JournalLine::class);
    }
    
    public function auditLogs()
    {
        return $this->hasMany(JournalAuditLog::class);
    }
}