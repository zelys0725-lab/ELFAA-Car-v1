import React, { useState, useEffect } from 'react';
import { useForm } from '@inertiajs/react';

export default function VehicleCalendar({ vehicles = [], isAdmin = true }) {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState('month'); // 'month', 'week', 'day'
    const [selectedVehicleId, setSelectedVehicleId] = useState('');
    const [selectedStatusFilter, setSelectedStatusFilter] = useState('');
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [showBlockModal, setShowBlockModal] = useState(false);

    // Block interval form
    const { data: blockData, setData: setBlockData, post: postBlock, processing: blockProcessing, errors: blockErrors, reset: resetBlock } = useForm({
        vehicle_id: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
        reason: '',
        type: 'maintenance',
    });

    useEffect(() => {
        fetchCalendarFeed();
    }, [currentDate, viewMode, selectedVehicleId, selectedStatusFilter]);

    const fetchCalendarFeed = async () => {
        setLoading(true);
        try {
            let startStr, endStr;

            if (viewMode === 'month') {
                startStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString();
                endStr = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString();
            } else if (viewMode === 'week') {
                const dayOfWeek = currentDate.getDay();
                const start = new Date(currentDate);
                start.setDate(currentDate.getDate() - dayOfWeek);
                const end = new Date(start);
                end.setDate(start.getDate() + 6);
                startStr = start.toISOString();
                endStr = end.toISOString();
            } else {
                // Day view
                const start = new Date(currentDate);
                start.setHours(0, 0, 0, 0);
                const end = new Date(currentDate);
                end.setHours(23, 59, 59, 999);
                startStr = start.toISOString();
                endStr = end.toISOString();
            }

            let url = `/admin/calendar/feed?start=${startStr}&end=${endStr}`;
            if (selectedVehicleId) url += `&vehicle_id=${selectedVehicleId}`;
            if (selectedStatusFilter) url += `&status=${selectedStatusFilter}`;

            const res = await fetch(url);
            const data = await res.json();
            setEvents(data.events || []);
        } catch (err) {
            console.error('Failed to load admin calendar feed:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleBlockSubmit = (e) => {
        e.preventDefault();
        postBlock(route('admin.unavailable_dates.store'), {
            onSuccess: () => {
                setShowBlockModal(false);
                resetBlock();
                fetchCalendarFeed();
            },
        });
    };

    // Calendar Navigation
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const navigatePrev = () => {
        if (viewMode === 'month') setCurrentDate(new Date(year, month - 1, 1));
        else if (viewMode === 'week') setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() - 7)));
        else setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() - 1)));
    };

    const navigateNext = () => {
        if (viewMode === 'month') setCurrentDate(new Date(year, month + 1, 1));
        else if (viewMode === 'week') setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() + 7)));
        else setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() + 1)));
    };

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay();

    // Event Status Color Mapping
    const getBadgeStyle = (status) => {
        switch (status) {
            case 'confirmed':
            case 'available':
                return 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/30';
            case 'reserved':
                return 'bg-amber-500/15 dark:bg-amber-500/20 text-amber-800 dark:text-amber-400 border-amber-500/30';
            case 'rented':
                return 'bg-sky-500/15 dark:bg-sky-500/20 text-sky-800 dark:text-sky-400 border-sky-500/30';
            case 'pending':
                return 'bg-yellow-500/15 dark:bg-yellow-500/20 text-yellow-800 dark:text-yellow-400 border-yellow-500/30';
            case 'maintenance':
                return 'bg-purple-500/15 dark:bg-purple-500/20 text-purple-800 dark:text-purple-400 border-purple-500/30';
            case 'unavailable':
                return 'bg-rose-500/15 dark:bg-rose-500/20 text-rose-800 dark:text-rose-400 border-rose-500/30';
            default:
                return 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700';
        }
    };

    return (
        <div className="space-y-6 select-none font-sans transition-colors">
            {/* Top Toolbar Controls */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-xl">
                <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-xl font-black uppercase tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
                        <span>Vehicle Schedule Calendar</span>
                    </h3>
                    <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-950 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-bold">
                        <button
                            type="button"
                            onClick={() => setViewMode('month')}
                            className={`px-3 py-1.5 rounded-lg transition-all ${viewMode === 'month' ? 'bg-[#FF3B30] text-white shadow' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'}`}
                        >
                            Month
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('week')}
                            className={`px-3 py-1.5 rounded-lg transition-all ${viewMode === 'week' ? 'bg-[#FF3B30] text-white shadow' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'}`}
                        >
                            Week
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('day')}
                            className={`px-3 py-1.5 rounded-lg transition-all ${viewMode === 'day' ? 'bg-[#FF3B30] text-white shadow' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'}`}
                        >
                            Day
                        </button>
                    </div>
                </div>

                {/* Filters & Action */}
                <div className="flex flex-wrap items-center gap-3">
                    {/* Vehicle Filter */}
                    <select
                        value={selectedVehicleId}
                        onChange={(e) => setSelectedVehicleId(e.target.value)}
                        className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white text-xs font-semibold rounded-xl px-3 py-2 focus:ring-red-500 focus:border-red-500"
                    >
                        <option value="">All Vehicles ({vehicles.length})</option>
                        {vehicles.map(v => (
                            <option key={v.id} value={v.id}>{v.name} ({v.plate_number || 'N/A'})</option>
                        ))}
                    </select>

                    {/* Status Filter */}
                    <select
                        value={selectedStatusFilter}
                        onChange={(e) => setSelectedStatusFilter(e.target.value)}
                        className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white text-xs font-semibold rounded-xl px-3 py-2 focus:ring-red-500 focus:border-red-500"
                    >
                        <option value="">All Statuses</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="rented">Rented</option>
                        <option value="reserved">Reserved</option>
                        <option value="pending">Pending</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="unavailable">Unavailable</option>
                    </select>

                    {/* Navigation Buttons */}
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={navigatePrev}
                            className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors text-xs font-bold cursor-pointer"
                        >
                            &larr;
                        </button>
                        <span className="text-xs font-black uppercase tracking-wider text-[#FF3B30] min-w-[120px] text-center">
                            {monthNames[month]} {year}
                        </span>
                        <button
                            type="button"
                            onClick={navigateNext}
                            className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors text-xs font-bold cursor-pointer"
                        >
                            &rarr;
                        </button>
                    </div>

                    {/* Add Maintenance Block Button */}
                    <button
                        type="button"
                        onClick={() => setShowBlockModal(true)}
                        className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-purple-600 hover:bg-purple-700 text-white shadow-lg transition-all cursor-pointer flex items-center gap-1.5"
                    >
                        <span>+ Maintenance Block</span>
                    </button>
                </div>
            </div>

            {/* Calendar Canvas View */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-6 shadow-xl transition-colors">
                {/* Days of Week Header */}
                <div className="grid grid-cols-7 gap-2 text-center text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 pb-3 border-b border-zinc-200 dark:border-zinc-800">
                    <span>Sun</span>
                    <span>Mon</span>
                    <span>Tue</span>
                    <span>Wed</span>
                    <span>Thu</span>
                    <span>Fri</span>
                    <span>Sat</span>
                </div>

                {loading ? (
                    <div className="py-20 text-center text-sm font-semibold text-zinc-500 dark:text-zinc-400 animate-pulse">
                        Loading vehicle calendar events...
                    </div>
                ) : (
                    <div className="grid grid-cols-7 gap-2 pt-3">
                        {/* Month offset blank days */}
                        {viewMode === 'month' && Array.from({ length: firstDayIndex }).map((_, idx) => (
                            <div key={`offset-${idx}`} className="min-h-[90px] rounded-xl bg-zinc-100/50 dark:bg-zinc-950/40 border border-zinc-200/50 dark:border-zinc-900/50" />
                        ))}

                        {/* Month Days Grid */}
                        {Array.from({ length: daysInMonth }).map((_, idx) => {
                            const dayNum = idx + 1;
                            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                            
                            // Filter events occurring on this date
                            const dayEvents = events.filter(ev => {
                                const evStart = ev.start.split('T')[0];
                                const evEnd = ev.end.split('T')[0];
                                return dateStr >= evStart && dateStr <= evEnd;
                            });

                            return (
                                <div
                                    key={dateStr}
                                    className="min-h-[110px] rounded-xl bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 p-2 flex flex-col justify-between hover:border-zinc-400 dark:hover:border-zinc-700 transition-colors"
                                >
                                    <div className="text-xs font-bold text-zinc-600 dark:text-zinc-400 mb-1">
                                        {dayNum}
                                    </div>

                                    {/* Events Container */}
                                    <div className="space-y-1 overflow-y-auto max-h-[80px] custom-scrollbar">
                                        {dayEvents.map((ev, evIdx) => (
                                            <div
                                                key={`${ev.id}-${evIdx}`}
                                                onClick={() => setSelectedEvent(ev)}
                                                className={`p-1.5 rounded-lg border text-[10px] font-bold truncate cursor-pointer transition-all hover:scale-[1.02] shadow-sm ${getBadgeStyle(ev.status)}`}
                                                title={`${ev.vehicle_name}: ${ev.title}`}
                                            >
                                                <div className="truncate font-black">{ev.vehicle_name}</div>
                                                <div className="opacity-90 truncate">{ev.title}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Event Detail Modal */}
            {selectedEvent && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-lg w-full p-6 text-zinc-900 dark:text-white space-y-5 shadow-2xl relative transition-colors">
                        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
                            <div className="flex items-center gap-2">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${getBadgeStyle(selectedEvent.status)}`}>
                                    {selectedEvent.status}
                                </span>
                                <h4 className="text-lg font-black uppercase tracking-wide">
                                    {selectedEvent.vehicle_name}
                                </h4>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedEvent(null)}
                                className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white font-black text-lg cursor-pointer"
                            >
                                &times;
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="space-y-3 text-xs">
                            <div className="grid grid-cols-2 gap-3 bg-zinc-50 dark:bg-zinc-950 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800">
                                <div>
                                    <span className="text-zinc-500 font-bold block uppercase text-[10px]">Plate Number</span>
                                    <span className="font-extrabold text-zinc-800 dark:text-zinc-200">{selectedEvent.plate_number || 'N/A'}</span>
                                </div>
                                <div>
                                    <span className="text-zinc-500 font-bold block uppercase text-[10px]">Event Type</span>
                                    <span className="font-extrabold text-zinc-800 dark:text-zinc-200 uppercase">{selectedEvent.type}</span>
                                </div>
                                <div>
                                    <span className="text-zinc-500 font-bold block uppercase text-[10px]">Start Schedule</span>
                                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{new Date(selectedEvent.start).toLocaleString()}</span>
                                </div>
                                <div>
                                    <span className="text-zinc-500 font-bold block uppercase text-[10px]">End Schedule</span>
                                    <span className="font-bold text-rose-600 dark:text-rose-400">{new Date(selectedEvent.end).toLocaleString()}</span>
                                </div>
                            </div>

                            {selectedEvent.type === 'booking' ? (
                                <div className="space-y-2 bg-zinc-50 dark:bg-zinc-950 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800">
                                    <div className="font-black text-[#FF3B30] uppercase tracking-wider text-[11px] pb-1 border-b border-zinc-200 dark:border-zinc-900">
                                        Customer & Booking Info
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-zinc-700 dark:text-zinc-300">
                                        <div><strong className="text-zinc-500 font-bold">Customer:</strong> {selectedEvent.customer_name}</div>
                                        <div><strong className="text-zinc-500 font-bold">Phone:</strong> {selectedEvent.customer_phone}</div>
                                        <div><strong className="text-zinc-500 font-bold">Email:</strong> {selectedEvent.customer_email}</div>
                                        <div><strong className="text-zinc-500 font-bold">Total Price:</strong> ₱{selectedEvent.total_price?.toLocaleString()}</div>
                                        <div><strong className="text-zinc-500 font-bold">Payment:</strong> <span className="uppercase font-bold">{selectedEvent.payment_method}</span></div>
                                        <div><strong className="text-zinc-500 font-bold">Pickup:</strong> {selectedEvent.pickup_location || 'Standard Meetup'}</div>
                                    </div>
                                    {selectedEvent.damage_notes && (
                                        <div className="mt-2 p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-400 text-[11px]">
                                            <strong>Recorded Vehicle Damage:</strong> {selectedEvent.damage_notes}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="bg-zinc-50 dark:bg-zinc-950 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 space-y-1">
                                    <div className="font-black text-purple-600 dark:text-purple-400 uppercase tracking-wider text-[11px]">
                                        Maintenance & Block Reason
                                    </div>
                                    <p className="text-xs text-zinc-600 dark:text-zinc-400">{selectedEvent.reason || 'No additional details logged.'}</p>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end pt-2">
                            <button
                                type="button"
                                onClick={() => setSelectedEvent(null)}
                                className="px-5 py-2 rounded-xl text-xs font-bold uppercase bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white transition-colors cursor-pointer"
                            >
                                Close View
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Maintenance Block Modal */}
            {showBlockModal && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 text-zinc-900 dark:text-white space-y-4 shadow-2xl transition-colors">
                        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
                            <h4 className="text-lg font-black uppercase tracking-wide text-purple-600 dark:text-purple-400">
                                Add Maintenance Block
                            </h4>
                            <button
                                type="button"
                                onClick={() => setShowBlockModal(false)}
                                className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white font-black text-lg cursor-pointer"
                            >
                                &times;
                            </button>
                        </div>

                        <form onSubmit={handleBlockSubmit} className="space-y-4 text-xs">
                            <div>
                                <label className="block text-zinc-600 dark:text-zinc-400 font-bold mb-1">Select Vehicle</label>
                                <select
                                    value={blockData.vehicle_id}
                                    onChange={(e) => setBlockData('vehicle_id', e.target.value)}
                                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 text-zinc-900 dark:text-white font-semibold"
                                    required
                                >
                                    <option value="">-- Choose Vehicle --</option>
                                    {vehicles.map(v => (
                                        <option key={v.id} value={v.id}>{v.name} ({v.plate_number || 'N/A'})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-zinc-600 dark:text-zinc-400 font-bold mb-1">Start Date</label>
                                    <input
                                        type="date"
                                        value={blockData.start_date}
                                        onChange={(e) => setBlockData('start_date', e.target.value)}
                                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-2 text-zinc-900 dark:text-white font-semibold"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-zinc-600 dark:text-zinc-400 font-bold mb-1">End Date</label>
                                    <input
                                        type="date"
                                        value={blockData.end_date}
                                        onChange={(e) => setBlockData('end_date', e.target.value)}
                                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-2 text-zinc-900 dark:text-white font-semibold"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-zinc-600 dark:text-zinc-400 font-bold mb-1">Reason / Notes</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Engine overhaul, Tire replacement, Detailing"
                                    value={blockData.reason}
                                    onChange={(e) => setBlockData('reason', e.target.value)}
                                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 text-zinc-900 dark:text-white font-semibold"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowBlockModal(false)}
                                    className="px-4 py-2 rounded-xl text-xs font-bold uppercase bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={blockProcessing}
                                    className="px-5 py-2 rounded-xl text-xs font-black uppercase bg-purple-600 hover:bg-purple-700 text-white shadow-lg cursor-pointer"
                                >
                                    Save Block Interval
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
