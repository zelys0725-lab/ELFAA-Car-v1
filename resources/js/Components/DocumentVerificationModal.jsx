import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import {
    X,
    Shield,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    RotateCw,
    ZoomIn,
    ZoomOut,
    Maximize2,
    Download,
    ExternalLink,
    RefreshCw,
    FileText,
    User,
    Calendar,
    Eye,
    History,
    Sparkles,
    Copy,
    Check,
    HelpCircle,
    MessageSquare,
    Send
} from 'lucide-react';

export default function DocumentVerificationModal({ document: initialDoc, onClose, onUpdated }) {
    const [doc, setDoc] = useState(initialDoc);
    const [activeTab, setActiveTab] = useState('comparison'); // 'comparison', 'raw_ocr', 'audit_log'
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [isReprocessing, setIsReprocessing] = useState(false);
    const [actionType, setActionType] = useState(null); // 'approve', 'reject', 'request_resubmission'
    const [actionNotes, setActionNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [copiedText, setCopiedText] = useState(false);

    if (!doc) return null;

    const user = doc.user || {};
    const summary = doc.verification_summary || {};
    const extracted = doc.ocr_extracted_data || {};
    const checks = summary.checks || [];
    const issues = summary.issues || [];
    const auditLogs = doc.audit_logs || [];
    const ocrConfidence = doc.ocr_confidence ? parseFloat(doc.ocr_confidence) : 0;

    const secureUrl = doc.secure_url || (doc.file_path ? `/documents/${doc.id}/file` : '#');
    const isPdf = (doc.mime_type === 'application/pdf') || (doc.file_path && doc.file_path.toLowerCase().endsWith('.pdf'));

    // Zoom & Rotation controls
    const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
    const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
    const handleRotate = () => setRotation(prev => (prev + 90) % 360);
    const handleResetView = () => {
        setZoom(1);
        setRotation(0);
    };

    // Copy raw OCR text
    const handleCopyOcrText = () => {
        if (!doc.ocr_raw_text) return;
        navigator.clipboard.writeText(doc.ocr_raw_text);
        setCopiedText(true);
        setTimeout(() => setCopiedText(false), 2000);
    };

    // Reprocess OCR
    const handleReprocess = () => {
        setIsReprocessing(true);
        router.post(
            route('admin.documents.reprocess', doc.id),
            {},
            {
                preserveScroll: true,
                onSuccess: (page) => {
                    // Update document state from page props if available
                    const updatedDocs = page.props?.documents || [];
                    const updated = updatedDocs.find(d => d.id === doc.id);
                    if (updated) {
                        setDoc(updated);
                        if (onUpdated) onUpdated(updated);
                    }
                    setIsReprocessing(false);
                },
                onError: () => {
                    setIsReprocessing(false);
                }
            }
        );
    };

    // Submit Decision
    const handleSubmitDecision = (e) => {
        e.preventDefault();
        if (!actionType) return;

        if (actionType === 'reject' && !actionNotes.trim()) {
            alert('Please provide a reason for rejecting this document.');
            return;
        }

        if (actionType === 'request_resubmission' && !actionNotes.trim()) {
            alert('Please specify instructions for the customer regarding what needs to be resubmitted.');
            return;
        }

        setIsSubmitting(true);

        const payload = {
            action: actionType,
            notes: actionNotes,
            reject_reason: actionType === 'reject' ? actionNotes : null,
            resubmission_notes: actionType === 'request_resubmission' ? actionNotes : null,
        };

        router.post(
            route('admin.documents.decision', doc.id),
            payload,
            {
                preserveScroll: true,
                onSuccess: (page) => {
                    setIsSubmitting(false);
                    setActionType(null);
                    setActionNotes('');
                    const updatedDocs = page.props?.documents || [];
                    const updated = updatedDocs.find(d => d.id === doc.id);
                    if (updated) {
                        setDoc(updated);
                        if (onUpdated) onUpdated(updated);
                    }
                },
                onError: () => {
                    setIsSubmitting(false);
                }
            }
        );
    };

    // Recommendation style banner helper
    const getRecommendationBanner = (level) => {
        switch (level) {
            case 'caution_expired':
                return {
                    bg: 'bg-rose-500/10 border-rose-500/30 text-rose-500 dark:text-rose-400',
                    badge: 'bg-rose-500 text-white',
                    title: 'License Appears Expired',
                    icon: AlertTriangle,
                };
            case 'caution_mismatch':
                return {
                    bg: 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400',
                    badge: 'bg-amber-500 text-white',
                    title: 'Potential Details Mismatch',
                    icon: AlertTriangle,
                };
            case 'caution_expiry':
                return {
                    bg: 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400',
                    badge: 'bg-amber-500 text-white',
                    title: 'License Expiring Soon',
                    icon: AlertTriangle,
                };
            case 'resubmit_suggested':
                return {
                    bg: 'bg-orange-500/10 border-orange-500/30 text-orange-600 dark:text-orange-400',
                    badge: 'bg-orange-500 text-white',
                    title: 'Resubmission Suggested',
                    icon: HelpCircle,
                };
            case 'manual_review':
                return {
                    bg: 'bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400',
                    badge: 'bg-blue-500 text-white',
                    title: 'Manual Review Advised',
                    icon: Eye,
                };
            default:
                return {
                    bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400',
                    badge: 'bg-emerald-600 text-white',
                    title: 'High Confidence Match',
                    icon: CheckCircle2,
                };
        }
    };

    const bannerConfig = getRecommendationBanner(summary.recommendation_level);
    const BannerIcon = bannerConfig.icon;

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden">
            {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity" 
                onClick={onClose} 
            />

            {/* Modal Dialog */}
            <div className="relative z-10 w-full max-w-7xl h-[94vh] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-zinc-900 dark:text-zinc-100 transition-colors">
                
                {/* Top Header Bar */}
                <div className="flex items-center justify-between px-6 py-3.5 border-b border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/80 dark:bg-zinc-900/80 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
                            <Shield className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-white">
                                    AI-Assisted Identity Verification
                                </h2>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                    doc.status === 'verified' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' :
                                    doc.status === 'rejected' ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20' :
                                    doc.status === 'resubmission_requested' ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20' :
                                    'bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border border-zinc-500/20'
                                }`}>
                                    {doc.status === 'resubmission_requested' ? 'Resubmission Requested' : doc.status}
                                </span>
                            </div>
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                                Document ID #{doc.id} • Customer: <strong className="text-zinc-700 dark:text-zinc-200">{user.name || 'Client'}</strong> ({user.email || '—'})
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleReprocess}
                            disabled={isReprocessing}
                            title="Re-run local Tesseract OCR on this file"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-850 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-700 dark:text-zinc-300 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${isReprocessing ? 'animate-spin text-red-500' : ''}`} />
                            <span>{isReprocessing ? 'Scanning OCR...' : 'Re-run OCR'}</span>
                        </button>

                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Main Split Content */}
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-zinc-200 dark:divide-zinc-800">
                    
                    {/* LEFT PANEL: Document Viewer (5 cols) */}
                    <div className="lg:col-span-5 bg-zinc-100/60 dark:bg-zinc-950 flex flex-col h-full overflow-hidden">
                        
                        {/* Viewer Control Toolbar */}
                        <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 text-xs">
                            <span className="font-bold text-[11px] text-zinc-500 uppercase tracking-wider truncate max-w-[200px]">
                                {doc.original_filename || (isPdf ? 'Document PDF' : 'Document Image')}
                            </span>
                            <div className="flex items-center gap-1">
                                {!isPdf && (
                                    <>
                                        <button 
                                            onClick={handleZoomIn} 
                                            title="Zoom In" 
                                            className="p-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors"
                                        >
                                            <ZoomIn className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={handleZoomOut} 
                                            title="Zoom Out" 
                                            className="p-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors"
                                        >
                                            <ZoomOut className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={handleRotate} 
                                            title="Rotate 90° Clockwise" 
                                            className="p-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors"
                                        >
                                            <RotateCw className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={handleResetView} 
                                            title="Reset Scale" 
                                            className="px-2 py-1 text-[10px] font-bold rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors"
                                        >
                                            Reset
                                        </button>
                                    </>
                                )}
                                <a 
                                    href={secureUrl} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    title="Open file directly in new tab"
                                    className="p-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                </a>
                                <a 
                                    href={`${secureUrl}?download=1`} 
                                    title="Download secure document"
                                    className="p-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors"
                                >
                                    <Download className="w-4 h-4" />
                                </a>
                            </div>
                        </div>

                        {/* Image / PDF Display Surface */}
                        <div className="flex-1 overflow-auto flex items-center justify-center p-4 relative select-none">
                            {isPdf ? (
                                <iframe 
                                    src={secureUrl} 
                                    className="w-full h-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white"
                                    title="PDF Document Preview"
                                />
                            ) : (
                                <div className="transition-transform duration-200 ease-out flex items-center justify-center max-w-full max-h-full">
                                    <img
                                        src={secureUrl}
                                        alt="Customer Verification Document"
                                        style={{
                                            transform: `scale(${zoom}) rotate(${rotation}deg)`,
                                            transformOrigin: 'center center',
                                        }}
                                        className="max-h-[70vh] max-w-full rounded-lg shadow-md object-contain border border-zinc-300/40 dark:border-zinc-800 pointer-events-auto"
                                    />
                                </div>
                            )}
                        </div>

                        {/* File Details Footer */}
                        <div className="px-4 py-2 border-t border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 text-[10px] text-zinc-500 dark:text-zinc-400 flex items-center justify-between">
                            <span>Storage: <strong>{doc.storage_disk || 'private disk'}</strong></span>
                            {doc.file_size && <span>Size: <strong>{(doc.file_size / 1024).toFixed(1)} KB</strong></span>}
                            <span>Uploaded: <strong>{doc.created_at ? new Date(doc.created_at).toLocaleString() : '—'}</strong></span>
                        </div>
                    </div>

                    {/* RIGHT PANEL: AI/OCR Findings & Decision Controls (7 cols) */}
                    <div className="lg:col-span-7 flex flex-col h-full bg-white dark:bg-zinc-900 overflow-hidden">
                        
                        {/* Recommendation Highlight Banner */}
                        <div className={`p-4 border-b ${bannerConfig.bg} transition-colors`}>
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-2.5">
                                    <BannerIcon className="w-5 h-5 shrink-0 mt-0.5" />
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-black uppercase tracking-wider">
                                                {bannerConfig.title}
                                            </span>
                                            {ocrConfidence > 0 && (
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/80 dark:bg-zinc-900/80 border border-current shadow-xs">
                                                    OCR Confidence: {ocrConfidence}%
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs mt-1 font-medium leading-relaxed">
                                            {summary.recommendation || 'Document scanned with local Tesseract OCR engine.'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Detected issues list */}
                            {issues.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-current/20 space-y-1">
                                    <span className="text-[10px] font-black uppercase tracking-wider block opacity-80">
                                        Identified Findings & Alerts ({issues.length}):
                                    </span>
                                    <ul className="text-xs space-y-1">
                                        {issues.map((issue, idx) => (
                                            <li key={idx} className="flex items-start gap-1.5 font-semibold">
                                                <span className="opacity-70 mt-0.5">•</span>
                                                <span>{issue}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <div className="mt-2 text-[10px] opacity-75 italic flex items-center gap-1">
                                <Sparkles className="w-3 h-3 shrink-0" />
                                <span>Local Tesseract OCR assistive data. Administrator makes the final binding decision.</span>
                            </div>
                        </div>

                        {/* Navigation Tabs */}
                        <div className="flex items-center px-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 gap-4 text-xs font-bold">
                            <button
                                onClick={() => setActiveTab('comparison')}
                                className={`py-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                                    activeTab === 'comparison'
                                        ? 'border-red-500 text-red-600 dark:text-red-400'
                                        : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                                }`}
                            >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Verification Checklist</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('raw_ocr')}
                                className={`py-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                                    activeTab === 'raw_ocr'
                                        ? 'border-red-500 text-red-600 dark:text-red-400'
                                        : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                                }`}
                            >
                                <FileText className="w-3.5 h-3.5" />
                                <span>Raw OCR Text</span>
                                {doc.ocr_word_count && (
                                    <span className="px-1.5 py-0.2 rounded bg-zinc-200 dark:bg-zinc-800 text-[10px] font-mono">
                                        {doc.ocr_word_count}w
                                    </span>
                                )}
                            </button>
                            <button
                                onClick={() => setActiveTab('audit_log')}
                                className={`py-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                                    activeTab === 'audit_log'
                                        ? 'border-red-500 text-red-600 dark:text-red-400'
                                        : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                                }`}
                            >
                                <History className="w-3.5 h-3.5" />
                                <span>Audit Trail</span>
                                <span className="px-1.5 py-0.2 rounded bg-zinc-200 dark:bg-zinc-800 text-[10px] font-mono">
                                    {auditLogs.length}
                                </span>
                            </button>
                        </div>

                        {/* Scrollable Tab Body */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            
                            {/* TAB 1: Comparison & Rule Checks */}
                            {activeTab === 'comparison' && (
                                <div className="space-y-6">
                                    {/* Comparison Matrix Table */}
                                    <div className="space-y-2">
                                        <h3 className="text-xs font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                                            Side-by-Side Identity Comparison
                                        </h3>
                                        <div className="overflow-hidden border border-zinc-200 dark:border-zinc-800 rounded-xl">
                                            <table className="w-full text-xs text-left">
                                                <thead className="bg-zinc-100/70 dark:bg-zinc-850/70 font-black uppercase text-[10px] text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
                                                    <tr>
                                                        <th className="py-2.5 px-3">Identity Attribute</th>
                                                        <th className="py-2.5 px-3">Registered Customer Info</th>
                                                        <th className="py-2.5 px-3">Extracted OCR Findings</th>
                                                        <th className="py-2.5 px-3 text-right">Rule Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-zinc-700 dark:text-zinc-300">
                                                    
                                                    {/* Full Name */}
                                                    <tr className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50">
                                                        <td className="py-2.5 px-3 font-bold text-zinc-900 dark:text-white">
                                                            Full Name
                                                        </td>
                                                        <td className="py-2.5 px-3 font-semibold">
                                                            {user.name || '—'}
                                                        </td>
                                                        <td className="py-2.5 px-3 font-mono font-medium text-zinc-900 dark:text-white">
                                                            {extracted.detected_name || <span className="italic text-zinc-400">Not explicitly isolated</span>}
                                                        </td>
                                                        <td className="py-2.5 px-3 text-right">
                                                            {summary.name_match_score !== undefined ? (
                                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                                                    summary.name_match_score >= 80 ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' :
                                                                    summary.name_match_score >= 50 ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' :
                                                                    'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                                                                }`}>
                                                                    {summary.name_match_score >= 80 ? 'Matched' : summary.name_match_score >= 50 ? 'Partial' : 'Mismatch'} ({summary.name_match_score}%)
                                                                </span>
                                                            ) : '—'}
                                                        </td>
                                                    </tr>

                                                    {/* ID / Driver's License Number */}
                                                    <tr className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50">
                                                        <td className="py-2.5 px-3 font-bold text-zinc-900 dark:text-white">
                                                            License / ID Number
                                                        </td>
                                                        <td className="py-2.5 px-3 font-mono">
                                                            {user.drivers_license_number || user.id_number || <span className="italic text-zinc-400">None in profile</span>}
                                                        </td>
                                                        <td className="py-2.5 px-3 font-mono font-bold text-zinc-900 dark:text-white">
                                                            {extracted.detected_id_number || <span className="italic text-zinc-400">Not detected</span>}
                                                        </td>
                                                        <td className="py-2.5 px-3 text-right">
                                                            {extracted.detected_id_number && (user.drivers_license_number || user.id_number) ? (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                                                                    Verified
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                                                                    Verify Image
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>

                                                    {/* Document Type */}
                                                    <tr className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50">
                                                        <td className="py-2.5 px-3 font-bold text-zinc-900 dark:text-white">
                                                            Document Classification
                                                        </td>
                                                        <td className="py-2.5 px-3 uppercase text-[11px]">
                                                            {doc.type}
                                                        </td>
                                                        <td className="py-2.5 px-3 font-bold text-red-600 dark:text-red-400">
                                                            {extracted.detected_doc_type || 'Government ID'}
                                                        </td>
                                                        <td className="py-2.5 px-3 text-right">
                                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                                                                Recognized
                                                            </span>
                                                        </td>
                                                    </tr>

                                                    {/* Expiration Date */}
                                                    <tr className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50">
                                                        <td className="py-2.5 px-3 font-bold text-zinc-900 dark:text-white">
                                                            License Expiry Date
                                                        </td>
                                                        <td className="py-2.5 px-3 text-zinc-500">
                                                            Must be active for rental
                                                        </td>
                                                        <td className="py-2.5 px-3 font-mono font-bold text-zinc-900 dark:text-white">
                                                            {extracted.detected_expiry_date_parsed || extracted.detected_expiry_date || <span className="italic text-zinc-400">Not detected</span>}
                                                        </td>
                                                        <td className="py-2.5 px-3 text-right">
                                                            {extracted.detected_expiry_date_parsed ? (
                                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                                                    new Date(extracted.detected_expiry_date_parsed) < new Date()
                                                                        ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                                                                        : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                                                }`}>
                                                                    {new Date(extracted.detected_expiry_date_parsed) < new Date() ? 'EXPIRED' : 'ACTIVE'}
                                                                </span>
                                                            ) : (
                                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-200 dark:bg-zinc-800 text-zinc-500">
                                                                    Check Photo
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>

                                                    {/* Birth Date */}
                                                    {extracted.detected_birth_date && (
                                                        <tr className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50">
                                                            <td className="py-2.5 px-3 font-bold text-zinc-900 dark:text-white">
                                                                Date of Birth
                                                            </td>
                                                            <td className="py-2.5 px-3 text-zinc-500">
                                                                Adult Driver Verification
                                                            </td>
                                                            <td className="py-2.5 px-3 font-mono font-medium">
                                                                {extracted.detected_birth_date_parsed || extracted.detected_birth_date}
                                                            </td>
                                                            <td className="py-2.5 px-3 text-right">
                                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                                                                    Detected
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Detailed Rule Checks */}
                                    <div className="space-y-2">
                                        <h3 className="text-xs font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                                            Automated Validation Checks
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {checks.map((check, idx) => {
                                                const isPass = check.status === 'pass';
                                                const isWarning = check.status === 'warning';
                                                const isFail = check.status === 'fail';

                                                return (
                                                    <div 
                                                        key={idx}
                                                        className={`p-3.5 rounded-xl border flex items-start gap-3 transition-colors ${
                                                            isPass ? 'bg-emerald-500/5 border-emerald-500/20' :
                                                            isWarning ? 'bg-amber-500/5 border-amber-500/20' :
                                                            isFail ? 'bg-rose-500/5 border-rose-500/20' :
                                                            'bg-zinc-100/50 dark:bg-zinc-850/50 border-zinc-200 dark:border-zinc-800'
                                                        }`}
                                                    >
                                                        <div className="mt-0.5 shrink-0">
                                                            {isPass && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                                                            {isWarning && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                                                            {isFail && <XCircle className="w-4 h-4 text-rose-500" />}
                                                            {!isPass && !isWarning && !isFail && <HelpCircle className="w-4 h-4 text-zinc-400" />}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between gap-1">
                                                                <h4 className="text-xs font-black text-zinc-900 dark:text-white truncate">
                                                                    {check.name}
                                                                </h4>
                                                                <span className={`text-[10px] font-black uppercase px-1.5 py-0.2 rounded ${
                                                                    isPass ? 'text-emerald-600 dark:text-emerald-400' :
                                                                    isWarning ? 'text-amber-600 dark:text-amber-400' :
                                                                    isFail ? 'text-rose-600 dark:text-rose-400' :
                                                                    'text-zinc-500'
                                                                }`}>
                                                                    {check.status}
                                                                </span>
                                                            </div>
                                                            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-1 leading-snug">
                                                                {check.message}
                                                            </p>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB 2: Raw OCR Output */}
                            {activeTab === 'raw_ocr' && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-white">
                                                Authentic Tesseract OCR Output
                                            </h3>
                                            <p className="text-[11px] text-zinc-500">
                                                Generated locally via Tesseract engine. Not fetched from external APIs.
                                            </p>
                                        </div>
                                        <button
                                            onClick={handleCopyOcrText}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-bold text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
                                        >
                                            {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                            <span>{copiedText ? 'Copied' : 'Copy Text'}</span>
                                        </button>
                                    </div>

                                    {/* Stats Strip */}
                                    <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-center">
                                        <div>
                                            <span className="text-[10px] text-zinc-500 uppercase font-bold block">Mean Confidence</span>
                                            <span className="text-base font-black text-zinc-900 dark:text-white font-mono">
                                                {ocrConfidence}%
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-zinc-500 uppercase font-bold block">Words Recognized</span>
                                            <span className="text-base font-black text-zinc-900 dark:text-white font-mono">
                                                {doc.ocr_word_count || 0}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-zinc-500 uppercase font-bold block">Characters Count</span>
                                            <span className="text-base font-black text-zinc-900 dark:text-white font-mono">
                                                {doc.ocr_char_count || 0}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Raw Text Box */}
                                    <div className="relative">
                                        <pre className="p-4 rounded-xl bg-zinc-950 text-zinc-200 font-mono text-xs overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-[350px] border border-zinc-800 select-text">
                                            {doc.ocr_raw_text ? doc.ocr_raw_text : 'No OCR text available for this document.'}
                                        </pre>
                                    </div>
                                </div>
                            )}

                            {/* TAB 3: Audit Trail */}
                            {activeTab === 'audit_log' && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-white">
                                            Verification Decision History & Audit Trail
                                        </h3>
                                        <span className="text-[11px] text-zinc-500">
                                            Immutable action records
                                        </span>
                                    </div>

                                    {auditLogs.length === 0 ? (
                                        <div className="p-8 text-center rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-400 text-xs">
                                            No audit entries recorded for this document yet.
                                        </div>
                                    ) : (
                                        <div className="relative border-l-2 border-zinc-200 dark:border-zinc-800 ml-3 space-y-5 py-2">
                                            {auditLogs.map((log) => {
                                                const isApproved = log.action === 'approved';
                                                const isRejected = log.action === 'rejected';
                                                const isResubmit = log.action === 'resubmission_requested';

                                                return (
                                                    <div key={log.id} className="relative pl-6">
                                                        <div className={`absolute -left-[7px] top-1.5 h-3 w-3 rounded-full border-2 bg-white dark:bg-zinc-900 ${
                                                            isApproved ? 'border-emerald-500 bg-emerald-500' :
                                                            isRejected ? 'border-rose-500 bg-rose-500' :
                                                            isResubmit ? 'border-amber-500 bg-amber-500' :
                                                            'border-zinc-400'
                                                        }`} />
                                                        
                                                        <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-950/60 space-y-1">
                                                            <div className="flex items-center justify-between gap-2">
                                                                <span className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-white">
                                                                    {log.action.replace('_', ' ')}
                                                                </span>
                                                                <span className="text-[10px] text-zinc-400 font-mono">
                                                                    {new Date(log.created_at).toLocaleString()}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-zinc-700 dark:text-zinc-300">
                                                                {log.notes || 'Action logged.'}
                                                            </p>
                                                            <div className="text-[10px] text-zinc-500 flex items-center justify-between pt-1">
                                                                <span>Actor: <strong>{log.user?.name || 'System / OCR Engine'}</strong> ({log.user?.role || 'Service'})</span>
                                                                {log.ip_address && <span className="font-mono">IP: {log.ip_address}</span>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Bottom Admin Decision Action Bar */}
                        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/80">
                            {actionType ? (
                                <form onSubmit={handleSubmitDecision} className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-white flex items-center gap-1.5">
                                            {actionType === 'approve' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                                            {actionType === 'reject' && <XCircle className="w-4 h-4 text-rose-500" />}
                                            {actionType === 'request_resubmission' && <MessageSquare className="w-4 h-4 text-amber-500" />}
                                            <span>
                                                {actionType === 'approve' ? 'Confirm Approval Decision' :
                                                 actionType === 'reject' ? 'Reason for Document Rejection' :
                                                 'Instructions for Client Resubmission'}
                                            </span>
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => { setActionType(null); setActionNotes(''); }}
                                            className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                                        >
                                            Cancel
                                        </button>
                                    </div>

                                    <textarea
                                        rows={2}
                                        value={actionNotes}
                                        onChange={(e) => setActionNotes(e.target.value)}
                                        placeholder={
                                            actionType === 'approve' ? 'Optional verification note for audit log (e.g. Validated against government ID database)...' :
                                            actionType === 'reject' ? 'State the explicit reason (e.g. License is expired, Name does not match renter profile)...' :
                                            'Explain what the customer needs to fix (e.g. Please upload a clear photo of the back side of your license)...'
                                        }
                                        className="w-full text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 p-2.5 text-zinc-900 dark:text-white focus:border-red-500 focus:ring-0 focus:outline-none"
                                        required={actionType !== 'approve'}
                                    />

                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            type="button"
                                            onClick={() => { setActionType(null); setActionNotes(''); }}
                                            className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider text-white transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5 ${
                                                actionType === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' :
                                                actionType === 'reject' ? 'bg-rose-600 hover:bg-rose-700' :
                                                'bg-amber-600 hover:bg-amber-700'
                                            }`}
                                        >
                                            <Send className="w-3.5 h-3.5" />
                                            <span>
                                                {isSubmitting ? 'Submitting...' :
                                                 actionType === 'approve' ? 'Approve Document' :
                                                 actionType === 'reject' ? 'Reject Document' :
                                                 'Send Resubmission Request'}
                                            </span>
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                                    <div className="text-[11px] text-zinc-500">
                                        Admin Actions: Choose an outcome for this customer's document.
                                    </div>
                                    <div className="flex items-center gap-2 w-full sm:w-auto">
                                        <button
                                            onClick={() => setActionType('request_resubmission')}
                                            className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-xs font-black uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                                        >
                                            <MessageSquare className="w-3.5 h-3.5" />
                                            <span>Request Resubmission</span>
                                        </button>

                                        <button
                                            onClick={() => setActionType('reject')}
                                            className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-xs font-black uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                                        >
                                            <XCircle className="w-3.5 h-3.5" />
                                            <span>Reject</span>
                                        </button>

                                        <button
                                            onClick={() => setActionType('approve')}
                                            className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider transition-colors cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
                                        >
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                            <span>Approve & Verify</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
