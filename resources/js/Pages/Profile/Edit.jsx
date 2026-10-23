import PortalLayout from '@/Layouts/PortalLayout';
import { Head, Link, usePage, router } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import MfaManagementCard from '@/Components/Mfa/MfaManagementCard';
import { ArrowLeft, User, Lock, Trash2 } from 'lucide-react';

export default function Edit({ mustVerifyEmail, status }) {
    const { auth } = usePage().props;
    const isClient = auth?.user?.role === 'client';
    const isAdmin = auth?.user?.role === 'admin';
    const isStaff = auth?.user?.role === 'staff';
    const isAdminOrStaff = isAdmin || isStaff;

    const sidebarTabs = isAdminOrStaff ? [
        { id: 'analytics', label: 'Financial Analytics' },
        { id: 'gps_fleet', label: 'Fleet GPS Tracking' },
        { id: 'bookings', label: 'Customer Bookings' },
        { id: 'daily_schedule', label: 'Daily Rental Schedule' },
        { id: 'calendar', label: 'Availability Calendar' },
        { id: 'verifications', label: 'Identity Verifications' },
        { id: 'bill_records', label: 'Utility & Bill Records' },
        { id: 'vehicles', label: 'Fleet Inventory' },
        { id: 'promos', label: 'Promo Campaigns' },
        { id: 'reports', label: 'Smart Reports & AI Insights' },
        { id: 'profit_analytics', label: 'Per-Car Profit Analytics' },
        ...(isAdmin ? [
            { id: 'users', label: 'User Accounts' },
            { id: 'payment_settings', label: 'Payment Settings' },
            { id: 'settings', label: 'Site Settings' },
        ] : []),
        { id: 'profile', label: 'Profile & Security' },
    ] : [];

    const handleTabClick = (tabId) => {
        if (tabId === 'profile') return;
        router.visit(route('admin.dashboard') + `?tab=${tabId}`);
    };

    return (
        <PortalLayout
            role={auth?.user?.role || 'client'}
            sidebarTabs={sidebarTabs}
            activeTab="profile"
            setActiveTab={handleTabClick}
            header={`${isAdmin ? 'Administrator' : isStaff ? 'Staff' : 'User'} Account & Security`}
        >
            <Head title="Profile & Security" />

            <div className="max-w-4xl mx-auto space-y-6">

                {/* Back Navigation */}
                <div className="flex items-center gap-3">
                    <Link
                        href={isClient ? route('client.dashboard') + '?tab=security' : route('admin.dashboard')}
                        className="inline-flex items-center gap-2 text-xs font-bold text-zinc-500 dark:text-zinc-400 hover:text-[#FF3B30] dark:hover:text-[#FF3B30] transition-colors group"
                    >
                        <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                        Back to Dashboard
                    </Link>
                </div>

                {/* Page Header Card */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-[#FF3B30]/10 border border-[#FF3B30]/20 flex items-center justify-center flex-shrink-0">
                            <User className="w-6 h-6 text-[#FF3B30]" />
                        </div>
                        <div>
                            <h1 className="text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-white">
                                Account & Security Settings
                            </h1>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                                Manage your profile information, password, multi-factor authentication, and account security.
                            </p>
                        </div>
                    </div>
                </div>

                {/* SECTION: Profile Information */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
                    <div className="flex items-center gap-3 px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40">
                        <User className="w-4 h-4 text-[#FF3B30]" />
                        <span className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-white">
                            Profile Information
                        </span>
                    </div>
                    <div className="p-6 sm:p-8">
                        <UpdateProfileInformationForm
                            mustVerifyEmail={mustVerifyEmail}
                            status={status}
                            className="max-w-xl"
                        />
                    </div>
                </div>

                {/* SECTION: Update Password */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
                    <div className="flex items-center gap-3 px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40">
                        <Lock className="w-4 h-4 text-[#FF3B30]" />
                        <span className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-white">
                            Update Password
                        </span>
                    </div>
                    <div className="p-6 sm:p-8">
                        <UpdatePasswordForm className="max-w-xl" />
                    </div>
                </div>

                {/* SECTION: Two-Factor Authentication — Card renders its own wrapper */}
                <MfaManagementCard authUser={auth.user} />

                {/* SECTION: Danger Zone */}
                <div className="bg-white dark:bg-zinc-900 border border-rose-200 dark:border-rose-900/40 rounded-2xl overflow-hidden shadow-sm">
                    <div className="flex items-center gap-3 px-6 py-4 border-b border-rose-100 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/20">
                        <Trash2 className="w-4 h-4 text-rose-500" />
                        <span className="text-xs font-black uppercase tracking-wider text-rose-700 dark:text-rose-400">
                            Danger Zone — Delete Account
                        </span>
                    </div>
                    <div className="p-6 sm:p-8">
                        <DeleteUserForm className="max-w-xl" />
                    </div>
                </div>

            </div>
        </PortalLayout>
    );
}
