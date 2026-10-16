<?php

namespace App\Services\DocumentVerification;

use Symfony\Component\Process\Process;
use Symfony\Component\Process\Exception\ProcessFailedException;
use Illuminate\Support\Facades\Log;

class TesseractOcrService
{
    protected ?string $binaryPath = null;
    protected int $timeout;

    public function __construct()
    {
        $this->timeout = (int) config('services.tesseract.timeout', 60);
        $this->binaryPath = $this->resolveBinaryPath();
    }

    /**
     * Resolve the location of the tesseract binary.
     */
    public function resolveBinaryPath(): ?string
    {
        $configured = config('services.tesseract.path');
        if ($configured && file_exists($configured)) {
            return $configured;
        }

        // Common Windows paths
        $windowsCandidates = [
            'C:\\Program Files\\Tesseract-OCR\\tesseract.exe',
            'C:\\Program Files (x86)\\Tesseract-OCR\\tesseract.exe',
            getenv('LOCALAPPDATA') . '\\Programs\\Tesseract-OCR\\tesseract.exe',
        ];

        foreach ($windowsCandidates as $candidate) {
            if ($candidate && file_exists($candidate)) {
                return $candidate;
            }
        }

        // Common Unix / Linux paths
        $unixCandidates = [
            '/usr/bin/tesseract',
            '/usr/local/bin/tesseract',
            '/opt/homebrew/bin/tesseract',
        ];

        foreach ($unixCandidates as $candidate) {
            if (file_exists($candidate)) {
                return $candidate;
            }
        }

        // Try 'where' or 'which' or system PATH
        $finderCmd = PHP_OS_FAMILY === 'Windows' ? ['where', 'tesseract'] : ['which', 'tesseract'];
        try {
            $process = new Process($finderCmd);
            $process->run();
            if ($process->isSuccessful()) {
                $output = trim(explode("\n", $process->getOutput())[0] ?? '');
                if ($output && file_exists($output)) {
                    return $output;
                }
            }
        } catch (\Throwable $e) {
            // Silently fall through
        }

        return null;
    }

    /**
     * Check if Tesseract OCR is available on the local host.
     */
    public function isAvailable(): bool
    {
        return !empty($this->binaryPath) && file_exists($this->binaryPath);
    }

    /**
     * Get the detected binary path.
     */
    public function getBinaryPath(): ?string
    {
        return $this->binaryPath;
    }

    /**
     * Get the version string of the installed Tesseract.
     */
    public function getVersion(): ?string
    {
        if (!$this->isAvailable()) {
            return null;
        }

        try {
            $process = new Process([$this->binaryPath, '--version']);
            $process->run();
            if ($process->isSuccessful()) {
                return trim(explode("\n", $process->getOutput())[0] ?? 'Tesseract OCR');
            }
        } catch (\Throwable $e) {
            Log::warning('Failed to query Tesseract version: ' . $e->getMessage());
        }

        return null;
    }

    /**
     * Extract text and genuine confidence data from a document file.
     *
     * @param string $absoluteFilePath
     * @return array
     */
    public function extract(string $absoluteFilePath): array
    {
        if (!file_exists($absoluteFilePath)) {
            return [
                'success' => false,
                'raw_text' => '',
                'mean_confidence' => 0.0,
                'word_count' => 0,
                'char_count' => 0,
                'words' => [],
                'lines' => [],
                'error' => "File not found at path: {$absoluteFilePath}",
            ];
        }

        if (!$this->isAvailable()) {
            return [
                'success' => false,
                'raw_text' => '',
                'mean_confidence' => 0.0,
                'word_count' => 0,
                'char_count' => 0,
                'words' => [],
                'lines' => [],
                'error' => 'Tesseract OCR binary is not installed or not found at configured path. Please verify local installation.',
            ];
        }

        $extension = strtolower(pathinfo($absoluteFilePath, PATHINFO_EXTENSION));

        // Tesseract handles image formats directly (jpg, jpeg, png, webp, tif, tiff, bmp)
        // If it's a PDF, we check if rasterizer is present or note PDF limitations
        if ($extension === 'pdf') {
            return $this->handlePdfExtraction($absoluteFilePath);
        }

        try {
            // 1. Run standard OCR to get formatted raw text
            $textProcess = new Process([$this->binaryPath, $absoluteFilePath, 'stdout'], null, null, null, $this->timeout);
            $textProcess->run();

            if (!$textProcess->isSuccessful()) {
                $err = trim($textProcess->getErrorOutput()) ?: 'OCR process terminated with an error.';
                return [
                    'success' => false,
                    'raw_text' => '',
                    'mean_confidence' => 0.0,
                    'word_count' => 0,
                    'char_count' => 0,
                    'words' => [],
                    'lines' => [],
                    'error' => $err,
                ];
            }

            $rawText = trim($textProcess->getOutput());

            // 2. Run TSV mode to capture real token coordinates and confidence values
            $tsvProcess = new Process([$this->binaryPath, $absoluteFilePath, 'stdout', 'tsv'], null, null, null, $this->timeout);
            $tsvProcess->run();

            $tsvOutput = $tsvProcess->isSuccessful() ? $tsvProcess->getOutput() : '';
            $tsvParsed = $this->parseTsvOutput($tsvOutput);

            return [
                'success' => true,
                'raw_text' => $rawText,
                'mean_confidence' => $tsvParsed['mean_confidence'],
                'word_count' => $tsvParsed['word_count'] ?: count(preg_split('/\s+/', $rawText, -1, PREG_SPLIT_NO_EMPTY)),
                'char_count' => mb_strlen($rawText),
                'words' => $tsvParsed['words'],
                'lines' => $tsvParsed['lines'],
                'error' => null,
            ];
        } catch (\Throwable $e) {
            Log::error('Tesseract OCR extraction exception: ' . $e->getMessage(), ['file' => $absoluteFilePath]);
            return [
                'success' => false,
                'raw_text' => '',
                'mean_confidence' => 0.0,
                'word_count' => 0,
                'char_count' => 0,
                'words' => [],
                'lines' => [],
                'error' => 'OCR execution failed: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Parse Tesseract TSV output into token confidences and line groupings.
     */
    protected function parseTsvOutput(string $tsv): array
    {
        $lines = explode("\n", trim($tsv));
        if (count($lines) < 2) {
            return [
                'mean_confidence' => 0.0,
                'word_count' => 0,
                'words' => [],
                'lines' => [],
            ];
        }

        $header = str_getcsv(array_shift($lines), "\t");
        $confIdx = array_search('conf', $header);
        $textIdx = array_search('text', $header);
        $levelIdx = array_search('level', $header);
        $lineNumIdx = array_search('line_num', $header);

        $validConfidences = [];
        $words = [];
        $groupedLines = [];

        foreach ($lines as $row) {
            $cols = str_getcsv($row, "\t");
            if (count($cols) < count($header)) {
                continue;
            }

            $conf = floatval($cols[$confIdx] ?? -1);
            $text = trim($cols[$textIdx] ?? '');
            $level = intval($cols[$levelIdx] ?? 0);
            $lineNum = intval($cols[$lineNumIdx] ?? 0);

            // Level 5 corresponds to word tokens in Tesseract TSV
            if ($level === 5 && $text !== '' && $conf >= 0) {
                $validConfidences[] = $conf;
                $words[] = [
                    'text' => $text,
                    'confidence' => round($conf, 2),
                    'line' => $lineNum,
                ];

                $groupedLines[$lineNum][] = $text;
            }
        }

        $meanConf = count($validConfidences) > 0
            ? round(array_sum($validConfidences) / count($validConfidences), 2)
            : 0.0;

        $flatLines = array_values(array_map(function ($words) {
            return implode(' ', $words);
        }, $groupedLines));

        return [
            'mean_confidence' => $meanConf,
            'word_count' => count($words),
            'words' => array_slice($words, 0, 100), // Cap words array for compact storage
            'lines' => $flatLines,
        ];
    }

    /**
     * Handle PDF documents when uploaded.
     */
    protected function handlePdfExtraction(string $pdfPath): array
    {
        // Try reading any plain text in the PDF stream without external paid APIs
        $content = @file_get_contents($pdfPath);
        $extractedText = '';

        if ($content !== false) {
            // Simple plain text stream extractor for digital PDFs
            if (preg_match_all('/\((.*?)\)\s*Tj/s', $content, $matches)) {
                $extractedText = implode(' ', $matches[1]);
            } elseif (preg_match_all('/\[(.*?)\]\s*TJ/s', $content, $matches)) {
                $extractedText = implode(' ', $matches[1]);
            }
        }

        $extractedText = trim(strip_tags($extractedText));

        if (!empty($extractedText) && mb_strlen($extractedText) > 20) {
            $words = preg_split('/\s+/', $extractedText, -1, PREG_SPLIT_NO_EMPTY);
            return [
                'success' => true,
                'raw_text' => $extractedText,
                'mean_confidence' => 85.0, // Text layer directly read
                'word_count' => count($words),
                'char_count' => mb_strlen($extractedText),
                'words' => [],
                'lines' => explode("\n", $extractedText),
                'error' => null,
            ];
        }

        return [
            'success' => false,
            'raw_text' => '',
            'mean_confidence' => 0.0,
            'word_count' => 0,
            'char_count' => 0,
            'words' => [],
            'lines' => [],
            'error' => 'PDF uploaded without readable text layer. For local OCR scanning, please upload document as high-resolution photo or scan (JPG, PNG, WebP). An administrator can review the PDF manually.',
        ];
    }
}
