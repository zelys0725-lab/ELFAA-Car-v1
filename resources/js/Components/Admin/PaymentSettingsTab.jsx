import React, { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { 
    CreditCard, 
    Smartphone, 
    ShieldCheck, 
    Key, 
    Globe, 
    CheckCircle2, 
    AlertTriangle, 
    Eye, 
    EyeOff, 
    Copy, 
    Check, 
    Zap, 
    ExternalLink, 
    Save, 
    RotateCcw,
    Settings,
    Layers,
    Sparkles,
    SlidersHorizontal,
    CheckCircle,
    Info,
    RefreshCw,
    BookOpen,
    BadgeCheck
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Input, Button, Badge } from '@/Components/Shadcn';
import Swal from 'sweetalert2';

export default function PaymentSettingsTab({ settings = {} }) {
    const [subTab, setSubTab] = useState('gcash'); // 'gcash' | 'stripe' | 'general' | 'webhooks'
    const [showKeys, setShowKeys] = useState({});
    const [copiedWebhook, setCopiedWebhook] = useState(null);
    const [testingGateway, setTestingGateway] = useState(null);

    const toggleShowKey = (field) => {
        setShowKeys(prev => ({ ...prev, [field]: !prev[field] }));
    };

    const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

    const form = useForm({
        // Stripe Configuration
        payment_stripe_enabled: settings?.payment_stripe_enabled === '1' || settings?.payment_stripe_enabled === true ? '1' : '0',
        payment_stripe_mode: settings?.payment_stripe_mode || 'test',
        payment_stripe_test_pk: settings?.payment_stripe_test_pk || '',
        payment_stripe_test_sk: settings?.payment_stripe_test_sk || '',
        payment_stripe_test_webhook_secret: settings?.payment_stripe_test_webhook_secret || '',
        payment_stripe_live_pk: settings?.payment_stripe_live_pk || '',
        payment_stripe_live_sk: settings?.payment_stripe_live_sk || '',
        payment_stripe_live_webhook_secret: settings?.payment_stripe_live_webhook_secret || '',

        // GCash (PayMongo) Configuration
        payment_gcash_enabled: settings?.payment_gcash_enabled === '1' || settings?.payment_gcash_enabled === true ? '1' : '0',
        payment_gcash_mode: settings?.payment_gcash_mode || 'test',
        payment_gcash_test_pk: settings?.payment_gcash_test_pk || '',
        payment_gcash_test_sk: settings?.payment_gcash_test_sk || '',
        payment_gcash_test_webhook_secret: settings?.payment_gcash_test_webhook_secret || '',
        payment_gcash_live_pk: settings?.payment_gcash_live_pk || '',
        payment_gcash_live_sk: settings?.payment_gcash_live_sk || '',
        payment_gcash_live_webhook_secret: settings?.payment_gcash_live_webhook_secret || '',

        // General Rules
        payment_auto_confirm: settings?.payment_auto_confirm ?? '1',
        payment_currency: settings?.payment_currency || 'PHP',
    });

    const handleSubmit = (e) => {
        e.preventDefault();

        form.post(route('admin.payment_settings.update'), {
            preserveScroll: true,
            onSuccess: () => {
                Swal.fire({
                    icon: 'success',
                    title: 'Payment Settings Saved!',
                    text: 'Payment gateways, API credentials, and processing rules have been updated successfully.',
                    confirmButtonColor: '#FF3B30',
                    background: isDark ? '#18181b' : '#ffffff',
                    color: isDark ? '#f4f4f5' : '#18181b',
                });
            },
            onError: (errs) => {
                Swal.fire({
                    icon: 'error',
                    title: 'Failed to Save Settings',
                    text: Object.values(errs).flat().join(' '),
                    confirmButtonColor: '#e11d48',
                    background: isDark ? '#18181b' : '#ffffff',
                    color: isDark ? '#f4f4f5' : '#18181b',
                });
            }
        });
    };

    const handleCopy = (text, id) => {
        navigator.clipboard.writeText(text);
        setCopiedWebhook(id);
        setTimeout(() => setCopiedWebhook(null), 2500);
    };

    const handleTestConnection = async (gateway) => {
        setTestingGateway(gateway);

        try {
            const res = await window.axios.post(route('admin.payment_settings.test_connection'), {
                gateway
            });

            Swal.fire({
                icon: res.data.success ? 'success' : 'warning',
                title: res.data.success ? 'API Connection Verified!' : 'Connection Warning',
                text: res.data.message || (res.data.success ? 'Successfully communicated with the payment provider API.' : 'Please verify your keys.'),
                confirmButtonColor: res.data.success ? '#16a34a' : '#d97706',
                background: isDark ? '#18181b' : '#ffffff',
                color: isDark ? '#f4f4f5' : '#18181b',
            });
        } catch (err) {
            const msg = err.response?.data?.message || err.message || 'Network error while contacting payment API.';
            Swal.fire({
                icon: 'error',
                title: 'Connection Failed',
                text: msg,
                confirmButtonColor: '#e11d48',
                background: isDark ? '#18181b' : '#ffffff',
                color: isDark ? '#f4f4f5' : '#18181b',
            });
        } finally {
            setTestingGateway(null);
        }
    };

    const stripeWebhookUrl = typeof window !== 'undefined' 
        ? `${window.location.origin}/api/webhooks/stripe` 
        : '/api/webhooks/stripe';

    const paymongoWebhookUrl = typeof window !== 'undefined' 
        ? `${window.location.origin}/api/webhooks/paymongo` 
        : '/api/webhooks/paymongo';

    const isStripeActive = form.data.payment_stripe_enabled === '1';
    const isGcashActive = form.data.payment_gcash_enabled === '1';

    const isStripeConfigured = form.data.payment_stripe_mode === 'live' 
        ? (Boolean(form.data.payment_stripe_live_sk) && Boolean(form.data.payment_stripe_live_pk))
        : (Boolean(form.data.payment_stripe_test_sk) && Boolean(form.data.payment_stripe_test_pk));

    const isGcashConfigured = form.data.payment_gcash_mode === 'live'
        ? Boolean(form.data.payment_gcash_live_sk)
        : Boolean(form.data.payment_gcash_test_sk);

    return (
        <div className="w-full space-y-6 text-left">
            {/* PAGE TITLE BAR */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
                <div>
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-[#FF3B30]">
                            <Zap className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black tracking-tight text-zinc-900 dark:text-white uppercase">
                                Payment Settings
                            </h2>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                Configure GCash & Stripe checkout, manage API credentials, switch environments, and set automation rules.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                        Server Verified Webhooks
                    </span>
                </div>
            </div>

            {/* THREE TOP STATUS CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* GCash Status Card */}
                <div 
                    onClick={() => setSubTab('gcash')}
                    className={`p-4 rounded-xl border transition-all cursor-pointer bg-white dark:bg-zinc-900 ${
                        subTab === 'gcash'
                            ? 'border-sky-500 ring-2 ring-sky-500/10 shadow-md'
                            : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                    }`}
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center font-black">
                                <Smartphone className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-extrabold text-xs text-zinc-900 dark:text-white">GCash (PayMongo)</h3>
                                <span className="text-[10px] text-zinc-400">e-Wallet Payments</span>
                            </div>
                        </div>

                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            isGcashActive 
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 border border-zinc-200 dark:border-zinc-700'
                        }`}>
                            {isGcashActive ? 'Active' : 'Disabled'}
                        </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
                        <span className="text-zinc-500">Environment:</span>
                        <span className={`font-mono font-bold uppercase text-[10px] px-1.5 py-0.5 rounded ${
                            form.data.payment_gcash_mode === 'live' 
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 font-extrabold'
                                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 font-extrabold'
                        }`}>
                            {form.data.payment_gcash_mode}
                        </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] mt-1.5">
                        <span className="text-zinc-500">API Credentials:</span>
                        <span className={isGcashConfigured ? 'text-emerald-600 font-bold' : 'text-zinc-400 font-medium'}>
                            {isGcashConfigured ? '✓ Configured' : '○ Missing Keys'}
                        </span>
                    </div>
                </div>

                {/* Stripe Status Card */}
                <div 
                    onClick={() => setSubTab('stripe')}
                    className={`p-4 rounded-xl border transition-all cursor-pointer bg-white dark:bg-zinc-900 ${
                        subTab === 'stripe'
                            ? 'border-blue-500 ring-2 ring-blue-500/10 shadow-md'
                            : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                    }`}
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-black">
                                <CreditCard className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-extrabold text-xs text-zinc-900 dark:text-white">Stripe Card Pay</h3>
                                <span className="text-[10px] text-zinc-400">Visa / Mastercard / Amex</span>
                            </div>
                        </div>

                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            isStripeActive 
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 border border-zinc-200 dark:border-zinc-700'
                        }`}>
                            {isStripeActive ? 'Active' : 'Disabled'}
                        </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
                        <span className="text-zinc-500">Environment:</span>
                        <span className={`font-mono font-bold uppercase text-[10px] px-1.5 py-0.5 rounded ${
                            form.data.payment_stripe_mode === 'live' 
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 font-extrabold'
                                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 font-extrabold'
                        }`}>
                            {form.data.payment_stripe_mode}
                        </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] mt-1.5">
                        <span className="text-zinc-500">API Credentials:</span>
                        <span className={isStripeConfigured ? 'text-emerald-600 font-bold' : 'text-zinc-400 font-medium'}>
                            {isStripeConfigured ? '✓ Configured' : '○ Missing Keys'}
                        </span>
                    </div>
                </div>

                {/* Automation Rules Card */}
                <div 
                    onClick={() => setSubTab('general')}
                    className={`p-4 rounded-xl border transition-all cursor-pointer bg-white dark:bg-zinc-900 ${
                        subTab === 'general'
                            ? 'border-red-500 ring-2 ring-red-500/10 shadow-md'
                            : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                    }`}
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-black">
                                <SlidersHorizontal className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-extrabold text-xs text-zinc-900 dark:text-white">Auto-Confirmation</h3>
                                <span className="text-[10px] text-zinc-400">Post-Payment Rules</span>
                            </div>
                        </div>

                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                            {form.data.payment_currency}
                        </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
                        <span className="text-zinc-500">Auto-Confirm:</span>
                        <span className={form.data.payment_auto_confirm === '1' ? 'text-emerald-600 font-bold' : 'text-zinc-400'}>
                            {form.data.payment_auto_confirm === '1' ? '● Enabled' : '○ Off (Manual)'}
                        </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] mt-1.5">
                        <span className="text-zinc-500">SMS / Email Alerts:</span>
                        <span className="text-emerald-600 font-bold">
                            ✓ Instant
                        </span>
                    </div>
                </div>
            </div>

            {/* CLEAN HORIZONTAL SUB-NAV TABS */}
            <div className="flex items-center gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-800/60 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <button
                    type="button"
                    onClick={() => setSubTab('gcash')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                        subTab === 'gcash'
                            ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm font-extrabold'
                            : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                >
                    <Smartphone className="w-4 h-4 text-sky-500" />
                    <span>GCash (PayMongo)</span>
                    {isGcashActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                </button>

                <button
                    type="button"
                    onClick={() => setSubTab('stripe')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                        subTab === 'stripe'
                            ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm font-extrabold'
                            : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                >
                    <CreditCard className="w-4 h-4 text-blue-500" />
                    <span>Stripe Cards</span>
                    {isStripeActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                </button>

                <button
                    type="button"
                    onClick={() => setSubTab('general')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                        subTab === 'general'
                            ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm font-extrabold'
                            : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                >
                    <SlidersHorizontal className="w-4 h-4 text-zinc-500" />
                    <span>General Rules</span>
                </button>

                <button
                    type="button"
                    onClick={() => setSubTab('webhooks')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                        subTab === 'webhooks'
                            ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm font-extrabold'
                            : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                >
                    <Globe className="w-4 h-4 text-emerald-500" />
                    <span>Webhooks & Setup</span>
                </button>
            </div>

            {/* TAB CONTENT */}
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* 1. GCASH TAB */}
                {subTab === 'gcash' && (
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
                        {/* Control Bar */}
                        <div className="p-6 border-b border-zinc-150 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-500 flex items-center justify-center shrink-0">
                                    <Smartphone className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-wider">
                                            GCash Integration via PayMongo
                                        </h3>
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300">
                                            PHP e-Wallet
                                        </span>
                                    </div>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                                        Enable instant Philippine GCash payments with mobile OTP verification and QR checkout.
                                    </p>
                                </div>
                            </div>

                            {/* Status, Mode & Connection Test */}
                            <div className="flex flex-wrap items-center gap-3">
                                {/* Toggle */}
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
                                    <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                                        {form.data.payment_gcash_enabled === '1' ? 'Enabled' : 'Disabled'}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => form.setData('payment_gcash_enabled', form.data.payment_gcash_enabled === '1' ? '0' : '1')}
                                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
                                            form.data.payment_gcash_enabled === '1' ? 'bg-[#FF3B30]' : 'bg-zinc-300 dark:bg-zinc-600'
                                        }`}
                                    >
                                        <span
                                            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                                                form.data.payment_gcash_enabled === '1' ? 'translate-x-4' : 'translate-x-1'
                                            }`}
                                        />
                                    </button>
                                </div>

                                {/* Mode Switcher */}
                                <div className="flex p-0.5 bg-zinc-200/80 dark:bg-zinc-800 rounded-xl border border-zinc-300 dark:border-zinc-700">
                                    <button
                                        type="button"
                                        onClick={() => form.setData('payment_gcash_mode', 'test')}
                                        className={`px-3 py-1 rounded-lg text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                                            form.data.payment_gcash_mode === 'test'
                                                ? 'bg-white dark:bg-zinc-900 text-amber-600 dark:text-amber-400 shadow-sm'
                                                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                                        }`}
                                    >
                                        Test Mode
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => form.setData('payment_gcash_mode', 'live')}
                                        className={`px-3 py-1 rounded-lg text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                                            form.data.payment_gcash_mode === 'live'
                                                ? 'bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                                                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                                        }`}
                                    >
                                        Live Mode
                                    </button>
                                </div>

                                {/* Test API Connection Button */}
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => handleTestConnection('gcash')}
                                    disabled={testingGateway === 'gcash'}
                                    className="text-xs h-9 font-bold gap-1.5 cursor-pointer bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700"
                                >
                                    <RefreshCw className={`w-3.5 h-3.5 text-sky-500 ${testingGateway === 'gcash' ? 'animate-spin' : ''}`} />
                                    {testingGateway === 'gcash' ? 'Testing...' : 'Test Connection'}
                                </Button>
                            </div>
                        </div>

                        {/* Environment Notice */}
                        <div className="p-6 space-y-6">
                            <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                                form.data.payment_gcash_mode === 'live'
                                    ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-300'
                                    : 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-300'
                            }`}>
                                <Info className="w-5 h-5 shrink-0 mt-0.5" />
                                <div className="text-xs space-y-0.5">
                                    <p className="font-extrabold">
                                        Active Environment: PayMongo GCash {form.data.payment_gcash_mode.toUpperCase()}
                                    </p>
                                    <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                        {form.data.payment_gcash_mode === 'live'
                                            ? 'Production keys are active. Real customer GCash wallets will be debited and funds will settle to your verified PayMongo account.'
                                            : 'Sandbox test mode is active. You can test checkout with test numbers (e.g. 09171234567 and OTP 123456) without charging real money.'}
                                    </p>
                                </div>
                            </div>

                            {/* Dual Credential Cards */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Test Keys Box */}
                                <div className={`p-5 rounded-xl border space-y-4 ${
                                    form.data.payment_gcash_mode === 'test'
                                        ? 'border-amber-500/50 bg-amber-50/20 dark:bg-amber-950/10 ring-1 ring-amber-500/20'
                                        : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-950/20'
                                }`}>
                                    <div className="flex items-center justify-between pb-2 border-b border-zinc-200/60 dark:border-zinc-800">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                                            <h4 className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-white">
                                                Test Mode Keys
                                            </h4>
                                        </div>
                                        {form.data.payment_gcash_mode === 'test' && (
                                            <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400">
                                                Currently Active
                                            </span>
                                        )}
                                    </div>

                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                                                Test Public Key (pk_test_...)
                                            </label>
                                            <Input
                                                type="text"
                                                placeholder="pk_test_..."
                                                value={form.data.payment_gcash_test_pk}
                                                onChange={e => form.setData('payment_gcash_test_pk', e.target.value)}
                                                className="font-mono text-xs h-9 bg-white dark:bg-zinc-950"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                                                Test Secret Key (sk_test_...)
                                            </label>
                                            <div className="relative">
                                                <Input
                                                    type={showKeys['gcash_test_sk'] ? 'text' : 'password'}
                                                    placeholder="sk_test_..."
                                                    value={form.data.payment_gcash_test_sk}
                                                    onChange={e => form.setData('payment_gcash_test_sk', e.target.value)}
                                                    className="font-mono text-xs h-9 pr-9 bg-white dark:bg-zinc-950"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => toggleShowKey('gcash_test_sk')}
                                                    className="absolute right-2.5 top-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                                                >
                                                    {showKeys['gcash_test_sk'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                                                Test Webhook Secret
                                            </label>
                                            <div className="relative">
                                                <Input
                                                    type={showKeys['gcash_test_whsec'] ? 'text' : 'password'}
                                                    placeholder="whsec_..."
                                                    value={form.data.payment_gcash_test_webhook_secret}
                                                    onChange={e => form.setData('payment_gcash_test_webhook_secret', e.target.value)}
                                                    className="font-mono text-xs h-9 pr-9 bg-white dark:bg-zinc-950"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => toggleShowKey('gcash_test_whsec')}
                                                    className="absolute right-2.5 top-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                                                >
                                                    {showKeys['gcash_test_whsec'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Live Keys Box */}
                                <div className={`p-5 rounded-xl border space-y-4 ${
                                    form.data.payment_gcash_mode === 'live'
                                        ? 'border-emerald-500/50 bg-emerald-50/20 dark:bg-emerald-950/10 ring-1 ring-emerald-500/20'
                                        : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-950/20'
                                }`}>
                                    <div className="flex items-center justify-between pb-2 border-b border-zinc-200/60 dark:border-zinc-800">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                                            <h4 className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-white">
                                                Live Production Keys
                                            </h4>
                                        </div>
                                        {form.data.payment_gcash_mode === 'live' && (
                                            <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400">
                                                Currently Active
                                            </span>
                                        )}
                                    </div>

                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                                                Live Public Key (pk_live_...)
                                            </label>
                                            <Input
                                                type="text"
                                                placeholder="pk_live_..."
                                                value={form.data.payment_gcash_live_pk}
                                                onChange={e => form.setData('payment_gcash_live_pk', e.target.value)}
                                                className="font-mono text-xs h-9 bg-white dark:bg-zinc-950"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                                                Live Secret Key (sk_live_...)
                                            </label>
                                            <div className="relative">
                                                <Input
                                                    type={showKeys['gcash_live_sk'] ? 'text' : 'password'}
                                                    placeholder="sk_live_..."
                                                    value={form.data.payment_gcash_live_sk}
                                                    onChange={e => form.setData('payment_gcash_live_sk', e.target.value)}
                                                    className="font-mono text-xs h-9 pr-9 bg-white dark:bg-zinc-950"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => toggleShowKey('gcash_live_sk')}
                                                    className="absolute right-2.5 top-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                                                >
                                                    {showKeys['gcash_live_sk'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                                                Live Webhook Secret Key
                                            </label>
                                            <div className="relative">
                                                <Input
                                                    type={showKeys['gcash_live_whsec'] ? 'text' : 'password'}
                                                    placeholder="whsec_..."
                                                    value={form.data.payment_gcash_live_webhook_secret}
                                                    onChange={e => form.setData('payment_gcash_live_webhook_secret', e.target.value)}
                                                    className="font-mono text-xs h-9 pr-9 bg-white dark:bg-zinc-950"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => toggleShowKey('gcash_live_whsec')}
                                                    className="absolute right-2.5 top-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                                                >
                                                    {showKeys['gcash_live_whsec'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. STRIPE TAB */}
                {subTab === 'stripe' && (
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
                        {/* Control Bar */}
                        <div className="p-6 border-b border-zinc-150 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center shrink-0">
                                    <CreditCard className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-wider">
                                            Stripe Card Integration
                                        </h3>
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                                            Visa / Mastercard / Amex
                                        </span>
                                    </div>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                                        Accept domestic and international credit or debit cards securely via Stripe Checkout.
                                    </p>
                                </div>
                            </div>

                            {/* Status, Mode & Connection Test */}
                            <div className="flex flex-wrap items-center gap-3">
                                {/* Toggle */}
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
                                    <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                                        {form.data.payment_stripe_enabled === '1' ? 'Enabled' : 'Disabled'}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => form.setData('payment_stripe_enabled', form.data.payment_stripe_enabled === '1' ? '0' : '1')}
                                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
                                            form.data.payment_stripe_enabled === '1' ? 'bg-[#FF3B30]' : 'bg-zinc-300 dark:bg-zinc-600'
                                        }`}
                                    >
                                        <span
                                            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                                                form.data.payment_stripe_enabled === '1' ? 'translate-x-4' : 'translate-x-1'
                                            }`}
                                        />
                                    </button>
                                </div>

                                {/* Mode Switcher */}
                                <div className="flex p-0.5 bg-zinc-200/80 dark:bg-zinc-800 rounded-xl border border-zinc-300 dark:border-zinc-700">
                                    <button
                                        type="button"
                                        onClick={() => form.setData('payment_stripe_mode', 'test')}
                                        className={`px-3 py-1 rounded-lg text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                                            form.data.payment_stripe_mode === 'test'
                                                ? 'bg-white dark:bg-zinc-900 text-amber-600 dark:text-amber-400 shadow-sm'
                                                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                                        }`}
                                    >
                                        Test Mode
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => form.setData('payment_stripe_mode', 'live')}
                                        className={`px-3 py-1 rounded-lg text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                                            form.data.payment_stripe_mode === 'live'
                                                ? 'bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                                                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                                        }`}
                                    >
                                        Live Mode
                                    </button>
                                </div>

                                {/* Test API Connection Button */}
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => handleTestConnection('stripe')}
                                    disabled={testingGateway === 'stripe'}
                                    className="text-xs h-9 font-bold gap-1.5 cursor-pointer bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700"
                                >
                                    <RefreshCw className={`w-3.5 h-3.5 text-blue-500 ${testingGateway === 'stripe' ? 'animate-spin' : ''}`} />
                                    {testingGateway === 'stripe' ? 'Testing...' : 'Test Connection'}
                                </Button>
                            </div>
                        </div>

                        {/* Environment Notice */}
                        <div className="p-6 space-y-6">
                            <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                                form.data.payment_stripe_mode === 'live'
                                    ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-300'
                                    : 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-300'
                            }`}>
                                <Info className="w-5 h-5 shrink-0 mt-0.5" />
                                <div className="text-xs space-y-0.5">
                                    <p className="font-extrabold">
                                        Active Environment: Stripe {form.data.payment_stripe_mode.toUpperCase()}
                                    </p>
                                    <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                        {form.data.payment_stripe_mode === 'live'
                                            ? 'Production keys are active. Real credit/debit card charges will be authorized and processed.'
                                            : 'Stripe Test Mode is active. You can safely simulate card payments using Stripe test card numbers (e.g. 4242 4242 4242 4242).'}
                                    </p>
                                </div>
                            </div>

                            {/* Dual Credential Cards */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Test Keys Box */}
                                <div className={`p-5 rounded-xl border space-y-4 ${
                                    form.data.payment_stripe_mode === 'test'
                                        ? 'border-amber-500/50 bg-amber-50/20 dark:bg-amber-950/10 ring-1 ring-amber-500/20'
                                        : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-950/20'
                                }`}>
                                    <div className="flex items-center justify-between pb-2 border-b border-zinc-200/60 dark:border-zinc-800">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                                            <h4 className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-white">
                                                Test Mode Keys
                                            </h4>
                                        </div>
                                        {form.data.payment_stripe_mode === 'test' && (
                                            <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400">
                                                Currently Active
                                            </span>
                                        )}
                                    </div>

                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                                                Test Publishable Key (pk_test_...)
                                            </label>
                                            <Input
                                                type="text"
                                                placeholder="pk_test_..."
                                                value={form.data.payment_stripe_test_pk}
                                                onChange={e => form.setData('payment_stripe_test_pk', e.target.value)}
                                                className="font-mono text-xs h-9 bg-white dark:bg-zinc-950"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                                                Test Secret Key (sk_test_...)
                                            </label>
                                            <div className="relative">
                                                <Input
                                                    type={showKeys['stripe_test_sk'] ? 'text' : 'password'}
                                                    placeholder="sk_test_..."
                                                    value={form.data.payment_stripe_test_sk}
                                                    onChange={e => form.setData('payment_stripe_test_sk', e.target.value)}
                                                    className="font-mono text-xs h-9 pr-9 bg-white dark:bg-zinc-950"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => toggleShowKey('stripe_test_sk')}
                                                    className="absolute right-2.5 top-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                                                >
                                                    {showKeys['stripe_test_sk'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                                                Test Webhook Signing Secret (whsec_...)
                                            </label>
                                            <div className="relative">
                                                <Input
                                                    type={showKeys['stripe_test_whsec'] ? 'text' : 'password'}
                                                    placeholder="whsec_..."
                                                    value={form.data.payment_stripe_test_webhook_secret}
                                                    onChange={e => form.setData('payment_stripe_test_webhook_secret', e.target.value)}
                                                    className="font-mono text-xs h-9 pr-9 bg-white dark:bg-zinc-950"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => toggleShowKey('stripe_test_whsec')}
                                                    className="absolute right-2.5 top-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                                                >
                                                    {showKeys['stripe_test_whsec'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Live Keys Box */}
                                <div className={`p-5 rounded-xl border space-y-4 ${
                                    form.data.payment_stripe_mode === 'live'
                                        ? 'border-emerald-500/50 bg-emerald-50/20 dark:bg-emerald-950/10 ring-1 ring-emerald-500/20'
                                        : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-950/20'
                                }`}>
                                    <div className="flex items-center justify-between pb-2 border-b border-zinc-200/60 dark:border-zinc-800">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                                            <h4 className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-white">
                                                Live Production Keys
                                            </h4>
                                        </div>
                                        {form.data.payment_stripe_mode === 'live' && (
                                            <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400">
                                                Currently Active
                                            </span>
                                        )}
                                    </div>

                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                                                Live Publishable Key (pk_live_...)
                                            </label>
                                            <Input
                                                type="text"
                                                placeholder="pk_live_..."
                                                value={form.data.payment_stripe_live_pk}
                                                onChange={e => form.setData('payment_stripe_live_pk', e.target.value)}
                                                className="font-mono text-xs h-9 bg-white dark:bg-zinc-950"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                                                Live Secret Key (sk_live_...)
                                            </label>
                                            <div className="relative">
                                                <Input
                                                    type={showKeys['stripe_live_sk'] ? 'text' : 'password'}
                                                    placeholder="sk_live_..."
                                                    value={form.data.payment_stripe_live_sk}
                                                    onChange={e => form.setData('payment_stripe_live_sk', e.target.value)}
                                                    className="font-mono text-xs h-9 pr-9 bg-white dark:bg-zinc-950"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => toggleShowKey('stripe_live_sk')}
                                                    className="absolute right-2.5 top-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                                                >
                                                    {showKeys['stripe_live_sk'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                                                Live Webhook Signing Secret (whsec_...)
                                            </label>
                                            <div className="relative">
                                                <Input
                                                    type={showKeys['stripe_live_whsec'] ? 'text' : 'password'}
                                                    placeholder="whsec_..."
                                                    value={form.data.payment_stripe_live_webhook_secret}
                                                    onChange={e => form.setData('payment_stripe_live_webhook_secret', e.target.value)}
                                                    className="font-mono text-xs h-9 pr-9 bg-white dark:bg-zinc-950"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => toggleShowKey('stripe_live_whsec')}
                                                    className="absolute right-2.5 top-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                                                >
                                                    {showKeys['stripe_live_whsec'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. GENERAL SETTINGS */}
                {subTab === 'general' && (
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm p-6 space-y-6">
                        <div className="flex items-center gap-3 pb-4 border-b border-zinc-150 dark:border-zinc-800">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                                <SlidersHorizontal className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-wider">
                                    Payment Automation & Settlement Rules
                                </h3>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                    Define default currencies and booking status behavior upon verified customer payments.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/30">
                                <label className="block text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-white">
                                    Default Settlement Currency
                                </label>
                                <Input
                                    type="text"
                                    value={form.data.payment_currency}
                                    onChange={e => form.setData('payment_currency', e.target.value.toUpperCase())}
                                    placeholder="PHP"
                                    className="font-mono font-bold text-xs h-10 bg-white dark:bg-zinc-950 max-w-xs"
                                />
                                <p className="text-[11px] text-zinc-500">
                                    Standard 3-letter ISO currency code. Philippine Peso (<code>PHP</code>) is standard for local GCash & Stripe card transactions.
                                </p>
                            </div>

                            <div className="space-y-3 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/30">
                                <label className="block text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-white">
                                    Auto-Confirm Booking on Success
                                </label>
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => form.setData('payment_auto_confirm', form.data.payment_auto_confirm === '1' ? '0' : '1')}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                                            form.data.payment_auto_confirm === '1' ? 'bg-[#FF3B30]' : 'bg-zinc-300 dark:bg-zinc-700'
                                        }`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                                form.data.payment_auto_confirm === '1' ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                        />
                                    </button>
                                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                                        {form.data.payment_auto_confirm === '1' ? 'Enabled (Auto Confirm)' : 'Disabled (Requires Manual Review)'}
                                    </span>
                                </div>
                                <p className="text-[11px] text-zinc-500">
                                    When enabled, as soon as a customer pays via GCash or Stripe, their reservation status is automatically upgraded to <strong>Confirmed</strong>, and an instant SMS/email alert is dispatched.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* 4. WEBHOOKS & INTEGRATION */}
                {subTab === 'webhooks' && (
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm p-6 space-y-6">
                        <div className="flex items-center gap-3 pb-4 border-b border-zinc-150 dark:border-zinc-800">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                                <Globe className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-wider">
                                    Webhook Endpoints & Real-Time Sync
                                </h3>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                    Webhooks ensure transaction statuses update automatically in the background even if the customer closes their browser.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* PayMongo / GCash Webhook Box */}
                            <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/30 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Smartphone className="w-4 h-4 text-sky-500" />
                                        <span className="text-xs font-black uppercase text-zinc-900 dark:text-white">
                                            PayMongo (GCash) Webhook URL
                                        </span>
                                    </div>
                                    <a
                                        href="https://dashboard.paymongo.com/developers"
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-[11px] text-sky-600 hover:text-sky-700 dark:text-sky-400 font-bold inline-flex items-center gap-1"
                                    >
                                        Dashboard <ExternalLink className="w-3 h-3" />
                                    </a>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Input
                                        type="text"
                                        readOnly
                                        value={paymongoWebhookUrl}
                                        className="font-mono text-xs bg-white dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 select-all"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleCopy(paymongoWebhookUrl, 'paymongo')}
                                        className="shrink-0 gap-1 bg-white dark:bg-zinc-900"
                                    >
                                        {copiedWebhook === 'paymongo' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                        {copiedWebhook === 'paymongo' ? 'Copied' : 'Copy'}
                                    </Button>
                                </div>

                                <div className="text-[11px] text-zinc-500 space-y-1">
                                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">Events to monitor in PayMongo:</span>
                                    <div className="flex flex-wrap gap-1 font-mono text-[10px]">
                                        <span className="px-2 py-0.5 rounded bg-zinc-200/80 dark:bg-zinc-800">checkout_session.payment.paid</span>
                                        <span className="px-2 py-0.5 rounded bg-zinc-200/80 dark:bg-zinc-800">payment.paid</span>
                                    </div>
                                </div>
                            </div>

                            {/* Stripe Webhook Box */}
                            <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/30 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <CreditCard className="w-4 h-4 text-blue-500" />
                                        <span className="text-xs font-black uppercase text-zinc-900 dark:text-white">
                                            Stripe Webhook URL
                                        </span>
                                    </div>
                                    <a
                                        href="https://dashboard.stripe.com/webhooks"
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-[11px] text-blue-600 hover:text-blue-700 dark:text-blue-400 font-bold inline-flex items-center gap-1"
                                    >
                                        Dashboard <ExternalLink className="w-3 h-3" />
                                    </a>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Input
                                        type="text"
                                        readOnly
                                        value={stripeWebhookUrl}
                                        className="font-mono text-xs bg-white dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 select-all"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleCopy(stripeWebhookUrl, 'stripe')}
                                        className="shrink-0 gap-1 bg-white dark:bg-zinc-900"
                                    >
                                        {copiedWebhook === 'stripe' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                        {copiedWebhook === 'stripe' ? 'Copied' : 'Copy'}
                                    </Button>
                                </div>

                                <div className="text-[11px] text-zinc-500 space-y-1">
                                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">Events to monitor in Stripe:</span>
                                    <div className="flex flex-wrap gap-1 font-mono text-[10px]">
                                        <span className="px-2 py-0.5 rounded bg-zinc-200/80 dark:bg-zinc-800">checkout.session.completed</span>
                                        <span className="px-2 py-0.5 rounded bg-zinc-200/80 dark:bg-zinc-800">payment_intent.succeeded</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* BOTTOM ACTION BAR */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">
                        {form.isDirty ? (
                            <span className="text-amber-500 font-bold flex items-center gap-1.5">
                                <AlertTriangle className="w-4 h-4 shrink-0" />
                                Unsaved payment configuration changes.
                            </span>
                        ) : (
                            <span className="text-emerald-500 font-bold flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 shrink-0" />
                                All settings synchronized in database.
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => form.reset()}
                            disabled={!form.isDirty || form.processing}
                            className="flex-1 sm:flex-none text-xs h-10 font-bold cursor-pointer bg-white dark:bg-zinc-900"
                        >
                            <RotateCcw className="w-3.5 h-3.5 mr-1" />
                            Discard
                        </Button>

                        <Button
                            type="submit"
                            disabled={form.processing}
                            className="flex-1 sm:flex-none bg-[#FF3B30] hover:bg-red-700 text-white text-xs h-10 font-black uppercase tracking-wider shadow-sm gap-1.5 cursor-pointer"
                        >
                            <Save className="w-4 h-4" />
                            {form.processing ? 'Saving...' : 'Save Payment Settings'}
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    );
}
