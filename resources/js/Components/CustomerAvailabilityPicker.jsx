import React, { useState, useEffect } from 'react';

export default function CustomerAvailabilityPicker({ vehicle, startDate, endDate, onDateSelect }) {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [overlapError, setOverlapError] = useState(false);

    useEffect(() => {
        if (!vehicle) return;
        fetchAvailability();
    }, [vehicle, currentMonth]);

    const fetchAvailability = async () => {
        setLoading(true);
        try {
            const startStr = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).toISOString();
            const endStr = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).toISOString();

            const res = await fetch(`/api/calendar/customer?vehicle_id=${vehicle.id}&start=${startStr}&end=${endStr}`);
            const data = await res.json();
            setEvents(data.events || []);
        } catch (err) {
            console.error('Error fetching vehicle availability feed:', err);
        } finally {
            setLoading(false);
        }
    };

    // Check if a given date string (YYYY-MM-DD) is booked or blocked
    const getDateStatus = (dateStr) => {
        if (vehicle.status === 'maintenance' || vehicle.status === 'unavailable') {
            return { status: 'unavailable', label: 'Unavailable' };
        }

        const target = new Date(dateStr + 'T00:00:00');

        for (const ev of events) {
            const evStart = new Date(ev.start);
            const evEnd = new Date(ev.end);
            
            // Normalize dates to start of day for comparison
            const evStartDay = new Date(evStart.getFullYear(), evStart.getMonth(), evStart.getDate());
            const evEndDay = new Date(evEnd.getFullYear(), evEnd.getMonth(), evEnd.getDate());

            if (target >= evStartDay && target <= evEndDay) {
                if (ev.status === 'maintenance') return { status: 'maintenance', label: 'Maintenance' };
                if (ev.status === 'rented') return { status: 'rented', label: 'Rented' };
                if (ev.status === 'reserved' || ev.status === 'confirmed' || ev.status === 'pending') return { status: 'reserved', label: 'Reserved' };
                return { status: 'unavailable', label: 'Unavailable' };
            }
        }

        return { status: 'available', label: 'Available' };
    };

    // Validate selected date range whenever startDate or endDate changes
    useEffect(() => {
        if (!startDate || !endDate) {
            setOverlapError(false);
            return;
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (start >= end) {
            setOverlapError(false);
            return;
        }

        let hasOverlap = false;
        let curr = new Date(start);
        while (curr < end) {
            const dateStr = curr.toISOString().split('T')[0];
            const info = getDateStatus(dateStr);
            if (info.status !== 'available') {
                hasOverlap = true;
                break;
            }
            curr.setDate(curr.getDate() + 1);
        }

        setOverlapError(hasOverlap);
    }, [startDate, endDate, events]);

    // Calendar grid calculations
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

    return (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 text-zinc-900 dark:text-white space-y-4 shadow-md transition-colors">
            <div className="flex items-center justify-between">
                <div>
                    <h4 className="text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-white">
                        Vehicle Availability Calendar
                    </h4>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">
                        {vehicle ? `${vehicle.name} (${vehicle.plate_number || 'Available'})` : 'Select dates'}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={prevMonth}
                        className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors text-xs font-bold cursor-pointer"
                    >
                        &larr; Prev
                    </button>
                    <span className="text-xs font-bold text-[#FF3B30] min-w-[100px] text-center">
                        {monthNames[month]} {year}
                    </span>
                    <button
                        type="button"
                        onClick={nextMonth}
                        className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors text-xs font-bold cursor-pointer"
                    >
                        Next &rarr;
                    </button>
                </div>
            </div>

            {/* Overlap Error Warning Banner */}
            {overlapError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-2 animate-pulse">
                    <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span>This vehicle is not available for the selected dates.</span>
                </div>
            )}

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold text-zinc-600 dark:text-zinc-400 pt-1">
                <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span>Available</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span>Reserved</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                    <span>Rented</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                    <span>Maintenance</span>
                </div>
            </div>

            {/* Calendar Days Header */}
            <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-black text-zinc-500 dark:text-zinc-400 uppercase">
                <span>Sun</span>
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
            </div>

            {/* Calendar Days Grid */}
            {loading ? (
                <div className="py-8 text-center text-xs font-bold text-zinc-500 dark:text-zinc-400">Loading schedule...</div>
            ) : (
                <div className="grid grid-cols-7 gap-1">
                    {/* Blank offset days */}
                    {Array.from({ length: firstDayIndex }).map((_, i) => (
                        <div key={`blank-${i}`} className="h-8 rounded-lg bg-zinc-100 dark:bg-zinc-950/40" />
                    ))}

                    {/* Month Days */}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                        const dayNum = i + 1;
                        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                        const { status } = getDateStatus(dateStr);

                        let bgClass = "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30";
                        if (status === 'reserved') bgClass = "bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30";
                        if (status === 'rented') bgClass = "bg-sky-500/20 text-sky-700 dark:text-sky-400 border-sky-500/30";
                        if (status === 'maintenance') bgClass = "bg-purple-500/20 text-purple-700 dark:text-purple-400 border-purple-500/30";
                        if (status === 'unavailable') bgClass = "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 border-zinc-200 dark:border-zinc-700 opacity-60";

                        const isSelected = (startDate && dateStr === startDate.split('T')[0]) || (endDate && dateStr === endDate.split('T')[0]);

                        return (
                            <div
                                key={dateStr}
                                className={`h-8 rounded-lg border flex items-center justify-center text-xs font-bold transition-all ${bgClass} ${
                                    isSelected ? 'ring-2 ring-red-500 shadow-md font-black scale-105' : ''
                                }`}
                                title={`${dateStr}: ${status.toUpperCase()}`}
                            >
                                {dayNum}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
