import React, { useState } from 'react';
import { useForm } from '@inertiajs/react';
import {
    X, DollarSign, Calendar, ShieldCheck, Tag, FileText,
    History, AlertTriangle, ArrowRight, Printer, CheckCircle, Edit3, Plus, CreditCard
} from 'lucide-react';

export default function BookingPriceBreakdownModal({ booking, isAdmin = false, onClose }) {
    const [showAdjustForm, setShowAdjustForm] = useState(false);
    const [showPaymentForm, setShowPaymentForm] = useState(false);

    // Calculate rental duration in days
    const startDate = new Date(booking.start_datetime);
    const endDate = new Date(booking.end_datetime);
    const durationDays = Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)));

    const approvedCharges = (booking.inspection_charges || [])
        .filter(c => c.status === 'approved')
        .reduce((sum, c) => sum + parseFloat(c.amount || 0), 0);

    const priceHistories = booking.price_histories || [];
    const payments = booking.payments || [];

    // Form for adjusting price / amounts
    const adjustForm = useForm({
        new_total: booking.total_price,
        security_deposit: booking.security_deposit || 0,
        amount_paid: booking.amount_paid || 0,
        reason: '',
    });

    const handleAdjustSubmit = (e) => {
        e.preventDefault();
        adjustForm.post(route('admin.bookings.adjust_price', booking.id), {
            onSuccess: () => {
                setShowAdjustForm(false);
                adjustForm.reset('reason');
            },
        });
    };

    // Form for logging individual cash / COD payment transaction (Feature #8)
    const paymentForm = useForm({
        amount_collected: '',
        payment_method: 'cash',
        payment_type: 'partial',
        reference_number: '',
        notes: '',
    });

    const handlePaymentSubmit = (e) => {
        e.preventDefault();
        paymentForm.post(route('admin.bookings.record_payment', booking.id), {
            onSuccess: () => {
                setShowPaymentForm(false);
                paymentForm.reset('amount_collected', 'reference_number', 'notes');
            },
        });
    };

    const remainingBalance = Math.max(0, parseFloat(booking.total_price) - parseFloat(booking.amount_paid || 0));
    const isFullyPaid = remainingBalance <= 0;
    const paidPercentage = Math.min(100, Math.round((parseFloat(booking.amount_paid || 0) / parseFloat(booking.total_price)) * 100));

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            
            <div className="z-10 w-full max-w-3xl max-h-[90vh] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-colors text-left">
                
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-white">
                                Complete Price Breakdown & Balances
                            </h3>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                                #INV-{String(booking.id).padStart(5, '0')}
                            </span>
                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                                booking.payment_status === 'paid' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' :
                                booking.payment_status === 'partial' ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' :
                                'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                            }`}>
                                {booking.payment_status === 'paid' ? 'Fully Paid' : booking.payment_status === 'partial' ? `Partial Paid (${paidPercentage}%)` : 'Unpaid Balance'}
                            </span>
                        </div>
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                            Renter: {booking.user?.name} ({booking.user?.email}) · Vehicle: {booking.vehicle?.name} ({booking.vehicle?.plate_number})
                        </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <a
                            href={route('admin.bookings.invoice', booking.id)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 px-3 py-1.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg text-xs font-bold hover:opacity-80 transition-opacity"
                        >
                            <Printer size={13} /> Print Statement
                        </a>
                        <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"><X size={18} /></button>
                    </div>
                </div>

                {/* Body Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    
                    {/* Payment Status Guard Banner (Feature #8) */}
                    {!isFullyPaid ? (
                        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 flex items-start gap-3 text-xs">
                            <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                            <div>
                                <div className="font-bold">Outstanding Balance: PHP {remainingBalance.toLocaleString()}</div>
                                <div className="text-[11px] opacity-90 mt-0.5">
                                    Feature Guard: This rental has an unpaid balance. The system enforces partial status and will not automatically mark as fully paid until the remaining balance is collected in full.
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 flex items-center gap-3 text-xs">
                            <CheckCircle size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <div>
                                <div className="font-bold">Fully Settled</div>
                                <div className="text-[11px] opacity-90">All rental charges, surcharges, and balances have been collected and verified.</div>
                            </div>
                        </div>
                    )}

                    {/* Itemized Price Breakdown Table */}
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
                                        Total Amount Payable
                                    </td>
                                    <td className="p-3 text-right font-mono text-zinc-900 dark:text-white">
                                        PHP {parseFloat(booking.total_price).toLocaleString()}
                                    </td>
                                </tr>

                                {/* AMOUNT PAID ROW */}
                                <tr>
                                    <td colSpan="2" className="p-3 text-emerald-600 dark:text-emerald-400 font-bold">
                                        Total Collected Payments
                                    </td>
                                    <td className="p-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                        - PHP {parseFloat(booking.amount_paid || 0).toLocaleString()}
                                    </td>
                                </tr>

                                {/* REMAINING BALANCE ROW */}
                                <tr className="bg-rose-500/10 font-black text-sm text-rose-600 dark:text-rose-400">
                                    <td colSpan="2" className="p-3 uppercase tracking-wider">
                                        Remaining Outstanding Balance
                                    </td>
                                    <td className="p-3 text-right font-mono">
                                        PHP {remainingBalance.toLocaleString()}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Feature 8: Log Cash / COD Payment Action */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                                <CreditCard size={13} className="text-zinc-400" /> Cash / COD Payment Entry
                            </h4>
                            <button
                                onClick={() => setShowPaymentForm(o => !o)}
                                className="flex items-center gap-1 text-xs text-emerald-600 hover:underline font-bold cursor-pointer"
                            >
                                <Plus size={12} /> {showPaymentForm ? 'Close Payment Form' : '+ Log Cash/COD Payment'}
                            </button>
                        </div>

                        {showPaymentForm && (
                            <form onSubmit={handlePaymentSubmit} className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-3">
                                <div className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                                    Log Received Cash / COD / Online Payment
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-[9px] font-bold text-zinc-500 uppercase mb-1">Amount Collected (PHP) *</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            required
                                            placeholder={remainingBalance > 0 ? remainingBalance : '0.00'}
                                            value={paymentForm.data.amount_collected}
                                            onChange={e => paymentForm.setData('amount_collected', e.target.value)}
                                            className="w-full h-8 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-2.5 text-xs font-mono font-bold text-emerald-600"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[9px] font-bold text-zinc-500 uppercase mb-1">Payment Method *</label>
                                        <select
                                            value={paymentForm.data.payment_method}
                                            onChange={e => paymentForm.setData('payment_method', e.target.value)}
                                            className="w-full h-8 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-2.5 text-xs font-bold"
                                        >
                                            <option value="cash">Cash (On Hand)</option>
                                            <option value="cod">Cash on Delivery (COD)</option>
                                            <option value="gcash">GCash Mobile Wallet</option>
                                            <option value="bank_transfer">Bank Transfer / Maya</option>
                                            <option value="credit_card">Credit Card</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[9px] font-bold text-zinc-500 uppercase mb-1">Payment Stage / Type *</label>
                                        <select
                                            value={paymentForm.data.payment_type}
                                            onChange={e => paymentForm.setData('payment_type', e.target.value)}
                                            className="w-full h-8 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-2.5 text-xs font-bold"
                                        >
                                            <option value="partial">Partial Payment</option>
                                            <option value="downpayment">Initial Downpayment</option>
                                            <option value="final_settlement">Final Balance Settlement</option>
                                            <option value="surcharge_payment">Surcharge Payment</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[9px] font-bold text-zinc-500 uppercase mb-1">Reference / Receipt No. (Optional)</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. OR-88192 / GCASH-99120"
                                            value={paymentForm.data.reference_number}
                                            onChange={e => paymentForm.setData('reference_number', e.target.value)}
                                            className="w-full h-8 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-2.5 text-xs"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[9px] font-bold text-zinc-500 uppercase mb-1">Notes / Collector Remarks</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Cash collected upon vehicle pickup..."
                                            value={paymentForm.data.notes}
                                            onChange={e => paymentForm.setData('notes', e.target.value)}
                                            className="w-full h-8 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-2.5 text-xs"
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end pt-1">
                                    <button
                                        type="submit"
                                        disabled={paymentForm.processing}
                                        className="px-4 h-8 bg-emerald-600 text-white rounded-lg text-xs font-black hover:bg-emerald-700 transition-colors disabled:opacity-50 cursor-pointer"
                                    >
                                        Submit Payment Log
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>

                    {/* Payment Audit Logs History List */}
                    <div>
                        <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                            <History size={13} className="text-zinc-400" /> Itemized Payment History Log ({payments.length})
                        </div>

                        {payments.length === 0 ? (
                            <p className="text-xs text-zinc-400 italic">No separate payment transactions recorded yet.</p>
                        ) : (
                            <div className="space-y-2">
                                {payments.map((p) => (
                                    <div key={p.id} className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <div className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                                <span className="capitalize">{p.payment_type.replace('_', ' ')}</span>
                                                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                                                    {p.payment_method}
                                                </span>
                                                {p.reference_number && (
                                                    <span className="text-[10px] font-mono text-zinc-400">#{p.reference_number}</span>
                                                )}
                                            </div>
                                            <div className="text-[10px] text-zinc-500">
                                                Collected by {p.collector?.name || 'Staff'} on {new Date(p.created_at).toLocaleString()}
                                                {p.notes ? ` · "${p.notes}"` : ''}
                                            </div>
                                        </div>
                                        <div className="font-mono font-black text-xs px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-600">
                                            + PHP {parseFloat(p.amount_collected).toLocaleString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Staff Price Adjustment Form (Admin/Staff) */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Override Price Statement Total</h4>
                            <button
                                onClick={() => setShowAdjustForm(o => !o)}
                                className="flex items-center gap-1 text-xs text-rose-500 hover:underline font-bold cursor-pointer"
                            >
                                <Edit3 size={12} /> {showAdjustForm ? 'Close Override Form' : 'Manual Price Override'}
                            </button>
                        </div>

                        {showAdjustForm && (
                            <form onSubmit={handleAdjustSubmit} className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20 space-y-3">
                                <div className="text-xs font-black text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                                    Override Total Price or Security Deposit
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-[9px] font-bold text-zinc-500 uppercase mb-1">New Total Price (PHP)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            required
                                            value={adjustForm.data.new_total}
                                            onChange={e => adjustForm.setData('new_total', e.target.value)}
                                            className="w-full h-8 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-2.5 text-xs font-mono"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[9px] font-bold text-zinc-500 uppercase mb-1">Amount Paid (PHP)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={adjustForm.data.amount_paid}
                                            onChange={e => adjustForm.setData('amount_paid', e.target.value)}
                                            className="w-full h-8 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-2.5 text-xs font-mono text-emerald-600 font-bold"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[9px] font-bold text-zinc-500 uppercase mb-1">Security Deposit (PHP)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={adjustForm.data.security_deposit}
                                            onChange={e => adjustForm.setData('security_deposit', e.target.value)}
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
                                        value={adjustForm.data.reason}
                                        onChange={e => adjustForm.setData('reason', e.target.value)}
                                        className="w-full h-8 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-2.5 text-xs"
                                    />
                                </div>
                                <div className="flex justify-end pt-1">
                                    <button
                                        type="submit"
                                        disabled={adjustForm.processing}
                                        className="px-4 h-8 bg-[#FF3B30] text-white rounded-lg text-xs font-black hover:bg-red-700 transition-colors disabled:opacity-50 cursor-pointer"
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
