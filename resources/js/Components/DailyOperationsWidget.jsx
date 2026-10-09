import React, { useState } from 'react';
import { useForm, router } from '@inertiajs/react';
import {
    Calendar, Clock, CheckCircle2, AlertCircle, AlertTriangle,
    Car, User, ShieldAlert, DollarSign, Plus, X, Filter, RefreshCw
} from 'lucide-react';

export default function DailyOperationsWidget({
    bookings = [],
    vehicles = [],
    manualTasks = [],
    staffUsers = [],
    onSelectBooking,
    onOpenInspection
}) {
    const [activeTab, setActiveTab] = useState('today'); // today, upcoming, overdue, completed, all
    const [showCreateModal, setShowCreateModal] = useState(false);

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // Compute live operational tasks from active bookings & inspections + manual tasks
    const liveTasks = [];

    // 1. Deliveries / Pickups Today & Upcoming
    bookings.forEach(b => {
        if (b.status === 'confirmed' || b.status === 'pending') {
            const startDate = new Date(b.start_datetime);
            const dateStr = startDate.toISOString().split('T')[0];
            const isToday = dateStr === todayStr;
            const isOverdue = startDate < now && b.status === 'pending';
            const isUpcoming = startDate > now;

            liveTasks.push({
                id: `pickup-${b.id}`,
                bookingId: b.id,
                title: `Vehicle Pickup / Delivery: ${b.vehicle?.name}`,
                type: 'delivery_pickup',
                dueDatetime: b.start_datetime,
                vehicle: b.vehicle,
                user: b.user,
                assignedStaff: null,
                bookingRef: `#INV-${String(b.id).padStart(5, '0')}`,
                status: b.status === 'confirmed' ? 'in_progress' : 'pending',
                isToday,
                isOverdue,
                isUpcoming,
                isCompleted: b.status === 'completed',
                actionType: 'view_booking',
                booking: b,
            });
        }

        // 2. Returns Today & Overdue Returns
        if (b.status === 'confirmed') {
            const endDate = new Date(b.end_datetime);
            const dateStr = endDate.toISOString().split('T')[0];
            const isToday = dateStr === todayStr;
            const isOverdue = endDate < now;
            const isUpcoming = endDate > now && !isToday;

            liveTasks.push({
                id: `return-${b.id}`,
                bookingId: b.id,
                title: isOverdue ? `OVERDUE Return: ${b.vehicle?.name}` : `Vehicle Return Scheduled: ${b.vehicle?.name}`,
                type: isOverdue ? 'overdue_return' : 'vehicle_return',
                dueDatetime: b.end_datetime,
                vehicle: b.vehicle,
                user: b.user,
                assignedStaff: null,
                bookingRef: `#INV-${String(b.id).padStart(5, '0')}`,
                status: isOverdue ? 'overdue' : 'pending',
                isToday,
                isOverdue,
                isUpcoming,
                isCompleted: false,
                actionType: 'view_booking',
                booking: b,
            });
        }

        // 3. Unpaid Outstanding Balances
        const remaining = parseFloat(b.total_price || 0) - parseFloat(b.amount_paid || 0);
        if (remaining > 0 && (b.status === 'confirmed' || b.status === 'completed')) {
            liveTasks.push({
                id: `unpaid-${b.id}`,
                bookingId: b.id,
                title: `Unpaid Balance Collection: PHP ${remaining.toLocaleString()}`,
                type: 'unpaid_balance',
                dueDatetime: b.end_datetime,
                vehicle: b.vehicle,
                user: b.user,
                assignedStaff: null,
                bookingRef: `#INV-${String(b.id).padStart(5, '0')}`,
                status: 'pending',
                isToday: true,
                isOverdue: false,
                isUpcoming: false,
                isCompleted: false,
                actionType: 'view_breakdown',
                booking: b,
            });
        }
    });

    // 4. Merge manual tasks logged by staff
    manualTasks.forEach(t => {
        const dueDate = new Date(t.due_datetime);
        const dateStr = dueDate.toISOString().split('T')[0];

        liveTasks.push({
            id: `manual-${t.id}`,
            taskId: t.id,
            title: t.title,
            type: t.task_type,
            dueDatetime: t.due_datetime,
            vehicle: t.vehicle,
            user: t.booking?.user,
            assignedStaff: t.assigned_staff,
            bookingRef: t.booking_id ? `#INV-${String(t.booking_id).padStart(5, '0')}` : 'Manual Task',
            status: t.status,
            isToday: dateStr === todayStr,
            isOverdue: dueDate < now && t.status !== 'completed',
            isUpcoming: dueDate > now,
            isCompleted: t.status === 'completed',
            actionType: 'toggle_manual',
            isManual: true,
        });
    });

    // Sort tasks by urgency (Overdue first, then today, then upcoming)
    liveTasks.sort((a, b) => new Date(a.dueDatetime) - new Date(b.dueDatetime));

    // Filter tasks based on activeTab
    const filteredTasks = liveTasks.filter(t => {
        if (activeTab === 'today') return t.isToday || t.isOverdue;
        if (activeTab === 'upcoming') return t.isUpcoming;
        if (activeTab === 'overdue') return t.isOverdue && !t.isCompleted;
        if (activeTab === 'completed') return t.isCompleted;
        return true; // 'all'
    });

    // Form for creating manual operational task
    const createForm = useForm({
        title: '',
        task_type: 'maintenance',
        due_datetime: '',
        assigned_staff_id: '',
        vehicle_id: '',
        notes: '',
    });

    const handleCreateTask = (e) => {
        e.preventDefault();
        createForm.post(route('admin.tasks.store'), {
            onSuccess: () => {
                setShowCreateModal(false);
                createForm.reset();
            },
        });
    };

    const handleToggleTask = (taskId) => {
        router.post(route('admin.tasks.toggle', taskId));
    };

    const getBadgeStyle = (type) => {
        switch (type) {
            case 'delivery_pickup':
                return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
            case 'vehicle_return':
                return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
            case 'overdue_return':
                return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 animate-pulse';
            case 'unpaid_balance':
                return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
            case 'maintenance':
                return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
            default:
                return 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20';
        }
    };

    return (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm transition-colors text-left space-y-4">
            
            {/* Header & Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-200 dark:border-zinc-800">
                <div>
                    <div className="flex items-center gap-2">
                        <Calendar size={18} className="text-[#FF3B30]" />
                        <h3 className="text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-white">
                            Today's Daily Operations & Task Management
                        </h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FF3B30]/10 text-[#FF3B30]">
                            {liveTasks.filter(t => t.isToday || t.isOverdue).length} Pending
                        </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                        Track deliveries, returns, overdue vehicles, unpaid balances, and maintenance schedule.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FF3B30] text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-colors cursor-pointer"
                    >
                        <Plus size={14} /> Log Operations Task
                    </button>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                {[
                    { id: 'today', label: 'Today & Urgents', count: liveTasks.filter(t => (t.isToday || t.isOverdue) && !t.isCompleted).length },
                    { id: 'overdue', label: 'Overdue Returns', count: liveTasks.filter(t => t.isOverdue && !t.isCompleted).length, color: 'text-rose-500' },
                    { id: 'upcoming', label: 'Upcoming', count: liveTasks.filter(t => t.isUpcoming).length },
                    { id: 'completed', label: 'Completed', count: liveTasks.filter(t => t.isCompleted).length },
                    { id: 'all', label: 'All Tasks', count: liveTasks.length },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                            activeTab === tab.id
                                ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-sm'
                                : 'bg-zinc-100 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800'
                        }`}
                    >
                        <span>{tab.label}</span>
                        {tab.count > 0 && (
                            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                                activeTab === tab.id
                                    ? 'bg-white/20 dark:bg-zinc-900/20 text-current'
                                    : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'
                            }`}>
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Task Cards List */}
            {filteredTasks.length === 0 ? (
                <div className="py-8 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                    <CheckCircle2 size={24} className="mx-auto text-emerald-500 mb-2 opacity-60" />
                    <p className="text-xs font-bold text-zinc-600 dark:text-zinc-400">No operational tasks found for this view.</p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">All scheduled pickups, returns, and maintenance items are cleared.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filteredTasks.map((t) => (
                        <div
                            key={t.id}
                            className={`p-4 rounded-xl border text-xs flex flex-col justify-between transition-all ${
                                t.isOverdue
                                    ? 'bg-rose-500/5 border-rose-500/30'
                                    : t.isCompleted
                                    ? 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 opacity-60'
                                    : 'bg-zinc-50/50 dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                            }`}
                        >
                            <div>
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${getBadgeStyle(t.type)}`}>
                                        {t.type.replace('_', ' ')}
                                    </span>
                                    <span className="text-[10px] font-mono font-bold text-zinc-400">
                                        {t.bookingRef}
                                    </span>
                                </div>

                                <h4 className="font-bold text-zinc-900 dark:text-white text-xs mb-1.5 line-clamp-2">
                                    {t.title}
                                </h4>

                                <div className="space-y-1 text-[11px] text-zinc-500 dark:text-zinc-400 mb-3">
                                    <div className="flex items-center gap-1.5">
                                        <Clock size={12} className="text-zinc-400" />
                                        <span>Due: {new Date(t.dueDatetime).toLocaleString()}</span>
                                    </div>
                                    {t.vehicle && (
                                        <div className="flex items-center gap-1.5">
                                            <Car size={12} className="text-zinc-400" />
                                            <span>{t.vehicle.name} ({t.vehicle.plate_number})</span>
                                        </div>
                                    )}
                                    {t.user && (
                                        <div className="flex items-center gap-1.5">
                                            <User size={12} className="text-zinc-400" />
                                            <span>Renter: {t.user.name}</span>
                                        </div>
                                    )}
                                    {t.assignedStaff && (
                                        <div className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400 font-bold">
                                            <ShieldAlert size={12} />
                                            <span>Staff Assigned: {t.assignedStaff.name}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                                <span className={`text-[10px] font-bold ${t.isOverdue ? 'text-rose-600 dark:text-rose-400' : 'text-zinc-400'}`}>
                                    {t.isOverdue ? '⚠️ Overdue Action Required' : t.isCompleted ? '✓ Completed' : 'Scheduled'}
                                </span>

                                {t.isManual ? (
                                    <button
                                        onClick={() => handleToggleTask(t.taskId)}
                                        className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                                            t.isCompleted
                                                ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                                                : 'bg-emerald-600 text-white hover:bg-emerald-700'
                                        }`}
                                    >
                                        {t.isCompleted ? 'Re-open Task' : 'Mark Done'}
                                    </button>
                                ) : t.booking ? (
                                    <button
                                        onClick={() => onSelectBooking && onSelectBooking(t.booking)}
                                        className="px-3 py-1 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg text-[11px] font-bold hover:opacity-80 transition-opacity cursor-pointer"
                                    >
                                        Manage Booking & Details →
                                    </button>
                                ) : null}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Manual Operational Task Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />
                    
                    <div className="z-10 w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
                            <h3 className="text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-white">
                                Log Operational Task
                            </h3>
                            <button onClick={() => setShowCreateModal(false)} className="text-zinc-400 hover:text-zinc-600"><X size={18} /></button>
                        </div>

                        <form onSubmit={handleCreateTask} className="space-y-3 text-xs">
                            <div>
                                <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Task Title *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Scheduled 10,000km Change Oil / Vehicle Delivery to Airport..."
                                    value={createForm.data.title}
                                    onChange={e => createForm.setData('title', e.target.value)}
                                    className="w-full h-8 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-2.5 text-xs"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Task Category *</label>
                                    <select
                                        value={createForm.data.task_type}
                                        onChange={e => createForm.setData('task_type', e.target.value)}
                                        className="w-full h-8 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-2.5 text-xs font-bold"
                                    >
                                        <option value="maintenance">Vehicle Maintenance</option>
                                        <option value="delivery_pickup">Delivery / Pickup</option>
                                        <option value="inspection_pending">Inspection</option>
                                        <option value="unpaid_balance">Billing Collection</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Due Date & Time *</label>
                                    <input
                                        type="datetime-local"
                                        required
                                        value={createForm.data.due_datetime}
                                        onChange={e => createForm.setData('due_datetime', e.target.value)}
                                        className="w-full h-8 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-2 text-xs"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Assign to Staff Member</label>
                                    <select
                                        value={createForm.data.assigned_staff_id}
                                        onChange={e => createForm.setData('assigned_staff_id', e.target.value)}
                                        className="w-full h-8 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-2.5 text-xs"
                                    >
                                        <option value="">-- Unassigned --</option>
                                        {staffUsers.map(u => (
                                            <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Select Vehicle</label>
                                    <select
                                        value={createForm.data.vehicle_id}
                                        onChange={e => createForm.setData('vehicle_id', e.target.value)}
                                        className="w-full h-8 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-2.5 text-xs"
                                    >
                                        <option value="">-- Optional --</option>
                                        {vehicles.map(v => (
                                            <option key={v.id} value={v.id}>{v.name} ({v.plate_number})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Task Notes & Instructions</label>
                                <textarea
                                    rows="2"
                                    placeholder="Enter instructions for staff member..."
                                    value={createForm.data.notes}
                                    onChange={e => createForm.setData('notes', e.target.value)}
                                    className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-2 text-xs"
                                />
                            </div>

                            <div className="flex justify-end pt-2">
                                <button
                                    type="submit"
                                    disabled={createForm.processing}
                                    className="px-4 h-8 bg-[#FF3B30] text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-colors disabled:opacity-50 cursor-pointer"
                                >
                                    Create Operation Task
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}
