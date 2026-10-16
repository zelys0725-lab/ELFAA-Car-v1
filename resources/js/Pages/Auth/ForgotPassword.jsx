import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import ApplicationLogo from '@/Components/ApplicationLogo';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { Sun, Moon, Car, Mail, Loader2, ArrowLeft } from 'lucide-react';

const CAROUSEL_IMAGES = [
    {
        url: "https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&q=80&w=1200",
        title: "Secure & Instant Account Recovery",
        subtitle: "We prioritize your account security. Recover your password in seconds with our automated verification."
    },
    {
        url: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=1200",
        title: "Unmatched Comfort & Premium Fleet",
        subtitle: "Handpicked luxury vehicles maintained to manufacturer perfection."
    },
    {
        url: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=1200",
        title: "Swift Dispatch & 24/7 Client Support",
        subtitle: "Drive with complete peace of mind anywhere in the city and beyond."
    }
];

export default function ForgotPassword({ status }) {
    const { settings } = usePage().props;
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isDarkMode, setIsDarkMode] = useState(true);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentImageIndex((prevIndex) => (prevIndex + 1) % CAROUSEL_IMAGES.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const submit = (e) => {
        e.preventDefault();
        post(route('password.email'));
    };

    return (
        <div className={`min-h-screen flex font-sans transition-colors duration-500 selection:bg-[#FF3B30] selection:text-white ${isDarkMode ? 'bg-zinc-950 text-zinc-100' : 'bg-slate-100 text-slate-900'}`}>
            <Head title="Forgot Password - ELFAA Car Rental" />

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

                    {/* Headline & Subtitle */}
                    <div className="text-center mb-6">
                        <h2 className={`text-2xl sm:text-3xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                            Reset Password
                        </h2>
                        <p className={`mt-2 text-xs sm:text-sm font-medium leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-slate-500'}`}>
                            Enter your registered email address and we'll dispatch a secure reset link to your inbox.
                        </p>
                    </div>

                    {status && (
                        <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-bold text-emerald-400 flex items-start gap-2.5 shadow-sm animate-in fade-in zoom-in-95">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0 mt-0.5" />
                            <span className="leading-relaxed">{status}</span>
                        </div>
                    )}

                    <form onSubmit={submit} className="space-y-5">
                        {/* Email Input */}
                        <div>
                            <InputLabel htmlFor="email" value="Registered Email Address" className={isDarkMode ? "text-zinc-300 font-bold text-xs uppercase tracking-wider mb-1.5" : "text-slate-700 font-bold text-xs uppercase tracking-wider mb-1.5"} />

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

                            <InputError message={errors.email} className="mt-1.5 text-xs font-semibold text-[#FF3B30]" />
                        </div>

                        {/* Submit Button */}
                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full flex items-center justify-center h-12 px-6 border border-transparent rounded-xl shadow-lg shadow-[#FF3B30]/25 text-xs font-black uppercase tracking-wider text-white bg-gradient-to-r from-[#FF3B30] to-red-600 hover:from-red-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF3B30] focus:ring-offset-zinc-950 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-[0.98]"
                            >
                                {processing ? (
                                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                                ) : (
                                    <span>Send Password Reset Link →</span>
                                )}
                            </button>
                        </div>
                    </form>

                    {/* Return to Login Link */}
                    <div className="mt-8 text-center pt-4 border-t border-zinc-200/50 dark:border-zinc-800/60">
                        <Link
                            href={route('login')}
                            className="text-xs font-extrabold text-zinc-400 hover:text-[#FF3B30] transition-colors inline-flex items-center gap-1.5 group"
                        >
                            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                            <span>Remembered your password? Back to Login</span>
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
                                ACCOUNT RECOVERY ENGINE
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
