<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Vehicle;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Carbon\Carbon;

class LegacyImportController extends Controller
{
    /**
     * Download sample CSV template for historical import.
     */
    public function downloadTemplate()
    {
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="elfaa_legacy_import_template.csv"',
        ];

        $columns = [
            'customer_name',
            'customer_email',
            'vehicle_name',
            'start_date',
            'end_date',
            'total_price',
            'amount_paid',
            'status',
            'pickup_location',
            'notes',
        ];

        $sampleRows = [
            [
                'Juan Dela Cruz',
                'juan@example.com',
                'Toyota Vios',
                '2024-01-15',
                '2024-01-18',
                '3600.00',
                '3600.00',
                'completed',
                'San Jose City Hub',
                'Paid cash upon pickup',
            ],
            [
                'Maria Santos',
                'maria@example.com',
                'Mitsubishi Montero Sport',
                '2024-02-10',
                '2024-02-14',
                '12000.00',
                '5000.00',
                'completed',
                'Airport Pickup',
                'Partial COD payment - PHP 7,000 balance remaining',
            ],
            [
                'Carlos Reyes',
                'carlos@example.com',
                'Nissan Urvan Shuttle',
                '2024-03-01',
                '2024-03-03',
                '7500.00',
                '7500.00',
                'completed',
                'City Garage',
                'Fully settled legacy booking',
            ],
        ];

        $callback = function () use ($columns, $sampleRows) {
            $file = fopen('php://output', 'w');
            fputcsv($file, $columns);
            foreach ($sampleRows as $row) {
                fputcsv($file, $row);
            }
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Parse uploaded CSV file and return preview rows + detected headers.
     * Uses PHP built-in str_getcsv — no extra dependencies needed.
     */
    public function previewImport(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,txt|max:5120',
        ]);

        $file = $request->file('file');
        $rows = [];
        $headers = [];

        if (($handle = fopen($file->getPathname(), 'r')) !== false) {
            $rowCount = 0;
            while (($data = fgetcsv($handle, 1000, ',')) !== false) {
                if ($rowCount === 0) {
                    $headers = array_map('trim', $data);
                } elseif ($rowCount <= 10) {
                    $rows[] = $data;
                }
                $rowCount++;
            }
            fclose($handle);
        }

        // Count total rows
        $totalRows = max(0, $rowCount - 1);

        // Store the full CSV temporarily for actual import
        $tempPath = $file->storeAs('imports', 'legacy_import_preview.csv', 'local');

        return response()->json([
            'headers' => $headers,
            'preview_rows' => $rows,
            'total_rows' => $totalRows,
            'temp_path' => $tempPath,
        ]);
    }

    /**
     * Process the full import with field mapping, validation,
     * duplicate detection, and legacy tagging.
     */
    public function processImport(Request $request)
    {
        $request->validate([
            'mapping' => 'required|array',
            'temp_path' => 'required|string',
        ]);

        $mapping = $request->input('mapping'); // e.g. { "customer_name": "Column A", "vehicle_name": "Column B", ... }
        $batchId = 'LEGACY-' . strtoupper(Str::random(8)) . '-' . now()->format('Ymd');

        $fullPath = storage_path('app/' . $request->input('temp_path'));

        if (!file_exists($fullPath)) {
            return response()->json(['error' => 'Import file not found. Please re-upload.'], 422);
        }

        $headers = [];
        $allRows = [];

        if (($handle = fopen($fullPath, 'r')) !== false) {
            $rowIdx = 0;
            while (($data = fgetcsv($handle, 1000, ',')) !== false) {
                if ($rowIdx === 0) {
                    $headers = array_map('trim', $data);
                } else {
                    $allRows[] = array_combine($headers, $data);
                }
                $rowIdx++;
            }
            fclose($handle);
        }

        // Helper to get mapped column value
        $get = function ($row, $key) use ($mapping) {
            $col = $mapping[$key] ?? null;
            return $col ? trim($row[$col] ?? '') : '';
        };

        $results = ['success' => 0, 'skipped' => 0, 'errors' => []];

        // Get all vehicles and users for matching
        $vehicles = Vehicle::all()->keyBy(fn($v) => strtolower($v->name));
        $users = User::all()->keyBy(fn($u) => strtolower($u->email));

        foreach ($allRows as $lineNum => $row) {
            $lineNum += 2; // Account for header row (1-indexed)

            try {
                $customerName = $get($row, 'customer_name');
                $vehicleName  = $get($row, 'vehicle_name');
                $startDate    = $get($row, 'start_date');
                $endDate      = $get($row, 'end_date');
                $totalPrice   = $get($row, 'total_price');
                $status       = $get($row, 'status') ?: 'completed';
                $amountPaid   = $get($row, 'amount_paid') ?: '0';
                $notes        = $get($row, 'notes') ?: '';
                $customerEmail = $get($row, 'customer_email') ?: '';

                // Validate required fields
                if (empty($customerName) || empty($vehicleName) || empty($startDate) || empty($totalPrice)) {
                    $results['errors'][] = [
                        'row' => $lineNum,
                        'message' => "Row {$lineNum}: Missing required fields (Customer Name, Vehicle, Start Date, or Total Price).",
                    ];
                    continue;
                }

                // Parse dates
                try {
                    $startDt = Carbon::parse($startDate);
                    $endDt = !empty($endDate) ? Carbon::parse($endDate) : $startDt->copy()->addDay();
                } catch (\Exception $e) {
                    $results['errors'][] = ['row' => $lineNum, 'message' => "Row {$lineNum}: Invalid date format — {$startDate}"];
                    continue;
                }

                // Find or create vehicle (by name match)
                $vehicle = $vehicles->get(strtolower($vehicleName));

                // Find or create user
                $user = null;
                if (!empty($customerEmail)) {
                    $user = $users->get(strtolower($customerEmail));
                }
                if (!$user) {
                    // Find by name as fallback
                    $user = User::whereRaw('LOWER(name) = ?', [strtolower($customerName)])->first();
                }
                if (!$user) {
                    // Create a placeholder legacy client account
                    $user = User::create([
                        'name' => $customerName,
                        'email' => $customerEmail ?: 'legacy_' . Str::slug($customerName) . '_' . Str::random(4) . '@elfaa.legacy',
                        'password' => bcrypt(Str::random(16)),
                        'role' => 'client',
                        'email_verified_at' => now(),
                    ]);
                    $users[$user->email] = $user;
                }

                // Duplicate detection: booking from same customer + same vehicle + same start date
                $duplicate = Booking::where('user_id', $user->id)
                    ->when($vehicle, fn($q) => $q->where('vehicle_id', $vehicle->id))
                    ->whereDate('start_datetime', $startDt->toDateString())
                    ->exists();

                if ($duplicate) {
                    $results['skipped']++;
                    continue;
                }

                $totalPriceNum = (float) preg_replace('/[^0-9.]/', '', $totalPrice);
                $amountPaidNum = (float) preg_replace('/[^0-9.]/', '', $amountPaid);
                $remaining = max(0, $totalPriceNum - $amountPaidNum);
                $paymentStatus = $remaining <= 0 ? 'paid' : ($amountPaidNum > 0 ? 'partial' : 'unpaid');

                // Map status to system statuses
                $statusMap = [
                    'completed' => 'completed', 'done' => 'completed', 'finished' => 'completed',
                    'confirmed' => 'confirmed', 'active' => 'confirmed', 'ongoing' => 'confirmed',
                    'pending' => 'pending', 'cancelled' => 'rejected', 'canceled' => 'rejected',
                ];
                $mappedStatus = $statusMap[strtolower($status)] ?? 'completed';

                Booking::create([
                    'user_id'          => $user->id,
                    'vehicle_id'       => $vehicle?->id,
                    'start_datetime'   => $startDt,
                    'end_datetime'     => $endDt,
                    'original_price'   => $totalPriceNum,
                    'total_price'      => $totalPriceNum,
                    'amount_paid'      => $amountPaidNum,
                    'payment_status'   => $paymentStatus,
                    'status'           => $mappedStatus,
                    'pickup_location'  => $get($row, 'pickup_location') ?: 'Legacy Record',
                    'is_legacy'        => true,
                    'legacy_notes'     => $notes,
                    'import_batch_id'  => $batchId,
                    'created_at'       => $startDt,
                    'updated_at'       => now(),
                ]);

                $results['success']++;

            } catch (\Exception $e) {
                $results['errors'][] = [
                    'row' => $lineNum,
                    'message' => "Row {$lineNum}: Unexpected error — " . $e->getMessage(),
                ];
            }
        }

        return response()->json([
            'batch_id' => $batchId,
            'success'  => $results['success'],
            'skipped'  => $results['skipped'],
            'errors'   => $results['errors'],
            'total'    => count($allRows),
        ]);
    }
}
