<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Models\User;
use App\Models\Document;
use App\Services\DocumentVerification\DocumentVerificationService;
use App\Services\DocumentVerification\TesseractOcrService;

class DocumentVerificationServiceTest extends TestCase
{
    protected DocumentVerificationService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $ocrMock = new TesseractOcrService();
        $this->service = new DocumentVerificationService($ocrMock);
    }

    public function test_it_extracts_philippine_drivers_license_fields_from_ocr_text(): void
    {
        $rawText = "REPUBLIC OF THE PHILIPPINES\n" .
                   "DEPARTMENT OF TRANSPORTATION\n" .
                   "LAND TRANSPORTATION OFFICE\n" .
                   "DRIVER'S LICENSE\n" .
                   "DL NO: N01-19-123456\n" .
                   "NAME: DELA CRUZ, JUAN MIGUEL\n" .
                   "DOB: 1992-05-14\n" .
                   "EXPIRATION DATE: 2029-05-14\n" .
                   "RESTRICTIONS: 1, 2";

        $extracted = $this->service->extractIdentityFields($rawText, 'gov_id_1');

        $this->assertEquals("Driver's License", $extracted['detected_doc_type']);
        $this->assertEquals("N01-19-123456", $extracted['detected_id_number']);
        $this->assertEquals("2029-05-14", $extracted['detected_expiry_date_parsed']);
    }

    public function test_it_detects_expired_license_properly(): void
    {
        $user = new User([
            'name' => 'Juan Dela Cruz',
            'drivers_license_number' => 'N01-19-123456',
        ]);

        $document = new Document(['type' => 'gov_id_1']);

        $extracted = [
            'detected_doc_type' => "Driver's License",
            'detected_name' => 'Juan Dela Cruz',
            'detected_id_number' => 'N01-19-123456',
            'detected_expiry_date_parsed' => '2023-01-15', // Past date
            'detected_expiry_date' => '2023-01-15',
            'detected_birth_date' => '1992-05-14',
            'detected_birth_date_parsed' => '1992-05-14',
        ];

        $summary = $this->service->compareWithCustomer(
            $user,
            $document,
            $extracted,
            88.5,
            24,
            "SAMPLE TEXT WITH Juan Dela Cruz AND N01-19-123456 EXPIRATION DATE 2023-01-15"
        );

        $this->assertEquals('caution_expired', $summary['recommendation_level']);
        $this->assertTrue(collect($summary['issues'])->some(fn($i) => str_contains($i, 'EXPIRED')));
    }

    public function test_it_detects_name_and_id_mismatch(): void
    {
        $user = new User([
            'name' => 'Roberto Alvarez',
            'drivers_license_number' => 'A02-22-999999',
        ]);

        $document = new Document(['type' => 'gov_id_1']);

        $extracted = [
            'detected_doc_type' => "Driver's License",
            'detected_name' => 'Maria Kristina Santos',
            'detected_id_number' => 'N01-18-111111',
            'detected_expiry_date_parsed' => '2028-10-10',
            'detected_expiry_date' => '2028-10-10',
            'detected_birth_date' => '1995-03-20',
            'detected_birth_date_parsed' => '1995-03-20',
        ];

        $summary = $this->service->compareWithCustomer(
            $user,
            $document,
            $extracted,
            91.0,
            30,
            "SAMPLE TEXT FOR Maria Kristina Santos WITH N01-18-111111"
        );

        $this->assertEquals('caution_mismatch', $summary['recommendation_level']);
        $this->assertTrue(collect($summary['issues'])->some(fn($i) => str_contains($i, 'Customer name mismatch') || str_contains($i, 'discrepancy')));
    }

    public function test_it_detects_low_readability_when_ocr_confidence_is_poor(): void
    {
        $user = new User([
            'name' => 'Juan Dela Cruz',
        ]);

        $document = new Document(['type' => 'gov_id_1']);

        $extracted = [
            'detected_doc_type' => "Government-Issued ID",
            'detected_name' => null,
            'detected_id_number' => null,
            'detected_expiry_date_parsed' => null,
            'detected_expiry_date' => null,
            'detected_birth_date' => null,
            'detected_birth_date_parsed' => null,
        ];

        $summary = $this->service->compareWithCustomer(
            $user,
            $document,
            $extracted,
            28.4, // low confidence
            2,
            "ab.. x"
        );

        $this->assertEquals('fail', $summary['readability_status']);
        $this->assertEquals('resubmit_suggested', $summary['recommendation_level']);
    }
}
