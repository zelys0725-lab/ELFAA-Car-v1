import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import ApplicationLogo from '@/Components/ApplicationLogo';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';

const CAROUSEL_IMAGES = [
    {
        url: "https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&q=80&w=1200",
        title: "Secure & Instant Account Recovery",
        subtitle: "Create a new strong password to safeguard your rental account and reservations."
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

export default function ResetPassword({ token, email }) {
    const { settings } = usePage().props;
    const { data, setData, post, processing, errors, reset } = useForm({
        token: token,
        email: email,
        password: '',
        password_confirmation: '',
    });

    const [showPassword, setShowPassword] = useState(false);
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

        post(route('password.store'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <div className={`min-h-screen flex font-sans transition-colors duration-500 selection:bg-[#FF3B30] selection:text-white ${isDarkMode ? 'bg-zinc-950 text-zinc-100' : 'bg-slate-100 text-slate-900'}`}>
            <Head title="Set New Password - ELFAA Car Rental" />

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
                                <svg className="w-3.5 h-3.5 text-amber-400 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 100 2h1z" clipRule="evenodd" />
                                </svg>
                                <span>Light</span>
                            </>
                        ) : (
                            <>
                                <svg className="w-3.5 h-3.5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                                </svg>
                                <span>Dark</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Form Body Container */}
                <div className="mx-auto w-full max-w-sm lg:w-[380px] my-auto py-6">
                    
                    {/* Animated SVG Sports Car Icon Accent */}
                    <div className="mb-6 flex items-center justify-center">
                        <div className="relative p-4 rounded-2xl bg-gradient-to-b from-[#FF3B30]/10 to-transparent border border-[#FF3B30]/20 shadow-inner group">
                            <svg className="w-16 h-12 text-[#FF3B30] transition-transform duration-500 group-hover:scale-110" viewBox="0 0 100 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                                {/* Speed Lines Animation */}
                                <line x1="5" y1="42" x2="25" y2="42" stroke="#FF3B30" strokeWidth="2" strokeLinecap="round" className="animate-pulse" />
                                <line x1="2" y1="46" x2="18" y2="46" stroke="#FF3B30" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
                                
                                {/* Sleek Car Body */}
                                <path d="M20 38 L28 24 C32 17, 42 14, 55 14 L72 16 C80 18, 86 24, 90 30 L95 38 Z" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
                                <path d="M35 24 L48 18 L68 18 L76 24 Z" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="1.5" />
                                <path d="M15 38 L95 38" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />

                                {/* Glowing Headlight */}
                                <circle cx="90" cy="34" r="2.5" fill="#FF3B30" className="animate-ping" />
                                <circle cx="90" cy="34" r="2" fill="#FFFFFF" />

                                {/* Wheels */}
                                <circle cx="32" cy="38" r="7" fill={isDarkMode ? "#09090b" : "#ffffff"} stroke="currentColor" strokeWidth="2.5" />
                                <circle cx="32" cy="38" r="3" fill="currentColor" />
                                <circle cx="78" cy="38" r="7" fill={isDarkMode ? "#09090b" : "#ffffff"} stroke="currentColor" strokeWidth="2.5" />
                                <circle cx="78" cy="38" r="3" fill="currentColor" />
                            </svg>
                            
                            {/* Ambient Light Beam */}
                            <div className="absolute top-1/2 right-2 w-10 h-6 bg-gradient-to-r from-[#FF3B30]/40 to-transparent blur-sm rounded-full pointer-events-none" />
                        </div>
                    </div>

                    {/* Headline & Subtitle */}
                    <div className="text-center mb-6">
                        <h2 className={`text-2xl sm:text-3xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                            Create New Password
                        </h2>
                        <p className={`mt-2 text-xs sm:text-sm font-medium leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-slate-500'}`}>
                            Enter your email and choose a new secure password for your account.
                        </p>
                    </div>

                    <form onSubmit={submit} className="space-y-4">
                        {/* Email Input (Readonly / Pre-filled) */}
                        <div>
                            <InputLabel htmlFor="email" value="Email Address" className={isDarkMode ? "text-zinc-300 font-bold text-xs uppercase tracking-wider mb-1.5" : "text-slate-700 font-bold text-xs uppercase tracking-wider mb-1.5"} />

                            <div className="relative rounded-xl shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                    </svg>
                                </div>
                                <TextInput
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={data.email}
                                    className={`w-full rounded-xl pl-10 pr-4 py-2.5 h-11 text-sm transition-all duration-200 border ${
                                        isDarkMode
                                            ? 'bg-zinc-900/90 border-zinc-800 text-white placeholder-zinc-500 focus:border-[#FF3B30] focus:ring-1 focus:ring-[#FF3B30]'
                                            : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-[#FF3B30] focus:ring-1 focus:ring-[#FF3B30]'
                                    }`}
                                    autoComplete="username"
                                    onChange={(e) => setData('email', e.target.value)}
                                    required
                                />
                            </div>
                            <InputError message={errors.email} className="mt-1.5 text-xs font-semibold text-[#FF3B30]" />
                        </div>

                        {/* New Password Input */}
                        <div>
                            <InputLabel htmlFor="password" value="New Password" className={isDarkMode ? "text-zinc-300 font-bold text-xs uppercase tracking-wider mb-1.5" : "text-slate-700 font-bold text-xs uppercase tracking-wider mb-1.5"} />

                            <div className="relative rounded-xl shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
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
                                    autoComplete="new-password"
                                    isFocused={true}
                                    onChange={(e) => setData('password', e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className={`absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs font-semibold transition-colors cursor-pointer ${
                                        isDarkMode ? 'text-zinc-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'
                                    }`}
                                >
                                    {showPassword ? "Hide" : "Show"}
                                </button>
                            </div>
                            <InputError message={errors.password} className="mt-1.5 text-xs font-semibold text-[#FF3B30]" />
                        </div>

                        {/* Confirm Password Input */}
                        <div>
                            <InputLabel htmlFor="password_confirmation" value="Confirm New Password" className={isDarkMode ? "text-zinc-300 font-bold text-xs uppercase tracking-wider mb-1.5" : "text-slate-700 font-bold text-xs uppercase tracking-wider mb-1.5"} />

                            <div className="relative rounded-xl shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <TextInput
                                    id="password_confirmation"
                                    type={showPassword ? "text" : "password"}
                                    name="password_confirmation"
                                    value={data.password_confirmation}
                                    placeholder="••••••••••••"
                                    className={`w-full rounded-xl pl-10 pr-4 py-2.5 h-11 text-sm transition-all duration-200 border ${
                                        isDarkMode
                                            ? 'bg-zinc-900/90 border-zinc-800 text-white placeholder-zinc-500 focus:border-[#FF3B30] focus:ring-1 focus:ring-[#FF3B30]'
                                            : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-[#FF3B30] focus:ring-1 focus:ring-[#FF3B30]'
                                    }`}
                                    autoComplete="new-password"
                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                    required
                                />
                            </div>
                            <InputError message={errors.password_confirmation} className="mt-1.5 text-xs font-semibold text-[#FF3B30]" />
                        </div>

                        {/* Submit Button */}
                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full flex items-center justify-center h-12 px-6 border border-transparent rounded-xl shadow-lg shadow-[#FF3B30]/25 text-xs font-black uppercase tracking-wider text-white bg-gradient-to-r from-[#FF3B30] to-red-600 hover:from-red-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF3B30] focus:ring-offset-zinc-950 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-[0.98]"
                            >
                                {processing ? (
                                    <svg className="w-5 h-5 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                ) : (
                                    <span>Reset Password & Sign In →</span>
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
                            <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
                            <span>Back to Login</span>
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
