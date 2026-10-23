import React, { useState, useEffect } from 'react';
import { 
    Receipt, 
    X, 
    CheckCircle2, 
    Clock, 
    AlertCircle, 
    CreditCard, 
    Smartphone, 
    ShieldCheck, 
    ExternalLink,
    RefreshCw,
    FileText
} from 'lucide-react';
import { Button, Badge } from '@/Components/Shadcn';

export default function PaymentHistoryModal({ booking, isOpen, onClose }) {
    if (!isOpen || !booking) return null;

    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({ transactions: [], payments: [], booking: null });
    const [selectedRaw, setSelectedRaw] = useState(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await window.axios.get(route('bookings.transactions', booking.id));
            setData(res.data);
        } catch (err) {
            console.error('Failed to load transactions:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [booking.id]);

    const getGatewayIcon = (gateway) => {
        if (gateway === 'stripe' || gateway === 'credit_card') {
            return <CreditCard className="w-4 h-4 text-blue-500" />;
        }
        if (gateway === 'gcash' || gateway === 'gcash_paymongo') {
            return <Smartphone className="w-4 h-4 text-sky-500" />;
        }
        return <Receipt className="w-4 h-4 text-zinc-500" />;
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'paid':
            case 'completed':
                return <Badge className="bg-emerald-500 text-white text-[10px] font-bold">Paid</Badge>;
            case 'pending':
                return <Badge className="bg-amber-500 text-white text-[10px] font-bold">Pending</Badge>;
            case 'failed':
                return <Badge className="bg-red-500 text-white text-[10px] font-bold">Failed</Badge>;
            case 'cancelled':
                return <Badge className="bg-zinc-500 text-white text-[10px] font-bold">Cancelled</Badge>;
            default:
                return <Badge className="bg-zinc-500 text-white text-[10px] font-bold">{status}</Badge>;
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

            <div className="z-10 w-full max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden text-left flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-zinc-150 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                            <Receipt className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white">
                                Payment Ledger & Transaction History
                            </h3>
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                                Booking #{booking.id} • {booking.vehicle?.name || 'Vehicle'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={loadData}
                            disabled={loading}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                            title="Refresh transaction history"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto space-y-6">
                    {/* Financial Summary */}
                    <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                        <div>
                            <span className="block text-[10px] font-black uppercase text-zinc-400 tracking-wider">Total Contract</span>
                            <span className="text-sm font-black text-zinc-900 dark:text-white mt-0.5 block">
                                PHP {parseFloat(booking.total_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                        <div>
                            <span className="block text-[10px] font-black uppercase text-zinc-400 tracking-wider">Amount Paid</span>
                            <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                                PHP {parseFloat(booking.amount_paid || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                        <div>
                            <span className="block text-[10px] font-black uppercase text-zinc-400 tracking-wider">Payment Status</span>
                            <span className="inline-block mt-1">
                                {getStatusBadge(booking.payment_status)}
                            </span>
                        </div>
                    </div>

                    {/* Online Gateway Transactions */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-white flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4 text-blue-500" />
                            Online Gateway Transactions (Stripe & GCash)
                        </h4>

                        {loading ? (
                            <div className="p-8 text-center text-xs text-zinc-400">Loading payment records...</div>
                        ) : data.transactions.length === 0 ? (
                            <div className="p-6 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 text-center text-xs text-zinc-400">
                                No online gateway transactions recorded yet for this booking.
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {data.transactions.map((tx) => (
                                    <div 
                                        key={tx.id} 
                                        className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 mt-0.5">
                                                {getGatewayIcon(tx.gateway)}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-extrabold uppercase text-zinc-900 dark:text-white">
                                                        {tx.gateway === 'stripe' ? 'Stripe Card Pay' : 'GCash (PayMongo)'}
                                                    </span>
                                                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 uppercase">
                                                        {tx.mode || 'test'}
                                                    </span>
                                                    {getStatusBadge(tx.status)}
                                                </div>
                                                <p className="text-[11px] font-mono text-zinc-500 mt-0.5 truncate max-w-sm">
                                                    Ref: {tx.gateway_transaction_id || `TX-${tx.id}`}
                                                </p>
                                                {tx.paid_at && (
                                                    <p className="text-[10px] text-zinc-400 mt-0.5">
                                                        Paid on {new Date(tx.paid_at).toLocaleString()}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="text-right shrink-0">
                                            <span className="font-black text-sm text-[#FF3B30] block">
                                                PHP {parseFloat(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </span>
                                            {tx.raw_response && (
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedRaw(selectedRaw === tx.id ? null : tx.id)}
                                                    className="text-[10px] text-blue-500 hover:underline mt-0.5 cursor-pointer"
                                                >
                                                    {selectedRaw === tx.id ? 'Hide Details' : 'View Payload'}
                                                </button>
                                            )}
                                        </div>

                                        {selectedRaw === tx.id && tx.raw_response && (
                                            <div className="w-full mt-2 p-3 bg-zinc-950 text-zinc-300 rounded-lg font-mono text-[10px] overflow-x-auto max-h-40">
                                                <pre>{JSON.stringify(tx.raw_response, null, 2)}</pre>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Official Ledger Payment Records */}
                    {data.payments && data.payments.length > 0 && (
                        <div className="space-y-3 pt-3 border-t border-zinc-150 dark:border-zinc-800">
                            <h4 className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-white flex items-center gap-1.5">
                                <FileText className="w-4 h-4 text-emerald-500" />
                                Confirmed Ledger Payments ({data.payments.length})
                            </h4>

                            <div className="space-y-2">
                                {data.payments.map((p) => (
                                    <div 
                                        key={p.id}
                                        className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 flex items-center justify-between text-xs"
                                    >
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-extrabold capitalize text-zinc-900 dark:text-white">
                                                    {p.payment_method}
                                                </span>
                                                <span className="text-[10px] font-bold uppercase text-zinc-500">
                                                    ({p.payment_type?.replace('_', ' ')})
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-zinc-400 mt-0.5">
                                                {new Date(p.created_at).toLocaleString()} • {p.collector ? `Recorded by ${p.collector.name}` : 'Automated Online Payment'}
                                            </p>
                                        </div>

                                        <span className="font-black text-xs text-emerald-600 dark:text-emerald-400">
                                            + PHP {parseFloat(p.amount_collected).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-zinc-150 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 flex items-center justify-end">
                    <Button
                        type="button"
                        onClick={onClose}
                        className="bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-bold text-xs h-9 px-4 rounded-xl cursor-pointer"
                    >
                        Close
                    </Button>
                </div>
            </div>
        </div>
    );
}
