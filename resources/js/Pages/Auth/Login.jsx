import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import ApplicationLogo from '@/Components/ApplicationLogo';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { Sun, Moon, Car, AlertCircle, Lock, UserX, Mail, Eye, EyeOff, Loader2, ShieldAlert, Clock, PhoneCall } from 'lucide-react';

const CAROUSEL_IMAGES = [
    {
        url: "https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&q=80&w=1200",
        title: "Experience the Prestige of Absolute Control",
        subtitle: "Reserve the finest sports, family, business and utility vehicles from ELFAA Car Rental."
    },
    {
        url: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=1200",
        title: "Unmatched Comfort & Premium Fleet",
        subtitle: "Handpicked premium vehicles maintained to manufacturer perfection."
    },
    {
        url: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=1200",
        title: "Swift Dispatch & 24/7 Client Support",
        subtitle: "Drive with complete peace of mind anywhere in the city and beyond."
    }
];

export default function Login({ status, canResetPassword }) {
    const { settings } = usePage().props;
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const [showPassword, setShowPassword] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [countdown, setCountdown] = useState(0);
    const [showBruteForceModal, setShowBruteForceModal] = useState(false);

    // Format seconds into MM:SS
    const formatTimeRemaining = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const rawEmailError = errors.email || '';
    const isThrottled = rawEmailError.includes('|seconds:');
    const isLocked = !isThrottled && (
        rawEmailError.toLowerCase().includes('account has been locked') ||
        rawEmailError.toLowerCase().includes('account is locked')
    );
    const isDeactivated = rawEmailError === 'Your account has been deactivated. Please contact support.';
    const displayEmailError = isThrottled ? rawEmailError.split('|seconds:')[0].trim() : rawEmailError;

    // Start countdown and trigger modal when throttle error is received
    useEffect(() => {
        if (isThrottled) {
            const secs = parseInt(rawEmailError.split('|seconds:')[1] || '900', 10);
            setCountdown(secs);
            setShowBruteForceModal(true);
        }
    }, [rawEmailError]);

    // Tick the countdown down each second
    useEffect(() => {
        if (countdown <= 0) return;
        const timer = setTimeout(() => setCountdown(c => Math.max(0, c - 1)), 1000);
        return () => clearTimeout(timer);
    }, [countdown]);

    // Carousel auto-rotate
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentImageIndex((prevIndex) => (prevIndex + 1) % CAROUSEL_IMAGES.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const submit = (e) => {
        e.preventDefault();
        if (countdown > 0) return; // Prevent submit during active lockout
        post(route('login'), {
            onFinish: () => reset('password'),
            replace: true,
        });
    };

    return (
        <div className={`min-h-screen flex font-sans transition-colors duration-500 selection:bg-[#FF3B30] selection:text-white ${isDarkMode ? 'bg-zinc-950 text-zinc-100' : 'bg-slate-100 text-slate-900'}`}>
            <Head title="Log in - ELFAA Car Rental" />

            {/* Ambient background glow accents */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#FF3B30]/15 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-red-600/10 rounded-full blur-3xl" />
            </div>

            {/* Left Form Section */}
            <div className={`flex-1 flex flex-col justify-between py-10 px-6 sm:px-12 lg:px-16 xl:px-20 z-10 w-full lg:w-1/2 transition-colors duration-300 ${isDarkMode ? 'bg-zinc-950/80 backdrop-blur-xl' : 'bg-white/90 backdrop-blur-xl shadow-2xl'}`}>
                
                {/* Header bar with Brand & Theme Toggle */}
                <div className="flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3 group">
                        {settings?.site_logo_image ? (
                            <img src={settings.site_logo_image} className="h-9 max-w-[150px] object-contain rounded" alt={settings?.site_logo || 'Logo'} />
                        ) : (
                            <ApplicationLogo className="w-9 h-9 fill-[#FF3B30] text-[#FF3B30] shrink-0 group-hover:scale-105 transition-transform" />
                        )}
                        <div>
                            <span className={`text-xl font-black tracking-wider uppercase leading-none block ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                                {settings?.site_logo || 'ELFAA CARS'}
                            </span>
                            <span className={`text-[9px] font-extrabold uppercase tracking-widest block mt-0.5 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                                Premium Self-Drive Fleet
                            </span>
                        </div>
                    </Link>

                    <button
                        type="button"
                        onClick={() => setIsDarkMode(!isDarkMode)}
                        className={`px-3 py-1.5 rounded-full border transition-all text-xs font-bold flex items-center gap-2 cursor-pointer ${
                            isDarkMode
                                ? 'bg-zinc-900/90 border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 shadow-sm'
                                : 'bg-slate-100 border-slate-300 text-slate-700 hover:text-slate-900 hover:bg-slate-200'
                        }`}
                    >
                        {isDarkMode ? (
                            <>
                                <Sun className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                                <span>Light</span>
                            </>
                        ) : (
                            <>
                                <Moon className="w-3.5 h-3.5 text-indigo-600" />
                                <span>Dark</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Form Body Container */}
                <div className="mx-auto w-full max-w-sm lg:w-[380px] my-auto py-6">
                    
                    {/* Brand Vehicle Icon Accent */}
                    <div className="mb-6 flex items-center justify-center">
                        <div className="relative p-3.5 rounded-2xl bg-[#FF3B30]/10 border border-[#FF3B30]/20 shadow-inner group flex items-center justify-center">
                            <Car className="w-8 h-8 text-[#FF3B30] transition-transform duration-500 group-hover:scale-110 stroke-[1.75]" />
                        </div>
                    </div>

                    {/* Headline & Cleaned Subtitle */}
                    <div className="text-center mb-8">
                        <h2 className={`text-2xl sm:text-3xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                            Welcome Back
                        </h2>
                        <p className={`mt-2 text-xs sm:text-sm font-medium ${isDarkMode ? 'text-zinc-400' : 'text-slate-500'}`}>
                            Access your ELFAA rental portal and vehicle reservations.
                        </p>
                    </div>

                    {status && (
                        <div className="mb-6 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-bold text-emerald-400 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
                            <span>{status}</span>
                        </div>
                    )}

                    {/* Brute-Force Protection Security Pop-Up Modal */}
                    {showBruteForceModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
                            <div className="bg-white dark:bg-zinc-900 border-2 border-red-500/60 rounded-2xl max-w-md w-full p-6 text-zinc-900 dark:text-white shadow-2xl relative space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-[#FF3B30] shrink-0">
                                        <ShieldAlert className="w-6 h-6 animate-pulse" />
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-500/15 text-[#FF3B30] border border-red-500/30">
                                            Brute-Force Protection
                                        </span>
                                        <h3 className="text-base font-black uppercase tracking-wide text-zinc-900 dark:text-white mt-1">
                                            Account Temporarily Locked
                                        </h3>
                                    </div>
                                </div>

                                <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                                    You have exceeded <strong>3 failed login attempts</strong>. To protect your account against unauthorized brute-force attacks, signing in has been temporarily suspended for <strong>15 minutes</strong>.
                                </p>

                                {/* Countdown visualizer inside modal */}
                                <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 dark:text-zinc-400">
                                        <Clock className="w-4 h-4 text-[#FF3B30]" />
                                        <span>Auto-Unlock In:</span>
                                    </div>
                                    <div className="text-xl font-black font-mono text-[#FF3B30] tabular-nums">
                                        {formatTimeRemaining(countdown)}
                                    </div>
                                </div>

                                {/* Call Support to unlock immediately */}
                                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 space-y-1.5 text-left">
                                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                                        <PhoneCall className="w-4 h-4 text-amber-500 shrink-0" />
                                        <span>Need Urgent Access? Call Support to Unlock</span>
                                    </div>
                                    <p className="text-[11px] font-medium leading-relaxed text-zinc-700 dark:text-zinc-300">
                                        If you locked yourself out, you can call our support desk at{' '}
                                        <a href={`tel:${settings?.contact_phone || '0917-888-9999'}`} className="font-bold underline text-[#FF3B30] hover:text-red-600">
                                            {settings?.contact_phone || '0917-888-9999'}
                                        </a>{' '}
                                        or email{' '}
                                        <a href={`mailto:${settings?.contact_email || 'support@elfaacarrental.com'}`} className="font-bold underline text-[#FF3B30] hover:text-red-600">
                                            {settings?.contact_email || 'support@elfaacarrental.com'}
                                        </a>
                                        . An administrator can verify your identity and unlock your account immediately so you can sign in right away.
                                    </p>
                                </div>

                                <div className="flex justify-end pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowBruteForceModal(false)}
                                        className="w-full py-2.5 px-4 bg-[#FF3B30] hover:bg-red-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-red-500/20 cursor-pointer"
                                    >
                                        I Understand
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Rate-limit lockout banner with live countdown */}
                    {isThrottled && (
                        <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs font-bold text-[#FF3B30]">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    <span>3 failed attempts reached. Account locked.</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowBruteForceModal(true)}
                                    className="text-[10px] underline font-bold uppercase hover:text-red-700 dark:hover:text-red-300 cursor-pointer"
                                >
                                    Details
                                </button>
                            </div>
                            {countdown > 0 && (
                                <div className="space-y-1.5 mt-2">
                                    <div className="flex items-center justify-between text-[11px] font-mono">
                                        <span className="text-zinc-500 dark:text-zinc-400 font-bold">Lockout remaining:</span>
                                        <span className="font-black text-[#FF3B30]">{formatTimeRemaining(countdown)}</span>
                                    </div>
                                    <div className="h-1.5 bg-rose-500/20 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-[#FF3B30] rounded-full transition-all duration-1000"
                                            style={{ width: `${Math.min(100, (countdown / 900) * 100)}%` }}
                                        />
                                    </div>
                                    <div className="pt-1 text-[11px] font-normal text-zinc-600 dark:text-zinc-300 flex items-center gap-1.5">
                                        <PhoneCall className="w-3.5 h-3.5 text-[#FF3B30] shrink-0" />
                                        <span>Customer helpline: Call <a href={`tel:${settings?.contact_phone || '0917-888-9999'}`} className="font-bold underline text-[#FF3B30]">{settings?.contact_phone || '0917-888-9999'}</a> to unlock.</span>
                                    </div>
                                </div>
                            )}
                            {countdown === 0 && (
                                <span className="text-emerald-500 text-[11px] font-black">✓ Lockout ended. You may try logging in again.</span>
                            )}
                        </div>
                    )}

                    {/* Admin-locked or brute-force locked account banner */}
                    {isLocked && (
                        <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs font-bold text-amber-600 dark:text-amber-400 space-y-2">
                            <div className="flex items-start gap-2">
                                <Lock className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                                <div>
                                    <p>Your account is currently <strong>locked</strong>.</p>
                                    <p className="mt-1 font-medium text-[11px] text-zinc-700 dark:text-zinc-300 leading-relaxed">
                                        If you locked your account due to failed login attempts, you can call our support helpline at{' '}
                                        <a href={`tel:${settings?.contact_phone || '0917-888-9999'}`} className="font-bold underline text-[#FF3B30]">
                                            {settings?.contact_phone || '0917-888-9999'}
                                        </a>{' '}
                                        or email{' '}
                                        <a href={`mailto:${settings?.contact_email || 'support@elfaacarrental.com'}`} className="font-bold underline text-[#FF3B30]">
                                            {settings?.contact_email || 'support@elfaacarrental.com'}
                                        </a>
                                        . An administrator can unlock your account immediately upon your call.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Deactivated account banner */}
                    {isDeactivated && (
                        <div className="mb-6 p-3.5 rounded-xl bg-zinc-500/10 border border-zinc-500/30 text-xs font-bold text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                            <UserX className="w-4 h-4 shrink-0" />
                            <span>Your account has been <strong>deactivated</strong>. Please contact support.</span>
                        </div>
                    )}

                    <form onSubmit={submit} className="space-y-5">
                        {/* Email Input */}
                        <div>
                            <InputLabel htmlFor="email" value="Email Address" className={isDarkMode ? "text-zinc-300 font-bold text-xs uppercase tracking-wider mb-1.5" : "text-slate-700 font-bold text-xs uppercase tracking-wider mb-1.5"} />

                            <div className="relative rounded-xl shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                                    <Mail className="w-4 h-4" />
                                </div>
                                <TextInput
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={data.email}
                                    placeholder="yourname@example.com"
                                    className={`w-full rounded-xl pl-10 pr-4 py-2.5 h-11 text-sm transition-all duration-200 border ${
                                        isDarkMode
                                            ? 'bg-zinc-900/90 border-zinc-800 text-white placeholder-zinc-500 focus:border-[#FF3B30] focus:ring-1 focus:ring-[#FF3B30]'
                                            : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-[#FF3B30] focus:ring-1 focus:ring-[#FF3B30]'
                                    }`}
                                    autoComplete="username"
                                    isFocused={true}
                                    onChange={(e) => setData('email', e.target.value)}
                                    required
                                />
                            </div>

                            <InputError message={(!isLocked && !isDeactivated && !isThrottled) ? displayEmailError : ''} className="mt-1.5 text-xs font-semibold text-[#FF3B30]" />
                        </div>

                        {/* Password Input */}
                        <div>
                            <InputLabel htmlFor="password" value="Password" className={isDarkMode ? "text-zinc-300 font-bold text-xs uppercase tracking-wider mb-1.5" : "text-slate-700 font-bold text-xs uppercase tracking-wider mb-1.5"} />

                            <div className="relative rounded-xl shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                                    <Lock className="w-4 h-4" />
                                </div>
                                <TextInput
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={data.password}
                                    placeholder="••••••••••••"
                                    className={`w-full rounded-xl pl-10 pr-10 py-2.5 h-11 text-sm transition-all duration-200 border ${
                                        isDarkMode
                                            ? 'bg-zinc-900/90 border-zinc-800 text-white placeholder-zinc-500 focus:border-[#FF3B30] focus:ring-1 focus:ring-[#FF3B30]'
                                            : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-[#FF3B30] focus:ring-1 focus:ring-[#FF3B30]'
                                    }`}
                                    autoComplete="current-password"
                                    onChange={(e) => setData('password', e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className={`absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs font-semibold transition-colors cursor-pointer ${
                                        isDarkMode ? 'text-zinc-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'
                                    }`}
                                    title={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-4 h-4" />
                                    ) : (
                                        <Eye className="w-4 h-4" />
                                    )}
                                </button>
                            </div>

                            <InputError message={errors.password} className="mt-1.5 text-xs font-semibold text-[#FF3B30]" />
                        </div>

                        {/* Remember & Forgot Password */}
                        <div className="flex items-center justify-between pt-1">
                            <label className="flex items-center cursor-pointer">
                                <Checkbox
                                    name="remember"
                                    checked={data.remember}
                                    onChange={(e) => setData('remember', e.target.checked)}
                                    className={`rounded border-zinc-700 text-[#FF3B30] focus:ring-[#FF3B30] ${
                                        isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-slate-100 border-slate-300'
                                    }`}
                                />
                                <span className={`ms-2 text-xs font-semibold ${isDarkMode ? 'text-zinc-400' : 'text-slate-600'}`}>
                                    Remember this device
                                </span>
                            </label>

                            {canResetPassword && (
                                <Link
                                    href={route('password.request')}
                                    className={`text-xs font-bold transition-colors hover:underline ${
                                        isDarkMode ? 'text-zinc-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                >
                                    Forgot Password?
                                </Link>
                            )}
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={processing || countdown > 0}
                                className="w-full flex items-center justify-center h-12 px-6 border border-transparent rounded-xl shadow-lg shadow-[#FF3B30]/25 text-xs font-black uppercase tracking-wider text-white bg-gradient-to-r from-[#FF3B30] to-red-600 hover:from-red-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF3B30] focus:ring-offset-zinc-950 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-[0.98]"
                            >
                                {processing ? (
                                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                                ) : countdown > 0 ? (
                                    <span>Locked out — retry in {countdown}s</span>
                                ) : (
                                    <span>Sign In to Dashboard →</span>
                                )}
                            </button>
                        </div>
                    </form>

                    {/* Registration Link Footer */}
                    <div className="mt-8 text-center pt-4 border-t border-zinc-200/50 dark:border-zinc-800/60">
                        <span className={`text-xs font-medium ${isDarkMode ? 'text-zinc-500' : 'text-slate-500'}`}>Don't have an account yet? </span>
                        <Link
                            href={route('register')}
                            className="text-xs font-extrabold text-[#FF3B30] hover:text-red-500 transition-colors ml-1 underline underline-offset-4"
                        >
                            Register here
                        </Link>
                    </div>
                </div>

                {/* Footer copyright */}
                <div className="text-center text-[10px] text-zinc-500 font-semibold tracking-wider">
                    © {new Date().getFullYear()} ELFAA CAR RENTAL. All rights reserved.
                </div>
            </div>

            {/* Right Column: Premium Visual Image Carousel */}
            <div className="hidden lg:block relative w-0 flex-1 h-screen overflow-hidden">
                {CAROUSEL_IMAGES.map((img, idx) => (
                    <div
                        key={idx}
                        className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                            idx === currentImageIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
                        }`}
                    >
                        <img
                            className="absolute inset-0 h-full w-full object-cover scale-105 animate-pulse-subtle"
                            src={img.url}
                            alt="ELFAA Luxury Car Rental"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
                        
                        <div className="absolute bottom-16 left-16 right-16 text-left z-20">
                            <span className="text-[10px] font-black tracking-widest text-white uppercase bg-[#FF3B30] px-3.5 py-1.5 rounded-full shadow-lg inline-block mb-4">
                                ELFAA FLEET SELECTION
                            </span>
                            <h3 className="text-4xl font-black text-white leading-tight drop-shadow-xl tracking-tight">
                                {img.title}
                            </h3>
                            <p className="mt-3 text-sm font-medium text-zinc-300 max-w-md drop-shadow">
                                {img.subtitle}
                            </p>

                            {/* Carousel Indicators */}
                            <div className="flex gap-2.5 mt-6">
                                {CAROUSEL_IMAGES.map((_, dotIdx) => (
                                    <button
                                        key={dotIdx}
                                        type="button"
                                        onClick={() => setCurrentImageIndex(dotIdx)}
                                        className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                                            dotIdx === currentImageIndex ? 'w-10 bg-[#FF3B30] shadow-md shadow-[#FF3B30]/50' : 'w-2 bg-white/40 hover:bg-white/70'
                                        }`}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

