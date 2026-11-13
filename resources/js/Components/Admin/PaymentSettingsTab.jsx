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
    const [subTab, setSubTab] = useState('paymongo'); // 'paymongo' | 'methods' | 'general' | 'webhooks'
    const [showKeys, setShowKeys] = useState({});
    const [copiedWebhook, setCopiedWebhook] = useState(null);
    const [testingGateway, setTestingGateway] = useState(false);

    const toggleShowKey = (field) => {
        setShowKeys(prev => ({ ...prev, [field]: !prev[field] }));
    };

    const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

    const form = useForm({
        // PayMongo Core API Configuration
        payment_paymongo_mode: settings?.payment_paymongo_mode || settings?.payment_gcash_mode || 'test',
        payment_paymongo_test_pk: settings?.payment_paymongo_test_pk || settings?.payment_gcash_test_pk || '',
        payment_paymongo_test_sk: settings?.payment_paymongo_test_sk || settings?.payment_gcash_test_sk || '',
        payment_paymongo_test_webhook_secret: settings?.payment_paymongo_test_webhook_secret || settings?.payment_gcash_test_webhook_secret || '',
        payment_paymongo_live_pk: settings?.payment_paymongo_live_pk || settings?.payment_gcash_live_pk || '',
        payment_paymongo_live_sk: settings?.payment_paymongo_live_sk || settings?.payment_gcash_live_sk || '',
        payment_paymongo_live_webhook_secret: settings?.payment_paymongo_live_webhook_secret || settings?.payment_gcash_live_webhook_secret || '',

        // Payment Methods (Separate controls)
        payment_gcash_enabled: settings?.payment_gcash_enabled === '1' || settings?.payment_gcash_enabled === true ? '1' : '0',
        payment_card_enabled: settings?.payment_card_enabled === '1' || settings?.payment_card_enabled === true ? '1' : '0',

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
                    text: 'PayMongo credentials, payment methods, and processing rules have been saved successfully.',
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

    const handleTestConnection = async () => {
        setTestingGateway(true);

        try {
            const res = await window.axios.post(route('admin.payment_settings.test_connection'), {
                gateway: 'paymongo'
            });

            Swal.fire({
                icon: res.data.success ? 'success' : 'warning',
                title: res.data.success ? 'PayMongo API Verified!' : 'Connection Warning',
                text: res.data.message || (res.data.success ? 'Successfully communicated with PayMongo API.' : 'Please verify your keys.'),
                confirmButtonColor: res.data.success ? '#16a34a' : '#d97706',
                background: isDark ? '#18181b' : '#ffffff',
                color: isDark ? '#f4f4f5' : '#18181b',
            });
        } catch (err) {
            const msg = err.response?.data?.message || err.message || 'Network error while contacting PayMongo API.';
            Swal.fire({
                icon: 'error',
                title: 'Connection Failed',
                text: msg,
                confirmButtonColor: '#e11d48',
                background: isDark ? '#18181b' : '#ffffff',
                color: isDark ? '#f4f4f5' : '#18181b',
            });
        } finally {
            setTestingGateway(false);
        }
    };

    const paymongoWebhookUrl = typeof window !== 'undefined' 
        ? `${window.location.origin}/api/webhooks/paymongo` 
        : '/api/webhooks/paymongo';

    const isPayMongoConfigured = form.data.payment_paymongo_mode === 'live'
        ? Boolean(form.data.payment_paymongo_live_sk)
        : Boolean(form.data.payment_paymongo_test_sk);

    const isGcashActive = form.data.payment_gcash_enabled === '1';
    const isCardActive = form.data.payment_card_enabled === '1';

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
                                Configure PayMongo backend gateway, manage API credentials, and toggle GCash and Card payment options.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                        PayMongo Gateway Active
                    </span>
                </div>
            </div>

            {/* THREE TOP STATUS CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* PayMongo Gateway Status Card */}
                <div 
                    onClick={() => setSubTab('paymongo')}
                    className={`p-4 rounded-xl border transition-all cursor-pointer bg-white dark:bg-zinc-900 ${
                        subTab === 'paymongo'
                            ? 'border-emerald-500 ring-2 ring-emerald-500/10 shadow-md'
                            : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                    }`}
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-black">
                                <Key className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-extrabold text-xs text-zinc-900 dark:text-white">PayMongo Core</h3>
                                <span className="text-[10px] text-zinc-400">Backend Payment Gateway</span>
                            </div>
                        </div>

                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            isPayMongoConfigured 
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                                : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                        }`}>
                            {isPayMongoConfigured ? 'Connected' : 'Missing Keys'}
                        </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
                        <span className="text-zinc-500">Environment:</span>
                        <span className={`font-mono font-bold uppercase text-[10px] px-1.5 py-0.5 rounded ${
                            form.data.payment_paymongo_mode === 'live' 
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 font-extrabold'
                                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 font-extrabold'
                        }`}>
                            {form.data.payment_paymongo_mode} Mode
                        </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] mt-1.5">
                        <span className="text-zinc-500">API Credentials:</span>
                        <span className={isPayMongoConfigured ? 'text-emerald-600 font-bold' : 'text-zinc-400 font-medium'}>
                            {isPayMongoConfigured ? '✓ Configured' : '○ Needs Setup'}
                        </span>
                    </div>
                </div>

                {/* GCash Payment Option Card */}
                <div 
                    onClick={() => setSubTab('methods')}
                    className={`p-4 rounded-xl border transition-all cursor-pointer bg-white dark:bg-zinc-900 ${
                        subTab === 'methods'
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
                                <h3 className="font-extrabold text-xs text-zinc-900 dark:text-white">GCash</h3>
                                <span className="text-[10px] text-zinc-400">e-Wallet Checkout</span>
                            </div>
                        </div>

                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            isGcashActive 
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 border border-zinc-200 dark:border-zinc-700'
                        }`}>
                            {isGcashActive ? 'Enabled' : 'Disabled'}
                        </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
                        <span className="text-zinc-500">Customer Checkout:</span>
                        <span className={isGcashActive ? 'text-emerald-600 font-bold' : 'text-zinc-400'}>
                            {isGcashActive ? 'Visible to Clients' : 'Hidden'}
                        </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] mt-1.5">
                        <span className="text-zinc-500">Processor:</span>
                        <span className="text-zinc-700 dark:text-zinc-300 font-bold">
                            PayMongo API
                        </span>
                    </div>
                </div>

                {/* Credit / Debit Card Option Card */}
                <div 
                    onClick={() => setSubTab('methods')}
                    className={`p-4 rounded-xl border transition-all cursor-pointer bg-white dark:bg-zinc-900 ${
                        subTab === 'methods'
                            ? 'border-indigo-500 ring-2 ring-indigo-500/10 shadow-md'
                            : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                    }`}
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-black">
                                <CreditCard className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-extrabold text-xs text-zinc-900 dark:text-white">Credit / Debit Card</h3>
                                <span className="text-[10px] text-zinc-400">Visa / Mastercard</span>
                            </div>
                        </div>

                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            isCardActive 
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 border border-zinc-200 dark:border-zinc-700'
                        }`}>
                            {isCardActive ? 'Enabled' : 'Disabled'}
                        </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
                        <span className="text-zinc-500">Customer Checkout:</span>
                        <span className={isCardActive ? 'text-emerald-600 font-bold' : 'text-zinc-400'}>
                            {isCardActive ? 'Visible to Clients' : 'Hidden'}
                        </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] mt-1.5">
                        <span className="text-zinc-500">Processor:</span>
                        <span className="text-zinc-700 dark:text-zinc-300 font-bold">
                            PayMongo API
                        </span>
                    </div>
                </div>
            </div>

            {/* HORIZONTAL SUB-NAV TABS */}
            <div className="flex items-center gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-800/60 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <button
                    type="button"
                    onClick={() => setSubTab('paymongo')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                        subTab === 'paymongo'
                            ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm font-extrabold'
                            : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                >
                    <Key className="w-4 h-4 text-emerald-500" />
                    <span>PayMongo Credentials</span>
                    {isPayMongoConfigured && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                </button>

                <button
                    type="button"
                    onClick={() => setSubTab('methods')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                        subTab === 'methods'
                            ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm font-extrabold'
                            : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                >
                    <Layers className="w-4 h-4 text-sky-500" />
                    <span>Payment Methods</span>
                    {(isGcashActive || isCardActive) && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
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
                    <span>Webhooks & Sync</span>
                </button>
            </div>

            {/* TAB CONTENT */}
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* 1. PAYMONGO API CREDENTIALS TAB */}
                {subTab === 'paymongo' && (
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
                        {/* Control Bar */}
                        <div className="p-6 border-b border-zinc-150 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
                                    <Key className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-wider">
                                            PayMongo API Credentials
                                        </h3>
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                                            Primary Gateway
                                        </span>
                                    </div>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                                        PayMongo powers both GCash and Credit/Debit Card payments with secure hosted checkout.
                                    </p>
                                </div>
                            </div>

                            {/* Mode Switcher & Test Connection */}
                            <div className="flex flex-wrap items-center gap-3">
                                {/* Environment Switcher */}
                                <div className="flex p-0.5 bg-zinc-200/80 dark:bg-zinc-800 rounded-xl border border-zinc-300 dark:border-zinc-700">
                                    <button
                                        type="button"
                                        onClick={() => form.setData('payment_paymongo_mode', 'test')}
                                        className={`px-3 py-1 rounded-lg text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                                            form.data.payment_paymongo_mode === 'test'
                                                ? 'bg-white dark:bg-zinc-900 text-amber-600 dark:text-amber-400 shadow-sm'
                                                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                                        }`}
                                    >
                                        Test Mode
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => form.setData('payment_paymongo_mode', 'live')}
                                        className={`px-3 py-1 rounded-lg text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                                            form.data.payment_paymongo_mode === 'live'
                                                ? 'bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                                                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                                        }`}
                                    >
                                        Live Mode
                                    </button>
                                </div>

                                {/* Test Connection Button */}
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleTestConnection}
                                    disabled={testingGateway}
                                    className="text-xs h-9 font-bold gap-1.5 cursor-pointer bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700"
                                >
                                    <RefreshCw className={`w-3.5 h-3.5 text-emerald-500 ${testingGateway ? 'animate-spin' : ''}`} />
                                    {testingGateway ? 'Testing...' : 'Test Connection'}
                                </Button>
                            </div>
                        </div>

                        {/* Environment Notice */}
                        <div className="p-6 space-y-6">
                            <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                                form.data.payment_paymongo_mode === 'live'
                                    ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-300'
                                    : 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-300'
                            }`}>
                                <Info className="w-5 h-5 shrink-0 mt-0.5" />
                                <div className="text-xs space-y-0.5">
                                    <p className="font-extrabold">
                                        Active Environment: PayMongo {form.data.payment_paymongo_mode.toUpperCase()}
                                    </p>
                                    <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                        {form.data.payment_paymongo_mode === 'live'
                                            ? 'Production keys are active. Real GCash wallets and bank cards will be debited and settled directly to your PayMongo account.'
                                            : 'Sandbox test mode is active. You can safely simulate customer payments using test card numbers and test GCash phone numbers without charging real money.'}
                                    </p>
                                </div>
                            </div>

                            {/* Dual Credential Cards */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Test Keys Box */}
                                <div className={`p-5 rounded-xl border space-y-4 ${
                                    form.data.payment_paymongo_mode === 'test'
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
                                        {form.data.payment_paymongo_mode === 'test' && (
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
                                                value={form.data.payment_paymongo_test_pk}
                                                onChange={e => form.setData('payment_paymongo_test_pk', e.target.value)}
                                                className="font-mono text-xs h-9 bg-white dark:bg-zinc-950"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                                                Test Secret Key (sk_test_...)
                                            </label>
                                            <div className="relative">
                                                <Input
                                                    type={showKeys['paymongo_test_sk'] ? 'text' : 'password'}
                                                    placeholder="sk_test_..."
                                                    value={form.data.payment_paymongo_test_sk}
                                                    onChange={e => form.setData('payment_paymongo_test_sk', e.target.value)}
                                                    className="font-mono text-xs h-9 pr-9 bg-white dark:bg-zinc-950"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => toggleShowKey('paymongo_test_sk')}
                                                    className="absolute right-2.5 top-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                                                >
                                                    {showKeys['paymongo_test_sk'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                                                Test Webhook Signing Secret (whsec_...)
                                            </label>
                                            <div className="relative">
                                                <Input
                                                    type={showKeys['paymongo_test_whsec'] ? 'text' : 'password'}
                                                    placeholder="whsec_..."
                                                    value={form.data.payment_paymongo_test_webhook_secret}
                                                    onChange={e => form.setData('payment_paymongo_test_webhook_secret', e.target.value)}
                                                    className="font-mono text-xs h-9 pr-9 bg-white dark:bg-zinc-950"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => toggleShowKey('paymongo_test_whsec')}
                                                    className="absolute right-2.5 top-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                                                >
                                                    {showKeys['paymongo_test_whsec'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Live Keys Box */}
                                <div className={`p-5 rounded-xl border space-y-4 ${
                                    form.data.payment_paymongo_mode === 'live'
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
                                        {form.data.payment_paymongo_mode === 'live' && (
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
                                                value={form.data.payment_paymongo_live_pk}
                                                onChange={e => form.setData('payment_paymongo_live_pk', e.target.value)}
                                                className="font-mono text-xs h-9 bg-white dark:bg-zinc-950"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                                                Live Secret Key (sk_live_...)
                                            </label>
                                            <div className="relative">
                                                <Input
                                                    type={showKeys['paymongo_live_sk'] ? 'text' : 'password'}
                                                    placeholder="sk_live_..."
                                                    value={form.data.payment_paymongo_live_sk}
                                                    onChange={e => form.setData('payment_paymongo_live_sk', e.target.value)}
                                                    className="font-mono text-xs h-9 pr-9 bg-white dark:bg-zinc-950"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => toggleShowKey('paymongo_live_sk')}
                                                    className="absolute right-2.5 top-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                                                >
                                                    {showKeys['paymongo_live_sk'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                                                Live Webhook Signing Secret (whsec_...)
                                            </label>
                                            <div className="relative">
                                                <Input
                                                    type={showKeys['paymongo_live_whsec'] ? 'text' : 'password'}
                                                    placeholder="whsec_..."
                                                    value={form.data.payment_paymongo_live_webhook_secret}
                                                    onChange={e => form.setData('payment_paymongo_live_webhook_secret', e.target.value)}
                                                    className="font-mono text-xs h-9 pr-9 bg-white dark:bg-zinc-950"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => toggleShowKey('paymongo_live_whsec')}
                                                    className="absolute right-2.5 top-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                                                >
                                                    {showKeys['paymongo_live_whsec'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. PAYMENT METHODS (SEPARATE TOGGLES) */}
                {subTab === 'methods' && (
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm p-6 space-y-6">
                        <div className="flex items-center gap-3 pb-4 border-b border-zinc-150 dark:border-zinc-800">
                            <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center">
                                <Layers className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-wider">
                                    Customer Payment Methods
                                </h3>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                    Enable or disable individual payment channels. Customers will only see the payment methods you turn on here.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* GCash Control Box */}
                            <div className={`p-5 rounded-2xl border transition-all ${
                                form.data.payment_gcash_enabled === '1'
                                    ? 'bg-sky-50/30 dark:bg-sky-950/10 border-sky-500/40 ring-1 ring-sky-500/20'
                                    : 'bg-zinc-50/50 dark:bg-zinc-950/30 border-zinc-200 dark:border-zinc-800'
                            }`}>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center">
                                            <Smartphone className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-extrabold text-sm text-zinc-900 dark:text-white">GCash</h4>
                                            <span className="text-[10px] text-zinc-500">e-Wallet Checkout</span>
                                        </div>
                                    </div>

                                    {/* Enable/Disable Switch */}
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                                            {form.data.payment_gcash_enabled === '1' ? 'Enabled' : 'Disabled'}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => form.setData('payment_gcash_enabled', form.data.payment_gcash_enabled === '1' ? '0' : '1')}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                                                form.data.payment_gcash_enabled === '1' ? 'bg-[#FF3B30]' : 'bg-zinc-300 dark:bg-zinc-700'
                                            }`}
                                        >
                                            <span
                                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                                    form.data.payment_gcash_enabled === '1' ? 'translate-x-6' : 'translate-x-1'
                                                }`}
                                            />
                                        </button>
                                    </div>
                                </div>

                                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                    Allows customers to pay directly with their GCash mobile wallet via SMS OTP. Backend routing uses PayMongo's secure GCash integration.
                                </p>

                                <div className="mt-4 pt-3 border-t border-zinc-200/60 dark:border-zinc-800 flex items-center justify-between text-[11px]">
                                    <span className="text-zinc-500">Checkout Display:</span>
                                    <span className={`font-bold ${form.data.payment_gcash_enabled === '1' ? 'text-emerald-600' : 'text-zinc-400'}`}>
                                        {form.data.payment_gcash_enabled === '1' ? '● Shown to customer' : '○ Hidden from customer'}
                                    </span>
                                </div>
                            </div>

                            {/* Credit/Debit Card Control Box */}
                            <div className={`p-5 rounded-2xl border transition-all ${
                                form.data.payment_card_enabled === '1'
                                    ? 'bg-indigo-50/30 dark:bg-indigo-950/10 border-indigo-500/40 ring-1 ring-indigo-500/20'
                                    : 'bg-zinc-50/50 dark:bg-zinc-950/30 border-zinc-200 dark:border-zinc-800'
                            }`}>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                                            <CreditCard className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-extrabold text-sm text-zinc-900 dark:text-white">Credit / Debit Card</h4>
                                            <span className="text-[10px] text-zinc-500">Visa / Mastercard</span>
                                        </div>
                                    </div>

                                    {/* Enable/Disable Switch */}
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                                            {form.data.payment_card_enabled === '1' ? 'Enabled' : 'Disabled'}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => form.setData('payment_card_enabled', form.data.payment_card_enabled === '1' ? '0' : '1')}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                                                form.data.payment_card_enabled === '1' ? 'bg-[#FF3B30]' : 'bg-zinc-300 dark:bg-zinc-700'
                                            }`}
                                        >
                                            <span
                                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                                    form.data.payment_card_enabled === '1' ? 'translate-x-6' : 'translate-x-1'
                                                }`}
                                            />
                                        </button>
                                    </div>
                                </div>

                                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                    Enables customer card checkout for Visa and Mastercard credit or debit cards via PayMongo. Card credentials are processed securely on PayMongo's PCI-DSS compliant checkout.
                                </p>

                                <div className="mt-4 pt-3 border-t border-zinc-200/60 dark:border-zinc-800 flex items-center justify-between text-[11px]">
                                    <span className="text-zinc-500">Checkout Display:</span>
                                    <span className={`font-bold ${form.data.payment_card_enabled === '1' ? 'text-emerald-600' : 'text-zinc-400'}`}>
                                        {form.data.payment_card_enabled === '1' ? '● Shown to customer' : '○ Hidden from customer'}
                                    </span>
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
                                    Standard 3-letter ISO currency code. Philippine Peso (<code>PHP</code>) is standard for local GCash & Card transactions via PayMongo.
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
                                    When enabled, as soon as a customer pays via GCash or Card, their reservation status is automatically upgraded to <strong>Confirmed</strong>, and an instant SMS/email alert is dispatched.
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
                                    PayMongo Webhook Endpoint & Real-Time Sync
                                </h3>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                    Webhooks ensure transaction statuses update automatically in the background even if the customer closes their browser.
                                </p>
                            </div>
                        </div>

                        <div className="max-w-2xl p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/30 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Globe className="w-4 h-4 text-emerald-500" />
                                    <span className="text-xs font-black uppercase text-zinc-900 dark:text-white">
                                        PayMongo Webhook URL (GCash & Card)
                                    </span>
                                </div>
                                <a
                                    href="https://dashboard.paymongo.com/developers"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[11px] text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 font-bold inline-flex items-center gap-1"
                                >
                                    PayMongo Dashboard <ExternalLink className="w-3 h-3" />
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

                            <div className="text-[11px] text-zinc-500 space-y-2">
                                <span className="font-semibold text-zinc-700 dark:text-zinc-300">Events to subscribe in your PayMongo Dashboard:</span>
                                <div className="flex flex-wrap gap-1.5 font-mono text-[10px]">
                                    <span className="px-2 py-0.5 rounded bg-zinc-200/80 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">checkout_session.payment.paid</span>
                                    <span className="px-2 py-0.5 rounded bg-zinc-200/80 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">payment.paid</span>
                                    <span className="px-2 py-0.5 rounded bg-zinc-200/80 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">link.payment.paid</span>
                                </div>
                                <p className="text-[10px] text-zinc-400 pt-1">
                                    Copy the Webhook Signing Secret from PayMongo into the <strong>PayMongo Credentials</strong> tab above to enable cryptographic signature verification.
                                </p>
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
