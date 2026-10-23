import React, { useState, useEffect, useRef } from 'react';
import { 
    ShieldCheck, 
    ShieldAlert, 
    Smartphone, 
    Mail, 
    KeyRound, 
    Check, 
    Copy, 
    Download, 
    RefreshCw, 
    AlertTriangle, 
    Lock, 
    CheckCircle2, 
    X,
    Eye,
    EyeOff
} from 'lucide-react';
import QRCode from 'qrcode';
import Swal from 'sweetalert2';

export default function MfaManagementCard({ authUser }) {
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(true);

    // Modals
    const [totpModalOpen, setTotpModalOpen] = useState(false);
    const [totpSetupData, setTotpSetupData] = useState(null);
    const [totpCode, setTotpCode] = useState('');
    const [totpSubmitting, setTotpSubmitting] = useState(false);
    const canvasRef = useRef(null);

    const [emailModalOpen, setEmailModalOpen] = useState(false);
    const [emailCode, setEmailCode] = useState('');
    const [emailSubmitting, setEmailSubmitting] = useState(false);
    const [emailSending, setEmailSending] = useState(false);

    const [backupCodesModalOpen, setBackupCodesModalOpen] = useState(false);
    const [backupCodes, setBackupCodes] = useState([]);
    const [backupPassword, setBackupPassword] = useState('');
    const [backupGenerating, setBackupGenerating] = useState(false);

    const [disableModalOpen, setDisableModalOpen] = useState(false);
    const [disablePassword, setDisablePassword] = useState('');
    const [disableSubmitting, setDisableSubmitting] = useState(false);
    const [copiedIndex, setCopiedIndex] = useState(null);
    const [copiedSecret, setCopiedSecret] = useState(false);

    // Fetch current status
    const fetchStatus = () => {
        setLoading(true);
        window.axios.get(route('mfa.status'))
            .then(res => {
                setStatus(res.data);
            })
            .catch(err => {
                console.error('Failed to load MFA status', err);
            })
            .finally(() => {
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchStatus();
    }, []);

    // Render QR Code on canvas
    useEffect(() => {
        if (totpModalOpen && totpSetupData?.otpauth_url && canvasRef.current) {
            QRCode.toCanvas(canvasRef.current, totpSetupData.otpauth_url, {
                width: 200,
                margin: 2,
                color: {
                    dark: '#09090b',
                    light: '#ffffff',
                },
            }, (error) => {
                if (error) console.error('QR code render error:', error);
            });
        }
    }, [totpModalOpen, totpSetupData]);

    // Handle Start TOTP Setup
    const handleStartTotpSetup = () => {
        setTotpSetupData(null);
        setTotpCode('');
        setTotpModalOpen(true);
        window.axios.post(route('mfa.totp.setup'))
            .then(res => {
                setTotpSetupData(res.data);
            })
            .catch(err => {
                Swal.fire({
                    icon: 'error',
                    title: 'Setup Error',
                    text: err.response?.data?.message || 'Failed to initialize Authenticator setup.',
                    confirmButtonColor: '#FF3B30',
                });
                setTotpModalOpen(false);
            });
    };

    // Confirm TOTP Setup
    const handleConfirmTotp = (e) => {
        e.preventDefault();
        if (totpCode.length !== 6 || totpSubmitting) return;

        setTotpSubmitting(true);
        window.axios.post(route('mfa.totp.confirm'), { code: totpCode })
            .then(res => {
                setTotpModalOpen(false);
                fetchStatus();
                if (res.data.backup_codes?.length) {
                    setBackupCodes(res.data.backup_codes);
                    setBackupCodesModalOpen(true);
                }
                Swal.fire({
                    icon: 'success',
                    title: 'Authenticator Activated!',
                    text: res.data.message || 'Your account is now protected with Authenticator App 2FA.',
                    confirmButtonColor: '#FF3B30',
                });
            })
            .catch(err => {
                Swal.fire({
                    icon: 'error',
                    title: 'Verification Failed',
                    text: err.response?.data?.message || 'Invalid code. Please try again.',
                    confirmButtonColor: '#FF3B30',
                });
            })
            .finally(() => setTotpSubmitting(false));
    };

    // Handle Start Email OTP Setup
    const handleStartEmailSetup = () => {
        setEmailCode('');
        setEmailModalOpen(true);
        setEmailSending(true);
        window.axios.post(route('mfa.email.send'))
            .then(res => {
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'success',
                    title: 'Verification code sent to your registered email!',
                    showConfirmButton: false,
                    timer: 3000,
                });
            })
            .catch(err => {
                Swal.fire({
                    icon: 'error',
                    title: 'Dispatch Failed',
                    text: err.response?.data?.message || 'Unable to send verification code.',
                    confirmButtonColor: '#FF3B30',
                });
            })
            .finally(() => setEmailSending(false));
    };

    // Confirm Email OTP Setup
    const handleConfirmEmail = (e) => {
        e.preventDefault();
        if (emailCode.length !== 6 || emailSubmitting) return;

        setEmailSubmitting(true);
        window.axios.post(route('mfa.email.confirm'), { code: emailCode })
            .then(res => {
                setEmailModalOpen(false);
                fetchStatus();
                if (res.data.backup_codes?.length) {
                    setBackupCodes(res.data.backup_codes);
                    setBackupCodesModalOpen(true);
                }
                Swal.fire({
                    icon: 'success',
                    title: 'Email OTP Enabled!',
                    text: res.data.message || 'Email verification is now active for your account.',
                    confirmButtonColor: '#FF3B30',
                });
            })
            .catch(err => {
                Swal.fire({
                    icon: 'error',
                    title: 'Verification Failed',
                    text: err.response?.data?.message || 'Invalid code entered.',
                    confirmButtonColor: '#FF3B30',
                });
            })
            .finally(() => setEmailSubmitting(false));
    };

    // Change Preferred Method
    const handleSetPreferredMethod = (method) => {
        window.axios.post(route('mfa.preferred'), { method })
            .then(res => {
                fetchStatus();
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'success',
                    title: res.data.message,
                    showConfirmButton: false,
                    timer: 2500,
                });
            })
            .catch(err => {
                Swal.fire({
                    icon: 'error',
                    title: 'Cannot Change Method',
                    text: err.response?.data?.message || 'Failed to update preferred method.',
                    confirmButtonColor: '#FF3B30',
                });
            });
    };

    // Generate Backup Codes
    const handleGenerateBackupCodes = (e) => {
        e.preventDefault();
        if (!backupPassword || backupGenerating) return;

        setBackupGenerating(true);
        window.axios.post(route('mfa.backup_codes'), { password: backupPassword })
            .then(res => {
                setBackupCodes(res.data.codes);
                setBackupPassword('');
                fetchStatus();
                Swal.fire({
                    icon: 'success',
                    title: 'New Backup Codes Generated!',
                    text: 'Please copy or download these codes now. They will not be displayed again.',
                    confirmButtonColor: '#FF3B30',
                });
            })
            .catch(err => {
                Swal.fire({
                    icon: 'error',
                    title: 'Failed to Generate Codes',
                    text: err.response?.data?.message || 'Incorrect password.',
                    confirmButtonColor: '#FF3B30',
                });
            })
            .finally(() => setBackupGenerating(false));
    };

    // Disable MFA
    const handleDisableMfa = (e) => {
        e.preventDefault();
        if (!disablePassword || disableSubmitting) return;

        setDisableSubmitting(true);
        window.axios.post(route('mfa.disable'), { password: disablePassword })
            .then(res => {
                setDisableModalOpen(false);
                setDisablePassword('');
                fetchStatus();
                Swal.fire({
                    icon: 'success',
                    title: 'MFA Disabled',
                    text: 'Multi-Factor Authentication has been removed from your account.',
                    confirmButtonColor: '#FF3B30',
                });
            })
            .catch(err => {
                Swal.fire({
                    icon: 'error',
                    title: 'Failed to Disable',
                    text: err.response?.data?.message || 'Incorrect password.',
                    confirmButtonColor: '#FF3B30',
                });
            })
            .finally(() => setDisableSubmitting(false));
    };

    // Copy Secret
    const handleCopySecret = (secret) => {
        navigator.clipboard.writeText(secret.replace(/\s+/g, ''));
        setCopiedSecret(true);
        setTimeout(() => setCopiedSecret(false), 2000);
    };

    // Copy All Backup Codes
    const handleCopyAllBackupCodes = () => {
        const text = backupCodes.join('\n');
        navigator.clipboard.writeText(text);
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'All backup codes copied to clipboard!',
            showConfirmButton: false,
            timer: 2000,
        });
    };

    // Download Backup Codes as .txt
    const handleDownloadBackupCodes = () => {
        const text = `ELFAA CAR RENTAL - EMERGENCY BACKUP RECOVERY CODES\nAccount: ${authUser?.email || 'User'}\nGenerated: ${new Date().toLocaleString()}\n\nEach code can only be used once:\n\n` +
            backupCodes.map((c, i) => `${i + 1}. ${c}`).join('\n') +
            '\n\nKeep these codes in a safe, secure place.';
        
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `elfaa-backup-codes-${Date.now()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    if (loading) {
        return (
            <div className="p-8 text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
                <RefreshCw className="w-6 h-6 animate-spin text-[#FF3B30] mx-auto mb-2" />
                <p className="text-xs text-zinc-500">Loading security parameters...</p>
            </div>
        );
    }

    const isEnabled = status?.mfa_enabled;
    const isEnforced = status?.is_mandatory;

    return (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden text-left">
            {/* Header */}
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        isEnabled 
                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                            : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                    }`}>
                        {isEnabled ? <ShieldCheck className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-white">
                                Two-Factor Authentication (2FA / MFA)
                            </h3>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                isEnabled 
                                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' 
                                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border border-zinc-200 dark:border-zinc-700'
                            }`}>
                                {isEnabled ? 'Enabled & Active' : 'Not Configured'}
                            </span>
                            {isEnforced && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/15 text-blue-500 border border-blue-500/30">
                                    Enforced by Policy
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                            Protect your account with a second identity verification factor during login.
                        </p>
                    </div>
                </div>

                {isEnabled && !isEnforced && (
                    <button
                        type="button"
                        onClick={() => {
                            setDisablePassword('');
                            setDisableModalOpen(true);
                        }}
                        className="py-2 px-3 text-xs font-bold text-red-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors border border-transparent hover:border-red-200 dark:hover:border-red-900/40 cursor-pointer"
                    >
                        Disable 2FA
                    </button>
                )}
            </div>

            {/* Methods Grid */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Method 1: Authenticator App */}
                <div className={`p-5 rounded-xl border transition-all ${
                    status?.has_totp 
                        ? 'bg-emerald-500/[0.03] border-emerald-500/30 dark:border-emerald-500/20' 
                        : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800'
                }`}>
                    <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                                <Smartphone className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-white">
                                    Authenticator App
                                </h4>
                                <p className="text-[11px] text-zinc-500">
                                    Google Authenticator, Microsoft Authenticator, Authy
                                </p>
                            </div>
                        </div>

                        {status?.has_totp && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                <Check className="w-3 h-3" /> Connected
                            </span>
                        )}
                    </div>

                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-4">
                        Generate time-sensitive 6-digit codes directly on your mobile device even when offline.
                    </p>

                    <div className="flex items-center gap-2">
                        {status?.totp_allowed ? (
                            status?.has_totp ? (
                                <>
                                    <button
                                        type="button"
                                        onClick={handleStartTotpSetup}
                                        className="py-1.5 px-3 rounded-lg text-xs font-bold bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-400 transition-all cursor-pointer"
                                    >
                                        Reconfigure
                                    </button>
                                    {status?.mfa_type !== 'authenticator' && (
                                        <button
                                            type="button"
                                            onClick={() => handleSetPreferredMethod('authenticator')}
                                            className="py-1.5 px-3 rounded-lg text-xs font-bold text-[#FF3B30] hover:bg-[#FF3B30]/10 transition-colors cursor-pointer"
                                        >
                                            Set as Default
                                        </button>
                                    )}
                                </>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleStartTotpSetup}
                                    className="py-2 px-4 rounded-xl text-xs font-black uppercase tracking-wider bg-[#FF3B30] hover:bg-red-600 text-white shadow-md shadow-[#FF3B30]/20 transition-all cursor-pointer"
                                >
                                    Set Up Authenticator
                                </button>
                            )
                        ) : (
                            <span className="text-xs text-zinc-400 italic">Disabled by administrator</span>
                        )}
                    </div>
                </div>

                {/* Method 2: Email OTP */}
                <div className={`p-5 rounded-xl border transition-all ${
                    status?.mfa_type === 'email' && isEnabled
                        ? 'bg-blue-500/[0.03] border-blue-500/30 dark:border-blue-500/20' 
                        : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800'
                }`}>
                    <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                                <Mail className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-white">
                                    Email One-Time Password
                                </h4>
                                <p className="text-[11px] text-zinc-500">
                                    Verification sent to {authUser?.email}
                                </p>
                            </div>
                        </div>

                        {status?.mfa_type === 'email' && isEnabled && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full">
                                <Check className="w-3 h-3" /> Active Default
                            </span>
                        )}
                    </div>

                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-4">
                        Receive a secure 6-digit code via email every time you log in to your account.
                    </p>

                    <div className="flex items-center gap-2">
                        {status?.email_allowed ? (
                            isEnabled && status?.mfa_type === 'email' ? (
                                <span className="text-xs font-semibold text-emerald-500 flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Ready for login
                                </span>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleStartEmailSetup}
                                    className="py-2 px-4 rounded-xl text-xs font-black uppercase tracking-wider bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-white hover:border-[#FF3B30] hover:text-[#FF3B30] transition-all cursor-pointer"
                                >
                                    Enable Email OTP
                                </button>
                            )
                        ) : (
                            <span className="text-xs text-zinc-400 italic">Disabled by administrator</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Backup Codes Section */}
            <div className="p-6 bg-zinc-50 dark:bg-zinc-950/60 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 shrink-0">
                        <KeyRound className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h4 className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-white">
                                Emergency Recovery Codes
                            </h4>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400">
                                {status?.remaining_backup_codes ?? 0} codes remaining
                            </span>
                        </div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                            Single-use recovery codes allow you to regain access if you lose your phone or email.
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => {
                        setBackupPassword('');
                        setBackupCodes([]);
                        setBackupCodesModalOpen(true);
                    }}
                    className="py-2 px-4 rounded-xl text-xs font-black uppercase tracking-wider bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-white hover:border-amber-500 hover:text-amber-500 transition-all cursor-pointer whitespace-nowrap self-start sm:self-center"
                >
                    {status?.remaining_backup_codes > 0 ? 'Manage Recovery Codes' : 'Generate Recovery Codes'}
                </button>
            </div>

            {/* MODAL 1: TOTP SETUP */}
            {totpModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-left">
                        <button
                            type="button"
                            onClick={() => setTotpModalOpen(false)}
                            className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-2.5 mb-4">
                            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                                <Smartphone className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-white">
                                    Set Up Authenticator App
                                </h3>
                                <p className="text-xs text-zinc-500">Step-by-step connection</p>
                            </div>
                        </div>

                        {totpSetupData ? (
                            <div className="space-y-4">
                                <div className="text-xs text-zinc-600 dark:text-zinc-400">
                                    <strong>Step 1:</strong> Scan this QR code using Google Authenticator, Microsoft Authenticator, or 1Password.
                                </div>

                                {/* QR Canvas */}
                                <div className="flex justify-center p-3 bg-white rounded-xl border border-zinc-200 max-w-[220px] mx-auto shadow-inner">
                                    <canvas ref={canvasRef} />
                                </div>

                                {/* Manual Secret */}
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">
                                        Or enter key manually:
                                    </span>
                                    <div className="flex items-center gap-2 p-2 rounded-lg bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                                        <code className="text-xs font-mono font-bold tracking-wider text-zinc-900 dark:text-zinc-200 flex-1 break-all">
                                            {totpSetupData.formatted_secret}
                                        </code>
                                        <button
                                            type="button"
                                            onClick={() => handleCopySecret(totpSetupData.secret)}
                                            className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-white rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer"
                                            title="Copy Key"
                                        >
                                            {copiedSecret ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Step 2: Verification Code Input */}
                                <form onSubmit={handleConfirmTotp} className="space-y-3 pt-2">
                                    <div className="text-xs text-zinc-600 dark:text-zinc-400">
                                        <strong>Step 2:</strong> Enter the 6-digit code shown in your app to activate.
                                    </div>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={6}
                                        placeholder="••••••"
                                        autoFocus
                                        value={totpCode}
                                        onChange={e => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        className="w-full text-center text-xl font-black font-mono tracking-widest py-2.5 px-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-white focus:border-[#FF3B30] focus:ring-0 focus:outline-none"
                                    />
                                    <button
                                        type="submit"
                                        disabled={totpCode.length !== 6 || totpSubmitting}
                                        className="w-full py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider bg-[#FF3B30] hover:bg-red-600 disabled:opacity-50 text-white transition-all cursor-pointer flex items-center justify-center gap-2"
                                    >
                                        {totpSubmitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                                        <span>Verify & Activate</span>
                                    </button>
                                </form>
                            </div>
                        ) : (
                            <div className="py-8 text-center">
                                <RefreshCw className="w-6 h-6 animate-spin text-[#FF3B30] mx-auto mb-2" />
                                <p className="text-xs text-zinc-500">Generating secure key pair...</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* MODAL 2: EMAIL OTP SETUP */}
            {emailModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl relative text-left">
                        <button
                            type="button"
                            onClick={() => setEmailModalOpen(false)}
                            className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-2.5 mb-4">
                            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                                <Mail className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-white">
                                    Enable Email OTP
                                </h3>
                                <p className="text-xs text-zinc-500">Confirm test code</p>
                            </div>
                        </div>

                        <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-4">
                            We've sent a 6-digit confirmation code to <strong>{authUser?.email}</strong>. Enter it below to activate.
                        </p>

                        <form onSubmit={handleConfirmEmail} className="space-y-4">
                            <input
                                type="text"
                                inputMode="numeric"
                                maxLength={6}
                                placeholder="••••••"
                                autoFocus
                                value={emailCode}
                                onChange={e => setEmailCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                className="w-full text-center text-xl font-black font-mono tracking-widest py-2.5 px-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-white focus:border-[#FF3B30] focus:ring-0 focus:outline-none"
                            />
                            <button
                                type="submit"
                                disabled={emailCode.length !== 6 || emailSubmitting}
                                className="w-full py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider bg-[#FF3B30] hover:bg-red-600 disabled:opacity-50 text-white transition-all cursor-pointer flex items-center justify-center gap-2"
                            >
                                {emailSubmitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                                <span>Verify & Enable</span>
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 3: BACKUP RECOVERY CODES */}
            {backupCodesModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-left">
                        <button
                            type="button"
                            onClick={() => setBackupCodesModalOpen(false)}
                            className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-2.5 mb-4">
                            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                                <KeyRound className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-white">
                                    Recovery Backup Codes
                                </h3>
                                <p className="text-xs text-zinc-500">Emergency account access</p>
                            </div>
                        </div>

                        {backupCodes.length > 0 ? (
                            <div className="space-y-4">
                                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs">
                                    <strong>Important:</strong> Save these single-use codes now in a password manager or secure location. They will not be displayed again.
                                </div>

                                <div className="grid grid-cols-2 gap-2 p-3 bg-zinc-100 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800">
                                    {backupCodes.map((c, i) => (
                                        <div key={i} className="flex items-center justify-between p-1.5 bg-white dark:bg-zinc-900 rounded border border-zinc-200 dark:border-zinc-800 text-xs font-mono font-bold text-zinc-800 dark:text-zinc-200">
                                            <span>{c}</span>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    navigator.clipboard.writeText(c);
                                                    setCopiedIndex(i);
                                                    setTimeout(() => setCopiedIndex(null), 1500);
                                                }}
                                                className="p-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                                                title="Copy code"
                                            >
                                                {copiedIndex === i ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex items-center gap-2 pt-2">
                                    <button
                                        type="button"
                                        onClick={handleCopyAllBackupCodes}
                                        className="flex-1 py-2 px-3 rounded-lg text-xs font-bold bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 hover:text-zinc-900 dark:hover:text-white flex items-center justify-center gap-1.5 cursor-pointer"
                                    >
                                        <Copy className="w-3.5 h-3.5" />
                                        <span>Copy All</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleDownloadBackupCodes}
                                        className="flex-1 py-2 px-3 rounded-lg text-xs font-bold bg-[#FF3B30] hover:bg-red-600 text-white flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                                    >
                                        <Download className="w-3.5 h-3.5" />
                                        <span>Download .TXT</span>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleGenerateBackupCodes} className="space-y-4">
                                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                                    Enter your account password to generate a fresh set of 8 emergency backup codes. Any previous codes will be permanently invalidated.
                                </p>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-500 mb-1">
                                        Confirm Account Password
                                    </label>
                                    <input
                                        type="password"
                                        required
                                        autoFocus
                                        value={backupPassword}
                                        onChange={e => setBackupPassword(e.target.value)}
                                        className="w-full text-sm py-2 px-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-white focus:border-[#FF3B30] focus:ring-0 focus:outline-none"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={!backupPassword || backupGenerating}
                                    className="w-full py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider bg-[#FF3B30] hover:bg-red-600 disabled:opacity-50 text-white transition-all cursor-pointer flex items-center justify-center gap-2"
                                >
                                    {backupGenerating && <RefreshCw className="w-4 h-4 animate-spin" />}
                                    <span>Generate 8 New Codes</span>
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* MODAL 4: DISABLE MFA CONFIRMATION */}
            {disableModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl relative text-left">
                        <button
                            type="button"
                            onClick={() => setDisableModalOpen(false)}
                            className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-2.5 mb-4">
                            <div className="p-2 rounded-xl bg-red-500/10 text-red-500">
                                <AlertTriangle className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-white">
                                    Disable 2FA Security
                                </h3>
                                <p className="text-xs text-zinc-500">Confirm account password</p>
                            </div>
                        </div>

                        <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-4">
                            Disabling Two-Factor Authentication makes your account vulnerable to unauthorized access. Enter your password to proceed.
                        </p>

                        <form onSubmit={handleDisableMfa} className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-500 mb-1">
                                    Account Password
                                </label>
                                <input
                                    type="password"
                                    required
                                    autoFocus
                                    value={disablePassword}
                                    onChange={e => setDisablePassword(e.target.value)}
                                    className="w-full text-sm py-2 px-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-white focus:border-[#FF3B30] focus:ring-0 focus:outline-none"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={!disablePassword || disableSubmitting}
                                className="w-full py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white transition-all cursor-pointer flex items-center justify-center gap-2"
                            >
                                {disableSubmitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                                <span>Confirm & Turn Off 2FA</span>
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
