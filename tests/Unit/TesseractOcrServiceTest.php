<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Services\DocumentVerification\TesseractOcrService;

class TesseractOcrServiceTest extends TestCase
{
    protected TesseractOcrService $ocrService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->ocrService = new TesseractOcrService();
    }

    public function test_it_resolves_local_tesseract_binary(): void
    {
        $this->assertTrue($this->ocrService->isAvailable(), 'Tesseract binary should be detected on local host.');
        $this->assertNotEmpty($this->ocrService->getBinaryPath());
    }

    public function test_it_queries_tesseract_version(): void
    {
        $version = $this->ocrService->getVersion();
        $this->assertNotNull($version);
        $this->assertStringContainsString('tesseract', strtolower($version));
    }

    public function test_it_extracts_real_ocr_text_and_tsv_confidence_from_local_image(): void
    {
        $sampleImage = public_path('uploads/documents/1785236948_6a688dd418464.jpg');

        if (!file_exists($sampleImage)) {
            $this->markTestSkipped('Sample test image not present.');
        }

        $result = $this->ocrService->extract($sampleImage);

        $this->assertTrue($result['success']);
        $this->assertNotEmpty($result['raw_text']);
        $this->assertGreaterThan(0.0, $result['mean_confidence'], 'Mean confidence should be a real positive number.');
        $this->assertGreaterThan(0, $result['word_count']);
    }

    public function test_it_returns_structured_error_when_file_is_missing(): void
    {
        $result = $this->ocrService->extract('non_existent_file_path.jpg');

        $this->assertFalse($result['success']);
        $this->assertStringContainsString('File not found', $result['error']);
        $this->assertEquals(0.0, $result['mean_confidence']);
    }
}
