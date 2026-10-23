import React from 'react';
import { useForm } from '@inertiajs/react';
import { 
    ShieldCheck, 
    ShieldAlert, 
    Lock, 
    Mail, 
    Smartphone, 
    Clock, 
    RefreshCw, 
    Save, 
    CheckCircle2, 
    AlertTriangle,
    Sliders,
    KeyRound
} from 'lucide-react';
import Swal from 'sweetalert2';

export default function MfaSettingsSection({ settings = {} }) {
    const { data, setData, post, processing, errors } = useForm({
        mfa_policy: settings?.mfa_policy || 'optional',
        mfa_allow_email: settings?.mfa_allow_email ?? '1',
        mfa_allow_totp: settings?.mfa_allow_totp ?? '1',
        mfa_otp_expiration: settings?.mfa_otp_expiration || '10',
        mfa_resend_cooldown: settings?.mfa_resend_cooldown || '60',
        mfa_max_attempts: settings?.mfa_max_attempts || '5',
        mfa_max_resends: settings?.mfa_max_resends || '5',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('admin.mfa_settings.update'), {
            preserveScroll: true,
            onSuccess: () => {
                Swal.fire({
                    icon: 'success',
                    title: 'MFA Security Policies Saved',
                    text: 'Multi-Factor Authentication settings have been successfully updated.',
                    confirmButtonColor: '#FF3B30',
                });
            },
            onError: (err) => {
                Swal.fire({
                    icon: 'error',
                    title: 'Save Failed',
                    text: 'Please check the form fields for errors.',
                    confirmButtonColor: '#FF3B30',
                });
            },
        });
    };

    return (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-lg overflow-hidden text-left">
            {/* Header */}
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-[#FF3B30]/10 text-[#FF3B30]">
                        <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-white">
                            Multi-Factor Authentication (MFA / 2FA) Settings
                        </h3>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                            Control system-wide enforcement policy, allowed verification methods, and security timers.
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-8">
                {/* Section 1: Global Policy */}
                <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-white mb-2 flex items-center gap-2">
                        <Lock className="w-4 h-4 text-[#FF3B30]" />
                        <span>Enforcement Policy</span>
                    </label>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
                        Choose whether MFA is optional, disabled, or strictly mandatory for specific user tiers.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {/* Policy 1: Disabled */}
                        <div 
                            onClick={() => setData('mfa_policy', 'disabled')}
                            className={`p-4 rounded-xl border cursor-pointer transition-all ${
                                data.mfa_policy === 'disabled'
                                    ? 'bg-red-500/10 border-red-500 text-red-500 shadow-sm'
                                    : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300'
                            }`}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-black uppercase tracking-wider">Disabled</span>
                                <input 
                                    type="radio" 
                                    name="mfa_policy" 
                                    checked={data.mfa_policy === 'disabled'} 
                                    onChange={() => setData('mfa_policy', 'disabled')}
                                    className="text-red-500 focus:ring-0" 
                                />
                            </div>
                            <p className="text-[11px] leading-relaxed opacity-80">
                                MFA is completely turned off. No users are prompted for 2FA.
                            </p>
                        </div>

                        {/* Policy 2: Optional */}
                        <div 
                            onClick={() => setData('mfa_policy', 'optional')}
                            className={`p-4 rounded-xl border cursor-pointer transition-all ${
                                data.mfa_policy === 'optional'
                                    ? 'bg-[#FF3B30]/10 border-[#FF3B30] text-[#FF3B30] shadow-sm'
                                    : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300'
                            }`}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-black uppercase tracking-wider">Optional (Opt-In)</span>
                                <input 
                                    type="radio" 
                                    name="mfa_policy" 
                                    checked={data.mfa_policy === 'optional'} 
                                    onChange={() => setData('mfa_policy', 'optional')}
                                    className="text-[#FF3B30] focus:ring-0" 
                                />
                            </div>
                            <p className="text-[11px] leading-relaxed opacity-80">
                                Users choose whether to enable MFA on their personal account settings.
                            </p>
                        </div>

                        {/* Policy 3: Enforce for Admins */}
                        <div 
                            onClick={() => setData('mfa_policy', 'enforced_admin')}
                            className={`p-4 rounded-xl border cursor-pointer transition-all ${
                                data.mfa_policy === 'enforced_admin'
                                    ? 'bg-blue-500/10 border-blue-500 text-blue-500 shadow-sm'
                                    : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300'
                            }`}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-black uppercase tracking-wider">Admins & Staff Only</span>
                                <input 
                                    type="radio" 
                                    name="mfa_policy" 
                                    checked={data.mfa_policy === 'enforced_admin'} 
                                    onChange={() => setData('mfa_policy', 'enforced_admin')}
                                    className="text-blue-500 focus:ring-0" 
                                />
                            </div>
                            <p className="text-[11px] leading-relaxed opacity-80">
                                Mandatory for all Administrators and Staff. Optional for customers.
                            </p>
                        </div>

                        {/* Policy 4: Enforce for All */}
                        <div 
                            onClick={() => setData('mfa_policy', 'enforced_all')}
                            className={`p-4 rounded-xl border cursor-pointer transition-all ${
                                data.mfa_policy === 'enforced_all'
                                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500 shadow-sm'
                                    : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300'
                            }`}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-black uppercase tracking-wider">Enforce All Accounts</span>
                                <input 
                                    type="radio" 
                                    name="mfa_policy" 
                                    checked={data.mfa_policy === 'enforced_all'} 
                                    onChange={() => setData('mfa_policy', 'enforced_all')}
                                    className="text-emerald-500 focus:ring-0" 
                                />
                            </div>
                            <p className="text-[11px] leading-relaxed opacity-80">
                                Strictly mandatory for all accounts: Administrators, Staff, and Customers.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Section 2: Allowed Verification Methods */}
                <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-white mb-2 flex items-center gap-2">
                        <Sliders className="w-4 h-4 text-[#FF3B30]" />
                        <span>Allowed Verification Methods</span>
                    </label>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
                        Enable or disable individual authentication methods available to users.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Email OTP */}
                        <label className="flex items-start gap-3 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 cursor-pointer hover:border-zinc-300 transition-all">
                            <input 
                                type="checkbox"
                                checked={data.mfa_allow_email === '1'}
                                onChange={e => setData('mfa_allow_email', e.target.checked ? '1' : '0')}
                                className="mt-1 rounded text-[#FF3B30] focus:ring-0 cursor-pointer"
                            />
                            <div>
                                <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-blue-500" />
                                    <span className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-white">
                                        Email One-Time Password (OTP)
                                    </span>
                                </div>
                                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                                    Dispatches a 6-digit numeric verification code to the user's registered email via configured SMTP.
                                </p>
                            </div>
                        </label>

                        {/* Authenticator App */}
                        <label className="flex items-start gap-3 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 cursor-pointer hover:border-zinc-300 transition-all">
                            <input 
                                type="checkbox"
                                checked={data.mfa_allow_totp === '1'}
                                onChange={e => setData('mfa_allow_totp', e.target.checked ? '1' : '0')}
                                className="mt-1 rounded text-[#FF3B30] focus:ring-0 cursor-pointer"
                            />
                            <div>
                                <div className="flex items-center gap-2">
                                    <Smartphone className="w-4 h-4 text-emerald-500" />
                                    <span className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-white">
                                        Authenticator App (TOTP RFC 6238)
                                    </span>
                                </div>
                                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                                    Generates rolling 6-digit codes on Google Authenticator, Microsoft Authenticator, Authy, or 1Password.
                                </p>
                            </div>
                        </label>
                    </div>
                </div>

                {/* Section 3: Security & Rate-Limiting Parameters */}
                <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-white mb-2 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[#FF3B30]" />
                        <span>Security & Expiration Parameters</span>
                    </label>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
                        Fine-tune time limits, resend cooldowns, and brute-force protection thresholds.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Expiration */}
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-500 mb-1.5">
                                Code Expiration (Minutes)
                            </label>
                            <input 
                                type="number" 
                                min="1" 
                                max="60"
                                value={data.mfa_otp_expiration}
                                onChange={e => setData('mfa_otp_expiration', e.target.value)}
                                className="w-full text-xs font-bold py-2.5 px-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white focus:border-[#FF3B30] focus:ring-0 focus:outline-none"
                            />
                            <span className="text-[10px] text-zinc-400 mt-1 block">Recommended: 10 mins</span>
                        </div>

                        {/* Cooldown */}
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-500 mb-1.5">
                                Resend Cooldown (Seconds)
                            </label>
                            <input 
                                type="number" 
                                min="10" 
                                max="300"
                                value={data.mfa_resend_cooldown}
                                onChange={e => setData('mfa_resend_cooldown', e.target.value)}
                                className="w-full text-xs font-bold py-2.5 px-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white focus:border-[#FF3B30] focus:ring-0 focus:outline-none"
                            />
                            <span className="text-[10px] text-zinc-400 mt-1 block">Recommended: 60s</span>
                        </div>

                        {/* Max Verification Attempts */}
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-500 mb-1.5">
                                Max Failed Attempts
                            </label>
                            <input 
                                type="number" 
                                min="3" 
                                max="10"
                                value={data.mfa_max_attempts}
                                onChange={e => setData('mfa_max_attempts', e.target.value)}
                                className="w-full text-xs font-bold py-2.5 px-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white focus:border-[#FF3B30] focus:ring-0 focus:outline-none"
                            />
                            <span className="text-[10px] text-zinc-400 mt-1 block">Locks challenge if exceeded (Default: 5)</span>
                        </div>

                        {/* Max Resends */}
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-500 mb-1.5">
                                Max Resend Limit
                            </label>
                            <input 
                                type="number" 
                                min="2" 
                                max="10"
                                value={data.mfa_max_resends}
                                onChange={e => setData('mfa_max_resends', e.target.value)}
                                className="w-full text-xs font-bold py-2.5 px-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white focus:border-[#FF3B30] focus:ring-0 focus:outline-none"
                            />
                            <span className="text-[10px] text-zinc-400 mt-1 block">Max resends per session (Default: 5)</span>
                        </div>
                    </div>
                </div>

                {/* Save Button */}
                <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-end">
                    <button
                        type="submit"
                        disabled={processing}
                        className="py-3 px-6 rounded-xl text-xs font-black uppercase tracking-wider bg-[#FF3B30] hover:bg-red-600 disabled:opacity-50 text-white shadow-lg shadow-[#FF3B30]/25 transition-all flex items-center gap-2 cursor-pointer"
                    >
                        {processing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        <span>Save MFA Security Settings</span>
                    </button>
                </div>
            </form>
        </div>
    );
}
