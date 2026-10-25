import React, { useState } from 'react';
import { useForm } from '@inertiajs/react';
import {
    X, Fuel, Gauge, AlertTriangle, Camera, DollarSign,
    CheckCircle, XCircle, Plus, ShieldCheck, ArrowRight,
    Image as ImageIcon, ZoomIn, Clock, Calendar, Car, Sparkles, ExternalLink
} from 'lucide-react';
import { resolvePhotoUrl } from '@/utils/photoHelper';

const CHARGE_STATUS_CONFIG = {
    proposed: { label: 'Proposed', color: 'text-amber-600 bg-amber-500/10 border-amber-500/20' },
    approved: { label: 'Approved', color: 'text-blue-600 bg-blue-500/10 border-blue-500/20' },
    rejected: { label: 'Rejected', color: 'text-rose-600 bg-rose-500/10 border-rose-500/20' },
    paid:     { label: 'Paid',     color: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20' },
};

export default function InspectionComparisonDrawer({ booking, isAdmin = false, onClose, onRecordInspection }) {
    const inspections = booking.inspections || [];
    const pickup = inspections.find(i => i.type === 'pickup');
    const returnInsp = inspections.find(i => i.type === 'return');
    const charges = booking.inspection_charges || [];

    const [showChargeForm, setShowChargeForm] = useState(false);
    const [selectedPickupIdx, setSelectedPickupIdx] = useState(0);
    const [selectedReturnIdx, setSelectedReturnIdx] = useState(0);
    const [activeViewTab, setActiveViewTab] = useState('split'); // 'split' | 'pickup' | 'return'
    const [zoomModalPhoto, setZoomModalPhoto] = useState(null);

    const chargeForm = useForm({
        booking_id: booking.id,
        inspection_id: returnInsp?.id || pickup?.id || null,
        charge_type: 'damage',
        description: '',
        amount: '',
        evidence_photos: [],
    });

    // Calculations
    const fuelDeficit = (pickup && returnInsp) ? pickup.fuel_bars - returnInsp.fuel_bars : 0;
    const distanceDriven = (pickup && returnInsp) ? Math.max(0, returnInsp.odometer_reading - pickup.odometer_reading) : 0;

    const pickupPhotos = pickup?.photos || [];
    const returnPhotos = returnInsp?.photos || [];

    const activePickupPhoto = pickupPhotos[selectedPickupIdx] || pickupPhotos[0];
    const activeReturnPhoto = returnPhotos[selectedReturnIdx] || returnPhotos[0];

    const handleChargeSubmit = (e) => {
        e.preventDefault();
        chargeForm.post(route('admin.inspection_charges.store'), {
            onSuccess: () => {
                setShowChargeForm(false);
                chargeForm.reset();
            },
        });
    };

    const handleUpdateChargeStatus = (chargeId, status) => {
        useForm().post(route('admin.inspection_charges.status', chargeId), {
            data: { status },
        });
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-2 sm:p-4 lg:p-6 overflow-y-auto">
            <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
            
            <div className="z-10 w-full max-w-6xl xl:max-w-7xl h-full max-h-[92vh] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-colors">
                
                {/* 1. Header Bar */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/70">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 text-[#FF3B30] flex items-center justify-center">
                            <Camera className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-white">
                                    Inspection & Damage Comparison Log
                                </h3>
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase bg-zinc-200/60 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                                    Booking #{booking.id}
                                </span>
                            </div>
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                                <span className="font-bold text-zinc-800 dark:text-zinc-200">{booking.vehicle?.name || 'Vehicle'}</span>
                                {booking.vehicle?.plate_number && (
                                    <span className="font-mono ml-1.5 px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-[10px]">
                                        {booking.vehicle.plate_number}
                                    </span>
                                )}
                                <span className="mx-2 text-zinc-400">·</span>
                                Renter: <span className="font-semibold text-zinc-700 dark:text-zinc-300">{booking.user?.name || 'Renter'}</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button 
                            type="button" 
                            onClick={onClose} 
                            className="w-8 h-8 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 flex items-center justify-center transition-colors cursor-pointer"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* 2. Main Dual-Pane Content Body */}
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-zinc-200 dark:divide-zinc-800">
                    
                    {/* ======================================================== */}
                    {/* LEFT PANE: VISUAL EVIDENCE & PHOTO COMPARISON (WIDTH 7/12) */}
                    {/* ======================================================== */}
                    <div className="lg:col-span-7 flex flex-col bg-zinc-50/50 dark:bg-zinc-950/60 overflow-y-auto p-4 sm:p-6 text-left">
                        {/* Section Subheader */}
                        <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-200 dark:border-zinc-800">
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-[#FF3B30] flex items-center gap-1.5">
                                    <Sparkles className="w-3 h-3" /> Visual Comparison Showcase
                                </span>
                                <h4 className="text-sm font-extrabold text-zinc-900 dark:text-white mt-0.5">
                                    Vehicle Pickup vs Return Photos
                                </h4>
                            </div>

                            {/* View Switcher Controls */}
                            <div className="flex items-center p-0.5 bg-zinc-200/70 dark:bg-zinc-800/80 rounded-lg text-[10px] font-black uppercase">
                                <button
                                    type="button"
                                    onClick={() => setActiveViewTab('split')}
                                    className={`px-2.5 py-1 rounded-md transition-colors ${
                                        activeViewTab === 'split' 
                                            ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm' 
                                            : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                                    }`}
                                >
                                    Side-by-Side
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveViewTab('pickup')}
                                    className={`px-2.5 py-1 rounded-md transition-colors ${
                                        activeViewTab === 'pickup' 
                                            ? 'bg-blue-600 text-white shadow-sm' 
                                            : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                                    }`}
                                >
                                    Pickup ({pickupPhotos.length})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveViewTab('return')}
                                    className={`px-2.5 py-1 rounded-md transition-colors ${
                                        activeViewTab === 'return' 
                                            ? 'bg-emerald-600 text-white shadow-sm' 
                                            : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                                    }`}
                                >
                                    Return ({returnPhotos.length})
                                </button>
                            </div>
                        </div>

                        {/* Interactive Photo Cards Grid */}
                        <div className={`grid gap-4 ${activeViewTab === 'split' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'} flex-1`}>
                            
                            {/* A. PICKUP PHOTO CARD */}
                            {(activeViewTab === 'split' || activeViewTab === 'pickup') && (
                                <div className="flex flex-col bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
                                    {/* Card Header */}
                                    <div className="flex items-center justify-between px-3.5 py-2.5 bg-blue-50/50 dark:bg-blue-950/20 border-b border-zinc-200 dark:border-zinc-800">
                                        <div className="flex items-center gap-2">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                                                Pickup Photo
                                            </span>
                                            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">
                                                {pickup?.inspected_at ? new Date(pickup.inspected_at).toLocaleDateString() : 'Departure Check'}
                                            </span>
                                        </div>
                                        {pickup && (
                                            <span className="text-[10px] font-mono font-bold text-zinc-600 dark:text-zinc-300">
                                                {pickup.fuel_bars}/8 bars · {pickup.odometer_reading?.toLocaleString()} KM
                                            </span>
                                        )}
                                    </div>

                                    {/* Main Photo Frame */}
                                    <div className="relative aspect-video bg-zinc-950 flex items-center justify-center overflow-hidden group">
                                        {activePickupPhoto ? (
                                            <>
                                                <img
                                                    src={resolvePhotoUrl(activePickupPhoto)}
                                                    alt="Pickup Inspection Photo"
                                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                    onError={(e) => {
                                                        e.currentTarget.style.display = 'none';
                                                        e.currentTarget.parentElement.querySelector('.fallback-box')?.classList.remove('hidden');
                                                    }}
                                                />
                                                <div className="fallback-box hidden absolute inset-0 flex flex-col items-center justify-center p-4 text-center text-zinc-400">
                                                    <Camera className="w-8 h-8 text-zinc-600 mb-1" />
                                                    <span className="text-xs font-bold text-zinc-300">Photo Preview Unavailable</span>
                                                </div>

                                                {/* Zoom Button Overlay */}
                                                <button
                                                    type="button"
                                                    onClick={() => setZoomModalPhoto({
                                                        url: resolvePhotoUrl(activePickupPhoto),
                                                        title: `Pickup Inspection Photo — ${booking.vehicle?.name}`,
                                                        type: 'pickup',
                                                        details: pickup
                                                    })}
                                                    className="absolute top-2 right-2 w-8 h-8 rounded-lg bg-black/60 hover:bg-black/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                                    title="View Full Resolution"
                                                >
                                                    <ZoomIn size={14} />
                                                </button>

                                                <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur-sm text-white text-[9px] font-bold">
                                                    Pickup Record
                                                </div>
                                            </>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center p-6 text-center text-zinc-500">
                                                <Camera className="w-10 h-10 text-zinc-600 mb-2 stroke-[1.5]" />
                                                <span className="text-xs font-bold text-zinc-300">No Pickup Photos Recorded</span>
                                                <span className="text-[10px] text-zinc-500 mt-0.5">Staff has not uploaded inspection photos</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Pickup Thumbnail Selector (if multiple photos) */}
                                    {pickupPhotos.length > 1 && (
                                        <div className="p-2 border-t border-zinc-200 dark:border-zinc-800 flex gap-1.5 overflow-x-auto bg-zinc-50 dark:bg-zinc-950">
                                            {pickupPhotos.map((photo, pIdx) => (
                                                <button
                                                    key={pIdx}
                                                    type="button"
                                                    onClick={() => setSelectedPickupIdx(pIdx)}
                                                    className={`w-12 h-9 rounded-md border-2 overflow-hidden shrink-0 transition-all ${
                                                        selectedPickupIdx === pIdx ? 'border-blue-500 scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                                                    }`}
                                                >
                                                    <img src={resolvePhotoUrl(photo)} alt={`Pickup ${pIdx+1}`} className="w-full h-full object-cover" />
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {/* Notes Footer */}
                                    <div className="p-3 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 text-xs">
                                        <div className="text-[9px] font-black uppercase tracking-wider text-zinc-400 mb-0.5">
                                            Departure Handover Note
                                        </div>
                                        <p className="text-zinc-700 dark:text-zinc-300 text-[11px] leading-relaxed line-clamp-2">
                                            {pickup?.notes || 'No notes logged at pickup.'}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* B. RETURN PHOTO CARD */}
                            {(activeViewTab === 'split' || activeViewTab === 'return') && (
                                <div className="flex flex-col bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
                                    {/* Card Header */}
                                    <div className="flex items-center justify-between px-3.5 py-2.5 bg-emerald-50/50 dark:bg-emerald-950/20 border-b border-zinc-200 dark:border-zinc-800">
                                        <div className="flex items-center gap-2">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                                Return Photo
                                            </span>
                                            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">
                                                {returnInsp?.inspected_at ? new Date(returnInsp.inspected_at).toLocaleDateString() : 'Pending Return'}
                                            </span>
                                        </div>
                                        {returnInsp && (
                                            <span className="text-[10px] font-mono font-bold text-zinc-600 dark:text-zinc-300">
                                                {returnInsp.fuel_bars}/8 bars · {returnInsp.odometer_reading?.toLocaleString()} KM
                                            </span>
                                        )}
                                    </div>

                                    {/* Main Photo Frame or Pending State */}
                                    <div className="relative aspect-video bg-zinc-950 flex items-center justify-center overflow-hidden group">
                                        {returnInsp && activeReturnPhoto ? (
                                            <>
                                                <img
                                                    src={resolvePhotoUrl(activeReturnPhoto)}
                                                    alt="Return Inspection Photo"
                                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                    onError={(e) => {
                                                        e.currentTarget.style.display = 'none';
                                                        e.currentTarget.parentElement.querySelector('.fallback-box-ret')?.classList.remove('hidden');
                                                    }}
                                                />
                                                <div className="fallback-box-ret hidden absolute inset-0 flex flex-col items-center justify-center p-4 text-center text-zinc-400">
                                                    <Camera className="w-8 h-8 text-zinc-600 mb-1" />
                                                    <span className="text-xs font-bold text-zinc-300">Photo Preview Unavailable</span>
                                                </div>

                                                {/* Zoom Button Overlay */}
                                                <button
                                                    type="button"
                                                    onClick={() => setZoomModalPhoto({
                                                        url: resolvePhotoUrl(activeReturnPhoto),
                                                        title: `Return Inspection Photo — ${booking.vehicle?.name}`,
                                                        type: 'return',
                                                        details: returnInsp
                                                    })}
                                                    className="absolute top-2 right-2 w-8 h-8 rounded-lg bg-black/60 hover:bg-black/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                                    title="View Full Resolution"
                                                >
                                                    <ZoomIn size={14} />
                                                </button>

                                                <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur-sm text-white text-[9px] font-bold">
                                                    Return Record
                                                </div>
                                            </>
                                        ) : (
                                            /* Return Inspection Pending Showcase */
                                            <div className="flex flex-col items-center justify-center p-6 text-center text-zinc-400 bg-gradient-to-b from-zinc-900 to-zinc-950 h-full w-full">
                                                <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mb-2.5">
                                                    <Clock className="w-6 h-6 stroke-[1.5]" />
                                                </div>
                                                <h5 className="text-xs font-black uppercase tracking-wider text-zinc-200">
                                                    Return Inspection Pending
                                                </h5>
                                                <p className="text-[11px] text-zinc-400 max-w-xs mt-1 leading-normal">
                                                    No return inspection photos submitted yet. Vehicle is currently in rental period or awaiting arrival check-in.
                                                </p>
                                                {onRecordInspection && (
                                                    <button
                                                        type="button"
                                                        onClick={() => onRecordInspection('return')}
                                                        className="mt-3 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-wider transition-colors inline-flex items-center gap-1.5 shadow-md"
                                                    >
                                                        <Camera size={12} /> Record Return Inspection
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Return Thumbnail Selector (if multiple photos) */}
                                    {returnPhotos.length > 1 && (
                                        <div className="p-2 border-t border-zinc-200 dark:border-zinc-800 flex gap-1.5 overflow-x-auto bg-zinc-50 dark:bg-zinc-950">
                                            {returnPhotos.map((photo, rIdx) => (
                                                <button
                                                    key={rIdx}
                                                    type="button"
                                                    onClick={() => setSelectedReturnIdx(rIdx)}
                                                    className={`w-12 h-9 rounded-md border-2 overflow-hidden shrink-0 transition-all ${
                                                        selectedReturnIdx === rIdx ? 'border-emerald-500 scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                                                    }`}
                                                >
                                                    <img src={resolvePhotoUrl(photo)} alt={`Return ${rIdx+1}`} className="w-full h-full object-cover" />
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {/* Notes Footer */}
                                    <div className="p-3 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 text-xs">
                                        <div className="text-[9px] font-black uppercase tracking-wider text-zinc-400 mb-0.5">
                                            Return Inspection Notes
                                        </div>
                                        <p className="text-zinc-700 dark:text-zinc-300 text-[11px] leading-relaxed line-clamp-2">
                                            {returnInsp?.notes || (returnInsp ? 'No damage notes logged.' : 'Awaiting return verification.')}
                                        </p>
                                    </div>
                                </div>
                            )}

                        </div>

                        {/* Visual Difference Callout Bar */}
                        <div className="mt-4 p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                            <div className="flex items-center gap-2">
                                <Fuel className="w-4 h-4 text-amber-500" />
                                <span className="text-[11px] font-bold text-zinc-600 dark:text-zinc-300">
                                    Fuel Level Status:
                                </span>
                                <span className={`text-[11px] font-black ${fuelDeficit > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                    {fuelDeficit > 0 ? `${fuelDeficit} bars deficit` : fuelDeficit === 0 ? 'Full / Match' : `${Math.abs(fuelDeficit)} bars surplus`}
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                <Gauge className="w-4 h-4 text-blue-500" />
                                <span className="text-[11px] font-bold text-zinc-600 dark:text-zinc-300">
                                    Total Trip Distance:
                                </span>
                                <span className="text-[11px] font-black text-zinc-900 dark:text-white font-mono">
                                    {distanceDriven.toLocaleString()} KM
                                </span>
                            </div>
                        </div>

                    </div>

                    {/* ======================================================== */}
                    {/* RIGHT PANE: LOGS, RECORDS & SURCHARGES (WIDTH 5/12)      */}
                    {/* ======================================================== */}
                    <div className="lg:col-span-5 flex flex-col bg-white dark:bg-zinc-900 overflow-y-auto p-4 sm:p-6 space-y-5 text-left">
                        
                        {/* 1. Summary Metrics Bar */}
                        <div className="grid grid-cols-3 gap-2.5">
                            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                                <div className="text-[9px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1">
                                    <Fuel size={11} className="text-amber-500" /> Fuel Deficit
                                </div>
                                <div className={`text-sm font-black mt-1 ${fuelDeficit > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                    {fuelDeficit > 0 ? `-${fuelDeficit} Bars` : fuelDeficit === 0 ? 'Full / Match' : `+${Math.abs(fuelDeficit)} Extra`}
                                </div>
                                <div className="text-[9px] text-zinc-400 mt-0.5 truncate">
                                    {pickup ? `${pickup.fuel_bars}/8` : '—'} vs {returnInsp ? `${returnInsp.fuel_bars}/8` : '—'}
                                </div>
                            </div>

                            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                                <div className="text-[9px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1">
                                    <Gauge size={11} className="text-blue-500" /> Mileage
                                </div>
                                <div className="text-sm font-black text-zinc-900 dark:text-white mt-1 font-mono">
                                    {distanceDriven.toLocaleString()} KM
                                </div>
                                <div className="text-[9px] text-zinc-400 mt-0.5 truncate">
                                    {pickup ? `${pickup.odometer_reading}km` : '0km'}
                                </div>
                            </div>

                            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                                <div className="text-[9px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1">
                                    <DollarSign size={11} className="text-rose-500" /> Surcharges
                                </div>
                                <div className="text-sm font-black text-rose-500 mt-1 font-mono">
                                    PHP {charges.reduce((sum, c) => sum + parseFloat(c.amount || 0), 0).toLocaleString()}
                                </div>
                                <div className="text-[9px] text-zinc-400 mt-0.5">
                                    {charges.length} proposed
                                </div>
                            </div>
                        </div>

                        {/* 2. Pickup vs Return Matrix Details */}
                        <div className="space-y-3">
                            <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                                Inspection Records Log
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {/* Pickup Details */}
                                <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 space-y-2">
                                    <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-1.5">
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-blue-500/10 text-blue-600 border border-blue-500/20">
                                            Pickup Record
                                        </span>
                                        <span className="text-[9px] text-zinc-400 font-semibold">
                                            {pickup?.inspected_at ? new Date(pickup.inspected_at).toLocaleDateString() : 'Not Recorded'}
                                        </span>
                                    </div>

                                    {pickup ? (
                                        <div className="text-xs space-y-1">
                                            <div className="flex justify-between"><span className="text-zinc-400">Fuel Level:</span> <span className="font-bold">{pickup.fuel_bars} / 8 Bars</span></div>
                                            <div className="flex justify-between"><span className="text-zinc-400">Odometer:</span> <span className="font-mono font-bold">{pickup.odometer_reading.toLocaleString()} KM</span></div>
                                            <div className="flex justify-between"><span className="text-zinc-400">Inspector:</span> <span className="font-bold truncate max-w-[100px]">{pickup.inspector?.name || 'Staff'}</span></div>
                                            {pickup.notes && (
                                                <div className="pt-1 text-[11px] text-zinc-600 dark:text-zinc-400 border-t border-zinc-200 dark:border-zinc-800">
                                                    {pickup.notes}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-zinc-400 italic py-2">No pickup record.</p>
                                    )}
                                </div>

                                {/* Return Details */}
                                <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 space-y-2">
                                    <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-1.5">
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                                            Return Record
                                        </span>
                                        <span className="text-[9px] text-zinc-400 font-semibold">
                                            {returnInsp?.inspected_at ? new Date(returnInsp.inspected_at).toLocaleDateString() : 'Pending'}
                                        </span>
                                    </div>

                                    {returnInsp ? (
                                        <div className="text-xs space-y-1">
                                            <div className="flex justify-between"><span className="text-zinc-400">Fuel Level:</span> <span className="font-bold">{returnInsp.fuel_bars} / 8 Bars</span></div>
                                            <div className="flex justify-between"><span className="text-zinc-400">Odometer:</span> <span className="font-mono font-bold">{returnInsp.odometer_reading.toLocaleString()} KM</span></div>
                                            <div className="flex justify-between"><span className="text-zinc-400">Inspector:</span> <span className="font-bold truncate max-w-[100px]">{returnInsp.inspector?.name || 'Staff'}</span></div>
                                            {returnInsp.notes && (
                                                <div className="pt-1 text-[11px] text-zinc-600 dark:text-zinc-400 border-t border-zinc-200 dark:border-zinc-800">
                                                    {returnInsp.notes}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-zinc-400 italic py-2">No return inspection yet.</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* 3. Additional Charges Section */}
                        <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                                        Proposed Surcharges & Damages
                                    </h4>
                                    <p className="text-[10px] text-zinc-400">Fuel shortage, damages, or late return penalties</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowChargeForm(o => !o)}
                                    className="flex items-center gap-1.5 px-2.5 h-7 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg text-[10px] font-black hover:opacity-80 transition-opacity"
                                >
                                    <Plus size={11} /> {showChargeForm ? 'Cancel' : 'Propose Charge'}
                                </button>
                            </div>

                            {/* Charge Submission Form */}
                            {showChargeForm && (
                                <form onSubmit={handleChargeSubmit} className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-2.5 mb-3 text-xs">
                                    <div className="text-[11px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                                        Propose Additional Surcharge
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="block text-[9px] font-bold text-zinc-500 uppercase mb-1">Charge Type</label>
                                            <select
                                                value={chargeForm.data.charge_type}
                                                onChange={e => chargeForm.setData('charge_type', e.target.value)}
                                                className="w-full h-7 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-2 text-xs"
                                            >
                                                <option value="fuel_deficit">Fuel Deficit</option>
                                                <option value="damage">Vehicle Damage</option>
                                                <option value="cleaning">Special Cleaning Fee</option>
                                                <option value="late_return">Late Return Penalty</option>
                                                <option value="other">Other Surcharge</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[9px] font-bold text-zinc-500 uppercase mb-1">Amount (PHP)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                required
                                                placeholder="e.g. 500"
                                                value={chargeForm.data.amount}
                                                onChange={e => chargeForm.setData('amount', e.target.value)}
                                                className="w-full h-7 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-2 text-xs font-mono"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[9px] font-bold text-zinc-500 uppercase mb-1">Reason / Description</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="e.g. 1 hour late return, scratches on bumper..."
                                            value={chargeForm.data.description}
                                            onChange={e => chargeForm.setData('description', e.target.value)}
                                            className="w-full h-7 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-2 text-xs"
                                        />
                                    </div>
                                    <div className="flex justify-end gap-2 pt-1">
                                        <button
                                            type="submit"
                                            disabled={chargeForm.processing}
                                            className="px-3 h-7 bg-[#FF3B30] text-white rounded-lg text-xs font-black hover:bg-red-700 transition-colors disabled:opacity-50"
                                        >
                                            Submit Proposal
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* Charges List */}
                            {charges.length === 0 ? (
                                <p className="text-xs text-zinc-400 italic py-2">No extra charges proposed for this booking.</p>
                            ) : (
                                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                                    {charges.map(c => {
                                        const cfg = CHARGE_STATUS_CONFIG[c.status] || CHARGE_STATUS_CONFIG.proposed;
                                        return (
                                            <div key={c.id} className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex flex-col gap-2">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-black uppercase border ${cfg.color}`}>
                                                            {cfg.label}
                                                        </span>
                                                        <span className="text-xs font-bold text-zinc-900 dark:text-white uppercase">
                                                            {c.charge_type.replace('_', ' ')}
                                                        </span>
                                                    </div>
                                                    <span className="text-xs font-black text-rose-500 font-mono">
                                                        PHP {parseFloat(c.amount).toLocaleString()}
                                                    </span>
                                                </div>

                                                <p className="text-[11px] text-zinc-600 dark:text-zinc-400">{c.description}</p>
                                                
                                                <div className="flex items-center justify-between text-[9px] text-zinc-400 pt-1 border-t border-zinc-200 dark:border-zinc-800/60">
                                                    <span>By {c.creator?.name || 'Staff'}</span>

                                                    {/* Status Action Buttons for Staff/Admin */}
                                                    <div className="flex items-center gap-1">
                                                        {c.status === 'proposed' && (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleUpdateChargeStatus(c.id, 'approved')}
                                                                    className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-600 text-[9px] font-black uppercase rounded hover:bg-blue-500/20 transition-colors"
                                                                >
                                                                    Approve
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleUpdateChargeStatus(c.id, 'rejected')}
                                                                    className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 text-rose-600 text-[9px] font-black uppercase rounded hover:bg-rose-500/20 transition-colors"
                                                                >
                                                                    Reject
                                                                </button>
                                                            </>
                                                        )}
                                                        {c.status === 'approved' && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleUpdateChargeStatus(c.id, 'paid')}
                                                                className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-[9px] font-black uppercase rounded hover:bg-emerald-500/20 transition-colors"
                                                            >
                                                                Mark Paid
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                    </div>

                </div>

            </div>

            {/* Photo Lightbox Zoom Modal */}
            {zoomModalPhoto && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
                    <div className="relative max-w-4xl w-full bg-zinc-950 rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl">
                        <div className="flex items-center justify-between p-4 border-b border-zinc-800 text-white">
                            <div>
                                <h4 className="text-sm font-black">{zoomModalPhoto.title}</h4>
                                <p className="text-[10px] text-zinc-400 capitalize">{zoomModalPhoto.type} Inspection Record</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setZoomModalPhoto(null)}
                                className="w-8 h-8 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className="max-h-[70vh] flex items-center justify-center p-2 bg-black">
                            <img
                                src={zoomModalPhoto.url}
                                alt={zoomModalPhoto.title}
                                className="max-h-[68vh] w-auto max-w-full object-contain rounded-lg"
                            />
                        </div>
                        <div className="p-3 bg-zinc-900 border-t border-zinc-800 flex justify-between items-center text-xs">
                            <span className="text-zinc-400 text-[11px]">
                                {zoomModalPhoto.details?.notes || 'No extra notes recorded.'}
                            </span>
                            <a
                                href={zoomModalPhoto.url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-red-500 hover:underline"
                            >
                                <ExternalLink size={12} /> Open Original
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
