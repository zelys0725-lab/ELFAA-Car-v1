import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import Checkbox from '@/Components/Checkbox';
import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        phone: '',
        drivers_license_number: '',
        password: '',
        password_confirmation: '',
        terms: false,
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [showTermsModal, setShowTermsModal] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(true);

    const isMinLength = data.password.length >= 8;
    const isPasswordMatch = data.password.length > 0 && data.password === data.password_confirmation;
    const isFormValid = isMinLength && isPasswordMatch && data.terms;

    const submit = (e) => {
        e.preventDefault();

        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <div className={`min-h-screen flex font-sans transition-colors duration-300 ${isDarkMode ? 'bg-zinc-950 text-zinc-100' : 'bg-slate-50 text-slate-900'}`}>
            <Head title="Register - ELFAA Car Rental" />

            <div className={`flex-1 flex flex-col justify-center py-12 px-6 sm:px-12 lg:flex-none lg:px-20 xl:px-24 z-10 w-full lg:w-1/2 transition-colors duration-300 ${isDarkMode ? 'bg-zinc-950' : 'bg-white shadow-2xl'}`}>
                <div className="mx-auto w-full max-w-sm lg:w-96">
                    {/* Header bar with Theme Toggle */}
                    <div className="flex items-center justify-between mb-4">
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
                            {isDarkMode ? '☀️ Light' : '🌙 Dark'}
                        </button>
                    </div>

                    <div>
                        <h2 className={`text-3xl font-extrabold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                            Create an account
                        </h2>
                        <p className={`mt-1 text-sm ${isDarkMode ? 'text-zinc-400' : 'text-slate-600'}`}>
                            Join ELFAA Car Rental to manage bookings and cruise in comfort.
                        </p>
                    </div>

                    <div className="mt-6">
                        <form onSubmit={submit} className="space-y-4">
                            <div>
                                <InputLabel htmlFor="name" value="Full Name" className={isDarkMode ? "text-zinc-300 font-semibold" : "text-slate-700 font-semibold"} />
                                <div className="mt-1">
                                    <TextInput
                                        id="name"
                                        name="name"
                                        value={data.name}
                                        className={`w-full rounded-lg p-2.5 h-10 text-sm shadow-inner transition-colors duration-150 ${
                                            isDarkMode
                                                ? 'bg-zinc-900 border-zinc-800 text-white focus:border-[#FF3B30] focus:ring-[#FF3B30]'
                                                : 'bg-white border-slate-300 text-slate-900 focus:border-[#FF3B30] focus:ring-[#FF3B30]'
                                        }`}
                                        autoComplete="name"
                                        isFocused={true}
                                        onChange={(e) => setData('name', e.target.value)}
                                        required
                                    />
                                </div>
                                <InputError message={errors.name} className="mt-1 text-xs text-[#FF3B30]" />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <InputLabel htmlFor="email" value="Email Address" className={isDarkMode ? "text-zinc-300 font-semibold" : "text-slate-700 font-semibold"} />
                                    <div className="mt-1">
                                        <TextInput
                                            id="email"
                                            type="email"
                                            name="email"
                                            value={data.email}
                                            className={`w-full rounded-lg p-2.5 h-10 text-sm shadow-inner transition-colors duration-150 ${
                                                isDarkMode
                                                    ? 'bg-zinc-900 border-zinc-800 text-white focus:border-[#FF3B30] focus:ring-[#FF3B30]'
                                                    : 'bg-white border-slate-300 text-slate-900 focus:border-[#FF3B30] focus:ring-[#FF3B30]'
                                            }`}
                                            autoComplete="username"
                                            onChange={(e) => setData('email', e.target.value)}
                                            required
                                        />
                                    </div>
                                    <InputError message={errors.email} className="mt-1 text-xs text-[#FF3B30]" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="phone" value="Phone Number" className={isDarkMode ? "text-zinc-300 font-semibold" : "text-slate-700 font-semibold"} />
                                    <div className="mt-1">
                                        <TextInput
                                            id="phone"
                                            name="phone"
                                            value={data.phone}
                                            className={`w-full rounded-lg p-2.5 h-10 text-sm shadow-inner transition-colors duration-150 ${
                                                isDarkMode
                                                    ? 'bg-zinc-900 border-zinc-800 text-white focus:border-[#FF3B30] focus:ring-[#FF3B30]'
                                                    : 'bg-white border-slate-300 text-slate-900 focus:border-[#FF3B30] focus:ring-[#FF3B30]'
                                            }`}
                                            autoComplete="tel"
                                            onChange={(e) => setData('phone', e.target.value)}
                                            required
                                        />
                                    </div>
                                    <InputError message={errors.phone} className="mt-1 text-xs text-[#FF3B30]" />
                                </div>
                            </div>

                            <div>
                                <InputLabel htmlFor="drivers_license_number" value="Driver's License No. (Optional)" className={isDarkMode ? "text-zinc-300 font-semibold" : "text-slate-700 font-semibold"} />
                                <div className="mt-1">
                                    <TextInput
                                        id="drivers_license_number"
                                        name="drivers_license_number"
                                        value={data.drivers_license_number}
                                        placeholder="e.g. N01-12-345678"
                                        className={`w-full rounded-lg p-2.5 h-10 text-sm shadow-inner transition-colors duration-150 ${
                                            isDarkMode
                                                ? 'bg-zinc-900 border-zinc-800 text-white focus:border-[#FF3B30] focus:ring-[#FF3B30]'
                                                : 'bg-white border-slate-300 text-slate-900 focus:border-[#FF3B30] focus:ring-[#FF3B30]'
                                        }`}
                                        onChange={(e) => setData('drivers_license_number', e.target.value)}
                                    />
                                </div>
                                <InputError message={errors.drivers_license_number} className="mt-1 text-xs text-[#FF3B30]" />
                            </div>

                            <div>
                                <InputLabel htmlFor="password" value="Password" className={isDarkMode ? "text-zinc-300 font-semibold" : "text-slate-700 font-semibold"} />
                                <div className="mt-1 relative rounded-md">
                                    <TextInput
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        value={data.password}
                                        className={`w-full rounded-lg p-2.5 h-10 text-sm pr-10 shadow-inner transition-colors duration-150 ${
                                            isDarkMode
                                                ? 'bg-zinc-900 border-zinc-800 text-white focus:border-[#FF3B30] focus:ring-[#FF3B30]'
                                                : 'bg-white border-slate-300 text-slate-900 focus:border-[#FF3B30] focus:ring-[#FF3B30]'
                                        }`}
                                        autoComplete="new-password"
                                        onChange={(e) => setData('password', e.target.value)}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className={`absolute inset-y-0 right-0 pr-3 flex items-center text-xs font-semibold ${
                                            isDarkMode ? 'text-zinc-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'
                                        }`}
                                    >
                                        {showPassword ? "Hide" : "Show"}
                                    </button>
                                </div>
                                <InputError message={errors.password} className="mt-1 text-xs text-[#FF3B30]" />
                            </div>

                            <div>
                                <InputLabel htmlFor="password_confirmation" value="Confirm Password" className={isDarkMode ? "text-zinc-300 font-semibold" : "text-slate-700 font-semibold"} />
                                <div className="mt-1 relative rounded-md">
                                    <TextInput
                                        id="password_confirmation"
                                        type={showConfirmPassword ? "text" : "password"}
                                        name="password_confirmation"
                                        value={data.password_confirmation}
                                        className={`w-full rounded-lg p-2.5 h-10 text-sm pr-10 shadow-inner transition-colors duration-150 ${
                                            isDarkMode
                                                ? 'bg-zinc-900 border-zinc-800 text-white focus:border-[#FF3B30] focus:ring-[#FF3B30]'
                                                : 'bg-white border-slate-300 text-slate-900 focus:border-[#FF3B30] focus:ring-[#FF3B30]'
                                        }`}
                                        onChange={(e) => setData('password_confirmation', e.target.value)}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className={`absolute inset-y-0 right-0 pr-3 flex items-center text-xs font-semibold ${
                                            isDarkMode ? 'text-zinc-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'
                                        }`}
                                    >
                                        {showConfirmPassword ? "Hide" : "Show"}
                                    </button>
                                </div>
                                <InputError message={errors.password_confirmation} className="mt-1 text-xs text-[#FF3B30]" />
                            </div>

                            {/* Password Rules Indicators */}
                            <div className={`p-3 rounded-lg border text-xs space-y-1.5 ${isDarkMode ? 'bg-zinc-900/60 border-zinc-800' : 'bg-slate-100 border-slate-200'}`}>
                                <div className="font-bold mb-1 text-zinc-400">Password Requirements:</div>
                                <div className={`flex items-center gap-1.5 ${isMinLength ? 'text-emerald-400 font-semibold' : 'text-zinc-500'}`}>
                                    <span>{isMinLength ? '✓' : '○'}</span>
                                    <span>At least 8 characters long</span>
                                </div>
                                <div className={`flex items-center gap-1.5 ${isPasswordMatch ? 'text-emerald-400 font-semibold' : 'text-zinc-500'}`}>
                                    <span>{isPasswordMatch ? '✓' : '○'}</span>
                                    <span>Passwords match</span>
                                </div>
                            </div>

                            {/* Terms & Conditions Checkbox */}
                            <div className="pt-1">
                                <div className="flex items-start">
                                    <Checkbox
                                        name="terms"
                                        id="terms"
                                        checked={data.terms}
                                        onChange={(e) => setData('terms', e.target.checked)}
                                        className={`mt-0.5 rounded border-zinc-800 text-[#FF3B30] focus:ring-[#FF3B30] ${
                                            isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-slate-100 border-slate-300'
                                        }`}
                                        required
                                    />
                                    <label htmlFor="terms" className={`ms-2 text-xs leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-slate-600'}`}>
                                        I accept the{' '}
                                        <button
                                            type="button"
                                            onClick={() => setShowTermsModal(true)}
                                            className="text-[#FF3B30] underline hover:text-red-500 font-bold"
                                        >
                                            Terms and Conditions
                                        </button>{' '}
                                        and rental agreement policies.
                                    </label>
                                </div>
                                <InputError message={errors.terms} className="mt-1 text-xs text-[#FF3B30]" />
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={processing || !isFormValid}
                                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-xs font-black uppercase tracking-wider text-white bg-[#FF3B30] hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF3B30] focus:ring-offset-zinc-950 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-[0.98]"
                                >
                                    Register Account
                                </button>
                            </div>
                        </form>

                        <div className="mt-6 text-center">
                            <span className={`text-xs ${isDarkMode ? 'text-zinc-500' : 'text-slate-500'}`}>Already have an account? </span>
                            <Link
                                href={route('login')}
                                className={`text-xs font-bold transition-colors hover:underline ml-1 ${
                                    isDarkMode ? 'text-zinc-300 hover:text-white' : 'text-slate-800 hover:text-slate-950'
                                }`}
                            >
                                Sign in here
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column: Hero Cover */}
            <div className="hidden lg:block relative w-0 flex-1 h-screen">
                <img
                    className="absolute inset-0 h-full w-full object-cover"
                    src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=1200"
                    alt="ELFAA Luxury Car Rental"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
                
                <div className="absolute bottom-16 left-16 right-16 text-left z-20">
                    <span className="text-xs font-bold tracking-widest text-[#FF3B30] uppercase bg-[#FF3B30]/10 px-3 py-1.5 rounded-full border border-[#FF3B30]/20 inline-block mb-4 backdrop-blur-md">
                        JOIN ELFAA CARS
                    </span>
                    <h3 className="text-4xl font-extrabold text-white leading-tight drop-shadow-md">
                        Drive the car of your dreams today
                    </h3>
                    <p className="mt-4 text-base text-zinc-300 max-w-md drop-shadow">
                        Create an account to submit verification documents, book instant reservations, and access exclusive promo discounts.
                    </p>
                </div>
            </div>

            {/* Terms and Conditions Modal */}
            {showTermsModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className={`w-full max-w-lg rounded-xl p-6 shadow-2xl border transition-colors ${
                        isDarkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-slate-300 text-slate-900'
                    }`}>
                        <div className="flex justify-between items-center pb-3 border-b border-zinc-800 mb-4">
                            <h4 className="text-lg font-bold text-[#FF3B30]">ELFAA Rental Terms & Conditions</h4>
                            <button
                                type="button"
                                onClick={() => setShowTermsModal(false)}
                                className="text-zinc-400 hover:text-white font-bold"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="max-h-64 overflow-y-auto space-y-3 text-xs leading-relaxed text-zinc-300 pr-2">
                            <p><strong>1. Driver Requirements:</strong> Renters must possess a valid driver's license and be at least 21 years of age.</p>
                            <p><strong>2. Identification:</strong> Government-issued ID and driver's license details must be verified before vehicle dispatch.</p>
                            <p><strong>3. Vehicle Usage:</strong> Vehicles must be operated legally, under designated capacity limits, and within authorized geographical boundaries.</p>
                            <p><strong>4. Fuel & Return Policy:</strong> Vehicles should be returned with the same fuel level as dispatched. Late returns may incur hourly fees.</p>
                            <p><strong>5. Payment:</strong> Cash payments are collected upon meetup or vehicle inspection.</p>
                        </div>
                        <div className="mt-6 flex justify-end">
                            <button
                                type="button"
                                onClick={() => {
                                    setData('terms', true);
                                    setShowTermsModal(false);
                                }}
                                className="px-4 py-2 bg-[#FF3B30] text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-red-700"
                            >
                                Accept Terms
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
