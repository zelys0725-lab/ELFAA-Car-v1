import PortalLayout from '@/Layouts/PortalLayout';
import { Head, Link } from '@inertiajs/react';

export default function Dashboard() {
    return (
        <PortalLayout role="customer" header="Customer Dashboard">
            <Head title="Customer Hub | ELFAA CAR RENTAL" />

            <div className="bg-white p-6 shadow sm:rounded-lg dark:bg-gray-800">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-150 pb-4 mb-6 dark:border-gray-700">
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 dark:text-gray-100">
                            Welcome to ELFAA CAR RENTAL!
                        </h2>
                        <p className="mt-1 text-sm text-gray-550 dark:text-gray-400">
                            Manage bookings, upload credentials, and browse available vehicles.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Card 1 */}
                    <div className="p-5 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow">
                        <h3 className="font-bold text-lg text-brand mb-2">Book a Car</h3>
                        <p className="text-sm text-gray-650 dark:text-gray-450 mb-4">
                            Browse ELFAA's premium vehicle fleet and reserve a car in real time.
                        </p>
                        <Link href="#" className="inline-flex items-center text-sm font-semibold text-brand hover:underline">
                            Browse Vehicles &rarr;
                        </Link>
                    </div>

                    {/* Card 2 */}
                    <div className="p-5 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow">
                        <h3 className="font-bold text-lg text-brand mb-2">My Bookings</h3>
                        <p className="text-sm text-gray-650 dark:text-gray-450 mb-4">
                            Check booking status, download rental details, and manage payment methods.
                        </p>
                        <Link href="#" className="inline-flex items-center text-sm font-semibold text-brand hover:underline">
                            View Bookings &rarr;
                        </Link>
                    </div>

                    {/* Card 3 */}
                    <div className="p-5 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow">
                        <h3 className="font-bold text-lg text-brand mb-2">Verify Documents</h3>
                        <p className="text-sm text-gray-650 dark:text-gray-450 mb-4">
                            Upload a copy of your Driver's License and Government ID for verification.
                        </p>
                        <Link href="#" className="inline-flex items-center text-sm font-semibold text-brand hover:underline">
                            Upload Identity Docs &rarr;
                        </Link>
                    </div>
                </div>
            </div>
        </PortalLayout>
    );
}
