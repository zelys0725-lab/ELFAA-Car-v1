import React, { useState } from 'react';
import { useForm } from '@inertiajs/react';
import {
    X, DollarSign, Calendar, ShieldCheck, Tag, FileText,
    History, AlertTriangle, ArrowRight, Printer, CheckCircle, Edit3, Plus
} from 'lucide-react';

export default function BookingPriceBreakdownModal({ booking, isAdmin = false, onClose }) {
    const [showAdjustForm, setShowAdjustForm] = useState(false);

    // Calculate rental duration in days
    const startDate = new Date(booking.start_datetime);
    const endDate = new Date(booking.end_datetime);
    const durationDays = Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)));

    const approvedCharges = (booking.inspection_charges || [])
        .filter(c => c.status === 'approved')
        .reduce((sum, c) => sum + parseFloat(c.amount || 0), 0);

    const priceHistories = booking.price_histories || [];

    // Form for adjusting price / amounts
    const form = useForm({
        new_total: booking.total_price,
        security_deposit: booking.security_deposit || 0,
        amount_paid: booking.amount_paid || 0,
        reason: '',
    });

    const handleAdjustSubmit = (e) => {
        e.preventDefault();
        form.post(route('admin.bookings.adjust_price', booking.id), {
            onSuccess: () => {
                setShowAdjustForm(false);
                form.reset('reason');
            },
        });
    };

    const remainingBalance = Math.max(0, parseFloat(booking.total_price) - parseFloat(booking.amount_paid || 0));

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            
            <div className="z-10 w-full max-w-2xl max-h-[90vh] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-colors">
                
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-white">
                                Complete Price Breakdown & Statement
                            </h3>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                                #INV-{String(booking.id).padStart(5, '0')}
                            </span>
                        </div>
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                            Renter: {booking.user?.name} · Vehicle: {booking.vehicle?.name} ({booking.vehicle?.plate_number})
                        </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <a
                            href={route('admin.bookings.invoice', booking.id)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 px-3 py-1.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg text-xs font-bold hover:opacity-80 transition-opacity"
                        >
                            <Printer size={13} /> Print Invoice
                        </a>
                        <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"><X size={18} /></button>
                    </div>
                </div>

                {/* Body Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 text-left">
                    
                    {/* Itemized Price Table */}
                    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-zinc-100 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                                    <th className="p-3">Item Description</th>
                                    <th className="p-3">Rate / Basis</th>
                                    <th className="p-3 text-right">Amount (PHP)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-xs">
                                
                                {/* 1. Base Rental */}
                                <tr>
                                    <td className="p-3">
                                        <div className="font-bold text-zinc-900 dark:text-white">{booking.vehicle?.name} Rental</div>
                                        <div className="text-[10px] text-zinc-400">{durationDays} Days ({new Date(booking.start_datetime).toLocaleDateString()} – {new Date(booking.end_datetime).toLocaleDateString()})</div>
                                    </td>
                                    <td className="p-3 text-zinc-500">PHP {parseFloat(booking.vehicle?.price_per_day || 0).toLocaleString()} / day</td>
                                    <td className="p-3 text-right font-mono font-bold">PHP {parseFloat(booking.original_price || 0).toLocaleString()}</td>
                                </tr>

                                {/* 2. Location Fee */}
                                {parseFloat(booking.location_fee || 0) > 0 && (
                                    <tr>
                                        <td className="p-3">
                                            <div className="font-bold text-zinc-900 dark:text-white">Location / Delivery Charge</div>
                                            <div className="text-[10px] text-zinc-400">Pickup: {booking.pickup_location}</div>
                                        </td>
                                        <td className="p-3 text-zinc-500">Out-of-Bounds Fee</td>
                                        <td className="p-3 text-right font-mono font-bold text-amber-500">+ PHP {parseFloat(booking.location_fee).toLocaleString()}</td>
                                    </tr>
                                )}

                                {/* 3. Promo Discount */}
                                {parseFloat(booking.discount_amount || 0) > 0 && (
                                    <tr>
                                        <td className="p-3">
                                            <div className="font-bold text-emerald-600 dark:text-emerald-400">Promo Discount ({booking.promo_code})</div>
                                            <div className="text-[10px] text-zinc-400">Campaign Deduction</div>
                                        </td>
                                        <td className="p-3 text-zinc-500">Discount</td>
                                        <td className="p-3 text-right font-mono font-bold text-emerald-500">- PHP {parseFloat(booking.discount_amount).toLocaleString()}</td>
                                    </tr>
                                )}

                                {/* 4. Approved Return Surcharges */}
                                {approvedCharges > 0 && (
                                    <tr className="bg-rose-500/5">
                                        <td className="p-3">
                                            <div className="font-bold text-rose-600 dark:text-rose-400">Approved Return Inspection Surcharges</div>
                                            <div className="text-[10px] text-zinc-400">Damage, fuel deficit, or late return penalties</div>
                                        </td>
                                        <td className="p-3 text-zinc-500">Inspection Fee</td>
                                        <td className="p-3 text-right font-mono font-bold text-rose-500">+ PHP {approvedCharges.toLocaleString()}</td>
                                    </tr>
                                )}

                                {/* 5. Security Deposit */}
                                {parseFloat(booking.security_deposit || 0) > 0 && (
                                    <tr>
                                        <td className="p-3">
                                            <div className="font-bold text-blue-600 dark:text-blue-400">Refundable Security Deposit</div>
                                            <div className="text-[10px] text-zinc-400">Subject to vehicle inspection on return</div>
                                        </td>
                                        <td className="p-3 text-zinc-500">Deposit</td>
                                        <td className="p-3 text-right font-mono font-bold text-blue-500">PHP {parseFloat(booking.security_deposit).toLocaleString()}</td>
                                    </tr>
                                )}

                                {/* TOTAL ROW */}
                                <tr className="bg-zinc-50 dark:bg-zinc-950 font-black text-sm">
                                    <td colSpan="2" className="p-3 uppercase tracking-wider text-zinc-900 dark:text-white">
                                        Final Total Rental Amount
                                    </td>
                                    <td className="p-3 text-right font-mono text-zinc-900 dark:text-white">
                                        PHP {parseFloat(booking.total_price).toLocaleString()}
                                    </td>
                                </tr>

                                {/* AMOUNT PAID ROW */}
                                <tr>
                                    <td colSpan="2" className="p-3 text-emerald-600 dark:text-emerald-400 font-bold">
                                        Amount Received / Verified Paid
                                    </td>
                                    <td className="p-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                        - PHP {parseFloat(booking.amount_paid || 0).toLocaleString()}
                                    </td>
                                </tr>

                                {/* REMAINING BALANCE ROW */}
                                <tr className="bg-rose-500/10 font-black text-sm text-rose-600 dark:text-rose-400">
                                    <td colSpan="2" className="p-3 uppercase tracking-wider">
                                        Remaining Unpaid Balance
                                    </td>
                                    <td className="p-3 text-right font-mono">
                                        PHP {remainingBalance.toLocaleString()}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Staff Price Adjustment Form (Admin/Staff) */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Post-Return Price Adjustment</h4>
                            <button
                                onClick={() => setShowAdjustForm(o => !o)}
                                className="flex items-center gap-1 text-xs text-rose-500 hover:underline font-bold"
                            >
                                <Edit3 size={12} /> {showAdjustForm ? 'Close Form' : 'Update Statement & Amounts'}
                            </button>
                        </div>

                        {showAdjustForm && (
                            <form onSubmit={handleAdjustSubmit} className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20 space-y-3">
                                <div className="text-xs font-black text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                                    Modify Total Amount or Payments
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-[9px] font-bold text-zinc-500 uppercase mb-1">New Total Price (PHP)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            required
                                            value={form.data.new_total}
                                            onChange={e => form.setData('new_total', e.target.value)}
                                            className="w-full h-8 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-2.5 text-xs font-mono"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[9px] font-bold text-zinc-500 uppercase mb-1">Amount Paid (PHP)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={form.data.amount_paid}
                                            onChange={e => form.setData('amount_paid', e.target.value)}
                                            className="w-full h-8 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-2.5 text-xs font-mono text-emerald-600 font-bold"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[9px] font-bold text-zinc-500 uppercase mb-1">Security Deposit (PHP)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={form.data.security_deposit}
                                            onChange={e => form.setData('security_deposit', e.target.value)}
                                            className="w-full h-8 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-2.5 text-xs font-mono text-blue-600 font-bold"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[9px] font-bold text-zinc-500 uppercase mb-1">Reason for Adjustment *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Added approved bumper damage fee / Granted return fuel refund..."
                                        value={form.data.reason}
                                        onChange={e => form.setData('reason', e.target.value)}
                                        className="w-full h-8 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-2.5 text-xs"
                                    />
                                </div>
                                <div className="flex justify-end pt-1">
                                    <button
                                        type="submit"
                                        disabled={form.processing}
                                        className="px-4 h-8 bg-[#FF3B30] text-white rounded-lg text-xs font-black hover:bg-red-700 transition-colors disabled:opacity-50"
                                    >
                                        Save & Audit Log Price Change
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>

                    {/* Price Modification History Audit Trail */}
                    <div>
                        <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                            <History size={13} className="text-zinc-400" /> Price Modification Audit Log History ({priceHistories.length})
                        </div>

                        {priceHistories.length === 0 ? (
                            <p className="text-xs text-zinc-400 italic">No previous price adjustments recorded. Original price preserved.</p>
                        ) : (
                            <div className="space-y-2">
                                {priceHistories.map((log) => (
                                    <div key={log.id} className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <div className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                                <span>{log.reason}</span>
                                                <span className="text-[10px] text-zinc-400 font-normal">
                                                    by {log.changed_by?.name || 'Staff'} on {new Date(log.created_at).toLocaleString()}
                                                </span>
                                            </div>
                                            <div className="text-[10px] text-zinc-500 font-mono">
                                                Previous: PHP {parseFloat(log.previous_total).toLocaleString()} → New: PHP {parseFloat(log.new_total).toLocaleString()}
                                            </div>
                                        </div>
                                        <div className={`font-mono font-black text-xs px-2 py-1 rounded ${
                                            parseFloat(log.change_amount) >= 0 ? 'bg-rose-500/10 text-rose-600' : 'bg-emerald-500/10 text-emerald-600'
                                        }`}>
                                            {parseFloat(log.change_amount) >= 0 ? `+PHP ${parseFloat(log.change_amount).toLocaleString()}` : `-PHP ${Math.abs(parseFloat(log.change_amount)).toLocaleString()}`}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                </div>

            </div>
        </div>
    );
}
