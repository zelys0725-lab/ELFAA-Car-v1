import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Login({ status }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('client.login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Owner Login | ELFAA CAR RENTAL" />

            <div className="mb-6 text-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    ELFAA CAR RENTAL
                </h2>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    Fleet Owner & Client Sign In
                </p>
            </div>

            {status && (
                <div className="mb-4 text-sm font-medium text-green-600">
                    {status}
                </div>
            )}

            <form onSubmit={submit}>
                <div>
                    <InputLabel htmlFor="email" value="Business Email" />

                    <TextInput
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className="mt-1 block w-full focus:border-brand focus:ring-brand"
                        autoComplete="username"
                        isFocused={true}
                        onChange={(e) => setData('email', e.target.value)}
                        required
                    />

                    <InputError message={errors.email} className="mt-2" />
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="password" value="Password" />

                    <TextInput
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        className="mt-1 block w-full focus:border-brand focus:ring-brand"
                        autoComplete="current-password"
                        onChange={(e) => setData('password', e.target.value)}
                        required
                    />

                    <InputError message={errors.password} className="mt-2" />
                </div>

                <div className="mt-4 block">
                    <label className="flex items-center">
                        <Checkbox
                            name="remember"
                            checked={data.remember}
                            onChange={(e) =>
                                setData('remember', e.target.checked)
                            }
                        />
                        <span className="ms-2 text-sm text-gray-600 dark:text-gray-400">
                            Remember me
                        </span>
                    </label>
                </div>

                <div className="mt-6 flex items-center justify-between">
                    <Link
                        href={route('client.register')}
                        className="rounded-md text-sm text-brand hover:text-red-700 underline focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                    >
                        Register your business
                    </Link>

                    <button
                        type="submit"
                        className="inline-flex items-center rounded-md border border-transparent bg-brand px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition duration-150 ease-in-out hover:bg-red-700 focus:bg-red-700 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 active:bg-brand dark:focus:ring-offset-gray-800"
                        disabled={processing}
                    >
                        Log in
                    </button>
                </div>
            </form>
        </GuestLayout>
    );
}
