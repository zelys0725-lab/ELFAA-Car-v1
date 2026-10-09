import React, { useState } from 'react';
import { useForm } from '@inertiajs/react';
import {
    X, Fuel, Gauge, AlertTriangle, Camera, DollarSign,
    CheckCircle, XCircle, Plus, ShieldCheck, ArrowRight, Image as ImageIcon
} from 'lucide-react';

const CHARGE_STATUS_CONFIG = {
    proposed: { label: 'Proposed', color: 'text-amber-600 bg-amber-500/10 border-amber-500/20' },
    approved: { label: 'Approved', color: 'text-blue-600 bg-blue-500/10 border-blue-500/20' },
    rejected: { label: 'Rejected', color: 'text-rose-600 bg-rose-500/10 border-rose-500/20' },
    paid:     { label: 'Paid',     color: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20' },
};

export default function InspectionComparisonDrawer({ booking, isAdmin = false, onClose }) {
    const inspections = booking.inspections || [];
    const pickup = inspections.find(i => i.type === 'pickup');
    const returnInsp = inspections.find(i => i.type === 'return');
    const charges = booking.inspection_charges || [];

    const [showChargeForm, setShowChargeForm] = useState(false);

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
        <div className="fixed inset-0 z-[70] flex items-center justify-end p-0 sm:p-4">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="z-10 w-full max-w-2xl h-full sm:h-[90vh] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-none sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-colors">
                
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                    <div>
                        <h3 className="text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-white">
                            Inspection & Damage Comparison Log
                        </h3>
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                            {booking.vehicle?.name} ({booking.vehicle?.plate_number}) — Renter: {booking.user?.name}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"><X size={18} /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 text-left">
                    
                    {/* Summary Metrics Bar */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                            <div className="text-[9px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1">
                                <Fuel size={12} className="text-amber-500" /> Fuel Deficit
                            </div>
                            <div className={`text-base font-black mt-1 ${fuelDeficit > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                {fuelDeficit > 0 ? `-${fuelDeficit} Fuel Bars` : fuelDeficit === 0 ? 'Full / Match' : `+${Math.abs(fuelDeficit)} Bars Extra`}
                            </div>
                            <div className="text-[10px] text-zinc-400 mt-0.5">
                                Pickup: {pickup ? `${pickup.fuel_bars}/8` : '—'} vs Return: {returnInsp ? `${returnInsp.fuel_bars}/8` : '—'}
                            </div>
                        </div>

                        <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                            <div className="text-[9px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1">
                                <Gauge size={12} className="text-blue-500" /> Distance Driven
                            </div>
                            <div className="text-base font-black text-zinc-900 dark:text-white mt-1">
                                {distanceDriven.toLocaleString()} KM
                            </div>
                            <div className="text-[10px] text-zinc-400 mt-0.5">
                                {pickup ? `${pickup.odometer_reading}km` : '0km'} → {returnInsp ? `${returnInsp.odometer_reading}km` : '0km'}
                            </div>
                        </div>

                        <div className="col-span-2 sm:col-span-1 p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                            <div className="text-[9px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1">
                                <DollarSign size={12} className="text-rose-500" /> Additional Charges
                            </div>
                            <div className="text-base font-black text-rose-500 mt-1">
                                PHP {charges.reduce((sum, c) => sum + parseFloat(c.amount || 0), 0).toLocaleString()}
                            </div>
                            <div className="text-[10px] text-zinc-400 mt-0.5">
                                {charges.length} Surcharge items proposed
                            </div>
                        </div>
                    </div>

                    {/* Side-by-Side Comparison Matrix */}
                    <div>
                        <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3">Pickup vs Return Inspection Records</div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            
                            {/* PICKUP COLUMN */}
                            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 space-y-3">
                                <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase bg-blue-500/10 text-blue-600 border border-blue-500/20">
                                        Pickup Record
                                    </span>
                                    <span className="text-[10px] text-zinc-400 font-semibold">{pickup?.inspected_at ? new Date(pickup.inspected_at).toLocaleDateString() : 'Not Recorded'}</span>
                                </div>

                                {pickup ? (
                                    <>
                                        <div className="text-xs space-y-1">
                                            <div className="flex justify-between"><span className="text-zinc-400">Fuel Level:</span> <span className="font-bold">{pickup.fuel_bars} / 8 Bars</span></div>
                                            <div className="flex justify-between"><span className="text-zinc-400">Odometer:</span> <span className="font-mono font-bold">{pickup.odometer_reading.toLocaleString()} KM</span></div>
                                            <div className="flex justify-between"><span className="text-zinc-400">Inspector:</span> <span className="font-bold">{pickup.inspector?.name || 'Staff'}</span></div>
                                        </div>
                                        {pickup.notes && (
                                            <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-700 dark:text-zinc-300">
                                                <strong className="block text-[9px] uppercase tracking-wider text-zinc-400 mb-0.5">Initial Damage Notes:</strong>
                                                {pickup.notes}
                                            </div>
                                        )}
                                        {pickup.photos && pickup.photos.length > 0 && (
                                            <div>
                                                <div className="text-[9px] font-bold uppercase text-zinc-400 mb-1">Pickup Photos ({pickup.photos.length})</div>
                                                <div className="grid grid-cols-3 gap-1.5">
                                                    {pickup.photos.map((p, idx) => (
                                                        <a key={idx} href={`/storage/${p}`} target="_blank" rel="noreferrer" className="aspect-video rounded border border-zinc-200 dark:border-zinc-800 overflow-hidden block">
                                                            <img src={`/storage/${p}`} alt={`Pickup photo ${idx+1}`} className="w-full h-full object-cover" />
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <p className="text-xs text-zinc-400 italic py-4">No pickup inspection submitted yet.</p>
                                )}
                            </div>

                            {/* RETURN COLUMN */}
                            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 space-y-3">
                                <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                                        Return Record
                                    </span>
                                    <span className="text-[10px] text-zinc-400 font-semibold">{returnInsp?.inspected_at ? new Date(returnInsp.inspected_at).toLocaleDateString() : 'Not Recorded'}</span>
                                </div>

                                {returnInsp ? (
                                    <>
                                        <div className="text-xs space-y-1">
                                            <div className="flex justify-between"><span className="text-zinc-400">Fuel Level:</span> <span className="font-bold">{returnInsp.fuel_bars} / 8 Bars</span></div>
                                            <div className="flex justify-between"><span className="text-zinc-400">Odometer:</span> <span className="font-mono font-bold">{returnInsp.odometer_reading.toLocaleString()} KM</span></div>
                                            <div className="flex justify-between"><span className="text-zinc-400">Inspector:</span> <span className="font-bold">{returnInsp.inspector?.name || 'Staff'}</span></div>
                                        </div>
                                        {returnInsp.notes && (
                                            <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-700 dark:text-zinc-300">
                                                <strong className="block text-[9px] uppercase tracking-wider text-amber-500 mb-0.5">Return Damage / Deficit Notes:</strong>
                                                {returnInsp.notes}
                                            </div>
                                        )}
                                        {returnInsp.photos && returnInsp.photos.length > 0 && (
                                            <div>
                                                <div className="text-[9px] font-bold uppercase text-zinc-400 mb-1">Return Photos ({returnInsp.photos.length})</div>
                                                <div className="grid grid-cols-3 gap-1.5">
                                                    {returnInsp.photos.map((p, idx) => (
                                                        <a key={idx} href={`/storage/${p}`} target="_blank" rel="noreferrer" className="aspect-video rounded border border-zinc-200 dark:border-zinc-800 overflow-hidden block">
                                                            <img src={`/storage/${p}`} alt={`Return photo ${idx+1}`} className="w-full h-full object-cover" />
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <p className="text-xs text-zinc-400 italic py-4">No return inspection submitted yet.</p>
                                )}
                            </div>

                        </div>
                    </div>

                    {/* Additional Charges Section */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Proposed Additional Surcharges & Damages</h4>
                                <p className="text-[10px] text-zinc-400">Extra fees proposed for damage, fuel shortage, or cleaning</p>
                            </div>
                            <button
                                onClick={() => setShowChargeForm(o => !o)}
                                className="flex items-center gap-1.5 px-3 h-8 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg text-[10px] font-black hover:opacity-80 transition-opacity"
                            >
                                <Plus size={12} /> {showChargeForm ? 'Cancel Form' : 'Propose Charge'}
                            </button>
                        </div>

                        {/* Additional Charge Submission Form */}
                        {showChargeForm && (
                            <form onSubmit={handleChargeSubmit} className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-3 mb-4">
                                <div className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                                    Propose Additional Surcharge
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[9px] font-bold text-zinc-500 uppercase mb-1">Charge Type</label>
                                        <select
                                            value={chargeForm.data.charge_type}
                                            onChange={e => chargeForm.setData('charge_type', e.target.value)}
                                            className="w-full h-8 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-2.5 text-xs"
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
                                            placeholder="e.g. 1500"
                                            value={chargeForm.data.amount}
                                            onChange={e => chargeForm.setData('amount', e.target.value)}
                                            className="w-full h-8 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-2.5 text-xs font-mono"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[9px] font-bold text-zinc-500 uppercase mb-1">Reason / Description</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. 3 fuel bars shortage, front bumper dent repair cost..."
                                        value={chargeForm.data.description}
                                        onChange={e => chargeForm.setData('description', e.target.value)}
                                        className="w-full h-8 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-2.5 text-xs"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-bold text-zinc-500 uppercase mb-1">Upload Evidence Photos</label>
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        onChange={e => chargeForm.setData('evidence_photos', Array.from(e.target.files))}
                                        className="w-full text-xs h-8 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:font-bold file:bg-zinc-200 dark:file:bg-zinc-800"
                                    />
                                </div>
                                <div className="flex justify-end gap-2 pt-1">
                                    <button
                                        type="submit"
                                        disabled={chargeForm.processing}
                                        className="px-4 h-8 bg-[#FF3B30] text-white rounded-lg text-xs font-black hover:bg-red-700 transition-colors disabled:opacity-50"
                                    >
                                        Submit Charge Proposal
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* Charges Table */}
                        {charges.length === 0 ? (
                            <p className="text-xs text-zinc-400 italic">No extra charges proposed for this booking.</p>
                        ) : (
                            <div className="space-y-2">
                                {charges.map(c => {
                                    const cfg = CHARGE_STATUS_CONFIG[c.status] || CHARGE_STATUS_CONFIG.proposed;
                                    return (
                                        <div key={c.id} className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-black uppercase border ${cfg.color}`}>
                                                        {cfg.label}
                                                    </span>
                                                    <span className="text-xs font-bold text-zinc-900 dark:text-white uppercase">{c.charge_type.replace('_', ' ')}</span>
                                                    <span className="text-xs font-black text-rose-500 font-mono">PHP {parseFloat(c.amount).toLocaleString()}</span>
                                                </div>
                                                <p className="text-xs text-zinc-600 dark:text-zinc-400">{c.description}</p>
                                                <div className="text-[9px] text-zinc-400">
                                                    Proposed by {c.creator?.name || 'Staff'}
                                                    {c.approver && ` · Reviewed by ${c.approver.name}`}
                                                </div>
                                            </div>

                                            {/* Status Action Buttons for Staff/Admin */}
                                            <div className="flex items-center gap-1 shrink-0">
                                                {c.status === 'proposed' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleUpdateChargeStatus(c.id, 'approved')}
                                                            className="px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-600 text-[10px] font-black uppercase rounded hover:bg-blue-500/20 transition-colors"
                                                        >
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => handleUpdateChargeStatus(c.id, 'rejected')}
                                                            className="px-2.5 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-600 text-[10px] font-black uppercase rounded hover:bg-rose-500/20 transition-colors"
                                                        >
                                                            Reject
                                                        </button>
                                                    </>
                                                )}
                                                {c.status === 'approved' && (
                                                    <button
                                                        onClick={() => handleUpdateChargeStatus(c.id, 'paid')}
                                                        className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-[10px] font-black uppercase rounded hover:bg-emerald-500/20 transition-colors"
                                                    >
                                                        Mark Paid
                                                    </button>
                                                )}
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
    );
}
