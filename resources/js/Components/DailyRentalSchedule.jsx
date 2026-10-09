import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Button } from '@/Components/Shadcn';
import { CalendarDays, ChevronLeft, ChevronRight, Calendar, Search, Filter, Clock, MapPin, AlertTriangle, User, DollarSign, X, CheckCircle } from 'lucide-react';

export default function DailyRentalSchedule({ vehicles = [], bookings = [] }) {
    const [startDate, setStartDate] = useState(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return today;
    });
    const [numDays, setNumDays] = useState(7);
    const [selectedType, setSelectedType] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [inspectingCell, setInspectingCell] = useState(null);

    // Generate array of dates starting from startDate
    const datesList = Array.from({ length: numDays }, (_, i) => {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i);
        return d;
    });

    const formatDateKey = (date) => {
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    };

    const formatDateHeader = (date) => {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return {
            dayName: days[date.getDay()],
            dayNum: date.getDate(),
            monthName: months[date.getMonth()],
            isToday: date.toDateString() === new Date().toDateString(),
        };
    };

    const formatExactTime = (datetimeStr) => {
        if (!datetimeStr) return '';
        const d = new Date(datetimeStr);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    const formatFullDateTime = (datetimeStr) => {
        if (!datetimeStr) return '';
        const d = new Date(datetimeStr);
        return d.toLocaleString([], { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit', 
            hour12: true 
        });
    };

    // Determine vehicle status for a specific date
    const getVehicleStatusForDate = (vehicle, dateObj) => {
        const dateStr = formatDateKey(dateObj);
        const dayStart = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), 0, 0, 0);
        const dayEnd = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), 23, 59, 59);

        // 1. Check under maintenance / unavailable status
        if (vehicle.status === 'maintenance' || vehicle.status === 'unavailable') {
            return {
                status: 'Under Maintenance',
                code: 'maintenance',
                bgClass: 'bg-zinc-800 text-zinc-100 border-zinc-700',
                badgeClass: 'bg-zinc-700 text-zinc-200 border-zinc-600',
                dotClass: 'bg-zinc-400',
            };
        }

        // 2. Find active bookings for this vehicle
        const vBookings = bookings.filter(b => 
            b.vehicle_id.toString() === vehicle.id.toString() &&
            ['pending', 'confirmed', 'rented', 'reserved'].includes(b.status)
        );

        let isPickup = false;
        let isReturn = false;
        let isCurrentlyRented = false;
        let isReserved = false;
        let activeBooking = null;

        for (const b of vBookings) {
            const bStart = new Date(b.start_datetime);
            const bEnd = new Date(b.end_datetime);

            const bStartStr = formatDateKey(bStart);
            const bEndStr = formatDateKey(bEnd);

            if (bStartStr === dateStr) {
                isPickup = true;
                activeBooking = b;
            }
            if (bEndStr === dateStr) {
                isReturn = true;
                activeBooking = b;
            }
            if (dayStart >= bStart && dayEnd <= bEnd) {
                if (b.status === 'rented' || b.status === 'confirmed') {
                    isCurrentlyRented = true;
                } else {
                    isReserved = true;
                }
                activeBooking = b;
            } else if (bStart <= dayEnd && bEnd >= dayStart) {
                if (b.status === 'rented' || b.status === 'confirmed') {
                    isCurrentlyRented = true;
                } else {
                    isReserved = true;
                }
                activeBooking = b;
            }
        }

        if (isPickup) {
            return {
                status: `Pickup @ ${formatExactTime(activeBooking?.start_datetime)}`,
                code: 'pickup',
                bgClass: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40 hover:border-amber-500',
                badgeClass: 'bg-amber-500 text-white',
                dotClass: 'bg-amber-500',
                booking: activeBooking,
                timeLabel: formatExactTime(activeBooking?.start_datetime),
            };
        }

        if (isReturn) {
            return {
                status: `Return @ ${formatExactTime(activeBooking?.end_datetime)}`,
                code: 'return',
                bgClass: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/40 hover:border-rose-500',
                badgeClass: 'bg-rose-600 text-white',
                dotClass: 'bg-rose-500',
                booking: activeBooking,
                timeLabel: formatExactTime(activeBooking?.end_datetime),
            };
        }

        if (isCurrentlyRented) {
            return {
                status: 'Currently Rented',
                code: 'rented',
                bgClass: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/40 hover:border-purple-500',
                badgeClass: 'bg-purple-600 text-white',
                dotClass: 'bg-purple-500',
                booking: activeBooking,
                timeLabel: `${formatExactTime(activeBooking?.start_datetime)} - ${formatExactTime(activeBooking?.end_datetime)}`,
            };
        }

        if (isReserved) {
            return {
                status: 'Reserved',
                code: 'reserved',
                bgClass: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/40 hover:border-sky-500',
                badgeClass: 'bg-sky-600 text-white',
                dotClass: 'bg-sky-500',
                booking: activeBooking,
                timeLabel: formatExactTime(activeBooking?.start_datetime),
            };
        }

        return {
            status: 'Available',
            code: 'available',
            bgClass: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 hover:border-emerald-500',
            badgeClass: 'bg-emerald-600 text-white',
            dotClass: 'bg-emerald-500',
        };
    };

    // Filter vehicles
    const vehicleTypes = ['All', ...new Set(vehicles.map(v => v.type))];
    const filteredVehicles = vehicles.filter(v => {
        const matchesType = selectedType === 'All' || v.type === selectedType;
        const matchesSearch = !searchQuery || 
            v.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            (v.plate_number && v.plate_number.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesType && matchesSearch;
    });

    const shiftDate = (days) => {
        const d = new Date(startDate);
        d.setDate(d.getDate() + days);
        setStartDate(d);
    };

    const resetToToday = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        setStartDate(today);
    };

    return (
        <>
            <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl rounded-xl overflow-hidden text-left transition-colors">
                <CardHeader className="px-6 pt-5 pb-4 border-b border-zinc-100 dark:border-zinc-800/80">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <CardTitle className="text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-white flex items-center gap-2">
                                <CalendarDays className="w-4 h-4 text-[#FF3B30]" /> Daily Rental Schedule & Fleet Status Matrix
                            </CardTitle>
                            <CardDescription className="text-zinc-500 dark:text-zinc-400 text-xs mt-0.5">
                                Real-time rental calendar tracking vehicle availability, exact pickup/return times, location surcharges, and conflict monitor.
                            </CardDescription>
                        </div>

                        {/* Navigation Controls */}
                        <div className="flex flex-wrap items-center gap-2">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => shiftDate(-numDays)} 
                                className="h-8 text-xs font-bold text-zinc-700 dark:text-zinc-300"
                            >
                                <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Prev {numDays} Days
                            </Button>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={resetToToday} 
                                className="h-8 text-xs font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white"
                            >
                                Today
                            </Button>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => shiftDate(numDays)} 
                                className="h-8 text-xs font-bold text-zinc-700 dark:text-zinc-300"
                            >
                                Next {numDays} Days <ChevronRight className="w-3.5 h-3.5 ml-1" />
                            </Button>
                            <select 
                                value={numDays}
                                onChange={(e) => setNumDays(Number(e.target.value))}
                                className="h-8 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-2 text-xs text-zinc-900 dark:text-white focus:border-[#FF3B30] focus:ring-0"
                            >
                                <option value={7}>7 Days View</option>
                                <option value={14}>14 Days View</option>
                            </select>
                        </div>
                    </div>

                    {/* Status Legend */}
                    <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/60 flex flex-wrap items-center gap-3 text-[11px] font-extrabold uppercase tracking-wider">
                        <span className="text-zinc-400 text-[10px]">Status Legend:</span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <span className="h-2 w-2 rounded-full bg-emerald-500" /> Available
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30">
                            <span className="h-2 w-2 rounded-full bg-sky-500" /> Reserved
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                            <span className="h-2 w-2 rounded-full bg-purple-500" /> Currently Rented
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                            <span className="h-2 w-2 rounded-full bg-amber-500" /> Scheduled Pickup
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                            <span className="h-2 w-2 rounded-full bg-rose-500" /> Scheduled Return
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-zinc-700">
                            <span className="h-2 w-2 rounded-full bg-zinc-400" /> Under Maintenance
                        </span>
                    </div>

                    {/* Filters bar */}
                    <div className="mt-3 flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-400" />
                            <input 
                                type="text" 
                                placeholder="Search vehicle name or plate number..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="h-9 w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 pl-9 pr-3 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:border-[#FF3B30] focus:ring-0"
                            />
                        </div>
                        <div className="relative">
                            <Filter className="w-4 h-4 absolute left-3 top-2.5 text-zinc-400" />
                            <select
                                value={selectedType}
                                onChange={(e) => setSelectedType(e.target.value)}
                                className="h-9 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 pl-9 pr-4 text-xs text-zinc-900 dark:text-white focus:border-[#FF3B30] focus:ring-0"
                            >
                                {vehicleTypes.map((t, idx) => (
                                    <option key={idx} value={t}>{t === 'All' ? 'All Vehicle Types' : t}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-0 overflow-x-auto">
                    {filteredVehicles.length === 0 ? (
                        <p className="text-center py-12 text-zinc-500 text-xs font-medium">No vehicles matching filter criteria.</p>
                    ) : (
                        <table className="w-full text-left border-collapse min-w-[850px]">
                            <thead>
                                <tr className="bg-zinc-50 dark:bg-zinc-950/80 border-b border-zinc-200 dark:border-zinc-800 text-[10px] font-black uppercase text-zinc-500 dark:text-zinc-400">
                                    <th className="p-3 sticky left-0 z-20 bg-zinc-50 dark:bg-zinc-950 w-64 shadow-sm border-r border-zinc-200 dark:border-zinc-800">
                                        Fleet Vehicle
                                    </th>
                                    {datesList.map((d, idx) => {
                                        const dh = formatDateHeader(d);
                                        return (
                                            <th 
                                                key={idx} 
                                                className={`p-2.5 text-center min-w-[125px] border-r border-zinc-200 dark:border-zinc-800 ${dh.isToday ? 'bg-amber-500/10 dark:bg-amber-500/20 text-[#FF3B30]' : ''}`}
                                            >
                                                <div className="font-extrabold text-[11px]">{dh.dayName}</div>
                                                <div className="text-[13px] font-black">{dh.dayNum} {dh.monthName}</div>
                                                {dh.isToday && <span className="inline-block mt-0.5 px-1.5 py-0.2 text-[9px] bg-[#FF3B30] text-white rounded font-bold uppercase">Today</span>}
                                            </th>
                                        );
                                    })}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-xs">
                                {filteredVehicles.map((vehicle) => (
                                    <tr key={vehicle.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-950/40 transition-colors">
                                        {/* Vehicle Info Cell */}
                                        <td className="p-3 sticky left-0 z-10 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 shadow-sm">
                                            <div className="font-extrabold text-zinc-900 dark:text-white text-xs">{vehicle.name}</div>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <span className="text-[10px] font-mono bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-700 dark:text-zinc-300 font-bold">
                                                    {vehicle.plate_number || 'N/A'}
                                                </span>
                                                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold">
                                                    • {vehicle.type}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Date Cells */}
                                        {datesList.map((d, dIdx) => {
                                            const st = getVehicleStatusForDate(vehicle, d);
                                            return (
                                                <td key={dIdx} className="p-1.5 border-r border-zinc-200 dark:border-zinc-800 align-middle">
                                                    <div 
                                                        onClick={() => setInspectingCell({ vehicle, date: d, statusInfo: st })}
                                                        className={`p-2 rounded-lg border flex flex-col justify-between h-16 text-left cursor-pointer transition-all hover:scale-[1.02] ${st.bgClass}`}
                                                        title={`Click to inspect exact dates, times, and location charges for ${vehicle.name}`}
                                                    >
                                                        <div className="flex items-center justify-between gap-1">
                                                            <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider">
                                                                <span className={`h-1.5 w-1.5 rounded-full ${st.dotClass}`} />
                                                                {st.code === 'available' ? 'Available' : st.code === 'pickup' ? 'Pickup' : st.code === 'return' ? 'Return' : st.code === 'rented' ? 'Rented' : st.code === 'reserved' ? 'Reserved' : 'Maint'}
                                                            </span>
                                                            {st.timeLabel && (
                                                                <span className="text-[9px] font-mono font-bold text-zinc-500 dark:text-zinc-300 bg-white/50 dark:bg-zinc-950/50 px-1 rounded">
                                                                    {st.timeLabel}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-[10px] font-bold truncate">
                                                            {st.booking ? (st.booking.user?.name || `Booking #${st.booking.id}`) : st.status}
                                                        </div>
                                                        {st.booking?.location_fee > 0 && (
                                                            <div className="text-[9px] text-amber-600 dark:text-amber-400 font-extrabold flex items-center gap-0.5">
                                                                <AlertTriangle className="w-2.5 h-2.5" /> +₱{parseFloat(st.booking.location_fee).toLocaleString()} Fee
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </CardContent>
            </Card>

            {/* Inspection & Conflict Watch Drawer Modal */}
            {inspectingCell && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-950">
                            <div className="flex items-center gap-2">
                                <Clock className="w-5 h-5 text-[#FF3B30]" />
                                <div>
                                    <h3 className="text-sm font-black uppercase tracking-wide text-zinc-900 dark:text-white">
                                        Vehicle Schedule & Conflict Inspector
                                    </h3>
                                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                                        Detailed breakdown of rental times, locations, and pricing for {inspectingCell.vehicle.name}
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setInspectingCell(null)}
                                className="p-1 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-5 text-left text-xs text-zinc-700 dark:text-zinc-300">
                            {/* Vehicle Overview */}
                            <div className="p-3.5 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between">
                                <div>
                                    <div className="font-extrabold text-zinc-900 dark:text-white text-sm">{inspectingCell.vehicle.name}</div>
                                    <div className="text-[11px] text-zinc-500">{inspectingCell.vehicle.type} • {inspectingCell.vehicle.seats} Seats • {inspectingCell.vehicle.transmission}</div>
                                </div>
                                <span className="font-mono text-xs bg-red-500/10 text-red-600 dark:text-red-400 font-black px-2.5 py-1 rounded-lg border border-red-500/20">
                                    {inspectingCell.vehicle.plate_number || 'NO PLATE'}
                                </span>
                            </div>

                            {/* Booking Schedule Details */}
                            {inspectingCell.statusInfo.booking ? (
                                <div className="space-y-4">
                                    {/* Renter Header */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <User className="w-4 h-4 text-zinc-400" />
                                            <span className="font-extrabold text-zinc-900 dark:text-white text-xs">
                                                {inspectingCell.statusInfo.booking.user?.name || 'Registered Renter'}
                                            </span>
                                        </div>
                                        <Badge className={`${inspectingCell.statusInfo.badgeClass} uppercase text-[9px]`}>
                                            {inspectingCell.statusInfo.booking.status}
                                        </Badge>
                                    </div>

                                    {/* Exact Dates and Times Grid */}
                                    <div className="grid grid-cols-2 gap-3 p-4 bg-zinc-100/70 dark:bg-zinc-950/80 rounded-xl border border-zinc-200 dark:border-zinc-800">
                                        <div>
                                            <span className="text-[10px] uppercase font-black text-amber-600 dark:text-amber-400 block mb-1">
                                                📅 Scheduled Pickup Time
                                            </span>
                                            <div className="font-bold text-zinc-900 dark:text-white text-xs">
                                                {formatFullDateTime(inspectingCell.statusInfo.booking.start_datetime)}
                                            </div>
                                            <div className="text-[10px] text-zinc-500 mt-1 flex items-center gap-1">
                                                <MapPin className="w-3 h-3 text-zinc-400" />
                                                {inspectingCell.statusInfo.booking.pickup_location || 'Standard HQ'}
                                            </div>
                                        </div>

                                        <div>
                                            <span className="text-[10px] uppercase font-black text-rose-600 dark:text-rose-400 block mb-1">
                                                🏁 Scheduled Return Time
                                            </span>
                                            <div className="font-bold text-zinc-900 dark:text-white text-xs">
                                                {formatFullDateTime(inspectingCell.statusInfo.booking.end_datetime)}
                                            </div>
                                            <div className="text-[10px] text-zinc-500 mt-1 flex items-center gap-1">
                                                <MapPin className="w-3 h-3 text-zinc-400" />
                                                {inspectingCell.statusInfo.booking.dropoff_location || inspectingCell.statusInfo.booking.pickup_location || 'Standard HQ'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Location-Based Pricing Surcharge Warning & Breakdown */}
                                    {inspectingCell.statusInfo.booking.location_fee > 0 && (
                                        <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-1">
                                            <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-extrabold text-xs">
                                                <AlertTriangle className="w-4 h-4" />
                                                Additional Location Fee Applied
                                            </div>
                                            <p className="text-[11px] text-amber-800 dark:text-amber-300">
                                                This reservation includes an extra location surcharge for delivery/pickup outside standard hubs.
                                            </p>
                                            <div className="pt-2 flex justify-between items-center text-xs font-mono font-bold text-zinc-900 dark:text-white border-t border-amber-500/20 mt-2">
                                                <span>Location Fee:</span>
                                                <span className="text-amber-600 dark:text-amber-400">+ ₱{parseFloat(inspectingCell.statusInfo.booking.location_fee).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Financial Total */}
                                    <div className="flex justify-between items-center p-3 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 font-bold text-xs">
                                        <span className="text-zinc-500">Total Reservation Charge:</span>
                                        <span className="text-sm font-black text-green-600 dark:text-green-400">
                                            ₱{parseFloat(inspectingCell.statusInfo.booking.total_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div className="py-8 text-center text-zinc-500 space-y-2">
                                    <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto" />
                                    <p className="font-extrabold text-zinc-900 dark:text-white text-xs">Vehicle Available on {formatDateKey(inspectingCell.date)}</p>
                                    <p className="text-[11px]">No active reservations scheduled for this date. Ready for instant booking.</p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex justify-end">
                            <Button size="sm" onClick={() => setInspectingCell(null)} className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold text-xs">
                                Close Inspector
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
