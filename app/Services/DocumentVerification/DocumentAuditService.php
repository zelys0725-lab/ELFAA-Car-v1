<?php

namespace App\Services\DocumentVerification;

use App\Models\Document;
use App\Models\DocumentAuditLog;
use App\Models\User;
use Illuminate\Support\Facades\Request;

class DocumentAuditService
{
    /**
     * Log an audit event for a document verification action.
     */
    public static function log(
        Document $document,
        string $action,
        ?string $notes = null,
        ?array $metadata = null,
        ?User $actor = null,
        ?string $previousStatus = null,
        ?string $newStatus = null
    ): DocumentAuditLog {
        return DocumentAuditLog::create([
            'document_id' => $document->id,
            'user_id' => $actor ? $actor->id : auth()->id(),
            'action' => $action,
            'previous_status' => $previousStatus ?? $document->getOriginal('status'),
            'new_status' => $newStatus ?? $document->status,
            'notes' => $notes,
            'metadata' => $metadata,
            'ip_address' => Request::ip() ?? '127.0.0.1',
        ]);
    }
}
