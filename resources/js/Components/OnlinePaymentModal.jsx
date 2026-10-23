import React, { useState } from 'react';
import { 
    CreditCard, 
    Smartphone, 
    ShieldCheck, 
    Lock, 
    ExternalLink, 
    X, 
    CheckCircle2, 
    AlertCircle,
    Calendar,
    Car
} from 'lucide-react';
import { Button, Badge } from '@/Components/Shadcn';
import Swal from 'sweetalert2';

export default function OnlinePaymentModal({ booking, isOpen, onClose, availableGateways = [] }) {
    if (!isOpen || !booking) return null;

    const [selectedGateway, setSelectedGateway] = useState(() => {
        if (availableGateways.length > 0) {
            return availableGateways[0].alias || availableGateways[0].id;
        }
        return 'gcash';
    });
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);

    const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

    const totalPrice = parseFloat(booking.total_price || 0);
    const amountPaid = parseFloat(booking.amount_paid || 0);
    const balanceDue = Math.max(0, totalPrice - amountPaid);

    const handleProceedToPayment = async () => {
        setLoading(true);
        setErrorMessage(null);

        try {
            const res = await window.axios.post(route('bookings.pay', booking.id), {
                gateway: selectedGateway,
            });

            if (res.data && res.data.checkout_url) {
                // Redirect user to the secure hosted checkout page
                window.location.href = res.data.checkout_url;
            } else {
                throw new Error('No checkout URL returned from payment server.');
            }
        } catch (err) {
            setLoading(false);
            const msg = err.response?.data?.message || err.message || 'Failed to initiate secure checkout.';
            setErrorMessage(msg);

            Swal.fire({
                icon: 'error',
                title: 'Checkout Initialization Failed',
                text: msg,
                confirmButtonColor: '#e11d48',
                background: isDark ? '#18181b' : '#ffffff',
                color: isDark ? '#f4f4f5' : '#18181b',
            });
        }
    };

    const startDate = booking.start_datetime 
        ? new Date(booking.start_datetime).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
        : 'N/A';
    const endDate = booking.end_datetime 
        ? new Date(booking.end_datetime).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
        : 'N/A';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity" 
                onClick={!loading ? onClose : undefined} 
            />

            {/* Modal Dialog */}
            <div className="z-10 w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden transition-all text-left animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-zinc-150 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-[#FF3B30]">
                            <Lock className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white">
                                Complete Online Payment
                            </h3>
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                                Reservation #{booking.id} • 256-bit SSL Encrypted
                            </p>
                        </div>
                    </div>

                    {!loading && (
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                <div className="p-6 space-y-5">
                    {/* Booking Breakdown Card */}
                    <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/60 space-y-3">
                        <div className="flex items-center justify-between border-b border-zinc-200/80 dark:border-zinc-800 pb-2.5">
                            <div className="flex items-center gap-2">
                                <Car className="w-4 h-4 text-[#FF3B30]" />
                                <span className="font-extrabold text-xs text-zinc-900 dark:text-white">
                                    {booking.vehicle?.name || 'Fleet Vehicle'}
                                </span>
                            </div>
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                                {booking.vehicle?.transmission} • {booking.vehicle?.fuel_type}
                            </span>
                        </div>

                        <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400">
                            <span className="flex items-center gap-1.5 text-[11px]">
                                <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                                {startDate} — {endDate}
                            </span>
                            <span className="text-[11px] font-semibold text-zinc-500">
                                Total: PHP {totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                        </div>

                        {amountPaid > 0 && (
                            <div className="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 font-bold border-t border-zinc-200 dark:border-zinc-800 pt-2">
                                <span>Already Paid:</span>
                                <span>- PHP {amountPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                        )}

                        <div className="flex items-center justify-between pt-1 border-t border-zinc-200 dark:border-zinc-800 text-sm font-black">
                            <span className="text-zinc-900 dark:text-white">Amount Due Now:</span>
                            <span className="text-xl text-[#FF3B30] tracking-tight">
                                PHP {balanceDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>

                    {/* Payment Method Selector */}
                    <div className="space-y-2.5">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                            Choose Payment Method
                        </label>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {/* GCash Option */}
                            <button
                                type="button"
                                onClick={() => setSelectedGateway('gcash')}
                                className={`p-4 rounded-xl border text-left flex flex-col justify-between gap-3 transition-all cursor-pointer ${
                                    selectedGateway === 'gcash' || selectedGateway === 'gcash_paymongo'
                                        ? 'border-sky-500 bg-sky-50/60 dark:bg-sky-950/20 ring-2 ring-sky-500/20 shadow-md'
                                        : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700'
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-500 flex items-center justify-center font-black">
                                        <Smartphone className="w-4 h-4" />
                                    </div>
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 uppercase">
                                        Instant
                                    </span>
                                </div>
                                <div>
                                    <h4 className="font-extrabold text-xs text-zinc-900 dark:text-white">
                                        GCash (e-Wallet)
                                    </h4>
                                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-tight">
                                        Pay via mobile OTP, QR code, or PayMongo checkout.
                                    </p>
                                </div>
                            </button>

                            {/* Stripe Option */}
                            <button
                                type="button"
                                onClick={() => setSelectedGateway('stripe')}
                                className={`p-4 rounded-xl border text-left flex flex-col justify-between gap-3 transition-all cursor-pointer ${
                                    selectedGateway === 'stripe'
                                        ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/20 ring-2 ring-blue-500/20 shadow-md'
                                        : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700'
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                                        <CreditCard className="w-4 h-4" />
                                    </div>
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 uppercase">
                                        Card Pay
                                    </span>
                                </div>
                                <div>
                                    <h4 className="font-extrabold text-xs text-zinc-900 dark:text-white">
                                        Credit / Debit Card
                                    </h4>
                                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-tight">
                                        Visa, Mastercard, American Express via Stripe.
                                    </p>
                                </div>
                            </button>
                        </div>
                    </div>

                    {errorMessage && (
                        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-400 flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>{errorMessage}</span>
                        </div>
                    )}

                    {/* Trust & Security Notice */}
                    <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800 flex items-center gap-2.5 text-[11px] text-zinc-500">
                        <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>
                            You will be redirected to the secure payment provider to authenticate and authorize this payment. Your card and wallet credentials are never stored on ELFAA servers.
                        </span>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-5 border-t border-zinc-150 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 flex items-center justify-end gap-3">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onClose}
                        disabled={loading}
                        className="text-xs font-bold text-zinc-600 dark:text-zinc-400 cursor-pointer"
                    >
                        Cancel
                    </Button>

                    <Button
                        type="button"
                        onClick={handleProceedToPayment}
                        disabled={loading || balanceDue <= 0}
                        className="bg-[#FF3B30] hover:bg-red-700 text-white font-extrabold text-xs h-10 px-5 shadow-lg gap-2 cursor-pointer"
                    >
                        {loading ? (
                            <>
                                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Connecting to Gateway...
                            </>
                        ) : (
                            <>
                                Proceed to Pay PHP {balanceDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                <ExternalLink className="w-3.5 h-3.5" />
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
