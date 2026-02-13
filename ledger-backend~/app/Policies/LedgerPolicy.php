<?php

namespace App\Policies;

use App\Models\Ledger;
use App\Models\User;

class LedgerPolicy
{
    /**
     * Determine whether the user can view the specific ledger.
     */
    public function view(User $user, Ledger $ledger): bool
    {
        // Allow if user is the owner OR is in the authorized users list
        return $user->id === $ledger->owner_id || 
               $ledger->authorizedUsers->contains($user->id);
    }

    /**
     * Determine whether the user can update the model.
     * (Maybe only 'editors' or 'owners' can update)
     */
    public function update(User $user, Ledger $ledger): bool
    {
        if ($user->id === $ledger->owner_id) {
            return true;
        }

        // Check if they are authorized AND have a specific permission level
        $authorizedUser = $ledger->authorizedUsers()->where('user_id', $user->id)->first();
        
        return $authorizedUser && $authorizedUser->pivot->permission_level === 'editor';
    }

    /**
     * Determine whether the user can delete the model.
     * Usually, only the owner should be allowed to delete a ledger.
     */
    public function delete(User $user, Ledger $ledger): bool
    {
        return $user->id === $ledger->owner_id;
    }

    /**
     * Standard creation logic.
     */
    public function create(User $user): bool
    {
        // Any registered user can create their own ledger
        return true;
    }
}