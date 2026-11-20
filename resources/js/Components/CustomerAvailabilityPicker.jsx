import React, { useState, useEffect } from 'react';
import { AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';

export default function CustomerAvailabilityPicker({ vehicle, startDate, endDate, onDateSelect }) {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [overlapError, setOverlapError] = useState(false);
    const [overlapMessage, setOverlapMessage] = useState('This vehicle is not available for the selected dates.');

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

    // Check if a given date string (YYYY-MM-DD) is booked, blocked, or in the past
    const getDateStatus = (dateStr) => {
        const target = new Date(dateStr + 'T00:00:00');

        // Check if date is in the past
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (target < today) {
            return { status: 'past', label: 'Past Date' };
        }

        if (vehicle.status === 'maintenance' || vehicle.status === 'unavailable') {
            return { status: 'unavailable', label: 'Unavailable' };
        }

        for (const ev of events) {
            const evStart = new Date(ev.start);
            const evEnd = new Date(ev.end);
            
            // Normalize dates to start of day for comparison
            const evStartDay = new Date(evStart.getFullYear(), evStart.getMonth(), evStart.getDate());
            const evEndDay = new Date(evEnd.getFullYear(), evEnd.getMonth(), evEnd.getDate());

            if (target >= evStartDay && target <= evEndDay) {
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

        // Check if start date is in the past (allow 30-min leeway for current time)
        if (start < new Date(Date.now() - 30 * 60 * 1000)) {
            setOverlapError(true);
            setOverlapMessage('Pickup date/time cannot be in the past. Please select today or a future date.');
            return;
        }

        if (start >= end) {
            setOverlapError(true);
            setOverlapMessage('Return date/time must be after the pickup date/time.');
            return;
        }

        let hasOverlap = false;
        let isPastDateIncluded = false;
        let curr = new Date(start);
        while (curr < end) {
            const dateStr = curr.toISOString().split('T')[0];
            const info = getDateStatus(dateStr);
            if (info.status === 'past') {
                isPastDateIncluded = true;
                hasOverlap = true;
                break;
            }
            if (info.status !== 'available') {
                hasOverlap = true;
                break;
            }
            curr.setDate(curr.getDate() + 1);
        }

        setOverlapError(hasOverlap);
        if (isPastDateIncluded) {
            setOverlapMessage('Selected rental range includes past dates. Please choose future dates.');
        } else if (hasOverlap) {
            setOverlapMessage('This vehicle is not available for the selected dates.');
        }
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
                        className="inline-flex items-center gap-1 p-1.5 px-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors text-xs font-bold cursor-pointer"
                    >
                        <ChevronLeft className="w-3.5 h-3.5" /> Prev
                    </button>
                    <span className="text-xs font-bold text-[#FF3B30] min-w-[100px] text-center">
                        {monthNames[month]} {year}
                    </span>
                    <button
                        type="button"
                        onClick={nextMonth}
                        className="inline-flex items-center gap-1 p-1.5 px-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors text-xs font-bold cursor-pointer"
                    >
                        Next <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* Overlap / Past Date Error Warning Banner */}
            {overlapError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-2 animate-pulse">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>{overlapMessage}</span>
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
                    <span>Booked</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-zinc-400 dark:bg-zinc-600" />
                    <span>Past</span>
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

                        // For client-facing calendar: show available vs booked vs past
                        let bgClass = "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30";
                        if (status === 'past') {
                            bgClass = "bg-zinc-100/60 dark:bg-zinc-900/40 text-zinc-400 dark:text-zinc-600 border-zinc-200/50 dark:border-zinc-800/50 line-through opacity-40 cursor-not-allowed select-none";
                        } else if (status !== 'available') {
                            bgClass = "bg-amber-500/10 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 font-bold";
                        }

                        const isSelected = (startDate && dateStr === startDate.split('T')[0]) || (endDate && dateStr === endDate.split('T')[0]);

                        return (
                            <div
                                key={dateStr}
                                className={`h-8 rounded-lg border flex items-center justify-center text-xs font-bold transition-all ${bgClass} ${
                                    isSelected ? 'ring-2 ring-red-500 shadow-md font-black scale-105' : ''
                                }`}
                                title={`${dateStr}: ${status === 'past' ? 'PAST DATE' : status === 'available' ? 'AVAILABLE' : 'BOOKED'}`}
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
