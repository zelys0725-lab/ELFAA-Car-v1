<?php

namespace App\Services\DocumentVerification;

use App\Models\Document;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class DocumentVerificationService
{
    protected TesseractOcrService $ocrService;

    public function __construct(TesseractOcrService $ocrService)
    {
        $this->ocrService = $ocrService;
    }

    /**
     * Process OCR and identity verification analysis on a document.
     */
    public function processDocument(Document $document, bool $isReprocess = false): array
    {
        $document->loadMissing('user');
        $user = $document->user;

        $absolutePath = $this->resolveDocumentAbsolutePath($document);

        if (!$absolutePath || !file_exists($absolutePath)) {
            $err = "Document file could not be located on storage.";
            $document->update([
                'ocr_status' => 'failed',
                'ocr_error' => $err,
                'ocr_processed_at' => now(),
            ]);

            DocumentAuditService::log(
                $document,
                $isReprocess ? 'ocr_reprocessed' : 'ocr_processed',
                "OCR processing failed: {$err}",
                ['error' => $err]
            );

            return ['success' => false, 'error' => $err];
        }

        // Run Local Tesseract OCR
        $ocrResult = $this->ocrService->extract($absolutePath);

        if (!$ocrResult['success']) {
            $fallbackSummary = [
                'readability_status' => 'fail',
                'confidence_metrics' => [
                    'mean_confidence' => 0.0,
                    'word_count' => 0,
                    'char_count' => 0,
                ],
                'checks' => [
                    [
                        'name' => 'Image Readability',
                        'status' => 'fail',
                        'message' => 'OCR tool could not extract text: ' . ($ocrResult['error'] ?? 'Unknown error'),
                    ],
                    [
                        'name' => 'Human Review Required',
                        'status' => 'warning',
                        'message' => 'Manual verification required by administrator.',
                    ],
                ],
                'issues' => [
                    $ocrResult['error'] ?? 'OCR tool failed to process file. Please review image manually.',
                ],
                'recommendation' => 'Manual Review Required: Automated OCR could not extract text from this file.',
                'recommendation_level' => 'manual_review',
            ];

            $document->update([
                'ocr_status' => 'failed',
                'ocr_error' => $ocrResult['error'],
                'ocr_confidence' => 0.0,
                'ocr_word_count' => 0,
                'ocr_char_count' => 0,
                'verification_summary' => $fallbackSummary,
                'ocr_processed_at' => now(),
            ]);

            DocumentAuditService::log(
                $document,
                $isReprocess ? 'ocr_reprocessed' : 'ocr_processed',
                "OCR execution failed: " . ($ocrResult['error'] ?? 'Unknown error'),
                ['error' => $ocrResult['error']]
            );

            return ['success' => false, 'error' => $ocrResult['error'], 'summary' => $fallbackSummary];
        }

        // Extract Identity Fields from raw text
        $rawText = $ocrResult['raw_text'];
        $extractedFields = $this->extractIdentityFields($rawText, $document->type);

        // Perform rules-based validation against customer's registered profile
        $summary = $this->compareWithCustomer(
            $user,
            $document,
            $extractedFields,
            $ocrResult['mean_confidence'],
            $ocrResult['word_count'],
            $rawText
        );

        $document->update([
            'ocr_status' => 'completed',
            'ocr_raw_text' => $rawText,
            'ocr_confidence' => $ocrResult['mean_confidence'],
            'ocr_word_count' => $ocrResult['word_count'],
            'ocr_char_count' => $ocrResult['char_count'],
            'ocr_extracted_data' => $extractedFields,
            'verification_summary' => $summary,
            'ocr_processed_at' => now(),
            'ocr_error' => null,
        ]);

        DocumentAuditService::log(
            $document,
            $isReprocess ? 'ocr_reprocessed' : 'ocr_processed',
            "Tesseract OCR extracted {$ocrResult['word_count']} words with genuine mean confidence {$ocrResult['mean_confidence']}%. Analysis generated.",
            [
                'confidence' => $ocrResult['mean_confidence'],
                'word_count' => $ocrResult['word_count'],
                'recommendation_level' => $summary['recommendation_level'],
                'issues_count' => count($summary['issues']),
            ]
        );

        return [
            'success' => true,
            'ocr' => $ocrResult,
            'extracted' => $extractedFields,
            'summary' => $summary,
        ];
    }

    /**
     * Resolve the absolute filesystem path for a document file.
     */
    public function resolveDocumentAbsolutePath(Document $document): ?string
    {
        $path = $document->file_path;
        if (!$path) {
            return null;
        }

        // If stored in private disk (storage/app/private/documents/...)
        if ($document->storage_disk === 'local') {
            if (Storage::disk('local')->exists($path)) {
                return Storage::disk('local')->path($path);
            }
        }

        // If stored in public disk
        if (Storage::disk('public')->exists($path)) {
            return Storage::disk('public')->path($path);
        }

        // Relative path starting with /uploads/ or uploads/
        $cleanPath = ltrim($path, '/\\');
        $publicPath = public_path($cleanPath);
        if (file_exists($publicPath)) {
            return $publicPath;
        }

        // Storage path fallback
        $storagePath = storage_path('app/' . $cleanPath);
        if (file_exists($storagePath)) {
            return $storagePath;
        }

        $privateStoragePath = storage_path('app/private/' . $cleanPath);
        if (file_exists($privateStoragePath)) {
            return $privateStoragePath;
        }

        return null;
    }

    /**
     * Parse structured identity fields from raw OCR text using regex and heuristics.
     */
    public function extractIdentityFields(string $rawText, string $docType): array
    {
        $lines = array_values(array_filter(array_map('trim', explode("\n", $rawText))));
        $fullTextUpper = mb_strtoupper($rawText);

        $detectedDocType = $this->detectDocumentType($fullTextUpper, $docType);
        $detectedExpiry = $this->detectExpirationDate($rawText);
        $detectedDob = $this->detectBirthDate($rawText);
        $detectedIdNumber = $this->detectIdNumber($rawText, $detectedDocType);
        $detectedName = $this->detectName($lines, $rawText);

        return [
            'detected_doc_type' => $detectedDocType,
            'detected_name' => $detectedName,
            'detected_id_number' => $detectedIdNumber,
            'detected_expiry_date' => $detectedExpiry['raw'] ?? null,
            'detected_expiry_date_parsed' => $detectedExpiry['iso'] ?? null,
            'detected_birth_date' => $detectedDob['raw'] ?? null,
            'detected_birth_date_parsed' => $detectedDob['iso'] ?? null,
        ];
    }

    /**
     * Detect document type based on OCR keywords.
     */
    protected function detectDocumentType(string $upperText, string $defaultType): string
    {
        if (
            str_contains($upperText, "DRIVER'S LICENSE") ||
            str_contains($upperText, "DRIVERS LICENSE") ||
            str_contains($upperText, "DRIVER LICENSE") ||
            str_contains($upperText, "LAND TRANSPORTATION OFFICE") ||
            str_contains($upperText, "LTO") ||
            str_contains($upperText, "NON-PROFESSIONAL") ||
            str_contains($upperText, "PROFESSIONAL DRIVER")
        ) {
            return "Driver's License";
        }

        if (
            str_contains($upperText, "PASSPORT") ||
            str_contains($upperText, "PASAPORTE") ||
            str_contains($upperText, "REPUBLIC OF THE PHILIPPINES PASSPORT")
        ) {
            return "Passport";
        }

        if (
            str_contains($upperText, "PHILIPPINE IDENTIFICATION SYSTEM") ||
            str_contains($upperText, "PHILSYS") ||
            str_contains($upperText, "PAMBANSANG PAGKAKAKILANLAN")
        ) {
            return "Philippine National ID (PhilSys)";
        }

        if (
            str_contains($upperText, "UNIFIED MULTI-PURPOSE ID") ||
            str_contains($upperText, "UMID") ||
            str_contains($upperText, "SOCIAL SECURITY SYSTEM")
        ) {
            return "UMID / SSS ID";
        }

        if (
            str_contains($upperText, "POSTAL ID") ||
            str_contains($upperText, "PHILPOST")
        ) {
            return "Postal ID";
        }

        if (
            str_contains($upperText, "ELECTRIC") ||
            str_contains($upperText, "MERALCO") ||
            str_contains($upperText, "MAYNILAD") ||
            str_contains($upperText, "WATER DISTRICT") ||
            str_contains($upperText, "STATEMENT OF ACCOUNT") ||
            str_contains($upperText, "BILLING") ||
            str_contains($upperText, "INTERNET BILL")
        ) {
            return "Proof of Billing";
        }

        // Fallback friendly name from document type code
        $map = [
            'gov_id_1' => "Driver's License / Primary Gov ID",
            'gov_id_2' => "Secondary Official Photo ID",
            'proof_of_billing' => "Proof of Billing",
        ];

        return $map[$defaultType] ?? "Government-Issued ID";
    }

    /**
     * Detect expiration date in text using multiple format patterns.
     */
    protected function detectExpirationDate(string $rawText): array
    {
        $patterns = [
            // Keyword followed by date
            '/(?:EXPIRATION|EXPIRY|EXPIRES|EXP\.?\s*DATE|VALID\s*UNTIL|VALID\s*THRU)[\s\:\-]+([0-9]{4}[\/\-\.][0-9]{1,2}[\/\-\.][0-9]{1,2})/i',
            '/(?:EXPIRATION|EXPIRY|EXPIRES|EXP\.?\s*DATE|VALID\s*UNTIL|VALID\s*THRU)[\s\:\-]+([0-9]{1,2}[\/\-\.][0-9]{1,2}[\/\-\.][0-9]{4})/i',
            '/(?:EXPIRATION|EXPIRY|EXPIRES|EXP\.?\s*DATE|VALID\s*UNTIL|VALID\s*THRU)[\s\:\-]+([0-9]{1,2}\s+[A-Za-z]{3,9}\s+[0-9]{4})/i',
            '/(?:EXPIRATION|EXPIRY|EXPIRES|EXP\.?\s*DATE|VALID\s*UNTIL|VALID\s*THRU)[\s\:\-]+([A-Za-z]{3,9}\s+[0-9]{1,2}[\,\s]+[0-9]{4})/i',
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $rawText, $matches)) {
                $rawDate = trim($matches[1]);
                $parsed = $this->parseDateString($rawDate);
                if ($parsed) {
                    return ['raw' => $rawDate, 'iso' => $parsed->toDateString()];
                }
            }
        }

        // General search for dates that look like expiration (e.g. year >= 2020)
        if (preg_match_all('/([0-9]{4}[\/\-][0-9]{2}[\/\-][0-9]{2}|[0-9]{2}[\/\-][0-9]{2}[\/\-][0-9]{4})/i', $rawText, $matches)) {
            $candidates = [];
            foreach ($matches[1] as $candidate) {
                $parsed = $this->parseDateString($candidate);
                if ($parsed && $parsed->year >= 2020 && $parsed->year <= 2040) {
                    $candidates[] = ['raw' => $candidate, 'iso' => $parsed->toDateString(), 'carbon' => $parsed];
                }
            }

            if (!empty($candidates)) {
                // Return latest date which typically represents the expiration date on IDs
                usort($candidates, fn($a, $b) => $b['carbon'] <=> $a['carbon']);
                return ['raw' => $candidates[0]['raw'], 'iso' => $candidates[0]['iso']];
            }
        }

        return ['raw' => null, 'iso' => null];
    }

    /**
     * Detect birth date.
     */
    protected function detectBirthDate(string $rawText): array
    {
        $patterns = [
            '/(?:BIRTH|DOB|DATE\s*OF\s*BIRTH|B-DAY)[\s\:\-]+([0-9]{4}[\/\-\.][0-9]{1,2}[\/\-\.][0-9]{1,2})/i',
            '/(?:BIRTH|DOB|DATE\s*OF\s*BIRTH|B-DAY)[\s\:\-]+([0-9]{1,2}[\/\-\.][0-9]{1,2}[\/\-\.][0-9]{4})/i',
            '/(?:BIRTH|DOB|DATE\s*OF\s*BIRTH|B-DAY)[\s\:\-]+([0-9]{1,2}\s+[A-Za-z]{3,9}\s+[0-9]{4})/i',
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $rawText, $matches)) {
                $raw = trim($matches[1]);
                $parsed = $this->parseDateString($raw);
                if ($parsed) {
                    return ['raw' => $raw, 'iso' => $parsed->toDateString()];
                }
            }
        }

        return ['raw' => null, 'iso' => null];
    }

    /**
     * Detect license number or government ID number.
     */
    protected function detectIdNumber(string $rawText, string $docType): ?string
    {
        // 1. Philippine Driver's License format: N01-18-012345 or D02-21-000123
        if (preg_match('/([A-Z][0-9]{2}[\-\s][0-9]{2}[\-\s][0-9]{6})/i', $rawText, $matches)) {
            return strtoupper(str_replace(' ', '-', trim($matches[1])));
        }

        // 2. Keyword-anchored ID numbers
        $patterns = [
            '/(?:LICENSE\s*NO\.?|DL\s*NO\.?|DRIVER\'S\s*LICENSE\s*NO\.?)[\s\:\-]+([A-Z0-9\-]{7,20})/i',
            '/(?:ID\s*NO\.?|ID\s*NUMBER|CRN|CARD\s*NO\.?)[\s\:\-]+([A-Z0-9\-]{6,25})/i',
            '/(?:PASSPORT\s*NO\.?)[\s\:\-]+([A-Z][0-9]{7,8})/i',
            '/(?:PHILSYS|PCN)[\s\:\-]+([0-9]{4}[\-\s][0-9]{4}[\-\s][0-9]{4}[\-\s][0-9]{4})/i',
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $rawText, $matches)) {
                $clean = trim($matches[1]);
                if (mb_strlen($clean) >= 5) {
                    return strtoupper($clean);
                }
            }
        }

        // 3. Fallback: PhilSys 16-digit card format
        if (preg_match('/([0-9]{4}[\-\s][0-9]{4}[\-\s][0-9]{4}[\-\s][0-9]{4})/', $rawText, $matches)) {
            return trim($matches[1]);
        }

        return null;
    }

    /**
     * Detect full name on the ID card.
     */
    protected function detectName(array $lines, string $rawText): ?string
    {
        // Keyword-anchored name: "NAME: LAST, FIRST MIDDLE"
        if (preg_match('/(?:NAME|FULL\s*NAME|BEARER)[\s\:\-]+([A-Za-z\s\,\.\-]+)/i', $rawText, $matches)) {
            $nameCandidate = trim($matches[1]);
            $firstLine = explode("\n", $nameCandidate)[0] ?? '';
            $firstLine = preg_replace('/[^A-Za-z\s\,\.]/', '', trim($firstLine));
            if (mb_strlen($firstLine) >= 4 && mb_strlen($firstLine) <= 60) {
                return ucwords(strtolower($firstLine));
            }
        }

        // Filter candidate lines with 2-4 capitalized words
        $blacklist = [
            'REPUBLIC', 'PHILIPPINES', 'TRANSPORTATION', 'DEPARTMENT', 'OFFICE',
            'LAND', 'GOVERNMENT', 'COMMISSION', 'NATIONAL', 'SECURITY', 'SYSTEM',
            'SIGNATURE', 'EXPIRATION', 'RESTRICTIONS', 'CONDITIONS', 'ADDRESS',
            'BLOOD', 'HEIGHT', 'WEIGHT', 'EYES', 'DATE', 'BIRTH', 'SEX'
        ];

        foreach ($lines as $line) {
            $words = preg_split('/\s+/', trim($line), -1, PREG_SPLIT_NO_EMPTY);
            if (count($words) >= 2 && count($words) <= 5) {
                $isBlacklisted = false;
                foreach ($words as $w) {
                    if (in_array(strtoupper($w), $blacklist)) {
                        $isBlacklisted = true;
                        break;
                    }
                }

                if (!$isBlacklisted && preg_match('/^[A-Za-z\s\,\.\-]+$/', $line)) {
                    if (mb_strlen($line) >= 5 && mb_strlen($line) <= 50) {
                        return ucwords(strtolower(trim($line)));
                    }
                }
            }
        }

        return null;
    }

    /**
     * Compare extracted OCR information against the customer's registered profile.
     */
    public function compareWithCustomer(
        User $user,
        Document $document,
        array $extracted,
        float $ocrConfidence,
        int $wordCount,
        string $rawText
    ): array {
        $checks = [];
        $issues = [];
        $recommendationLevel = 'approve_ready';

        // 1. Image Readability Check (Authentic Tesseract OCR metric)
        $readabilityStatus = 'pass';
        if ($ocrConfidence >= 70.0 && $wordCount >= 6) {
            $readabilityStatus = 'pass';
            $readabilityMsg = "High readability: Genuine Tesseract mean confidence is {$ocrConfidence}%. Recognized {$wordCount} words.";
        } elseif ($ocrConfidence >= 40.0 && $wordCount >= 3) {
            $readabilityStatus = 'warning';
            $readabilityMsg = "Moderate readability: Mean confidence is {$ocrConfidence}%. Text may be slightly skewed, low resolution, or glossy.";
            $issues[] = "Moderate OCR readability ({$ocrConfidence}%). Confirm details visually against the document image.";
            $recommendationLevel = 'caution_readability';
        } else {
            $readabilityStatus = 'fail';
            $readabilityMsg = "Low readability / blur warning: Mean confidence is {$ocrConfidence}% ({$wordCount} words recognized). Text is difficult to decipher.";
            $issues[] = "Document image has very low OCR readability ({$ocrConfidence}%). Image may be dark, blurry, or cropped.";
            $recommendationLevel = 'resubmit_suggested';
        }

        $checks[] = [
            'id' => 'readability',
            'name' => 'Image Readability & OCR Confidence',
            'status' => $readabilityStatus,
            'metric' => "{$ocrConfidence}%",
            'message' => $readabilityMsg,
        ];

        // 2. Customer Name Verification Check
        $nameCheck = $this->evaluateNameMatch($user->name, $extracted['detected_name'], $rawText);
        $checks[] = [
            'id' => 'name_match',
            'name' => 'Name Verification',
            'status' => $nameCheck['status'],
            'score' => $nameCheck['score'],
            'expected' => $user->name,
            'detected' => $extracted['detected_name'] ?? 'Not explicitly parsed',
            'message' => $nameCheck['message'],
        ];

        if ($nameCheck['status'] === 'fail') {
            $issues[] = "Customer name mismatch: Registered name is '{$user->name}', but detected name is '{$nameCheck['detected_label']}' (Similarity: {$nameCheck['score']}%).";
            $recommendationLevel = 'caution_mismatch';
        } elseif ($nameCheck['status'] === 'warning') {
            $issues[] = "Partial name match ({$nameCheck['score']}%). Verify maiden name, middle names, or suffixes manually.";
            if ($recommendationLevel === 'approve_ready') {
                $recommendationLevel = 'manual_review';
            }
        }

        // 3. License / ID Number Verification Check
        $idCheck = $this->evaluateIdMatch($user, $extracted['detected_id_number'], $rawText);
        $checks[] = [
            'id' => 'id_number_match',
            'name' => 'ID / License Number Verification',
            'status' => $idCheck['status'],
            'registered' => $idCheck['registered_value'] ?: 'None provided in profile',
            'detected' => $extracted['detected_id_number'] ?: 'Not detected',
            'message' => $idCheck['message'],
        ];

        if ($idCheck['status'] === 'fail') {
            $issues[] = "ID number discrepancy: Registered as '{$idCheck['registered_value']}' but detected as '{$extracted['detected_id_number']}'.";
            $recommendationLevel = 'caution_mismatch';
        } elseif ($idCheck['status'] === 'info') {
            // Customer didn't provide license number in profile yet
            $checks[count($checks) - 1]['status'] = 'info';
        }

        // 4. Expiration Date Check
        $expiryCheck = $this->evaluateExpiration($extracted['detected_expiry_date_parsed']);
        $checks[] = [
            'id' => 'expiration',
            'name' => 'License / ID Expiration Check',
            'status' => $expiryCheck['status'],
            'date' => $expiryCheck['date'],
            'days_remaining' => $expiryCheck['days_remaining'],
            'message' => $expiryCheck['message'],
        ];

        if ($expiryCheck['status'] === 'fail') {
            $issues[] = "EXPIRED DOCUMENT: Document expired on {$expiryCheck['date']} ({$expiryCheck['relative']}). Expired licenses cannot be accepted for car rentals.";
            $recommendationLevel = 'caution_expired';
        } elseif ($expiryCheck['status'] === 'warning') {
            $issues[] = "Expiring soon: Document will expire on {$expiryCheck['date']} ({$expiryCheck['relative']}). Ensure booking falls within valid period.";
            if ($recommendationLevel === 'approve_ready') {
                $recommendationLevel = 'caution_expiry';
            }
        } elseif ($expiryCheck['status'] === 'unknown') {
            $issues[] = "Expiration date could not be automatically confirmed by OCR. Please inspect the document image manually.";
            if ($recommendationLevel === 'approve_ready') {
                $recommendationLevel = 'manual_review';
            }
        }

        // 5. Completeness Check
        $completenessCheck = $this->evaluateCompleteness($extracted, $user);
        $checks[] = [
            'id' => 'completeness',
            'name' => 'Information Completeness',
            'status' => $completenessCheck['status'],
            'message' => $completenessCheck['message'],
        ];

        if ($completenessCheck['missing']) {
            $issues[] = "Missing document fields: " . implode(', ', $completenessCheck['missing']) . ".";
        }

        // Low readability / unreadable image takes precedence as resubmission is required
        if ($readabilityStatus === 'fail') {
            $recommendationLevel = 'resubmit_suggested';
        }

        // Generate Human Admin Recommendation Text
        $recommendationText = $this->generateRecommendationText($recommendationLevel, $issues);

        return [
            'readability_status' => $readabilityStatus,
            'recommendation_level' => $recommendationLevel,
            'recommendation' => $recommendationText,
            'confidence_metrics' => [
                'mean_confidence' => $ocrConfidence,
                'word_count' => $wordCount,
            ],
            'name_match_score' => $nameCheck['score'],
            'checks' => $checks,
            'issues' => $issues,
            'summary_disclaimer' => "AI & local Tesseract OCR assist the review process. Final approval, rejection, or resubmission request is exclusively determined by an administrator.",
        ];
    }

    /**
     * Compute name match similarity between registered name and detected text.
     */
    protected function evaluateNameMatch(string $userName, ?string $detectedName, string $rawText): array
    {
        $cleanUser = mb_strtolower(trim($userName));
        $userTokens = array_values(array_filter(preg_split('/\s+/', $cleanUser)));

        if (empty($userTokens)) {
            return [
                'status' => 'warning',
                'score' => 0.0,
                'detected_label' => $detectedName ?: 'None',
                'message' => 'User profile has an empty name.',
            ];
        }

        // Check if all tokens appear in raw OCR text
        $rawLower = mb_strtolower($rawText);
        $tokensFound = 0;
        foreach ($userTokens as $token) {
            if (mb_strlen($token) >= 2 && str_contains($rawLower, $token)) {
                $tokensFound++;
            }
        }

        $tokenScore = round(($tokensFound / count($userTokens)) * 100, 1);

        // If detectedName is present, also calculate direct string similarity
        $directScore = 0.0;
        if ($detectedName) {
            $cleanDetected = mb_strtolower(trim($detectedName));
            similar_text($cleanUser, $cleanDetected, $percent);
            $directScore = round($percent, 1);
        }

        $finalScore = max($tokenScore, $directScore);

        if ($finalScore >= 80.0) {
            return [
                'status' => 'pass',
                'score' => $finalScore,
                'detected_label' => $detectedName ?: $userName,
                'message' => "High confidence match ({$finalScore}%). Customer's registered name matched the extracted document text.",
            ];
        } elseif ($finalScore >= 50.0) {
            return [
                'status' => 'warning',
                'score' => $finalScore,
                'detected_label' => $detectedName ?: 'Partial match in text',
                'message' => "Partial match ({$finalScore}%). Some name tokens matched. Admin should confirm middle names or maiden name.",
            ];
        } else {
            return [
                'status' => 'fail',
                'score' => $finalScore,
                'detected_label' => $detectedName ?: 'Unmatched',
                'message' => "Potential mismatch ({$finalScore}% similarity). Registered name differs from document text.",
            ];
        }
    }

    /**
     * Evaluate ID / License Number match against registered user numbers.
     */
    protected function evaluateIdMatch(User $user, ?string $detectedId, string $rawText): array
    {
        $registeredNumbers = array_filter([
            'drivers_license' => $user->drivers_license_number,
            'id_number' => $user->id_number,
        ]);

        if (empty($registeredNumbers)) {
            return [
                'status' => 'info',
                'registered_value' => null,
                'message' => 'Customer has not registered an ID or license number in their profile.',
            ];
        }

        $cleanDetected = $detectedId ? preg_replace('/[^A-Za-z0-9]/', '', strtoupper($detectedId)) : '';
        $rawClean = preg_replace('/[^A-Za-z0-9]/', '', strtoupper($rawText));

        foreach ($registeredNumbers as $field => $val) {
            $cleanRegistered = preg_replace('/[^A-Za-z0-9]/', '', strtoupper($val));
            if (empty($cleanRegistered)) {
                continue;
            }

            // Direct match with detected ID or raw text contains registered number
            if ($cleanDetected && $cleanRegistered === $cleanDetected) {
                return [
                    'status' => 'pass',
                    'registered_value' => $val,
                    'message' => "Exact match with registered {$field} ({$val}).",
                ];
            }

            if (str_contains($rawClean, $cleanRegistered)) {
                return [
                    'status' => 'pass',
                    'registered_value' => $val,
                    'message' => "Registered number {$val} was located within the document text.",
                ];
            }
        }

        if ($detectedId) {
            return [
                'status' => 'fail',
                'registered_value' => implode(' / ', $registeredNumbers),
                'message' => "Detected ID ({$detectedId}) does not match the registered profile number.",
            ];
        }

        return [
            'status' => 'warning',
            'registered_value' => implode(' / ', $registeredNumbers),
            'message' => "ID number could not be clearly extracted. Verify visually against registered number.",
        ];
    }

    /**
     * Evaluate license expiration date.
     */
    protected function evaluateExpiration(?string $isoDate): array
    {
        if (!$isoDate) {
            return [
                'status' => 'unknown',
                'date' => null,
                'days_remaining' => null,
                'relative' => null,
                'message' => 'Expiration date not found in document text. Inspect image directly.',
            ];
        }

        try {
            $date = Carbon::parse($isoDate)->startOfDay();
            $today = Carbon::today();
            $diffDays = $today->diffInDays($date, false);

            if ($diffDays < 0) {
                $daysAgo = abs($diffDays);
                return [
                    'status' => 'fail',
                    'date' => $date->format('Y-m-d'),
                    'days_remaining' => $diffDays,
                    'relative' => "expired {$daysAgo} days ago",
                    'message' => "License expired on {$date->format('M d, Y')} ({$daysAgo} days ago). Not eligible for rental.",
                ];
            } elseif ($diffDays <= 30) {
                return [
                    'status' => 'warning',
                    'date' => $date->format('Y-m-d'),
                    'days_remaining' => $diffDays,
                    'relative' => "expires in {$diffDays} days",
                    'message' => "License expires soon on {$date->format('M d, Y')} (in {$diffDays} days).",
                ];
            } else {
                return [
                    'status' => 'pass',
                    'date' => $date->format('Y-m-d'),
                    'days_remaining' => $diffDays,
                    'relative' => "valid for {$diffDays} days",
                    'message' => "License is valid until {$date->format('M d, Y')}.",
                ];
            }
        } catch (\Throwable $e) {
            return [
                'status' => 'unknown',
                'date' => $isoDate,
                'days_remaining' => null,
                'relative' => null,
                'message' => 'Could not parse expiration date format.',
            ];
        }
    }

    /**
     * Check if key expected fields were extracted.
     */
    protected function evaluateCompleteness(array $extracted, User $user): array
    {
        $missing = [];

        if (empty($extracted['detected_name'])) {
            $missing[] = 'Document Name';
        }
        if (empty($extracted['detected_id_number'])) {
            $missing[] = 'License/ID Number';
        }
        if (empty($extracted['detected_expiry_date_parsed'])) {
            $missing[] = 'Expiration Date';
        }

        $count = count($missing);
        if ($count === 0) {
            return [
                'status' => 'pass',
                'missing' => [],
                'message' => 'All core identity fields (Name, ID Number, Expiry Date) were recognized.',
            ];
        } elseif ($count <= 2) {
            return [
                'status' => 'warning',
                'missing' => $missing,
                'message' => 'Some fields could not be isolated automatically: ' . implode(', ', $missing) . '.',
            ];
        } else {
            return [
                'status' => 'fail',
                'missing' => $missing,
                'message' => 'Critical identification fields missing from OCR extraction.',
            ];
        }
    }

    /**
     * Generate clear recommendations for administrators.
     */
    protected function generateRecommendationText(string $level, array $issues): string
    {
        switch ($level) {
            case 'caution_expired':
                return "Caution: Document appears EXPIRED. Drivers with expired licenses cannot legally operate rental vehicles. Verify carefully before taking action.";
            case 'caution_mismatch':
                return "Caution: Mismatch detected between document text and registered profile details. Inspect side-by-side comparison closely.";
            case 'caution_expiry':
                return "Caution: Document is near its expiration date. Confirm rental reservation dates do not exceed validity.";
            case 'resubmit_suggested':
                return "Resubmission Suggested: Image readability is poor or key fields are obscured. Consider requesting a clear, uncropped photo.";
            case 'manual_review':
                return "Manual Review Advised: Some identity fields require manual visual verification by the administrator.";
            default:
                return "Ready for Admin Review: High OCR confidence and all automated checks match registered customer information.";
        }
    }

    /**
     * Safely parse a date string.
     */
    protected function parseDateString(string $dateStr): ?Carbon
    {
        $clean = trim($dateStr);
        // Replace multiple spaces and common OCR noise
        $clean = preg_replace('/\s+/', ' ', $clean);

        $formats = [
            'Y-m-d', 'Y/m/d', 'Y.m.d',
            'm/d/Y', 'd/m/Y', 'm-d-Y', 'd-m-Y',
            'd M Y', 'd F Y', 'M d Y', 'F d Y',
            'd-M-Y', 'd-F-Y', 'M-d-Y',
        ];

        foreach ($formats as $fmt) {
            try {
                $c = Carbon::createFromFormat($fmt, $clean);
                if ($c && $c->year >= 1930 && $c->year <= 2060) {
                    return $c;
                }
            } catch (\Throwable $e) {
                // Try next format
            }
        }

        try {
            $c = Carbon::parse($clean);
            if ($c && $c->year >= 1930 && $c->year <= 2060) {
                return $c;
            }
        } catch (\Throwable $e) {
            // Unparseable
        }

        return null;
    }
}
