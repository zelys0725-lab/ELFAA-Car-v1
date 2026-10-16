<?php

namespace App\Policies;

use App\Models\Document;
use App\Models\User;

class DocumentPolicy
{
    /**
     * Determine whether the user can view the document file and details.
     */
    public function view(User $user, Document $document): bool
    {
        if (in_array($user->role, ['admin', 'staff'])) {
            return true;
        }

        return $document->user_id === $user->id;
    }

    /**
     * Determine whether the user can verify, approve, or reject the document.
     */
    public function verify(User $user, Document $document): bool
    {
        return in_array($user->role, ['admin', 'staff']);
    }

    /**
     * Determine whether the user can trigger OCR reprocessing.
     */
    public function reprocess(User $user, Document $document): bool
    {
        return in_array($user->role, ['admin', 'staff']);
    }

    /**
     * Determine whether the user can download or stream the document file.
     */
    public function download(User $user, Document $document): bool
    {
        if (in_array($user->role, ['admin', 'staff'])) {
            return true;
        }

        return $document->user_id === $user->id;
    }

    /**
     * Determine whether the user can delete or replace the document.
     */
    public function update(User $user, Document $document): bool
    {
        if (in_array($user->role, ['admin', 'staff'])) {
            return true;
        }

        return $document->user_id === $user->id;
    }
}
