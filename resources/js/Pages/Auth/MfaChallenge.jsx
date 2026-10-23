import React, { useState, useEffect, useRef } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { 
    ShieldCheck, 
    Mail, 
    Smartphone, 
    KeyRound, 
    ArrowLeft, 
    RefreshCw, 
    AlertTriangle, 
    CheckCircle2, 
    Clock, 
    ShieldAlert, 
    Lock,
    Sun,
    Moon,
    ArrowRight
} from 'lucide-react';
import Swal from 'sweetalert2';

export default function MfaChallenge({
    method = 'email',
    availableMethods = ['email'],
    maskedEmail = '',
    hasTotp = false,
    hasBackupCodes = false,
    cooldownSeconds = 0,
    expiresInMinutes = 10,
    maxAttempts = 5,
    failedAttempts = 0,
    status = null,
    error = null,
}) {
    const [currentMethod, setCurrentMethod] = useState(method);
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [timer, setTimer] = useState(cooldownSeconds);
    const [isResending, setIsResending] = useState(false);
    const inputRef = useRef(null);

    // Initialize Theme
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'light') {
            setIsDarkMode(false);
            document.documentElement.classList.remove('dark');
        } else {
            setIsDarkMode(true);
            document.documentElement.classList.add('dark');
        }
    }, []);

    const toggleTheme = () => {
        if (isDarkMode) {
            setIsDarkMode(false);
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        } else {
            setIsDarkMode(true);
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        }
    };

    // Cooldown Timer
    useEffect(() => {
        setTimer(cooldownSeconds);
    }, [cooldownSeconds]);

    useEffect(() => {
        if (timer <= 0) return;
        const interval = setInterval(() => {
            setTimer((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(interval);
    }, [timer]);

    // Form
    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        code: '',
        method: currentMethod,
    });

    useEffect(() => {
        setData('method', currentMethod);
        setData('code', '');
        clearErrors();
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, [currentMethod]);

    const handleSwitchMethod = (newMethod) => {
        if (newMethod === currentMethod) return;
        setCurrentMethod(newMethod);
        router.post(
            route('mfa.switch'),
            { method: newMethod },
            {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    Swal.fire({
                        toast: true,
                        position: 'top-end',
                        icon: 'info',
                        title: `Switched to ${newMethod === 'email' ? 'Email OTP' : newMethod === 'authenticator' ? 'Authenticator App' : 'Backup Code'}`,
                        showConfirmButton: false,
                        timer: 2000,
                    });
                },
            }
        );
    };

    const handleResendOtp = (e) => {
        e.preventDefault();
        if (timer > 0 || isResending) return;

        setIsResending(true);
        router.post(
            route('mfa.resend'),
            {},
            {
                preserveScroll: true,
                onFinish: () => setIsResending(false),
                onSuccess: () => {
                    Swal.fire({
                        toast: true,
                        position: 'top-end',
                        icon: 'success',
                        title: 'A new 6-digit code has been dispatched to your email!',
                        showConfirmButton: false,
                        timer: 3000,
                    });
                },
                onError: (err) => {
                    Swal.fire({
                        icon: 'error',
                        title: 'Resend Failed',
                        text: err.code || 'Unable to dispatch code at this time. Please try again later.',
                        confirmButtonColor: '#FF3B30',
                    });
                },
            }
        );
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('mfa.verify'), {
            preserveScroll: true,
            onError: (err) => {
                if (err.code) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Verification Failed',
                        text: err.code,
                        confirmButtonColor: '#FF3B30',
                    });
                }
            },
        });
    };

    const handleCancel = (e) => {
        e.preventDefault();
        Swal.fire({
            title: 'Cancel Verification?',
            text: 'You will be returned to the login screen and your authentication session will be cancelled.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#FF3B30',
            cancelButtonColor: '#71717a',
            confirmButtonText: 'Yes, Cancel Login',
            cancelButtonText: 'Stay on Verification',
        }).then((result) => {
            if (result.isConfirmed) {
                router.post(route('mfa.cancel'));
            }
        });
    };

    const remainingAttempts = Math.max(0, maxAttempts - failedAttempts);

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col justify-center items-center p-4 transition-colors duration-200 relative selection:bg-[#FF3B30] selection:text-white">
            <Head title="Two-Factor Security Verification | ELFAA Car Rental" />

            {/* Top Right Theme Toggle */}
            <div className="absolute top-5 right-5 z-20">
                <button
                    onClick={toggleTheme}
                    type="button"
                    className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white shadow-sm transition-all"
                    title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                >
                    {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-500" />}
                </button>
            </div>

            {/* Central Card */}
            <div className="w-full max-w-md">
                {/* Brand Header */}
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#FF3B30]/10 border border-[#FF3B30]/20 text-[#FF3B30] mb-3 shadow-lg shadow-[#FF3B30]/5">
                        <ShieldCheck className="w-7 h-7" />
                    </div>
                    <h1 className="text-xl font-black uppercase tracking-wider text-zinc-900 dark:text-white">
                        Two-Factor Authentication
                    </h1>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                        High-security verification for your ELFAA account
                    </p>
                </div>

                {/* Main Card */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xl rounded-2xl overflow-hidden p-6 sm:p-8">
                    {/* Status Alert Banner */}
                    {status && (
                        <div className="mb-5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                            <span>{status}</span>
                        </div>
                    )}

                    {/* Method Selector Tabs */}
                    <div className="flex items-center gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl mb-6">
                        {availableMethods.includes('email') && (
                            <button
                                type="button"
                                onClick={() => handleSwitchMethod('email')}
                                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                                    currentMethod === 'email'
                                        ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm border border-zinc-200 dark:border-zinc-700'
                                        : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                                }`}
                            >
                                <Mail className="w-3.5 h-3.5 text-blue-500" />
                                <span>Email OTP</span>
                            </button>
                        )}

                        {hasTotp && (
                            <button
                                type="button"
                                onClick={() => handleSwitchMethod('authenticator')}
                                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                                    currentMethod === 'authenticator'
                                        ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm border border-zinc-200 dark:border-zinc-700'
                                        : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                                }`}
                            >
                                <Smartphone className="w-3.5 h-3.5 text-emerald-500" />
                                <span>App Code</span>
                            </button>
                        )}

                        {hasBackupCodes && (
                            <button
                                type="button"
                                onClick={() => handleSwitchMethod('backup_code')}
                                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                                    currentMethod === 'backup_code'
                                        ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm border border-zinc-200 dark:border-zinc-700'
                                        : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                                }`}
                            >
                                <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                                <span>Backup Code</span>
                            </button>
                        )}
                    </div>

                    {/* Method Instructions */}
                    <div className="mb-6">
                        {currentMethod === 'email' && (
                            <div className="space-y-1.5 text-center">
                                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                                    We sent a 6-digit verification code to
                                </p>
                                <p className="text-sm font-black text-zinc-900 dark:text-white font-mono bg-zinc-100 dark:bg-zinc-800/60 py-1.5 px-3 rounded-lg inline-block border border-zinc-200 dark:border-zinc-700/60">
                                    {maskedEmail}
                                </p>
                                <p className="text-[11px] text-zinc-500 flex items-center justify-center gap-1 pt-1">
                                    <Clock className="w-3 h-3 text-[#FF3B30]" />
                                    <span>Code expires in {expiresInMinutes} minutes</span>
                                </p>
                            </div>
                        )}

                        {currentMethod === 'authenticator' && (
                            <div className="space-y-1.5 text-center">
                                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                                    Open your Authenticator app (Google Authenticator, Microsoft Authenticator, Authy, etc.)
                                </p>
                                <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                                    Enter the current 6-digit security code generated for ELFAA.
                                </p>
                            </div>
                        )}

                        {currentMethod === 'backup_code' && (
                            <div className="space-y-1.5 text-center">
                                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                                    Enter one of your 8-character single-use emergency backup recovery codes.
                                </p>
                                <p className="text-[11px] text-amber-500 flex items-center justify-center gap-1 font-semibold">
                                    <AlertTriangle className="w-3 h-3" />
                                    <span>Each backup code can only be used once.</span>
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Verification Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-2 text-center">
                                {currentMethod === 'backup_code' ? 'Emergency Backup Code' : '6-Digit Verification Code'}
                            </label>
                            <input
                                ref={inputRef}
                                type="text"
                                inputMode={currentMethod === 'backup_code' ? 'text' : 'numeric'}
                                autoComplete="one-time-code"
                                autoFocus
                                maxLength={currentMethod === 'backup_code' ? 12 : 6}
                                placeholder={currentMethod === 'backup_code' ? 'XXXX-XXXX' : '••••••'}
                                value={data.code}
                                onChange={(e) => {
                                    let val = e.target.value;
                                    if (currentMethod !== 'backup_code') {
                                        val = val.replace(/\D/g, '').slice(0, 6);
                                    } else {
                                        val = val.toUpperCase().slice(0, 12);
                                    }
                                    setData('code', val);
                                }}
                                className="w-full text-center text-2xl font-black font-mono tracking-[0.4em] py-3.5 px-4 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-white focus:border-[#FF3B30] focus:ring-2 focus:ring-[#FF3B30]/20 focus:outline-none transition-all placeholder:tracking-normal placeholder:font-sans placeholder:text-zinc-400"
                            />
                            {errors.code && (
                                <p className="text-xs text-red-500 mt-2 text-center font-medium flex items-center justify-center gap-1">
                                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                    <span>{errors.code}</span>
                                </p>
                            )}
                        </div>

                        {/* Remaining Attempts Warning */}
                        {failedAttempts > 0 && remainingAttempts > 0 && (
                            <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-500 text-[11px] font-medium flex items-center justify-center gap-1.5 text-center">
                                <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                                <span>Security Warning: {remainingAttempts} attempt{remainingAttempts === 1 ? '' : 's'} remaining before session lockout.</span>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={processing || !data.code.trim()}
                            className="w-full py-3.5 px-4 rounded-xl bg-[#FF3B30] hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-[#FF3B30]/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                        >
                            {processing ? (
                                <>
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    <span>Verifying Code...</span>
                                </>
                            ) : (
                                <>
                                    <span>Verify & Proceed</span>
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Resend OTP Row (for Email method) */}
                    {currentMethod === 'email' && (
                        <div className="mt-5 pt-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs">
                            <span className="text-zinc-500">Didn't receive the email?</span>
                            <button
                                type="button"
                                onClick={handleResendOtp}
                                disabled={timer > 0 || isResending}
                                className="font-bold text-[#FF3B30] hover:underline disabled:text-zinc-400 disabled:no-underline flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
                            >
                                <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
                                {timer > 0 ? (
                                    <span>Resend in {timer}s</span>
                                ) : (
                                    <span>Resend Code</span>
                                )}
                            </button>
                        </div>
                    )}

                    {/* Backup code toggle shortcut if not currently on backup code */}
                    {currentMethod !== 'backup_code' && hasBackupCodes && (
                        <div className="mt-4 text-center">
                            <button
                                type="button"
                                onClick={() => handleSwitchMethod('backup_code')}
                                className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 hover:underline inline-flex items-center gap-1 cursor-pointer"
                            >
                                <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                                <span>Lost your phone or email? Use a backup recovery code</span>
                            </button>
                        </div>
                    )}

                    {/* Cancel & Return to Login */}
                    <div className="mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800 text-center">
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="text-xs font-bold text-zinc-500 hover:text-red-500 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            <span>Cancel and Return to Login</span>
                        </button>
                    </div>
                </div>

                {/* Footer Notice */}
                <p className="text-center text-[11px] text-zinc-500 mt-6 flex items-center justify-center gap-1">
                    <Lock className="w-3 h-3 text-emerald-500" />
                    <span>Protected by ELFAA Multi-Factor Identity Defense</span>
                </p>
            </div>
        </div>
    );
}
