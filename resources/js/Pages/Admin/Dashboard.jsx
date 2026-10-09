import React, { useState } from 'react';
import PortalLayout from '@/Layouts/PortalLayout';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Badge, Button, Input } from '@/Components/Shadcn';
import VehicleCalendar from '@/Components/VehicleCalendar';
import SmartReportsDashboard from '@/Components/SmartReportsDashboard';
import DailyRentalSchedule from '@/Components/DailyRentalSchedule';
import BillRecordsManager from '@/Components/BillRecordsManager';
import VehicleProfitAnalytics from '@/Components/VehicleProfitAnalytics';
import VehicleInspectionModal from '@/Components/VehicleInspectionModal';
import InspectionComparisonDrawer from '@/Components/InspectionComparisonDrawer';
import BookingPriceBreakdownModal from '@/Components/BookingPriceBreakdownModal';

export default function Dashboard({ auth, stats, bookings = [], archivedBookings = [], vehicles = [], promos = [], extraGoods = [], documents = [], users = [], monthlyEarnings = [], categoryEarnings = [], topVehicles = [], billRecords = [] }) {
    const isAdmin = auth.user.role === 'admin';
    const { settings } = usePage().props;
    const [activeTab, setActiveTab] = useState('analytics');
    const [subFilter, setSubFilter] = useState('all');

    // Booking Logs Sub-view & Search & Pagination
    const [bookingLogTab, setBookingLogTab] = useState('active'); // 'active' | 'archived'
    const [bookingSearch, setBookingSearch] = useState('');
    const [bookingPage, setBookingPage] = useState(1);
    const bookingsPerPage = 8;

    // Dialog Modal States
    const [modalType, setModalType] = useState(null); // 'add_vehicle' | 'edit_vehicle' | 'add_promo' | 'edit_promo' | 'reject_doc' | 'confirm_action'
    const [editingItem, setEditingItem] = useState(null);
    const [rejectingDoc, setRejectingDoc] = useState(null);
    const [rejectReason, setRejectReason] = useState('');
    const [featureInput, setFeatureInput] = useState('');
    const [featuresList, setFeaturesList] = useState([]);

    // Inspection & Breakdown Modal States
    const [inspectionBooking, setInspectionBooking] = useState(null);
    const [inspectionType, setInspectionType] = useState('pickup');
    const [comparisonBooking, setComparisonBooking] = useState(null);
    const [breakdownBooking, setBreakdownBooking] = useState(null);

    // Styled Confirmation Dialog States
    const [confirmDialog, setConfirmDialog] = useState({
        open: false,
        title: '',
        message: '',
        actionLabel: 'Confirm',
        actionClass: 'bg-[#FF3B30] hover:bg-red-700 text-white',
        onConfirm: null,
    });

    const showConfirm = ({ title, message, actionLabel = 'Confirm', actionClass = 'bg-[#FF3B30] hover:bg-red-700 text-white', onConfirm }) => {
        setConfirmDialog({ open: true, title, message, actionLabel, actionClass, onConfirm });
    };

    const closeConfirm = () => setConfirmDialog(prev => ({ ...prev, open: false }));

    // Site Settings Form
    const settingsForm = useForm({
        site_logo: settings?.site_logo || '',
        home_hero_title: settings?.home_hero_title || '',
        home_hero_subtitle: settings?.home_hero_subtitle || '',
        contact_email: settings?.contact_email || '',
        contact_phone: settings?.contact_phone || '',
        site_logo_image_file: null,
        clear_logo_image: false,
    });

    const submitSettings = (e) => {
        e.preventDefault();
        settingsForm.post(route('admin.settings.update'), {
            preserveScroll: true,
        });
    };

    // Admin Password Change Form
    const passwordForm = useForm({
        current_password: '',
        new_password: '',
        new_password_confirmation: '',
    });

    const submitPasswordChange = (e) => {
        e.preventDefault();
        passwordForm.post(route('admin.password.change'), {
            preserveScroll: true,
            onSuccess: () => passwordForm.reset(),
        });
    };

    // Forms Initializations
    const vehicleForm = useForm({
        name: '', plate_number: '', type: 'Sedan', seats: 5, transmission: 'Auto',
        fuel_type: 'Gasoline', price_per_day: '', meetup_location: '', description: '',
        features: [], image_file: null, status: 'available',
    });

    const promoForm = useForm({
        title: '', promo_code: '', discount_type: 'percentage', discount_value: '', discount_text: '', description: '', status: 'active', promo_file: null,
    });

    const addonForm = useForm({
        name: '', price_per_day: '', description: '', status: 'available',
    });

    // Verification & Mutation Handlers
    const handleVerifyDoc = (docId, statusAction) => {
        if (statusAction === 'verify') {
            showConfirm({
                title: 'Approve Verification',
                message: 'Are you sure you want to approve this client identity verification?',
                actionLabel: 'Approve',
                actionClass: 'bg-green-600 hover:bg-green-700 text-white',
                onConfirm: () => router.post(route('admin.documents.verify', docId), { action: 'verify' }),
            });
        } else {
            setRejectingDoc(docId);
            setRejectReason('');
            setModalType('reject_doc');
        }
    };

    const submitDocReject = (e) => {
        e.preventDefault();
        if (!rejectReason.trim()) return;
        router.post(route('admin.documents.verify', rejectingDoc), {
            action: 'reject', reject_reason: rejectReason,
        }, {
            onSuccess: () => setModalType(null)
        });
    };

    const handleVerifyBooking = (bookingId, action) => {
        const isConfirm = action === 'confirm';
        const isReject = action === 'reject';
        showConfirm({
            title: isConfirm ? 'Confirm Booking' : isReject ? 'Reject Booking' : 'Mark as Complete',
            message: isConfirm
                ? 'Approve and confirm this rental booking?'
                : isReject
                ? 'Reject this booking request? The client will be notified.'
                : 'Mark this booking as completed? This action is final.',
            actionLabel: isConfirm ? 'Confirm Booking' : isReject ? 'Reject' : 'Complete Ride',
            actionClass: isConfirm ? 'bg-green-600 hover:bg-green-700 text-white' : isReject ? 'bg-rose-600 hover:bg-rose-700 text-white' : 'bg-[#FF3B30] hover:bg-red-700 text-white',
            onConfirm: () => router.post(route('admin.bookings.verify', bookingId), { action }),
        });
    };

    const handleArchiveBooking = (bookingId) => {
        showConfirm({
            title: 'Archive Booking Record',
            message: 'Move this booking to the archived records archive? You can restore it anytime.',
            actionLabel: 'Archive Record',
            actionClass: 'bg-[#FF3B30] hover:bg-red-700 text-white',
            onConfirm: () => router.post(route('admin.bookings.archive', bookingId)),
        });
    };

    const handleRestoreBooking = (bookingId) => {
        showConfirm({
            title: 'Restore Booking Record',
            message: 'Restore this booking record back to the active bookings list?',
            actionLabel: 'Restore Record',
            actionClass: 'bg-green-600 hover:bg-green-700 text-white',
            onConfirm: () => router.post(route('admin.bookings.restore', bookingId)),
        });
    };

    const handleToggleUser = (userId, currentStatus) => {
        if (!isAdmin) return;
        const isActive = currentStatus === 'active';
        showConfirm({
            title: isActive ? 'Block User Account' : 'Activate User Account',
            message: isActive
                ? 'This will deactivate the user account and prevent them from signing in.'
                : 'This will re-activate the user account and restore access.',
            actionLabel: isActive ? 'Block User' : 'Activate User',
            actionClass: isActive ? 'bg-rose-600 hover:bg-rose-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white',
            onConfirm: () => router.post(route('admin.users.toggle', userId)),
        });
    };

    // Modal Helpers
    const openAddVehicle = () => {
        vehicleForm.reset();
        setFeaturesList([]);
        setEditingItem(null);
        setModalType('add_vehicle');
    };

    const openEditVehicle = (vehicle) => {
        setEditingItem(vehicle.id);
        setFeaturesList(vehicle.features || []);
        vehicleForm.setData({
            name: vehicle.name || '', plate_number: vehicle.plate_number || '',
            type: vehicle.type || 'Sedan', seats: vehicle.seats || 5,
            transmission: vehicle.transmission || 'Auto', fuel_type: vehicle.fuel_type || 'Gasoline',
            price_per_day: vehicle.price_per_day || '', meetup_location: vehicle.meetup_location || '',
            description: vehicle.description || '', features: vehicle.features || [], status: vehicle.status || 'available',
        });
        setModalType('edit_vehicle');
    };

    const handleFeatureAdd = () => {
        if (featureInput.trim()) {
            const list = [...featuresList, featureInput.trim()];
            setFeaturesList(list);
            vehicleForm.setData('features', list);
            setFeatureInput('');
        }
    };

    const handleFeatureDelete = (index) => {
        const list = featuresList.filter((_, i) => i !== index);
        setFeaturesList(list);
        vehicleForm.setData('features', list);
    };

    const submitVehicle = (e) => {
        e.preventDefault();
        const actionUrl = modalType === 'add_vehicle' ? route('admin.vehicles.store') : route('admin.vehicles.update', editingItem);
        vehicleForm.post(actionUrl, { onSuccess: () => setModalType(null) });
    };

    const deleteVehicle = (id) => {
        showConfirm({
            title: 'Delete Vehicle',
            message: 'Permanently delete this vehicle? This cannot be undone.',
            actionLabel: 'Delete',
            actionClass: 'bg-rose-600 hover:bg-rose-700 text-white',
            onConfirm: () => router.post(route('admin.vehicles.destroy', id)),
        });
    };

    const openAddPromo = () => {
        promoForm.reset();
        setEditingItem(null);
        setModalType('add_promo');
    };

    const openEditPromo = (promo) => {
        setEditingItem(promo.id);
        promoForm.setData({
            title: promo.title || '', promo_code: promo.promo_code || '',
            discount_type: promo.discount_type || 'percentage',
            discount_value: promo.discount_value || '',
            discount_text: promo.discount_text || '', description: promo.description || '', status: promo.status || 'active',
        });
        setModalType('edit_promo');
    };

    const submitPromo = (e) => {
        e.preventDefault();
        const actionUrl = modalType === 'add_promo' ? route('admin.promos.store') : route('admin.promos.update', editingItem);
        promoForm.post(actionUrl, { onSuccess: () => setModalType(null) });
    };

    const deletePromo = (id) => {
        showConfirm({
            title: 'Delete Promo',
            message: 'Remove this promotional campaign? This cannot be undone.',
            actionLabel: 'Delete',
            actionClass: 'bg-rose-600 hover:bg-rose-700 text-white',
            onConfirm: () => router.post(route('admin.promos.destroy', id)),
        });
    };

    const openAddAddon = () => {
        addonForm.reset();
        setEditingItem(null);
        setModalType('add_addon');
    };

    const openEditAddon = (addon) => {
        setEditingItem(addon.id);
        addonForm.setData({
            name: addon.name || '', price_per_day: addon.price_per_day || '',
            description: addon.description || '', status: addon.status || 'available',
        });
        setModalType('edit_addon');
    };

    const submitAddon = (e) => {
        e.preventDefault();
        const actionUrl = modalType === 'add_addon' ? route('admin.extra-goods.store') : route('admin.extra-goods.update', editingItem);
        addonForm.post(actionUrl, { onSuccess: () => setModalType(null) });
    };

    const deleteAddon = (id) => {
        showConfirm({
            title: 'Delete Add-On',
            message: 'Remove this accessory item? This cannot be undone.',
            actionLabel: 'Delete',
            actionClass: 'bg-rose-600 hover:bg-rose-700 text-white',
            onConfirm: () => router.post(route('admin.extra-goods.destroy', id)),
        });
    };

    // Sidebar Config
    const tabsConfig = [
        { id: 'analytics', label: 'Dashboard' },
        { id: 'daily_schedule', label: 'Daily Rental Schedule' },
        { id: 'calendar', label: 'Availability Calendar' },
        { id: 'bookings', label: 'Bookings Log' },
        { id: 'verifications', label: 'Identity Verifications' },
        { id: 'bill_records', label: 'Utility & Bill Records' },
        { id: 'vehicles', label: 'Fleet Inventory' },
        { id: 'promos', label: 'Promo Campaigns' },
        { id: 'reports', label: 'Smart Reports & AI Insights' },
        { id: 'profit_analytics', label: 'Per-Car Profit Analytics' }
    ];
    if (isAdmin) {
        tabsConfig.push({ id: 'users', label: 'User Accounts' });
        tabsConfig.push({ id: 'settings', label: 'Site Settings' });
    }

    // Bookings filtering, searching, and pagination
    const baseBookingsList = bookingLogTab === 'active' ? bookings : archivedBookings;
    const filteredBookings = baseBookingsList.filter(b => {
        const matchesStatus = subFilter === 'all' || b.status === subFilter;
        const q = bookingSearch.toLowerCase().trim();
        const matchesSearch = !q || (
            (b.user?.name && b.user.name.toLowerCase().includes(q)) ||
            (b.user?.email && b.user.email.toLowerCase().includes(q)) ||
            (b.vehicle?.name && b.vehicle.name.toLowerCase().includes(q)) ||
            (b.pickup_location && b.pickup_location.toLowerCase().includes(q))
        );
        return matchesStatus && matchesSearch;
    });

    const totalBookingPages = Math.max(1, Math.ceil(filteredBookings.length / bookingsPerPage));
    const currentBookingPage = Math.min(bookingPage, totalBookingPages);
    const paginatedBookings = filteredBookings.slice((currentBookingPage - 1) * bookingsPerPage, currentBookingPage * bookingsPerPage);

    const filteredVehicles = vehicles.filter(v => subFilter === 'all' || v.status === subFilter);

    return (
        <PortalLayout role={auth.user.role} sidebarTabs={tabsConfig} activeTab={activeTab} setActiveTab={(t) => { setActiveTab(t); setSubFilter('all'); }} header={`${auth.user.role === 'admin' ? 'Administrator' : 'Staff'} Workspace`}>
            <Head title="Staff Hub | ELFAA CAR RENTAL" />

            <div className="space-y-8 select-none">
                {activeTab === 'analytics' && (
                    <>
                        {/* 1. FINANCIAL PERFORMANCE METRICS GRID */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                            {[
                                { title: 'Total Sales Revenue', value: `PHP ${parseFloat(stats.total_earnings).toLocaleString()}`, desc: `${stats.completed_bookings} Completed bookings`, color: 'text-red-500' },
                                { title: 'Pending Bookings', value: `${stats.pending_bookings} Requests`, desc: `${stats.confirmed_bookings} Confirmed pick-ups`, color: 'text-amber-550 dark:text-amber-500' },
                                { title: 'Fleet Vehicles', value: `${stats.total_vehicles} Active Cars`, desc: `${stats.active_promos} Promo ads running`, color: 'text-zinc-900 dark:text-white' },
                                { title: 'Average Order Value', value: `PHP ${(stats.completed_bookings > 0 ? Math.round(stats.total_earnings / stats.completed_bookings) : 0).toLocaleString()}`, desc: 'Per completed reservation', color: 'text-green-500' }
                            ].map((card, i) => (
                                <div key={i} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-lg flex flex-col justify-between transition-colors">
                                    <span className="text-[10px] font-black text-zinc-550 uppercase tracking-widest">{card.title}</span>
                                    <span className={`text-2xl font-black mt-2 tracking-tight ${card.color}`}>{card.value}</span>
                                    <span className="text-[10px] text-zinc-650 dark:text-zinc-400 mt-2 font-medium">{card.desc}</span>
                                </div>
                            ))}
                        </div>

                        {/* 2. DOUBLE COLUMN DETAILED ANALYTICS (MONTHLY INCOME TREND & CATEGORY SHARE) */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Monthly revenue bar chart tracker */}
                            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-lg transition-colors lg:col-span-2 text-left">
                                <div className="flex flex-col mb-6">
                                    <span className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest block">Financial Trend</span>
                                    <h3 className="text-base font-extrabold text-zinc-900 dark:text-white mt-1">Monthly Earnings</h3>
                                </div>

                                {monthlyEarnings.length === 0 ? (
                                    <div className="flex items-center justify-center h-[200px] border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-400 text-xs font-semibold">
                                        No financial history recorded yet. Complete rentals to compile charts.
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="flex items-end justify-between gap-4 h-[180px] pt-4 px-2 border-b border-zinc-200 dark:border-zinc-800/80">
                                            {monthlyEarnings.map((data, idx) => {
                                                const maxEarn = Math.max(...monthlyEarnings.map(m => m.earnings), 1);
                                                const heightPct = Math.round((data.earnings / maxEarn) * 100);
                                                return (
                                                    <div key={idx} className="flex-1 flex flex-col items-center group relative cursor-pointer">
                                                        {/* Tooltip on Hover */}
                                                        <div className="absolute bottom-[105%] bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[9px] font-black uppercase rounded p-1.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap shadow-xl">
                                                            PHP {Math.round(data.earnings).toLocaleString()}
                                                        </div>
                                                        {/* Main Visual bar */}
                                                        <div 
                                                            style={{ height: `${Math.max(heightPct, 8)}%` }} 
                                                            className="w-full bg-[#FF3B30] dark:bg-[#FF453A] group-hover:bg-red-700/80 rounded-t-md transition-all duration-300"
                                                        />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        {/* X Axis Labels */}
                                        <div className="flex justify-between text-[10px] font-black text-zinc-500 uppercase tracking-wider px-1">
                                            {monthlyEarnings.map((data, idx) => (
                                                <span key={idx} className="flex-1 text-center truncate">{data.month}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Category Share Distribution */}
                            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-lg transition-colors text-left flex flex-col justify-between">
                                <div className="mb-4">
                                    <span className="text-[10px] font-black text-zinc-550 uppercase tracking-widest block font-bold">Model Popularity</span>
                                    <h3 className="text-base font-extrabold text-zinc-900 dark:text-white mt-1">Category Revenue</h3>
                                </div>

                                {categoryEarnings.length === 0 ? (
                                    <div className="flex items-center justify-center h-[180px] border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-400 text-xs">
                                        No category reservations yet.
                                    </div>
                                ) : (
                                    <div className="space-y-4 my-auto">
                                        {categoryEarnings.map((cat, idx) => {
                                            const totalCatEarnVal = categoryEarnings.reduce((acc, c) => acc + c.earnings, 0);
                                            const categoryPct = totalCatEarnVal > 0 ? Math.round((cat.earnings / totalCatEarnVal) * 100) : 0;
                                            return (
                                                <div key={idx} className="space-y-1.5">
                                                    <div className="flex justify-between text-xs font-bold text-zinc-700 dark:text-zinc-300">
                                                        <span>{cat.type}</span>
                                                        <span className="text-[10px] text-zinc-550 font-extrabold">{categoryPct}% ({cat.count} Rides)</span>
                                                    </div>
                                                    <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-950 rounded-full overflow-hidden border border-zinc-200 dark:border-zinc-800/60">
                                                        <div 
                                                            style={{ width: `${categoryPct}%` }}
                                                            className="h-full bg-red-500 dark:bg-red-650 transition-all duration-500"
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 3. PERFORMANCE LEADERBOARD: TOP PERFORMING FLEET UNITS */}
                        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-lg transition-colors text-left animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="mb-5">
                                <span className="text-[10px] font-black text-zinc-550 dark:text-zinc-500 uppercase tracking-widest block">Units Leaderboard</span>
                                <h3 className="text-base font-extrabold text-zinc-900 dark:text-white mt-1">Top Performing Vehicles</h3>
                            </div>

                            {topVehicles.length === 0 ? (
                                <div className="text-center py-6 text-zinc-400 text-xs border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                                    No completed booking transactions to construct performance leaderboard.
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse text-left">
                                        <thead>
                                            <tr className="border-b border-zinc-200 dark:border-zinc-800/80 text-[10px] font-black uppercase text-zinc-500 tracking-wider">
                                                <th className="py-2.5 px-3">Vehicle Model</th>
                                                <th className="py-2.5 px-3">Vehicle Type</th>
                                                <th className="py-2.5 px-3 text-center">Completed Rides</th>
                                                <th className="py-2.5 px-3 text-right">Gross Income</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60 text-xs text-zinc-700 dark:text-zinc-300 font-semibold">
                                            {topVehicles.map((vehicle, idx) => (
                                                <tr key={idx} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-950/20">
                                                    <td className="py-3.5 px-3 font-extrabold text-zinc-900 dark:text-white">{vehicle.name}</td>
                                                    <td className="py-3.5 px-3 text-zinc-500">{vehicle.type}</td>
                                                    <td className="py-3.5 px-3 text-center font-bold">{vehicle.bookings_count} completed</td>
                                                    <td className="py-3.5 px-3 text-right font-black text-[#FF3B30] dark:text-[#FF453A]">PHP {parseInt(vehicle.revenue).toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* 3. MAIN WORKSPACE DATA TABLE CARD */}
                {!['analytics', 'settings', 'calendar', 'reports', 'daily_schedule', 'bill_records', 'profit_analytics'].includes(activeTab) && (
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-xl transition-colors">
                    {/* Header Action Section */}
                    <div className="px-6 py-5 border-b border-zinc-200 dark:border-zinc-800/80 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-zinc-50/50 dark:bg-zinc-900/50 transition-colors">
                        {/* Sub filters pill tags */}
                        {activeTab === 'bookings' && (
                            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                                {/* Active vs Archived tab toggle */}
                                <div className="flex bg-zinc-200/80 dark:bg-zinc-950 p-1 rounded-xl border border-zinc-300 dark:border-zinc-800">
                                    <button 
                                        onClick={() => { setBookingLogTab('active'); setBookingPage(1); }}
                                        className={`px-3 py-1 rounded-lg text-[10px] uppercase font-black tracking-wider transition-colors cursor-pointer ${
                                            bookingLogTab === 'active' ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                                        }`}
                                    >
                                        Active Log ({bookings.length})
                                    </button>
                                    <button 
                                        onClick={() => { setBookingLogTab('archived'); setBookingPage(1); }}
                                        className={`px-3 py-1 rounded-lg text-[10px] uppercase font-black tracking-wider transition-colors cursor-pointer ${
                                            bookingLogTab === 'archived' ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                                        }`}
                                    >
                                        Archived Records ({archivedBookings.length})
                                    </button>
                                </div>

                                {/* Status filter */}
                                <div className="flex flex-wrap gap-1 bg-zinc-100 dark:bg-zinc-950 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800/60 transition-colors">
                                    {[
                                        { k: 'all', l: 'All Status' },
                                        { k: 'pending', l: 'Pending' },
                                        { k: 'confirmed', l: 'Confirmed' },
                                        { k: 'completed', l: 'Completed' },
                                        { k: 'rejected', l: 'Rejected' }
                                    ].map(filter => (
                                        <button key={filter.k} onClick={() => { setSubFilter(filter.k); setBookingPage(1); }} className={`px-2.5 py-1 rounded-lg text-[9px] uppercase font-black tracking-wider transition-colors cursor-pointer ${subFilter === filter.k ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}`}>
                                            {filter.l}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        {activeTab === 'vehicles' && (
                            <div className="flex flex-wrap gap-1 bg-zinc-100 dark:bg-zinc-950 p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800/60 max-w-fit transition-colors">
                                {[
                                    { k: 'all', l: 'All Units' },
                                    { k: 'available', l: 'Available' },
                                    { k: 'reserved', l: 'Reserved' },
                                    { k: 'rented', l: 'Rented' },
                                    { k: 'maintenance', l: 'Maintenance' },
                                    { k: 'unavailable', l: 'Unavailable' }
                                ].map(filter => (
                                    <button key={filter.k} onClick={() => setSubFilter(filter.k)} className={`px-3 py-1.5 rounded-lg text-[10px] uppercase font-black tracking-wider transition-colors cursor-pointer ${subFilter === filter.k ? 'bg-zinc-200 dark:bg-zinc-850 text-zinc-900 dark:text-white' : 'text-zinc-550 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'}`}>
                                        {filter.l}
                                    </button>
                                ))}
                            </div>
                        )}
                        {!['bookings', 'vehicles'].includes(activeTab) && (
                            <div>
                                <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-wider">{tabsConfig.find(t => t.id === activeTab)?.label}</h3>
                            </div>
                        )}

                        {/* Search & Actions */}
                        <div className="flex items-center gap-2 self-end sm:self-auto w-full sm:w-auto">
                            {activeTab === 'bookings' && (
                                <Input 
                                    type="text" 
                                    placeholder="Search customer, vehicle..." 
                                    value={bookingSearch} 
                                    onChange={(e) => { setBookingSearch(e.target.value); setBookingPage(1); }}
                                    className="h-8 text-xs w-48 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800"
                                />
                            )}
                            {activeTab === 'vehicles' && (
                                <button onClick={openAddVehicle} className="px-3.5 h-9 bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors">
                                    + Add Vehicle
                                </button>
                            )}
                            {activeTab === 'promos' && (
                                <button onClick={openAddPromo} className="px-3.5 h-9 bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors">
                                    + Add Campaign
                                </button>
                            )}
                            {activeTab === 'addons' && (
                                <button onClick={openAddAddon} className="px-3.5 h-9 bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors">
                                    + Add Accessory
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Table View Body */}
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left">
                            <thead>
                                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100/50 dark:bg-zinc-950/20 text-zinc-500 text-[10px] font-black uppercase tracking-wider transition-colors">
                                    <th className="py-3 px-4 w-4"></th>
                                    <th className="py-3 px-4 w-4">
                                        <input type="checkbox" className="rounded bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-red-600 focus:ring-0 focus:ring-offset-0 h-3.5 w-3.5" disabled />
                                    </th>
                                    {activeTab === 'bookings' && (
                                        <>
                                            <th className="py-3 px-4 text-zinc-400">Renter Details</th>
                                            <th className="py-3 px-4 text-zinc-400">Reserved Vehicle</th>
                                            <th className="py-3 px-4 text-zinc-400">Total Price</th>
                                            <th className="py-3 px-4 text-zinc-400">Rental Period</th>
                                            <th className="py-3 px-4 text-zinc-400">Status</th>
                                            <th className="py-3 px-4 text-zinc-400 text-right">Verification Action</th>
                                        </>
                                    )}
                                    {activeTab === 'verifications' && (
                                        <>
                                            <th className="py-3 px-4 text-zinc-400">User Identification</th>
                                            <th className="py-3 px-4 text-zinc-400">ID Type</th>
                                            <th className="py-3 px-4 text-zinc-400">ID Document Number</th>
                                            <th className="py-3 px-4 text-zinc-400">File Attachment</th>
                                            <th className="py-3 px-4 text-zinc-400">Verification Status</th>
                                            <th className="py-3 px-4 text-zinc-400 text-right">Approval Decisions</th>
                                        </>
                                    )}
                                    {activeTab === 'vehicles' && (
                                        <>
                                            <th className="py-3 px-4 text-zinc-400">Vehicle Models</th>
                                            <th className="py-3 px-4 text-zinc-400">Plate Number</th>
                                            <th className="py-3 px-4 text-zinc-400">Category Tag</th>
                                            <th className="py-3 px-4 text-zinc-400">Price Per Day</th>
                                            <th className="py-3 px-4 text-zinc-400">Status</th>
                                            <th className="py-3 px-4 text-zinc-400 text-right">Management</th>
                                        </>
                                    )}
                                    {activeTab === 'promos' && (
                                        <>
                                            <th className="py-3 px-4 text-zinc-400">Campaign Header</th>
                                            <th className="py-3 px-4 text-zinc-400">Promo Code</th>
                                            <th className="py-3 px-4 text-zinc-400">Discount Text</th>
                                            <th className="py-3 px-4 text-zinc-400">Status</th>
                                            <th className="py-3 px-4 text-zinc-400 text-right">Management</th>
                                        </>
                                    )}
                                    {activeTab === 'addons' && (
                                        <>
                                            <th className="py-3 px-4 text-zinc-400">Accessory Name</th>
                                            <th className="py-3 px-4 text-zinc-400">Rate Per Day</th>
                                            <th className="py-3 px-4 text-zinc-400">Status</th>
                                            <th className="py-3 px-4 text-zinc-400 text-right">Management</th>
                                        </>
                                    )}
                                    {activeTab === 'users' && (
                                        <>
                                            <th className="py-3 px-4 text-zinc-400">Full Name</th>
                                            <th className="py-3 px-4 text-zinc-400">Email Address</th>
                                            <th className="py-3 px-4 text-zinc-400">System Role</th>
                                            <th className="py-3 px-4 text-zinc-400">Account status</th>
                                            <th className="py-3 px-4 text-zinc-400 text-right">Access Control</th>
                                        </>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 transition-colors">
                                {/* A. BOOKINGS DATA BODY */}
                                {activeTab === 'bookings' && paginatedBookings.length === 0 && (
                                    <tr>
                                        <td colSpan="8" className="py-8 text-center text-zinc-400 text-xs font-medium">
                                            No {bookingLogTab} bookings found matching your search or filters.
                                        </td>
                                    </tr>
                                )}
                                {activeTab === 'bookings' && paginatedBookings.map((booking) => (
                                    <tr key={booking.id} className="hover:bg-zinc-150/30 dark:hover:bg-zinc-850/30 transition-colors">
                                        <td className="py-3.5 px-4 text-zinc-400 dark:text-zinc-600 select-none cursor-grab">
                                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="9" cy="5" r="1" /><circle cx="9" cy="12" r="1" /><circle cx="9" cy="19" r="1" /><circle cx="15" cy="5" r="1" /><circle cx="15" cy="12" r="1" /><circle cx="15" cy="19" r="1" /></svg>
                                        </td>
                                        <td className="py-3.5 px-4"><input type="checkbox" className="rounded bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-red-600 focus:ring-0 focus:ring-offset-0 h-3.5 w-3.5" /></td>
                                        <td className="py-3.5 px-4">
                                            <span className="font-extrabold text-zinc-900 dark:text-white block">{booking.user?.name || 'Client User'}</span>
                                            <span className="text-[10px] text-zinc-550 dark:text-zinc-500 block mt-0.5">{booking.user?.email}</span>
                                        </td>
                                        <td className="py-3.5 px-4 text-zinc-800 dark:text-zinc-150 font-medium">{booking.vehicle?.name || 'Vehicle'}</td>
                                        <td className="py-3.5 px-4 font-bold text-zinc-900 dark:text-white">PHP {parseFloat(booking.total_price).toLocaleString()}</td>
                                        <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-450">{booking.start_date} to {booking.end_date}</td>
                                        <td className="py-3.5 px-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] uppercase font-black bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 ${
                                                booking.status === 'confirmed' ? 'text-green-600 dark:text-green-500' :
                                                booking.status === 'completed' ? 'text-sky-600 dark:text-sky-400' :
                                                booking.status === 'rejected' ? 'text-rose-600 dark:text-rose-500' : 'text-amber-600 dark:text-amber-500'
                                            }`}>
                                                <span className={`h-1.5 w-1.5 rounded-full ${
                                                    booking.status === 'confirmed' ? 'bg-green-600 dark:bg-green-500' :
                                                    booking.status === 'completed' ? 'bg-sky-600 dark:bg-sky-400' :
                                                    booking.status === 'rejected' ? 'bg-rose-600 dark:bg-rose-500' : 'bg-amber-600 dark:bg-amber-500'
                                                }`}></span>
                                                {booking.status}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4 text-right space-x-1">
                                            {bookingLogTab === 'active' ? (
                                                <>
                                                    {booking.status === 'pending' && (
                                                        <>
                                                            <button onClick={() => handleVerifyBooking(booking.id, 'confirm')} className="px-2 py-0.5 bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 text-green-600 dark:text-green-400 text-[10px] font-black uppercase rounded transition-colors cursor-pointer">Confirm</button>
                                                            <button onClick={() => handleVerifyBooking(booking.id, 'reject')} className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase rounded transition-colors cursor-pointer">Reject</button>
                                                        </>
                                                    )}
                                                    {booking.status === 'confirmed' && (
                                                        <button onClick={() => handleVerifyBooking(booking.id, 'complete')} className="px-2 py-0.5 bg-[#FF3B30]/10 border border-[#FF3B30]/20 hover:bg-[#FF3B30]/20 text-[#FF3B30] text-[10px] font-black uppercase rounded transition-colors cursor-pointer">Complete Ride</button>
                                                    )}
                                                    
                                                    {/* Inspection Buttons */}
                                                    <button
                                                        onClick={() => { setInspectionBooking(booking); setInspectionType('pickup'); }}
                                                        title="Record Vehicle Pickup Inspection"
                                                        className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase rounded transition-colors cursor-pointer"
                                                    >
                                                        +Pickup
                                                    </button>
                                                    <button
                                                        onClick={() => { setInspectionBooking(booking); setInspectionType('return'); }}
                                                        title="Record Vehicle Return Inspection"
                                                        className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase rounded transition-colors cursor-pointer"
                                                    >
                                                        +Return
                                                    </button>
                                                    <button
                                                        onClick={() => setComparisonBooking(booking)}
                                                        title="View Inspection Comparison & Surcharges"
                                                        className="px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 text-[10px] font-black uppercase rounded transition-colors cursor-pointer"
                                                    >
                                                        Inspections {booking.inspections?.length > 0 ? `(${booking.inspections.length})` : ''}
                                                    </button>
                                                    <button
                                                        onClick={() => setBreakdownBooking(booking)}
                                                        title="Review Complete Price Breakdown & Statement"
                                                        className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase rounded transition-colors cursor-pointer"
                                                    >
                                                        Review Breakdown
                                                    </button>

                                                    <button onClick={() => handleArchiveBooking(booking.id)} className="px-2 py-0.5 bg-zinc-500/10 border border-zinc-500/20 hover:bg-zinc-500/20 text-zinc-600 dark:text-zinc-400 text-[10px] font-black uppercase rounded transition-colors cursor-pointer">Archive</button>
                                                </>
                                            ) : (
                                                <button onClick={() => handleRestoreBooking(booking.id)} className="px-2.5 py-1 bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 text-green-600 dark:text-green-400 text-[10px] font-black uppercase rounded transition-colors cursor-pointer">Restore Record</button>
                                            )}
                                        </td>
                                    </tr>
                                ))}

                                {/* B. ID VERIFICATION DATA BODY */}
                                {activeTab === 'verifications' && documents.map((doc) => (
                                    <tr key={doc.id} className="hover:bg-zinc-150/30 dark:hover:bg-zinc-850/30 transition-colors">
                                        <td className="py-3.5 px-4 text-zinc-400 dark:text-zinc-600 cursor-grab">
                                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="9" cy="5" r="1" /><circle cx="9" cy="12" r="1" /><circle cx="9" cy="19" r="1" /><circle cx="15" cy="5" r="1" /><circle cx="15" cy="12" r="1" /><circle cx="15" cy="19" r="1" /></svg>
                                        </td>
                                        <td className="py-3.5 px-4"><input type="checkbox" className="rounded bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-red-650 focus:ring-0 focus:ring-offset-0 h-3.5 w-3.5" /></td>
                                        <td className="py-3.5 px-4 font-bold text-zinc-900 dark:text-white">{doc.user?.name || 'Client'}</td>
                                        <td className="py-3.5 px-4 uppercase text-zinc-600 dark:text-zinc-450">{doc.type || doc.id_type}</td>
                                        <td className="py-3.5 px-4 font-mono text-zinc-700 dark:text-zinc-150">{doc.id_number || '—'}</td>
                                        <td className="py-3.5 px-4">
                                            {(doc.file_path || doc.document_path) ? (
                                                <a
                                                    href={(() => {
                                                        const p = doc.file_path || doc.document_path;
                                                        if (!p) return '#';
                                                        if (p.startsWith('http://') || p.startsWith('https://') || p.startsWith('/')) return p;
                                                        if (p.startsWith('uploads/')) return `/${p}`;
                                                        return `/storage/${p}`;
                                                    })()}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-red-500/80 hover:text-red-500 font-bold hover:underline"
                                                >
                                                    View / Download Identification
                                                </a>
                                            ) : (
                                                <span className="text-zinc-400 italic font-normal">No File Attached</span>
                                            )}
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] uppercase font-black bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 ${
                                                doc.status === 'verified' ? 'text-green-600 dark:text-green-500' :
                                                doc.status === 'rejected' ? 'text-rose-600 dark:text-rose-500' : 'text-amber-600 dark:text-amber-500'
                                            }`}>
                                                <span className={`h-1.5 w-1.5 rounded-full ${
                                                    doc.status === 'verified' ? 'bg-green-600 dark:bg-green-500' :
                                                    doc.status === 'rejected' ? 'bg-rose-600 dark:bg-rose-500' : 'bg-amber-600 dark:bg-amber-500'
                                                }`}></span>
                                                {doc.status}
                                            </span>
                                            {doc.reject_reason && <span className="text-[9px] text-zinc-550 block mt-1">Reason: {doc.reject_reason}</span>}
                                        </td>
                                        <td className="py-3.5 px-4 text-right space-x-1">
                                            {doc.status === 'pending' && (
                                                <>
                                                    <button onClick={() => handleVerifyDoc(doc.id, 'verify')} className="px-2.5 py-1 bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 text-green-600 dark:text-green-400 text-[10px] font-black uppercase rounded transition-colors cursor-pointer">Verify ID</button>
                                                    <button onClick={() => handleVerifyDoc(doc.id, 'reject')} className="px-2.5 py-1 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase rounded transition-colors cursor-pointer">Reject</button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))}

                                {/* C. FLEET INVENTORY DATA BODY */}
                                {activeTab === 'vehicles' && filteredVehicles.map((vehicle) => (
                                    <tr key={vehicle.id} className="hover:bg-zinc-150/30 dark:hover:bg-zinc-850/30 transition-colors">
                                        <td className="py-3.5 px-4 text-zinc-400 dark:text-zinc-600 cursor-grab">
                                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="9" cy="5" r="1" /><circle cx="9" cy="12" r="1" /><circle cx="9" cy="19" r="1" /><circle cx="15" cy="5" r="1" /><circle cx="15" cy="12" r="1" /><circle cx="15" cy="19" r="1" /></svg>
                                        </td>
                                        <td className="py-3.5 px-4"><input type="checkbox" className="rounded bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-red-650 focus:ring-0 focus:ring-offset-0 h-3.5 w-3.5" /></td>
                                        <td className="py-3.5 px-4 text-zinc-800 dark:text-zinc-150 font-bold block">{vehicle.name}</td>
                                        <td className="py-3.5 px-4 font-mono text-zinc-600 dark:text-zinc-450 uppercase">{vehicle.plate_number}</td>
                                        <td className="py-3.5 px-4 text-zinc-605 dark:text-zinc-450">{vehicle.type}</td>
                                        <td className="py-3.5 px-4 font-bold text-zinc-900 dark:text-white">PHP {parseFloat(vehicle.price_per_day).toLocaleString()}</td>
                                        <td className="py-3.5 px-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] uppercase font-black bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 ${
                                                vehicle.status === 'available' ? 'text-green-600 dark:text-green-500' :
                                                vehicle.status === 'reserved' ? 'text-blue-600 dark:text-blue-400' :
                                                vehicle.status === 'rented' ? 'text-purple-600 dark:text-purple-400' :
                                                vehicle.status === 'maintenance' ? 'text-amber-600 dark:text-amber-500' : 'text-rose-600 dark:text-rose-500'
                                            }`}>
                                                <span className={`h-1.5 w-1.5 rounded-full ${
                                                    vehicle.status === 'available' ? 'bg-green-600 dark:bg-green-500' :
                                                    vehicle.status === 'reserved' ? 'bg-blue-600 dark:bg-blue-400' :
                                                    vehicle.status === 'rented' ? 'bg-purple-600 dark:bg-purple-400' :
                                                    vehicle.status === 'maintenance' ? 'bg-amber-600 dark:bg-amber-500' : 'bg-rose-600 dark:bg-rose-500'
                                                }`}></span>
                                                {vehicle.status}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4 text-right space-x-1">
                                            <button onClick={() => openEditVehicle(vehicle)} className="px-2.5 py-1 bg-white dark:bg-zinc-850 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-white text-[10px] font-black uppercase rounded cursor-pointer transition-colors">Edit</button>
                                            <button onClick={() => deleteVehicle(vehicle.id)} className="px-2.5 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-500 text-[10px] font-black uppercase rounded hover:bg-rose-500/20 cursor-pointer transition-colors animate-pulse-once">Delete</button>
                                        </td>
                                    </tr>
                                ))}

                                {/* D. PROMOS DATA BODY */}
                                {activeTab === 'promos' && promos.map((promo) => (
                                    <tr key={promo.id} className="hover:bg-zinc-150/30 dark:hover:bg-zinc-850/30 transition-colors">
                                        <td className="py-3.5 px-4 text-zinc-400 dark:text-zinc-650">::</td>
                                        <td className="py-3.5 px-4"><input type="checkbox" className="rounded bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-red-650" /></td>
                                        <td className="py-3.5 px-4 font-bold text-zinc-900 dark:text-white">{promo.title}</td>
                                        <td className="py-3.5 px-4 font-mono uppercase text-zinc-600 dark:text-zinc-450">{promo.promo_code}</td>
                                        <td className="py-3.5 px-4 text-red-600 dark:text-red-500 font-black uppercase">{promo.discount_text}</td>
                                        <td className="py-3.5 px-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] uppercase font-black bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 ${
                                                promo.status === 'active' ? 'text-green-600 dark:text-green-500' : 'text-rose-600 dark:text-rose-500'
                                            }`}>
                                                {promo.status}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4 text-right space-x-1">
                                            <button onClick={() => openEditPromo(promo)} className="px-2.5 py-1 bg-white dark:bg-zinc-850 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-white text-[10px] font-black uppercase rounded cursor-pointer transition-colors">Edit</button>
                                            <button onClick={() => deletePromo(promo.id)} className="px-2.5 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-500 text-[10px] font-black uppercase rounded hover:bg-rose-500/20 cursor-pointer transition-colors">Delete</button>
                                        </td>
                                    </tr>
                                ))}

                                {/* E. ADDONS DATA BODY */}
                                {activeTab === 'addons' && extraGoods.map((addon) => (
                                    <tr key={addon.id} className="hover:bg-zinc-150/30 dark:hover:bg-zinc-850/30 transition-colors">
                                        <td className="py-3.5 px-4 text-zinc-400 dark:text-zinc-650">::</td>
                                        <td className="py-3.5 px-4"><input type="checkbox" className="rounded bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-red-650" /></td>
                                        <td className="py-3.5 px-4 font-bold text-zinc-900 dark:text-white">{addon.name}</td>
                                        <td className="py-3.5 px-4 text-zinc-800 dark:text-zinc-150 font-bold">PHP {parseFloat(addon.price_per_day).toLocaleString()}</td>
                                        <td className="py-3.5 px-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] uppercase font-black bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 ${
                                                addon.status === 'available' ? 'text-green-600 dark:text-green-500' : 'text-rose-600 dark:text-rose-500'
                                            }`}>
                                                {addon.status}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4 text-right space-x-1">
                                            <button onClick={() => openEditAddon(addon)} className="px-2.5 py-1 bg-white dark:bg-zinc-850 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-white text-[10px] font-black uppercase rounded cursor-pointer transition-colors">Edit</button>
                                            <button onClick={() => deleteAddon(addon.id)} className="px-2.5 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-500 text-[10px] font-black uppercase rounded hover:bg-rose-500/20 cursor-pointer transition-colors">Delete</button>
                                        </td>
                                    </tr>
                                ))}

                                {/* F. USERS DATA BODY */}
                                {activeTab === 'users' && users.map((u) => (
                                    <tr key={u.id} className="hover:bg-zinc-150/30 dark:hover:bg-zinc-850/30 transition-colors">
                                        <td className="py-3.5 px-4 text-zinc-400 dark:text-zinc-650">::</td>
                                        <td className="py-3.5 px-4"><input type="checkbox" className="rounded bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-red-650" /></td>
                                        <td className="py-3.5 px-4 font-bold text-zinc-900 dark:text-white">{u.name}</td>
                                        <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-450">{u.email}</td>
                                        <td className="py-3.5 px-4 font-mono font-bold uppercase text-[10px] text-zinc-550 dark:text-zinc-400">{u.role}</td>
                                        <td className="py-3.5 px-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] uppercase font-black bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 ${
                                                u.status === 'active' ? 'text-green-600 dark:text-green-500' : 'text-rose-600 dark:text-rose-500'
                                            }`}>
                                                {u.status}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4 text-right">
                                            {isAdmin && u.id !== auth.user.id && (
                                                <button onClick={() => handleToggleUser(u.id, u.status)} className={`px-2.5 py-1 rounded text-[10px] font-black uppercase border transition-colors cursor-pointer ${
                                                    u.status === 'active' 
                                                        ? 'bg-rose-500/10 border-rose-500/20 hover:bg-rose-550/20 text-rose-600 dark:text-rose-400' 
                                                        : 'bg-green-500/10 border-green-500/20 hover:bg-green-550/20 text-green-600 dark:text-green-400'
                                                }`}>
                                                    {u.status === 'active' ? 'Block user' : 'Activate user'}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Footer for Bookings */}
                    {activeTab === 'bookings' && totalBookingPages > 1 && (
                        <div className="px-6 py-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50 transition-colors">
                            <span className="text-xs text-zinc-500 font-medium">
                                Page {currentBookingPage} of {totalBookingPages} ({filteredBookings.length} total records)
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setBookingPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentBookingPage === 1}
                                    className="px-3 py-1 rounded border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-300 disabled:opacity-40 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setBookingPage(prev => Math.min(totalBookingPages, prev + 1))}
                                    disabled={currentBookingPage === totalBookingPages}
                                    className="px-3 py-1 rounded border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-300 disabled:opacity-40 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'reports' && (
                <SmartReportsDashboard 
                    stats={stats} 
                    vehicles={vehicles} 
                    bookings={bookings} 
                    documents={documents} 
                    isAdmin={isAdmin} 
                />
            )}

            {activeTab === 'calendar' && (
                <VehicleCalendar vehicles={vehicles} isAdmin={isAdmin} />
            )}

            {activeTab === 'daily_schedule' && (
                <DailyRentalSchedule vehicles={vehicles} bookings={bookings} />
            )}

            {activeTab === 'bill_records' && (
                <BillRecordsManager billRecords={billRecords} showConfirm={showConfirm} />
            )}

            {activeTab === 'profit_analytics' && (
                <VehicleProfitAnalytics vehicles={vehicles} />
            )}

                {isAdmin && activeTab === 'settings' && (
                    <div className="space-y-6 max-w-2xl mx-auto">
                        <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-lg rounded-xl overflow-hidden transition-colors text-left">
                        <CardHeader className="px-6 pt-5 pb-3">
                            <CardTitle className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-white">Site & Branding Settings</CardTitle>
                            <CardDescription className="text-zinc-500 dark:text-zinc-400 text-xs">
                                Dynamically customize the global branding assets, banner titles, and contact details.
                            </CardDescription>
                        </CardHeader>
                        <form onSubmit={submitSettings}>
                            <CardContent className="space-y-5 px-6">
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5">Site Logo / Brand Text (Fallback)</label>
                                            <Input 
                                                value={settingsForm.data.site_logo} 
                                                onChange={e => settingsForm.setData('site_logo', e.target.value)} 
                                                required 
                                                className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white h-10 focus:border-[#FF3B30] focus:ring-0 focus:outline-none"
                                            />
                                            {settingsForm.errors.site_logo && <p className="text-xs text-red-500 mt-1">{settingsForm.errors.site_logo}</p>}
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5">Site Logo Image</label>
                                            {settings?.site_logo_image && !settingsForm.data.clear_logo_image ? (
                                                <div className="flex items-center gap-3 p-1.5 bg-zinc-50 dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800">
                                                    <img src={settings.site_logo_image} className="h-6 max-w-[120px] object-contain rounded" alt="Current logo" />
                                                    <button 
                                                        type="button" 
                                                        onClick={() => {
                                                            settingsForm.setData({ ...settingsForm.data, clear_logo_image: true, site_logo_image_file: null });
                                                        }}
                                                        className="text-[10px] font-black text-red-500 uppercase tracking-wide hover:underline cursor-pointer"
                                                    >
                                                        Clear Logo
                                                    </button>
                                                </div>
                                            ) : (
                                                <Input 
                                                    type="file"
                                                    onChange={e => {
                                                        settingsForm.setData({ ...settingsForm.data, site_logo_image_file: e.target.files[0] ? e.target.files[0] : null, clear_logo_image: false });
                                                    }}
                                                    accept="image/*"
                                                    className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white h-10 py-1.5 focus:border-[#FF3B30] text-xs"
                                                />
                                            )}
                                            {settingsForm.errors.site_logo_image_file && <p className="text-xs text-red-500 mt-1">{settingsForm.errors.site_logo_image_file}</p>}
                                            {settingsForm.data.clear_logo_image && (
                                                <p className="text-[9px] text-amber-500 font-bold mt-1">Image logo will be removed on save; using text fallback.</p>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5">Home Hero Main Title</label>
                                        <Input 
                                            value={settingsForm.data.home_hero_title} 
                                            onChange={e => settingsForm.setData('home_hero_title', e.target.value)} 
                                            required 
                                            className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white h-10 focus:border-[#FF3B30] focus:ring-0 focus:outline-none"
                                        />
                                        {settingsForm.errors.home_hero_title && <p className="text-xs text-red-500 mt-1">{settingsForm.errors.home_hero_title}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5">Home Hero Subtitle / Description</label>
                                        <textarea 
                                            rows="3"
                                            value={settingsForm.data.home_hero_subtitle} 
                                            onChange={e => settingsForm.setData('home_hero_subtitle', e.target.value)} 
                                            required 
                                            className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-3 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-[#FF3B30] transition-colors"
                                        />
                                        {settingsForm.errors.home_hero_subtitle && <p className="text-xs text-red-500 mt-1">{settingsForm.errors.home_hero_subtitle}</p>}
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5">Contact Email Address</label>
                                            <Input 
                                                type="email"
                                                value={settingsForm.data.contact_email} 
                                                onChange={e => settingsForm.setData('contact_email', e.target.value)} 
                                                required 
                                                className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white h-10 focus:border-[#FF3B30] focus:ring-0 focus:outline-none"
                                            />
                                            {settingsForm.errors.contact_email && <p className="text-xs text-red-550 mt-1">{settingsForm.errors.contact_email}</p>}
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5">Contact Phone Number</label>
                                            <Input 
                                                value={settingsForm.data.contact_phone} 
                                                onChange={e => settingsForm.setData('contact_phone', e.target.value)} 
                                                required 
                                                className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white h-10 focus:border-[#FF3B30] focus:ring-0 focus:outline-none"
                                            />
                                            {settingsForm.errors.contact_phone && <p className="text-xs text-red-500 mt-1">{settingsForm.errors.contact_phone}</p>}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="border-t border-zinc-200 dark:border-zinc-800/80 px-6 py-4 flex justify-end gap-2 bg-zinc-50/50 dark:bg-zinc-900/50">
                                <Button 
                                    type="submit" 
                                    disabled={settingsForm.processing} 
                                    className="bg-[#FF3B30] hover:bg-red-700 text-white font-black uppercase text-xs tracking-wider h-10 px-6 rounded-lg cursor-pointer"
                                >
                                    {settingsForm.processing ? 'Saving Settings...' : 'Save Site Settings'}
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>

                    {/* Administrator Password Change Section */}
                    <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-lg rounded-xl overflow-hidden transition-colors text-left max-w-2xl mx-auto mt-6">
                        <CardHeader className="px-6 pt-5 pb-3">
                            <CardTitle className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-white">Administrator Security</CardTitle>
                            <CardDescription className="text-zinc-500 dark:text-zinc-400 text-xs">
                                Update your administrative login credentials to maintain secure system access.
                            </CardDescription>
                        </CardHeader>
                        <form onSubmit={submitPasswordChange}>
                            <CardContent className="space-y-4 px-6">
                                <div>
                                    <label className="block text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5">Current Password</label>
                                    <Input 
                                        type="password"
                                        value={passwordForm.data.current_password} 
                                        onChange={e => passwordForm.setData('current_password', e.target.value)} 
                                        required 
                                        className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white h-10 focus:border-[#FF3B30] focus:ring-0 focus:outline-none"
                                    />
                                    {passwordForm.errors.current_password && <p className="text-xs text-red-500 mt-1">{passwordForm.errors.current_password}</p>}
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5">New Password</label>
                                        <Input 
                                            type="password"
                                            value={passwordForm.data.new_password} 
                                            onChange={e => passwordForm.setData('new_password', e.target.value)} 
                                            required 
                                            className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white h-10 focus:border-[#FF3B30] focus:ring-0 focus:outline-none"
                                        />
                                        {passwordForm.errors.new_password && <p className="text-xs text-red-500 mt-1">{passwordForm.errors.new_password}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5">Confirm New Password</label>
                                        <Input 
                                            type="password"
                                            value={passwordForm.data.new_password_confirmation} 
                                            onChange={e => passwordForm.setData('new_password_confirmation', e.target.value)} 
                                            required 
                                            className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white h-10 focus:border-[#FF3B30] focus:ring-0 focus:outline-none"
                                        />
                                        {passwordForm.errors.new_password_confirmation && <p className="text-xs text-red-500 mt-1">{passwordForm.errors.new_password_confirmation}</p>}
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="border-t border-zinc-200 dark:border-zinc-800/80 px-6 py-4 flex justify-end gap-2 bg-zinc-50/50 dark:bg-zinc-900/50">
                                <Button 
                                    type="submit" 
                                    disabled={passwordForm.processing} 
                                    className="bg-[#FF3B30] hover:bg-red-700 text-white font-black uppercase text-xs tracking-wider h-10 px-6 rounded-lg cursor-pointer"
                                >
                                    {passwordForm.processing ? 'Updating Password...' : 'Update Password'}
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>
                </div>
            )}
            </div>

            {/* Rejecting ID Details reason Modal Dialog */}
            {modalType === 'reject_doc' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setModalType(null)} />
                    <div className="z-10 w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-xl text-zinc-900 dark:text-white shadow-2xl transition-colors animate-in fade-in zoom-in-95 duration-200">
                        <h2 className="font-extrabold text-lg">Reject Document Verification</h2>
                        <form onSubmit={submitDocReject} className="space-y-4 mt-4">
                            <div>
                                <label className="block text-[10px] font-black text-zinc-550 dark:text-zinc-400 uppercase tracking-wider mb-2">Rejection Reason details</label>
                                <textarea required className="w-full text-xs p-2.5 rounded bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:border-red-650" rows="3" value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Provide short justification details..." />
                            </div>
                            <div className="flex justify-end gap-2 pt-4 border-t border-zinc-200 dark:border-zinc-850">
                                <Button type="button" variant="ghost" onClick={() => setModalType(null)} className="cursor-pointer">Cancel</Button>
                                <Button type="submit" className="bg-[#FF3B30] hover:bg-red-700 text-white cursor-pointer">Submit Rejection</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* VEHICLE ADD/EDIT DIALOG */}
            {(modalType === 'add_vehicle' || modalType === 'edit_vehicle') && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setModalType(null)} />
                    <div className="z-10 w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-xl text-zinc-900 dark:text-white shadow-2xl max-h-[85vh] overflow-y-auto transition-colors animate-in fade-in zoom-in-95 duration-200">
                        <h2 className="font-extrabold text-lg">{modalType === 'add_vehicle' ? 'Register Fleet Unit' : 'Edit Vehicle Details'}</h2>
                        <form onSubmit={submitVehicle} className="space-y-4 mt-4 text-left">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-zinc-550 dark:text-zinc-400 uppercase tracking-wider mb-1">Make / Model Name</label>
                                    <Input value={vehicleForm.data.name} onChange={e => vehicleForm.setData('name', e.target.value)} required className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50 focus:border-red-600" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-zinc-550 dark:text-zinc-400 uppercase tracking-wider mb-1">Plate Number</label>
                                    <Input value={vehicleForm.data.plate_number} onChange={e => vehicleForm.setData('plate_number', e.target.value)} required className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50 focus:border-red-600" />
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <div>
                                    <label className="block text-[10px] font-black text-zinc-550 dark:text-zinc-400 uppercase tracking-wider mb-1">Category Type</label>
                                    <select className="w-full text-xs p-2 h-9 rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none" value={vehicleForm.data.type} onChange={e => vehicleForm.setData('type', e.target.value)}>
                                        <option value="Sedan">Sedan</option>
                                        <option value="SUV">SUV</option>
                                        <option value="Van">Van</option>
                                        <option value="Pickup">Pickup</option>
                                        <option value="Sports">Sports</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-zinc-550 dark:text-zinc-400 uppercase tracking-wider mb-1">Seats Capacity</label>
                                    <Input type="number" value={vehicleForm.data.seats} onChange={e => vehicleForm.setData('seats', parseInt(e.target.value))} required className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-zinc-550 dark:text-zinc-400 uppercase tracking-wider mb-1">Price Per Day</label>
                                    <Input type="number" step="0.01" value={vehicleForm.data.price_per_day} onChange={e => vehicleForm.setData('price_per_day', e.target.value)} required className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-zinc-550 dark:text-zinc-400 uppercase tracking-wider mb-1">Transmission</label>
                                    <select className="w-full text-xs p-2 h-9 rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100" value={vehicleForm.data.transmission} onChange={e => vehicleForm.setData('transmission', e.target.value)}>
                                        <option value="Auto">Auto</option>
                                        <option value="Manual">Manual</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-zinc-550 dark:text-zinc-400 uppercase tracking-wider mb-1">Fuel Type</label>
                                    <select className="w-full text-xs p-2 h-9 rounded bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100" value={vehicleForm.data.fuel_type} onChange={e => vehicleForm.setData('fuel_type', e.target.value)}>
                                        <option value="Gasoline">Gasoline</option>
                                        <option value="Diesel">Diesel</option>
                                        <option value="Electric">Electric</option>
                                        <option value="Hybrid">Hybrid</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-zinc-555 dark:text-zinc-400 uppercase tracking-wider mb-1">Meetup Depot Location</label>
                                <Input value={vehicleForm.data.meetup_location} onChange={e => vehicleForm.setData('meetup_location', e.target.value)} required className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-zinc-550 dark:text-zinc-400 uppercase tracking-wider mb-1">Short Description</label>
                                <textarea className="w-full text-xs p-2.5 rounded bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:border-red-650" rows="2" value={vehicleForm.data.description} onChange={e => vehicleForm.setData('description', e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-zinc-550 dark:text-zinc-400 uppercase tracking-wider mb-1">Features Summary</label>
                                <div className="flex gap-2">
                                    <Input placeholder="E.g., GPS, Dashcam..." value={featureInput} onChange={e => setFeatureInput(e.target.value)} className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50" />
                                    <Button type="button" onClick={handleFeatureAdd} className="bg-zinc-100 dark:bg-zinc-850 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-800 dark:text-white border border-zinc-200 dark:border-zinc-800">Add</Button>
                                </div>
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                    {featuresList.map((feat, idx) => (
                                        <Badge key={idx} variant="secondary" className="flex items-center gap-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-white border border-zinc-200 dark:border-zinc-700">
                                            {feat}
                                            <span className="text-red-500 cursor-pointer font-bold" onClick={() => handleFeatureDelete(idx)}>×</span>
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-zinc-550 dark:text-zinc-400 uppercase tracking-wider mb-1 flex justify-between"><span>Model Photo Image</span><span className="text-[9px] text-zinc-550 dark:text-zinc-500 lowercase italic">Supports jpg, png, webp</span></label>
                                <Input type="file" accept="image/*" onChange={e => vehicleForm.setData('image_file', e.target.files[0])} className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-905 dark:text-zinc-50 h-9 py-1" />
                            </div>
                            {modalType === 'edit_vehicle' && (
                                <div>
                                    <label className="block text-[10px] font-black text-zinc-550 dark:text-zinc-400 uppercase tracking-wider mb-1">Availability Status</label>
                                    <select className="w-full text-xs p-2 h-9 rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-805 text-zinc-900 dark:text-zinc-100" value={vehicleForm.data.status} onChange={e => vehicleForm.setData('status', e.target.value)}>
                                        <option value="available">Available</option>
                                        <option value="reserved">Reserved</option>
                                        <option value="rented">Rented</option>
                                        <option value="maintenance">Maintenance</option>
                                        <option value="unavailable">Unavailable</option>
                                    </select>
                                </div>
                            )}
                            <div className="flex justify-end gap-2 pt-4 border-t border-zinc-200 dark:border-zinc-850">
                                <Button type="button" variant="ghost" onClick={() => setModalType(null)}>Cancel</Button>
                                <Button type="submit" disabled={vehicleForm.processing} className="bg-[#FF3B30] hover:bg-red-750 text-white">Save Vehicle</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* PROMO ADD/EDIT DIALOG */}
            {(modalType === 'add_promo' || modalType === 'edit_promo') && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setModalType(null)} />
                    <div className="z-10 w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-xl text-zinc-900 dark:text-white shadow-2xl transition-colors animate-in fade-in zoom-in-95 duration-200">
                        <h2 className="font-extrabold text-lg">{modalType === 'add_promo' ? 'Register Discount Promo' : 'Edit Promo Details'}</h2>
                        <form onSubmit={submitPromo} className="space-y-4 mt-4 text-left">
                            <div>
                                <label className="block text-[10px] font-black text-zinc-550 dark:text-zinc-400 uppercase tracking-wider mb-1">Campaign Title</label>
                                <Input value={promoForm.data.title} onChange={e => promoForm.setData('title', e.target.value)} required className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-zinc-550 dark:text-zinc-400 uppercase tracking-wider mb-1">Promo Code</label>
                                    <Input value={promoForm.data.promo_code} onChange={e => promoForm.setData('promo_code', e.target.value)} required className="bg-white dark:bg-zinc-950 border-zinc-250 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-zinc-550 dark:text-zinc-400 uppercase tracking-wider mb-1">Discount Type</label>
                                    <select className="w-full text-xs p-2 h-9 rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none" value={promoForm.data.discount_type} onChange={e => promoForm.setData('discount_type', e.target.value)}>
                                        <option value="percentage">Percentage (%)</option>
                                        <option value="fixed">Fixed Amount (PHP)</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-zinc-550 dark:text-zinc-400 uppercase tracking-wider mb-1">
                                        {promoForm.data.discount_type === 'percentage' ? 'Discount Value (%)' : 'Discount Value (PHP)'}
                                    </label>
                                    <Input type="number" step="0.01" min="0" placeholder={promoForm.data.discount_type === 'percentage' ? 'e.g. 20' : 'e.g. 500'} value={promoForm.data.discount_value} onChange={e => promoForm.setData('discount_value', e.target.value)} required className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-zinc-550 dark:text-zinc-400 uppercase tracking-wider mb-1">Display Label</label>
                                    <Input placeholder="E.g., 20% OFF" value={promoForm.data.discount_text} onChange={e => promoForm.setData('discount_text', e.target.value)} required className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-zinc-550 dark:text-zinc-400 uppercase tracking-wider mb-1">Details Description</label>
                                <textarea className="w-full text-xs p-2.5 rounded bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:border-red-650" rows="3" value={promoForm.data.description} onChange={e => promoForm.setData('description', e.target.value)} required />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-zinc-550 dark:text-zinc-400 uppercase tracking-wider mb-1">Campaign Banner Image</label>
                                <Input type="file" accept="image/*" onChange={e => promoForm.setData('promo_file', e.target.files[0])} className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50 h-9 py-1" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-zinc-550 dark:text-zinc-400 uppercase tracking-wider mb-1">Status</label>
                                <select className="w-full text-xs p-2 h-9 rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100" value={promoForm.data.status} onChange={e => promoForm.setData('status', e.target.value)}>
                                    <option value="active">Active</option>
                                    <option value="expired">Expired</option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-2 pt-4 border-t border-zinc-200 dark:border-zinc-850">
                                <Button type="button" variant="ghost" onClick={() => setModalType(null)}>Cancel</Button>
                                <Button type="submit" disabled={promoForm.processing} className="bg-[#FF3B30] hover:bg-red-755 text-white">Save Campaign</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ADD-ON ADD/EDIT DIALOG */}
            {(modalType === 'add_addon' || modalType === 'edit_addon') && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/65 backdrop-blur-sm" onClick={() => setModalType(null)} />
                    <div className="z-10 w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-xl text-zinc-900 dark:text-white shadow-2xl transition-colors animate-in fade-in zoom-in-95 duration-200">
                        <h2 className="font-extrabold text-lg">{modalType === 'add_addon' ? 'Register Extra Good' : 'Edit Add-On Details'}</h2>
                        <form onSubmit={submitAddon} className="space-y-4 mt-4 text-left">
                            <div>
                                <label className="block text-[10px] font-black text-zinc-550 dark:text-zinc-400 uppercase tracking-wider mb-1">Accessory Name</label>
                                <Input value={addonForm.data.name} onChange={e => addonForm.setData('name', e.target.value)} required className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-zinc-550 dark:text-zinc-400 uppercase tracking-wider mb-1">Rate Per Day</label>
                                <Input type="number" step="0.01" value={addonForm.data.price_per_day} onChange={e => addonForm.setData('price_per_day', e.target.value)} required className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-zinc-550 dark:text-zinc-400 uppercase tracking-wider mb-1">Details Description</label>
                                <textarea className="w-full text-xs p-2.5 rounded bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:border-red-650" rows="3" value={addonForm.data.description} onChange={e => addonForm.setData('description', e.target.value)} required />
                            </div>
                            {modalType === 'edit_addon' && (
                                <div>
                                    <label className="block text-[10px] font-black text-zinc-550 dark:text-zinc-400 uppercase tracking-wider mb-1">Availability Status</label>
                                    <select className="w-full text-xs p-2 h-9 rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-805 text-zinc-900 dark:text-zinc-100" value={addonForm.data.status} onChange={e => addonForm.setData('status', e.target.value)}>
                                        <option value="available">Available</option>
                                        <option value="unavailable">Unavailable</option>
                                    </select>
                                </div>
                            )}
                            <div className="flex justify-end gap-2 pt-4 border-t border-zinc-200 dark:border-zinc-850">
                                <Button type="button" variant="ghost" onClick={() => setModalType(null)}>Cancel</Button>
                                <Button type="submit" disabled={addonForm.processing} className="bg-[#FF3B30] hover:bg-red-750 text-white">Save Accessory</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* STYLED CONFIRMATION DIALOG */}
            {confirmDialog.open && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={closeConfirm} />
                    <div className="z-10 w-full max-w-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl text-zinc-900 dark:text-white shadow-2xl transition-colors animate-in fade-in zoom-in-95 duration-200">
                        {/* Icon */}
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 mb-4 mx-auto">
                            <svg className="w-6 h-6 text-zinc-600 dark:text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="text-base font-extrabold text-center mb-2">{confirmDialog.title}</h3>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 text-center leading-relaxed mb-6">{confirmDialog.message}</p>
                        <div className="flex gap-3">
                            <button
                                onClick={closeConfirm}
                                className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => { confirmDialog.onConfirm?.(); closeConfirm(); }}
                                className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide transition-colors cursor-pointer ${confirmDialog.actionClass}`}
                            >
                                {confirmDialog.actionLabel}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Vehicle Inspection Modal */}
            {inspectionBooking && (
                <VehicleInspectionModal
                    booking={inspectionBooking}
                    type={inspectionType}
                    onClose={() => setInspectionBooking(null)}
                />
            )}

            {/* Inspection Comparison & Surcharge Drawer */}
            {comparisonBooking && (
                <InspectionComparisonDrawer
                    booking={comparisonBooking}
                    isAdmin={isAdmin}
                    onClose={() => setComparisonBooking(null)}
                />
            )}

            {/* Price Breakdown & Statement Audit Modal (Feature #7) */}
            {breakdownBooking && (
                <BookingPriceBreakdownModal
                    booking={breakdownBooking}
                    isAdmin={isAdmin}
                    onClose={() => setBreakdownBooking(null)}
                />
            )}
        </PortalLayout>
    );
}
