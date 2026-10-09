import React, { useState, useRef } from 'react';
import { router } from '@inertiajs/react';
import {
    X, Upload, FileText, CheckCircle2, AlertTriangle,
    AlertCircle, ArrowRight, Download, RefreshCw, History
} from 'lucide-react';

const SYSTEM_FIELDS = [
    { key: 'customer_name', label: 'Customer Name', required: true },
    { key: 'customer_email', label: 'Customer Email', required: false },
    { key: 'vehicle_name', label: 'Vehicle Name', required: true },
    { key: 'start_date', label: 'Rental Start Date', required: true },
    { key: 'end_date', label: 'Rental End Date', required: false },
    { key: 'total_price', label: 'Total Price (PHP)', required: true },
    { key: 'amount_paid', label: 'Amount Paid (PHP)', required: false },
    { key: 'status', label: 'Booking Status', required: false },
    { key: 'pickup_location', label: 'Pickup Location', required: false },
    { key: 'notes', label: 'Notes / Remarks', required: false },
];

export default function LegacyImportModal({ onClose }) {
    const [step, setStep] = useState('upload'); // upload | mapping | importing | results
    const [csvFile, setCsvFile] = useState(null);
    const [previewData, setPreviewData] = useState(null); // { headers, preview_rows, total_rows, temp_path }
    const [mapping, setMapping] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [importResults, setImportResults] = useState(null);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef();

    const handleFileSelect = (file) => {
        if (!file) return;
        if (!file.name.endsWith('.csv') && !file.name.endsWith('.txt')) {
            alert('Please upload a CSV file (.csv or .txt)');
            return;
        }
        setCsvFile(file);
    };

    const handlePreview = async () => {
        if (!csvFile) return;
        setIsLoading(true);

        const formData = new FormData();
        formData.append('file', csvFile);
        formData.append('_token', document.querySelector('meta[name="csrf-token"]')?.content || '');

        try {
            const response = await fetch(route('admin.import.preview'), {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();

            if (data.error) {
                alert('Error parsing file: ' + data.error);
                return;
            }

            setPreviewData(data);

            // Auto-map columns by matching names
            const autoMapping = {};
            SYSTEM_FIELDS.forEach(field => {
                const match = data.headers.find(h =>
                    h.toLowerCase().replace(/[\s_-]/g, '') === field.key.replace(/_/g, '')
                    || h.toLowerCase().includes(field.key.replace(/_/g, ' ').split(' ')[0])
                );
                if (match) autoMapping[field.key] = match;
            });
            setMapping(autoMapping);
            setStep('mapping');
        } catch (err) {
            alert('Failed to parse file. Please check the format and try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleImport = async () => {
        setStep('importing');
        setIsLoading(true);

        try {
            const response = await fetch(route('admin.import.process'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || '',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    mapping,
                    temp_path: previewData.temp_path,
                }),
            });
            const data = await response.json();
            setImportResults(data);
            setStep('results');
        } catch (err) {
            alert('Import failed. Please try again.');
            setStep('mapping');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDone = () => {
        router.reload({ only: ['bookings'] });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

            <div className="z-10 w-full max-w-3xl max-h-[90vh] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-left">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
                    <div className="flex items-center gap-2">
                        <History size={18} className="text-[#FF3B30]" />
                        <h3 className="text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-white">
                            Import Historical Rental Records (Legacy Data)
                        </h3>
                    </div>
                    <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"><X size={18} /></button>
                </div>

                {/* Step Indicator */}
                <div className="flex items-center gap-0 px-6 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 shrink-0 text-[10px] font-black uppercase tracking-widest">
                    {['Upload CSV', 'Map Fields', 'Import & Preview', 'Results'].map((s, i) => (
                        <div key={s} className="flex items-center">
                            <span className={`px-3 py-1 rounded-lg ${
                                (step === 'upload' && i === 0) ||
                                (step === 'mapping' && i === 1) ||
                                (step === 'importing' && i === 2) ||
                                (step === 'results' && i === 3)
                                    ? 'bg-[#FF3B30] text-white'
                                    : 'text-zinc-400'
                            }`}>{s}</span>
                            {i < 3 && <span className="text-zinc-300 dark:text-zinc-700 px-1">›</span>}
                        </div>
                    ))}
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6">

                    {/* STEP 1: Upload */}
                    {step === 'upload' && (
                        <div className="space-y-6">
                            <div
                                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                onDragLeave={() => setDragOver(false)}
                                onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFileSelect(e.dataTransfer.files[0]); }}
                                onClick={() => fileInputRef.current?.click()}
                                className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
                                    dragOver ? 'border-[#FF3B30] bg-[#FF3B30]/5' : 'border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600'
                                }`}
                            >
                                <Upload size={36} className="mx-auto text-zinc-400 mb-3" />
                                <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                                    {csvFile ? `✅ File Selected: ${csvFile.name}` : 'Drag & drop your CSV file here, or click to browse'}
                                </p>
                                <p className="text-xs text-zinc-400 mt-1">Supports .csv format. Maximum 5MB.</p>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".csv,.txt"
                                    className="hidden"
                                    onChange={(e) => handleFileSelect(e.target.files[0])}
                                />
                            </div>

                            {/* CSV Template Download */}
                            <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 text-xs space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="font-bold text-blue-700 dark:text-blue-400 flex items-center gap-1">
                                        <FileText size={14} /> Required CSV Format & Template
                                    </div>
                                    <a
                                        href={route('admin.import.template')}
                                        download="elfaa_legacy_import_template.csv"
                                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[11px] rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                                    >
                                        <Download size={13} /> Download Sample Template (.CSV)
                                    </a>
                                </div>
                                <p className="text-zinc-600 dark:text-zinc-400">
                                    Your CSV must include headers in the first row. Required columns: <strong>customer_name, vehicle_name, start_date, total_price</strong>. All other columns are optional.
                                </p>
                                <code className="block bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 text-[10px] font-mono leading-relaxed overflow-x-auto">
                                    customer_name,customer_email,vehicle_name,start_date,end_date,total_price,amount_paid,status,notes<br/>
                                    Juan Dela Cruz,juan@email.com,Toyota Vios,2024-01-15,2024-01-18,3600,3600,completed,Full payment on pickup
                                </code>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: Mapping */}
                    {step === 'mapping' && previewData && (
                        <div className="space-y-5">
                            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                                ✅ Parsed {previewData.total_rows} records from CSV. Map your columns to system fields below.
                            </div>

                            {/* Field Mapping Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {SYSTEM_FIELDS.map(field => (
                                    <div key={field.key}>
                                        <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">
                                            {field.label} {field.required && <span className="text-rose-500">*</span>}
                                        </label>
                                        <select
                                            value={mapping[field.key] || ''}
                                            onChange={(e) => setMapping(m => ({ ...m, [field.key]: e.target.value || undefined }))}
                                            className="w-full h-8 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-2.5 text-xs"
                                        >
                                            <option value="">-- Skip this field --</option>
                                            {previewData.headers.map(h => (
                                                <option key={h} value={h}>{h}</option>
                                            ))}
                                        </select>
                                    </div>
                                ))}
                            </div>

                            {/* Preview Table */}
                            <div>
                                <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Preview (First 10 Rows)</div>
                                <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
                                    <table className="w-full text-[10px] border-collapse">
                                        <thead>
                                            <tr className="bg-zinc-100 dark:bg-zinc-950 text-zinc-500">
                                                {previewData.headers.map(h => (
                                                    <th key={h} className="p-2 text-left font-black uppercase">{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                            {previewData.preview_rows.map((row, i) => (
                                                <tr key={i} className="hover:bg-zinc-50 dark:hover:bg-zinc-950">
                                                    {row.map((cell, j) => (
                                                        <td key={j} className="p-2 font-mono text-zinc-700 dark:text-zinc-300 max-w-[120px] truncate">{cell}</td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: Importing */}
                    {step === 'importing' && (
                        <div className="flex flex-col items-center justify-center py-16 gap-4">
                            <div className="w-12 h-12 border-4 border-[#FF3B30]/30 border-t-[#FF3B30] rounded-full animate-spin" />
                            <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Importing historical records…</p>
                            <p className="text-xs text-zinc-400">Validating data, detecting duplicates, and tagging legacy records.</p>
                        </div>
                    )}

                    {/* STEP 4: Results */}
                    {step === 'results' && importResults && (
                        <div className="space-y-4">
                            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                                <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3">Import Summary — Batch {importResults.batch_id}</div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="text-center p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                                        <div className="text-2xl font-black text-emerald-600">{importResults.success}</div>
                                        <div className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">✅ Imported</div>
                                    </div>
                                    <div className="text-center p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                                        <div className="text-2xl font-black text-amber-600">{importResults.skipped}</div>
                                        <div className="text-[10px] font-bold text-amber-700 dark:text-amber-400">⚠️ Skipped (Duplicate)</div>
                                    </div>
                                    <div className="text-center p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
                                        <div className="text-2xl font-black text-rose-600">{importResults.errors?.length || 0}</div>
                                        <div className="text-[10px] font-bold text-rose-700 dark:text-rose-400">❌ Errors</div>
                                    </div>
                                </div>
                            </div>

                            {importResults.errors?.length > 0 && (
                                <div className="space-y-2">
                                    <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Error Log</div>
                                    <div className="max-h-52 overflow-y-auto space-y-1.5">
                                        {importResults.errors.map((err, i) => (
                                            <div key={i} className="p-2.5 rounded-xl bg-rose-500/5 border border-rose-500/20 text-xs flex items-start gap-2">
                                                <AlertCircle size={13} className="text-rose-500 shrink-0 mt-0.5" />
                                                <span className="text-zinc-700 dark:text-zinc-300">{err.message}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/20 text-xs text-blue-700 dark:text-blue-400">
                                <strong>All {importResults.success} imported records are tagged as Legacy Data</strong> and marked with a <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600 font-bold text-[10px]">LEGACY IMPORT</span> badge in the bookings table. Historical data is now included in revenue and outstanding balance analytics.
                            </div>
                        </div>
                    )}

                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 shrink-0 bg-zinc-50 dark:bg-zinc-950">
                    <button onClick={onClose} className="text-xs text-zinc-500 hover:text-zinc-700 font-bold cursor-pointer">
                        Cancel Import
                    </button>

                    <div className="flex items-center gap-2">
                        {step === 'mapping' && (
                            <button
                                onClick={() => { setStep('upload'); setPreviewData(null); }}
                                className="px-4 h-8 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg text-xs font-bold cursor-pointer"
                            >
                                ← Re-upload File
                            </button>
                        )}
                        {step === 'upload' && (
                            <button
                                onClick={handlePreview}
                                disabled={!csvFile || isLoading}
                                className="px-5 h-9 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg text-xs font-black hover:opacity-80 disabled:opacity-40 cursor-pointer transition-opacity flex items-center gap-2"
                            >
                                {isLoading ? <RefreshCw size={14} className="animate-spin" /> : <ArrowRight size={14} />}
                                Parse & Preview File →
                            </button>
                        )}
                        {step === 'mapping' && (
                            <button
                                onClick={handleImport}
                                disabled={isLoading || !mapping.customer_name || !mapping.vehicle_name || !mapping.start_date || !mapping.total_price}
                                className="px-5 h-9 bg-[#FF3B30] text-white rounded-lg text-xs font-black hover:bg-red-700 disabled:opacity-40 cursor-pointer transition-colors flex items-center gap-2"
                            >
                                <Upload size={14} /> Import {previewData?.total_rows} Legacy Records
                            </button>
                        )}
                        {step === 'results' && (
                            <button
                                onClick={handleDone}
                                className="px-5 h-9 bg-emerald-600 text-white rounded-lg text-xs font-black hover:bg-emerald-700 cursor-pointer transition-colors"
                            >
                                ✅ Done — View Booking Logs
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
