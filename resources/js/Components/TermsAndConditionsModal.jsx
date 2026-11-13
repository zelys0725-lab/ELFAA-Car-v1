import React, { useState, useRef, useEffect } from 'react';
import { ShieldCheck, ChevronDown, CheckCircle2 } from 'lucide-react';
import { Button } from '@/Components/Shadcn';

export default function TermsAndConditionsModal({
    isOpen,
    onClose,
    onContinue,
    vehicle = null,
    continueText = 'Continue'
}) {
    const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
    const contentRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            setHasScrolledToBottom(false);
            // Allow DOM to settle, reset scroll to top, and check if content already fits viewport
            const timer = setTimeout(() => {
                if (contentRef.current) {
                    contentRef.current.scrollTop = 0;
                    const { scrollHeight, clientHeight } = contentRef.current;
                    if (scrollHeight <= clientHeight + 5) {
                        setHasScrolledToBottom(true);
                    }
                }
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    const handleScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        // Require user to reach the bottom (with a safe 25px tolerance for fractional zoom/rounding)
        if (scrollHeight - scrollTop - clientHeight <= 25) {
            setHasScrolledToBottom(true);
        }
    };

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
            role="dialog"
            aria-modal="true"
            aria-labelledby="terms-modal-title"
        >
            <div 
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-left"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-950 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-[#FF3B30] shrink-0">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 id="terms-modal-title" className="text-base font-black text-zinc-900 dark:text-white uppercase tracking-tight">
                                ELFAA Car Rental Agreement
                            </h3>
                            <p className="text-[11px] text-zinc-500 font-medium">
                                Official Rental Policies & Prohibited Activities • Sto. Tomas, Batangas
                                {vehicle && (
                                    <span className="ml-2 font-bold text-zinc-800 dark:text-zinc-200">
                                        • Vehicle: {vehicle.name}
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                        aria-label="Close"
                    >
                        ✕
                    </button>
                </div>

                {/* Notice / Requirement Bar */}
                <div className={`px-5 py-2.5 text-xs font-semibold flex items-center justify-between border-b transition-colors shrink-0 ${
                    hasScrolledToBottom 
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                }`}>
                    <div className="flex items-center gap-2">
                        {hasScrolledToBottom ? (
                            <>
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                <span>You have reviewed all rental terms. You may now proceed.</span>
                            </>
                        ) : (
                            <>
                                <ChevronDown className="w-4 h-4 text-amber-500 shrink-0 animate-bounce" />
                                <span>Please scroll through the entire Terms and Conditions to proceed.</span>
                            </>
                        )}
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-wider opacity-85">
                        {hasScrolledToBottom ? 'Terms Completed' : 'Scroll Required'}
                    </span>
                </div>

                {/* Scrollable Terms Content */}
                <div 
                    ref={contentRef}
                    onScroll={handleScroll}
                    className="p-6 overflow-y-auto space-y-4 text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed flex-1 overscroll-contain"
                    tabIndex={0}
                >
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-[#FF3B30] text-[11px] font-bold">
                        ⚠️ By submitting a reservation for any vehicle in the ELFAA fleet, you acknowledge and agree to comply strictly with the terms outlined below.
                    </div>

                    <div className="space-y-3">
                        <h4 className="text-xs font-black uppercase tracking-wider text-red-600 dark:text-red-400 border-b border-red-500/20 pb-1">
                            1. General Rental Agreement & Eligibility
                        </h4>
                        <div className="space-y-2.5">
                            <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                                <strong className="text-zinc-900 dark:text-white block mb-0.5">• Authorized Drivers:</strong>
                                Only the registered and verified renter who submitted an active government-issued driver's license and secondary identification is authorized to operate the rented vehicle. Sub-leasing, driving under the influence, or transferring control to third parties is strictly prohibited.
                            </div>
                            <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                                <strong className="text-zinc-900 dark:text-white block mb-0.5">• Security Deposit & Fuel:</strong>
                                A security deposit may be required prior to unit release. Vehicles are provided with a recorded fuel level and must be returned with the same amount. No credits or refunds are granted for excess fuel.
                            </div>
                        </div>

                        <h4 className="text-xs font-black uppercase tracking-wider text-red-600 dark:text-red-400 border-b border-red-500/20 pb-1 pt-2">
                            2. Prohibited Activities & Non-Refundable Policies
                        </h4>

                        <div className="space-y-2.5">
                            <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                                <strong className="text-zinc-900 dark:text-white block mb-0.5">• Prohibitions:</strong>
                                Strict NO SMOKING policy inside the vehicle at any time. The vehicle must not be used for any illegal transactions, transport of contraband, criminal activity, sub-leasing, or off-road/improper usage outside its original design.
                            </div>

                            <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                                <strong className="text-zinc-900 dark:text-white block mb-0.5">• Non-Refundable Policy:</strong>
                                No refunds/credits will be issued for excess fuel remaining in the tank, unused pre-loaded RFID balances, early vehicle returns, or unused hours. Cancellations must be made at least 2 days prior to the start date, or a 50% rental charge will apply.
                            </div>

                            <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                                <strong className="text-zinc-900 dark:text-white block mb-0.5">• Destination Deviation & Late Fees:</strong>
                                A penalty of ₱500.00 applies for driving beyond agreed limits. Unauthorized extensions incur ₱200.00 per hour; delays exceeding 6 hours trigger a full daily rental charge. A cleaning fee of ₱200.00 applies for excessive dirt.
                            </div>

                            <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                                <strong className="text-zinc-900 dark:text-white block mb-0.5">• Keys & Tires:</strong>
                                Renter covers all tire vulcanizing/replacement costs and a minimum fee of ₱7,500.00 and up for lost or damaged keys.
                            </div>

                            <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                                <strong className="text-zinc-900 dark:text-white block mb-0.5">• Body Damage Penalty:</strong>
                                Any scratch, dent, scrape, or damage to the unit body—regardless of how minor or small it may be—will automatically be charged at a flat rate of ₱4,500.00 per affected panel.
                            </div>

                            <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                                <strong className="text-zinc-900 dark:text-white block mb-0.5">• Full Damage Liability:</strong>
                                Renter assumes all financial risk for theft, collision, loss, or destruction. Renter agrees to pay 100% of the actual repair costs or the current full market value of the vehicle if it is deemed a total loss.
                            </div>

                            <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                                <strong className="text-zinc-900 dark:text-white block mb-0.5">• Shop Participation & Negligence Fee:</strong>
                                The Renter must pay 100% of the daily rental rate for every single day the vehicle remains in the repair shop. In case of damage, Renter must secure a police report and provide a driver's license photocopy within 24 hours. Failure to do so makes the Renter entirely liable for 100% of parts and labor out-of-pocket, plus the standard daily rate during down-time.
                            </div>

                            <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                                <strong className="text-zinc-900 dark:text-white block mb-0.5">• Vehicle Condition Inspection:</strong>
                                All vehicles undergo joint pre-rental inspection. Pre-existing marks are recorded as [X] Scratch/Scrape, [D] Dent, or [M] Missing. Any new unrecorded defects are subject to the ₱4,500/panel fee.
                            </div>

                            <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                                <strong className="text-zinc-900 dark:text-white block mb-0.5">• Tracking & GPS Monitoring:</strong>
                                For safety, security, and fleet recovery, all vehicles are equipped with real-time GPS tracking devices. Any tampering with tracking equipment constitutes a breach of contract and incurs immediate repossession.
                            </div>
                        </div>

                        {/* Explicit bottom marker */}
                        <div className="pt-3 pb-1 text-center text-zinc-400 dark:text-zinc-500 text-[11px] font-medium border-t border-zinc-200 dark:border-zinc-800">
                            — End of Terms and Conditions —
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
                        <span className="text-[11px] text-zinc-500 font-medium">
                            Lessor: Mika Jane A. Aranzanso • Sto. Tomas, Batangas
                        </span>
                        {!hasScrolledToBottom && (
                            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                                <span>↓</span> Scroll to bottom to unlock Continue
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 h-9 rounded-lg text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                        <Button
                            type="button"
                            disabled={!hasScrolledToBottom}
                            onClick={() => {
                                if (!hasScrolledToBottom) return;
                                onContinue();
                            }}
                            className={`font-black text-xs uppercase px-6 h-9 rounded-lg transition-all ${
                                hasScrolledToBottom
                                    ? 'bg-[#FF3B30] hover:bg-red-700 text-white shadow-lg shadow-red-500/25 cursor-pointer'
                                    : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed opacity-60 border border-zinc-300 dark:border-zinc-700'
                            }`}
                        >
                            {continueText}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
