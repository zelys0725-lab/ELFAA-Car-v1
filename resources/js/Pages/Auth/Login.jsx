import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <div className="min-h-screen bg-zinc-950 flex font-sans text-zinc-150">
            <Head title="Log in" />

            <div className="flex-1 flex flex-col justify-center py-12 px-6 sm:px-12 lg:flex-none lg:px-20 xl:px-24 bg-zinc-950 z-10 w-full lg:w-1/2">
                <div className="mx-auto w-full max-w-sm lg:w-96">
                    <div>
                        <Link href="/" className="inline-block">
                            <span className="text-2xl font-black tracking-widest text-[#FF3B30] uppercase">
                                ELFAA CARS
                            </span>
                        </Link>
                        <h2 className="mt-6 text-3xl font-extrabold text-white tracking-tight">
                            Welcome back
                        </h2>
                        <p className="mt-2 text-sm text-zinc-400">
                            Enter your details below to access your account dashboard.
                        </p>
                    </div>

                    {status && (
                        <div className="mt-4 text-sm font-medium text-green-500">
                            {status}
                        </div>
                    )}

                    <div className="mt-8">
                        <form onSubmit={submit} className="space-y-6">
                            <div>
                                <InputLabel htmlFor="email" value="Email Address" className="text-zinc-300 font-semibold" />

                                <div className="mt-1">
                                    <TextInput
                                        id="email"
                                        type="email"
                                        name="email"
                                        value={data.email}
                                        className="w-full bg-zinc-900 border border-zinc-800 text-white focus:border-[#FF3B30] focus:ring-[#FF3B30] rounded-lg p-2.5 h-11 text-sm shadow-inner transition-colors duration-150"
                                        autoComplete="username"
                                        isFocused={true}
                                        onChange={(e) => setData('email', e.target.value)}
                                        required
                                    />
                                </div>

                                <InputError message={errors.email} className="mt-2 text-xs text-[#FF3B30]" />
                            </div>

                            <div>
                                <InputLabel htmlFor="password" value="Password" className="text-zinc-300 font-semibold" />

                                <div className="mt-1">
                                    <TextInput
                                        id="password"
                                        type="password"
                                        name="password"
                                        value={data.password}
                                        className="w-full bg-zinc-900 border border-zinc-800 text-white focus:border-[#FF3B30] focus:ring-[#FF3B30] rounded-lg p-2.5 h-11 text-sm shadow-inner transition-colors duration-150"
                                        autoComplete="current-password"
                                        onChange={(e) => setData('password', e.target.value)}
                                        required
                                    />
                                </div>

                                <InputError message={errors.password} className="mt-2 text-xs text-[#FF3B30]" />
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <Checkbox
                                        name="remember"
                                        checked={data.remember}
                                        onChange={(e) => setData('remember', e.target.checked)}
                                        className="rounded bg-zinc-900 border-zinc-800 text-[#FF3B30] focus:ring-[#FF3B30] focus:ring-offset-zinc-950"
                                    />
                                    <span className="ms-2 text-xs text-zinc-400">
                                        Remember this device
                                    </span>
                                </div>

                                {canResetPassword && (
                                    <Link
                                        href={route('password.request')}
                                        className="text-xs font-semibold text-zinc-400 hover:text-white transition-colors duration-150 hover:underline"
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
                            <span className="text-zinc-500 text-xs">Don't have an account? </span>
                            <Link
                                href={route('register')}
                                className="text-xs font-bold text-zinc-300 hover:text-white hover:underline transition-colors duration-150 ml-1"
                            >
                                Register here
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column: Media Cover Photo */}
            <div className="hidden lg:block relative w-0 flex-1 h-screen">
                <img
                    className="absolute inset-0 h-full w-full object-cover"
                    src="https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&q=80&w=1200"
                    alt="ELFAA Luxury Car Interior"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
                
                <div className="absolute bottom-16 left-16 right-16 text-left">
                    <span className="text-xs font-bold tracking-widest text-[#FF3B30] uppercase bg-[#FF3B30]/10 px-3 py-1.5 rounded-full border border-[#FF3B30]/20 inline-block mb-4">
                        ELFAA FLEET SELECTION
                    </span>
                    <h3 className="text-4xl font-extrabold text-white leading-tight">
                        Experience the prestige of absolute control
                    </h3>
                    <p className="mt-4 text-base text-zinc-300 max-w-md">
                        Reserve the finest sports, family, business and utility vehicles from ELFAA Car Rental. Quick dispatch, verified units, and 24/7 client center.
                    </p>
                </div>
            </div>
        </div>
    );
}

