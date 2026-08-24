import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';
import { useState, useEffect } from 'react';

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
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
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

        post(route('login'), {
            onFinish: () => reset('password'),
            replace: true,
        });
    };

    return (
        <div className={`min-h-screen flex font-sans transition-colors duration-300 ${isDarkMode ? 'bg-zinc-950 text-zinc-100' : 'bg-slate-50 text-slate-900'}`}>
            <Head title="Log in - ELFAA Car Rental" />

            {/* Left Form Section */}
            <div className={`flex-1 flex flex-col justify-center py-12 px-6 sm:px-12 lg:flex-none lg:px-20 xl:px-24 z-10 w-full lg:w-1/2 transition-colors duration-300 ${isDarkMode ? 'bg-zinc-950' : 'bg-white shadow-2xl'}`}>
                <div className="mx-auto w-full max-w-sm lg:w-96">
                    {/* Header bar with Theme Toggle */}
                    <div className="flex items-center justify-between mb-6">
                        <Link href="/" className="inline-block">
                            <span className="text-2xl font-black tracking-widest text-[#FF3B30] uppercase drop-shadow">
                                ELFAA CARS
                            </span>
                        </Link>

                        <button
                            type="button"
                            onClick={() => setIsDarkMode(!isDarkMode)}
                            className={`p-2 rounded-lg border transition-colors text-xs font-semibold flex items-center gap-1.5 ${
                                isDarkMode
                                    ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700'
                                    : 'bg-slate-100 border-slate-300 text-slate-700 hover:text-slate-900 hover:bg-slate-200'
                            }`}
                        >
                            {isDarkMode ? (
                                <>
                                    <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 100 2h1z" clipRule="evenodd" />
                                    </svg>
                                    <span>Light</span>
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                                    </svg>
                                    <span>Dark</span>
                                </>
                            )}
                        </button>
                    </div>

                    <div>
                        <h2 className={`text-3xl font-extrabold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                            Welcome back
                        </h2>
                        <p className={`mt-2 text-sm ${isDarkMode ? 'text-zinc-400' : 'text-slate-600'}`}>
                            Sign in to access your ELFAA rental portal and vehicle reservations.
                        </p>
                    </div>

                    {status && (
                        <div className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs font-semibold text-emerald-400">
                            {status}
                        </div>
                    )}

                    {errors.email && errors.email.includes('seconds') && (
                        <div className="mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs font-semibold text-[#FF3B30] flex items-center gap-2">
                            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <span>Too many failed login attempts. Please wait before trying again.</span>
                        </div>
                    )}

                    <div className="mt-8">
                        <form onSubmit={submit} className="space-y-6">
                            <div>
                                <InputLabel htmlFor="email" value="Email Address" className={isDarkMode ? "text-zinc-300 font-semibold" : "text-slate-700 font-semibold"} />

                                <div className="mt-1">
                                    <TextInput
                                        id="email"
                                        type="email"
                                        name="email"
                                        value={data.email}
                                        className={`w-full rounded-lg p-2.5 h-11 text-sm shadow-inner transition-colors duration-150 ${
                                            isDarkMode
                                                ? 'bg-zinc-900 border-zinc-800 text-white focus:border-[#FF3B30] focus:ring-[#FF3B30]'
                                                : 'bg-white border-slate-300 text-slate-900 focus:border-[#FF3B30] focus:ring-[#FF3B30]'
                                        }`}
                                        autoComplete="username"
                                        isFocused={true}
                                        onChange={(e) => setData('email', e.target.value)}
                                        required
                                    />
                                </div>

                                <InputError message={errors.email} className="mt-2 text-xs text-[#FF3B30]" />
                            </div>

                            <div>
                                <InputLabel htmlFor="password" value="Password" className={isDarkMode ? "text-zinc-300 font-semibold" : "text-slate-700 font-semibold"} />

                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <TextInput
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        value={data.password}
                                        className={`w-full rounded-lg p-2.5 h-11 text-sm pr-10 shadow-inner transition-colors duration-150 ${
                                            isDarkMode
                                                ? 'bg-zinc-900 border-zinc-800 text-white focus:border-[#FF3B30] focus:ring-[#FF3B30]'
                                                : 'bg-white border-slate-300 text-slate-900 focus:border-[#FF3B30] focus:ring-[#FF3B30]'
                                        }`}
                                        autoComplete="current-password"
                                        onChange={(e) => setData('password', e.target.value)}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className={`absolute inset-y-0 right-0 pr-3 flex items-center text-xs font-semibold transition-colors ${
                                            isDarkMode ? 'text-zinc-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'
                                        }`}
                                        title={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? (
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3l18 18" />
                                            </svg>
                                        ) : (
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>

                                <InputError message={errors.password} className="mt-2 text-xs text-[#FF3B30]" />
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <Checkbox
                                        name="remember"
                                        checked={data.remember}
                                        onChange={(e) => setData('remember', e.target.checked)}
                                        className={`rounded border-zinc-800 text-[#FF3B30] focus:ring-[#FF3B30] ${
                                            isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-slate-100 border-slate-300'
                                        }`}
                                    />
                                    <span className={`ms-2 text-xs ${isDarkMode ? 'text-zinc-400' : 'text-slate-600'}`}>
                                        Remember this device
                                    </span>
                                </div>

                                {canResetPassword && (
                                    <Link
                                        href={route('password.request')}
                                        className={`text-xs font-semibold transition-colors hover:underline ${
                                            isDarkMode ? 'text-zinc-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                                        }`}
                                    >
                                        Forgot Password?
                                    </Link>
                                )}
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-xs font-black uppercase tracking-wider text-white bg-[#FF3B30] hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF3B30] focus:ring-offset-zinc-950 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-[0.98]"
                                >
                                    Sign In
                                </button>
                            </div>
                        </form>

                        <div className="mt-6 text-center">
                            <span className={`text-xs ${isDarkMode ? 'text-zinc-500' : 'text-slate-500'}`}>Don't have an account? </span>
                            <Link
                                href={route('register')}
                                className={`text-xs font-bold transition-colors hover:underline ml-1 ${
                                    isDarkMode ? 'text-zinc-300 hover:text-white' : 'text-slate-800 hover:text-slate-950'
                                }`}
                            >
                                Register here
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column: Visual Image Carousel */}
            <div className="hidden lg:block relative w-0 flex-1 h-screen overflow-hidden">
                {CAROUSEL_IMAGES.map((img, idx) => (
                    <div
                        key={idx}
                        className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                            idx === currentImageIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
                        }`}
                    >
                        <img
                            className="absolute inset-0 h-full w-full object-cover"
                            src={img.url}
                            alt="ELFAA Luxury Car Rental"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
                        
                        <div className="absolute bottom-16 left-16 right-16 text-left z-20">
                            <span className="text-xs font-bold tracking-widest text-[#FF3B30] uppercase bg-[#FF3B30]/10 px-3 py-1.5 rounded-full border border-[#FF3B30]/20 inline-block mb-4 backdrop-blur-md">
                                ELFAA FLEET SELECTION
                            </span>
                            <h3 className="text-4xl font-extrabold text-white leading-tight drop-shadow-md">
                                {img.title}
                            </h3>
                            <p className="mt-4 text-base text-zinc-300 max-w-md drop-shadow">
                                {img.subtitle}
                            </p>

                            {/* Carousel Indicators */}
                            <div className="flex gap-2 mt-6">
                                {CAROUSEL_IMAGES.map((_, dotIdx) => (
                                    <button
                                        key={dotIdx}
                                        type="button"
                                        onClick={() => setCurrentImageIndex(dotIdx)}
                                        className={`h-1.5 rounded-full transition-all duration-300 ${
                                            dotIdx === currentImageIndex ? 'w-8 bg-[#FF3B30]' : 'w-2 bg-white/40 hover:bg-white/70'
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
