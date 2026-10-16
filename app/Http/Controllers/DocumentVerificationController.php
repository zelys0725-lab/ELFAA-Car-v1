<?php

namespace App\Http\Controllers;

use App\Models\Document;
use App\Services\DocumentVerification\DocumentVerificationService;
use App\Services\DocumentVerification\DocumentAuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class DocumentVerificationController extends Controller
{
    protected DocumentVerificationService $verificationService;

    public function __construct(DocumentVerificationService $verificationService)
    {
        $this->verificationService = $verificationService;
    }

    /**
     * Securely stream or download document file for authorized users.
     */
    public function serveFile(Request $request, Document $document)
    {
        Gate::authorize('view', $document);

        $absolutePath = $this->verificationService->resolveDocumentAbsolutePath($document);

        if (!$absolutePath || !file_exists($absolutePath)) {
            abort(404, 'Document file not found on secure storage.');
        }

        $filename = $document->original_filename ?: basename($absolutePath);

        if ($request->query('download') === '1') {
            return response()->download($absolutePath, $filename);
        }

        $mimeType = $document->mime_type;
        if (!$mimeType) {
            $mimeType = mime_content_type($absolutePath) ?: 'application/octet-stream';
        }

        return response()->file($absolutePath, [
            'Content-Type' => $mimeType,
            'Content-Disposition' => 'inline; filename="' . addslashes($filename) . '"',
            'X-Content-Type-Options' => 'nosniff',
            'Cache-Control' => 'private, no-cache, must-revalidate',
        ]);
    }

    /**
     * Get real-time document details including relations and audit log.
     */
    public function details(Document $document)
    {
        Gate::authorize('view', $document);

        $document->load([
            'user:id,name,email,phone,drivers_license_number,id_number,id_type',
            'verifiedByAdmin:id,name,email,role',
            'auditLogs.user:id,name,role',
        ]);

        return response()->json([
            'document' => $document,
        ]);
    }

    /**
     * Admin review decision: Approve, Reject, or Request Resubmission.
     */
    public function recordDecision(Request $request, Document $document)
    {
        Gate::authorize('verify', $document);

        $request->validate([
            'action' => 'required|in:approve,verify,reject,request_resubmission',
            'notes' => 'nullable|string|max:500',
            'reject_reason' => 'nullable|required_if:action,reject|string|max:500',
            'resubmission_notes' => 'nullable|required_if:action,request_resubmission|string|max:500',
        ]);

        $admin = Auth::user();
        $action = $request->action;
        $prevStatus = $document->status;

        if ($action === 'approve' || $action === 'verify') {
            $document->update([
                'status' => 'verified',
                'reject_reason' => null,
                'resubmission_notes' => null,
                'verified_by' => $admin->id,
                'verified_at' => now(),
            ]);

            DocumentAuditService::log(
                $document,
                'approved',
                $request->notes ?: 'Identity document approved and verified by administrator.',
                ['admin_id' => $admin->id, 'notes' => $request->notes],
                $admin,
                $prevStatus,
                'verified'
            );

            $msg = 'Document has been approved and marked as verified.';
        } elseif ($action === 'reject') {
            $reason = $request->reject_reason ?: $request->notes;
            $document->update([
                'status' => 'rejected',
                'reject_reason' => $reason,
                'verified_by' => $admin->id,
                'verified_at' => now(),
            ]);

            DocumentAuditService::log(
                $document,
                'rejected',
                "Document rejected: {$reason}",
                ['admin_id' => $admin->id, 'reason' => $reason],
                $admin,
                $prevStatus,
                'rejected'
            );

            $msg = 'Document has been rejected.';
        } elseif ($action === 'request_resubmission') {
            $notes = $request->resubmission_notes ?: $request->notes;
            $document->update([
                'status' => 'resubmission_requested',
                'resubmission_notes' => $notes,
                'verified_by' => $admin->id,
                'verified_at' => now(),
            ]);

            DocumentAuditService::log(
                $document,
                'resubmission_requested',
                "Resubmission requested: {$notes}",
                ['admin_id' => $admin->id, 'instructions' => $notes],
                $admin,
                $prevStatus,
                'resubmission_requested'
            );

            $msg = 'Resubmission request sent to customer.';
        }

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => $msg,
                'document' => $document->fresh(['user', 'verifiedByAdmin', 'auditLogs.user']),
            ]);
        }

        return redirect()->back()->with('success', $msg);
    }

    /**
     * Trigger OCR reprocessing on demand.
     */
    public function reprocess(Request $request, Document $document)
    {
        Gate::authorize('reprocess', $document);

        $result = $this->verificationService->processDocument($document, true);

        if ($request->wantsJson()) {
            return response()->json([
                'success' => $result['success'],
                'message' => $result['success']
                    ? "OCR reprocessed successfully ({$result['ocr']['word_count']} words detected)."
                    : "OCR processing failed: " . ($result['error'] ?? 'Unknown error'),
                'document' => $document->fresh(['user', 'verifiedByAdmin', 'auditLogs.user']),
            ]);
        }

        if ($result['success']) {
            return redirect()->back()->with('success', 'Document OCR reprocessed successfully.');
        }

        return redirect()->back()->with('error', 'OCR reprocessing failed: ' . ($result['error'] ?? 'Unknown error'));
    }
}
