import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        business_name: '',
        email: '',
        phone: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('client.register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Owner Registration | ELFAA CAR RENTAL" />

            <div className="mb-6 text-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    ELFAA CAR RENTAL
                </h2>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    Register a New Fleet Owner / Client Account
                </p>
            </div>

            <form onSubmit={submit}>
                <div>
                    <InputLabel htmlFor="name" value="Owner Name" />

                    <TextInput
                        id="name"
                        name="name"
                        value={data.name}
                        className="mt-1 block w-full focus:border-brand focus:ring-brand"
                        autoComplete="name"
                        isFocused={true}
                        onChange={(e) => setData('name', e.target.value)}
                        required
                    />

                    <InputError message={errors.name} className="mt-2" />
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="business_name" value="Business Name (ELFAA CAR RENTAL)" />

                    <TextInput
                        id="business_name"
                        name="business_name"
                        value={data.business_name}
                        className="mt-1 block w-full focus:border-brand focus:ring-brand"
                        onChange={(e) => setData('business_name', e.target.value)}
                        required
                    />

                    <InputError message={errors.business_name} className="mt-2" />
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="email" value="Business Email" />

                    <TextInput
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className="mt-1 block w-full focus:border-brand focus:ring-brand"
                        autoComplete="username"
                        onChange={(e) => setData('email', e.target.value)}
                        required
                    />

                    <InputError message={errors.email} className="mt-2" />
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="phone" value="Business Phone" />

                    <TextInput
                        id="phone"
                        type="text"
                        name="phone"
                        value={data.phone}
                        className="mt-1 block w-full focus:border-brand focus:ring-brand"
                        placeholder="e.g. 09987654321"
                        onChange={(e) => setData('phone', e.target.value)}
                        required
                    />

                    <InputError message={errors.phone} className="mt-2" />
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="password" value="Password" />

                    <TextInput
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        className="mt-1 block w-full focus:border-brand focus:ring-brand"
                        autoComplete="new-password"
                        onChange={(e) => setData('password', e.target.value)}
                        required
                    />

                    <InputError message={errors.password} className="mt-2" />

                    {/* Password Requirements List */}
                    <div className="mt-2 p-3 rounded-lg border text-xs space-y-1.5 bg-gray-50 border-gray-200 dark:bg-gray-900/60 dark:border-gray-800">
                        <div className="font-bold mb-1 text-gray-500 dark:text-gray-400">Password Requirements:</div>
                        <div className={`flex items-center gap-1.5 ${data.password.length >= 8 ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-gray-500'}`}>
                            <span>{data.password.length >= 8 ? '✓' : '○'}</span>
                            <span>At least 8 characters long</span>
                        </div>
                        <div className={`flex items-center gap-1.5 ${/[A-Z]/.test(data.password) ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-gray-500'}`}>
                            <span>{/[A-Z]/.test(data.password) ? '✓' : '○'}</span>
                            <span>At least 1 uppercase letter</span>
                        </div>
                        <div className={`flex items-center gap-1.5 ${/[a-z]/.test(data.password) ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-gray-500'}`}>
                            <span>{/[a-z]/.test(data.password) ? '✓' : '○'}</span>
                            <span>At least 1 lowercase letter</span>
                        </div>
                        <div className={`flex items-center gap-1.5 ${/[0-9]/.test(data.password) ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-gray-500'}`}>
                            <span>{/[0-9]/.test(data.password) ? '✓' : '○'}</span>
                            <span>At least 1 number</span>
                        </div>
                        <div className={`flex items-center gap-1.5 ${/[!@#$%^&*(),.?":{}|<>]/.test(data.password) ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-gray-500'}`}>
                            <span>{/[!@#$%^&*(),.?":{}|<>]/.test(data.password) ? '✓' : '○'}</span>
                            <span>At least 1 special character (!@#$%^&*)</span>
                        </div>
                    </div>
                </div>

                <div className="mt-4">
                    <InputLabel
                        htmlFor="password_confirmation"
                        value="Confirm Password"
                    />

                    <TextInput
                        id="password_confirmation"
                        type="password"
                        name="password_confirmation"
                        value={data.password_confirmation}
                        className="mt-1 block w-full focus:border-brand focus:ring-brand"
                        autoComplete="new-password"
                        onChange={(e) =>
                            setData('password_confirmation', e.target.value)
                        }
                        required
                    />

                    <InputError
                        message={errors.password_confirmation}
                        className="mt-2"
                    />
                </div>

                <div className="mt-6 flex items-center justify-between">
                    <Link
                        href={route('client.login')}
                        className="rounded-md text-sm text-brand hover:text-red-700 underline focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                    >
                        Already registered?
                    </Link>

                    <button
                        type="submit"
                        className="inline-flex items-center rounded-md border border-transparent bg-brand px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition duration-150 ease-in-out hover:bg-red-700 focus:bg-red-700 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 active:bg-brand dark:focus:ring-offset-gray-800"
                        disabled={processing}
                    >
                        Register
                    </button>
                </div>
            </form>
        </GuestLayout>
    );
}
