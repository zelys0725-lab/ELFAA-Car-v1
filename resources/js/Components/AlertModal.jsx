import React, { useEffect } from 'react';

/**
 * AlertModal – a centered success / error popup.
 *
 * Usage:
 *   const [alert, setAlert] = useState(null);
 *
 *   // Show:  setAlert({ type: 'success', title: 'Saved!', message: 'Record saved.' });
 *   // Hide:  setAlert(null);
 *
 *   <AlertModal alert={alert} onClose={() => setAlert(null)} />
 *
 * Props:
 *   alert  – null | { type: 'success'|'error', title?: string, message: string }
 *   onClose – callback to clear the alert
 */
export default function AlertModal({ alert, onClose }) {
    // Close on Escape key
    useEffect(() => {
        if (!alert) return;
        const handler = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [alert, onClose]);

    if (!alert) return null;

    const isSuccess = alert.type === 'success';

    // Colour tokens
    const ringColor   = isSuccess ? 'ring-green-500/30' : 'ring-rose-500/30';
    const iconBg      = isSuccess ? 'bg-green-500/10 border-green-500/20' : 'bg-rose-500/10 border-rose-500/20';
    const iconColor   = isSuccess ? 'text-green-500' : 'text-rose-500';
    const btnBg       = isSuccess ? 'bg-green-600 hover:bg-green-700' : 'bg-rose-600 hover:bg-rose-700';
    const defaultTitle = isSuccess ? 'Success!' : 'Something went wrong';
    const icon        = isSuccess ? '✓' : '✕';

    return (
        /* Backdrop */
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            aria-modal="true"
            role="alertdialog"
        >
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Modal card */}
            <div
                className={`
                    relative z-10 w-full max-w-sm
                    bg-white dark:bg-zinc-900
                    border border-zinc-200 dark:border-zinc-800
                    ring-4 ${ringColor}
                    rounded-2xl shadow-2xl
                    p-8 text-center space-y-5
                    animate-in zoom-in-95 fade-in duration-200
                    transition-colors
                `}
            >
                {/* Icon circle */}
                <div className={`mx-auto h-16 w-16 rounded-full border flex items-center justify-center text-3xl font-black ${iconBg} ${iconColor}`}>
                    {icon}
                </div>

                {/* Title */}
                <h3 className="text-base font-black uppercase tracking-wider text-zinc-900 dark:text-white">
                    {alert.title || defaultTitle}
                </h3>

                {/* Message */}
                {alert.message && (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                        {alert.message}
                    </p>
                )}

                {/* OK Button */}
                <button
                    onClick={onClose}
                    className={`
                        w-full h-11 rounded-xl text-white font-black text-xs uppercase tracking-wider
                        transition-colors cursor-pointer shadow-md
                        ${btnBg}
                    `}
                >
                    OK
                </button>
            </div>
        </div>
    );
}
