import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Login({ status }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        admin_code: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('admin.login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <div className="min-h-screen flex flex-col sm:justify-center items-center pt-6 sm:pt-0 bg-gray-950 text-gray-100">
            <Head title="Admin Secure Login | ELFAA CAR RENTAL" />

            <div className="w-full sm:max-w-md mt-6 px-6 py-6 bg-gray-900 shadow-2xl rounded-lg border border-gray-800">
                <div className="mb-6 text-center border-b border-gray-800 pb-4">
                    <h2 className="text-2xl font-bold tracking-wide text-brand text-red-500 uppercase">
                        ELFAA CAR RENTAL
                    </h2>
                    <p className="mt-1 text-xs text-gray-400 font-semibold tracking-wider uppercase">
                        Secure System Administrator Login
                    </p>
                </div>

                {status && (
                    <div className="mb-4 text-sm font-medium text-green-500">
                        {status}
                    </div>
                )}

                <form onSubmit={submit}>
                    <div>
                        <label className="block text-sm font-medium text-gray-300" htmlFor="email">
                            Operator Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            name="email"
                            value={data.email}
                            className="mt-1 block w-full rounded-md border-gray-700 bg-gray-950 text-gray-200 focus:border-red-500 focus:ring-red-500 shadow-sm"
                            autoComplete="username"
                            autoFocus
                            onChange={(e) => setData('email', e.target.value)}
                            required
                        />
                        <InputError message={errors.email} className="mt-2 text-red-400" />
                    </div>

                    <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-300" htmlFor="password">
                            Secure Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            name="password"
                            value={data.password}
                            className="mt-1 block w-full rounded-md border-gray-700 bg-gray-950 text-gray-200 focus:border-red-500 focus:ring-red-500 shadow-sm"
                            autoComplete="current-password"
                            onChange={(e) => setData('password', e.target.value)}
                            required
                        />
                        <InputError message={errors.password} className="mt-2 text-red-400" />
                    </div>

                    <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-300" htmlFor="admin_code">
                            Administrator Code (Secured Key)
                        </label>
                        <input
                            id="admin_code"
                            type="text"
                            name="admin_code"
                            value={data.admin_code}
                            className="mt-1 block w-full rounded-md border-gray-700 bg-gray-950 text-gray-200 focus:border-red-500 focus:ring-red-500 shadow-sm tracking-wider"
                            placeholder="ELFAAXXX"
                            onChange={(e) => setData('admin_code', e.target.value)}
                            required
                        />
                        <InputError message={errors.admin_code} className="mt-2 text-red-400" />
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
                            <span className="ms-2 text-sm text-gray-400">
                                Maintain Secure Session
                            </span>
                        </label>
                    </div>

                    <div className="mt-6 flex items-center justify-end">
                        <button
                            type="submit"
                            className="w-full inline-flex justify-center items-center rounded-md border border-transparent bg-red-600 px-4 py-2.5 text-sm font-bold uppercase tracking-widest text-white transition duration-150 ease-in-out hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900 active:bg-red-800 disabled:opacity-50"
                            disabled={processing}
                        >
                            Execute Authenticate
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
