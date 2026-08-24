import React, { useState, useEffect } from 'react';

export default function SmartReportsDashboard({ isAdmin = true, stats = null, vehicles = [], bookings = [], documents = [] }) {
    const [timeRange, setTimeRange] = useState('this_month');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchInsightsData();
    }, [timeRange]);

    const fetchInsightsData = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/admin/reports/smart-insights-data?time_range=${timeRange}`);
            const json = await res.json();
            setData(json);
        } catch (err) {
            console.error('Failed to fetch smart insights data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleExportPDF = () => {
        window.print();
    };

    if (loading || !data) {
        return (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 text-center text-sm font-semibold text-zinc-500 dark:text-zinc-400 animate-pulse transition-colors">
                Analyzing fleet data & generating automated smart insights...
            </div>
        );
    }

    const { summary, vehicle_stats, insights } = data;

    const timeRangeLabels = {
        today: 'Today',
        this_week: 'This Week',
        this_month: 'This Month',
        last_month: 'Last Month',
        this_year: 'This Year'
    };

    const totalVehiclesCount = vehicles.length > 0 ? vehicles.length : (summary.total_vehicles || 1);
    const availableVehiclesCount = vehicles.length > 0 ? vehicles.filter(v => v.status === 'available').length : summary.available_vehicles;
    const pendingDocsCount = documents.length > 0 ? documents.filter(d => d.status === 'pending').length : 0;
    const totalBookingsCount = bookings.length > 0 ? bookings.length : (summary.total_rentals || 0);
    const completedBookingsCount = stats?.completed_bookings || summary.completed_rentals || 0;
    const fulfillmentRate = totalBookingsCount > 0 ? Math.round((completedBookingsCount / totalBookingsCount) * 100) : 0;

    return (
        <div className="space-y-6 font-sans">
            {/* ================================================================================= */}
            {/* DEDICATED EXECUTIVE PRINTABLE DOCUMENT (Visible ONLY when printing / exporting)  */}
            {/* ================================================================================= */}
            <div className="hidden print:block space-y-6 text-black bg-white p-2">
                {/* Executive Header & Branding */}
                <div className="border-b-2 border-zinc-900 pb-4 flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <div className="bg-[#FF3B30] text-white px-2.5 py-1 rounded font-black text-xs uppercase tracking-widest">
                                ELFAA
                            </div>
                            <span className="text-xl font-black uppercase tracking-wider text-zinc-900">
                                CAR RENTAL PLATFORM
                            </span>
                        </div>
                        <h2 className="text-base font-extrabold text-zinc-700 uppercase tracking-tight mt-1">
                            Executive Fleet Performance & AI Intelligence Report
                        </h2>
                    </div>
                    <div className="text-right text-[10px] text-zinc-600 space-y-0.5 font-medium">
                        <div><strong>Report Generated:</strong> {new Date().toLocaleString()}</div>
                        <div><strong>Selected Period:</strong> {timeRangeLabels[timeRange] || timeRange}</div>
                        <div><strong>System Engine:</strong> ELFAA Smart Analytics v1.0</div>
                    </div>
                </div>

                {/* 1. Key System Insights & Executive Metrics */}
                <div className="print-card border border-zinc-300 rounded-xl p-4 space-y-3">
                    <h3 className="text-xs font-black uppercase tracking-wider text-zinc-900 border-b border-zinc-200 pb-2">
                        1. Executive Highlights & Operational KPIs
                    </h3>
                    <div className="grid grid-cols-4 gap-3 text-left">
                        <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg">
                            <span className="text-[9px] font-black uppercase text-zinc-500 block">Fleet Availability</span>
                            <span className="text-lg font-black text-emerald-700">{availableVehiclesCount} / {totalVehiclesCount}</span>
                            <p className="text-[9px] text-zinc-600 mt-0.5">Deployment Ready</p>
                        </div>
                        <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg">
                            <span className="text-[9px] font-black uppercase text-zinc-500 block">Verification Queue</span>
                            <span className="text-lg font-black text-amber-700">{pendingDocsCount}</span>
                            <p className="text-[9px] text-zinc-600 mt-0.5">Pending Staff Review</p>
                        </div>
                        <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg">
                            <span className="text-[9px] font-black uppercase text-zinc-500 block">Fulfillment Rate</span>
                            <span className="text-lg font-black text-sky-700">{fulfillmentRate}%</span>
                            <p className="text-[9px] text-zinc-600 mt-0.5">Completed Rides Ratio</p>
                        </div>
                        <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg">
                            <span className="text-[9px] font-black uppercase text-zinc-500 block">Period Revenue</span>
                            <span className="text-lg font-black text-zinc-900">₱{summary.total_revenue?.toLocaleString()}</span>
                            <p className="text-[9px] text-zinc-600 mt-0.5">{completedBookingsCount} Finished Rides</p>
                        </div>
                    </div>
                </div>

                {/* 2. Automated Smart AI Operational Insights */}
                <div className="print-card border border-zinc-300 rounded-xl p-4 space-y-3">
                    <h3 className="text-xs font-black uppercase tracking-wider text-zinc-900 border-b border-zinc-200 pb-2">
                        2. Automated Rule-Based AI Operational Insights
                    </h3>
                    {insights.length === 0 ? (
                        <p className="text-xs text-zinc-500 py-2">No abnormal fleet conditions detected.</p>
                    ) : (
                        <div className="grid grid-cols-2 gap-3">
                            {insights.map((item, idx) => (
                                <div key={idx} className="p-3 rounded-lg border border-zinc-200 bg-zinc-50 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <span className="font-extrabold text-xs text-zinc-900">{item.title}</span>
                                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded border border-zinc-400 bg-white">
                                            {item.badge}
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-zinc-700 leading-snug">{item.message}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* 3. Vehicle Utilization Breakdown & Performance Ranking */}
                <div className="print-card border border-zinc-300 rounded-xl p-4 space-y-3">
                    <h3 className="text-xs font-black uppercase tracking-wider text-zinc-900 border-b border-zinc-200 pb-2">
                        3. Fleet Utilization & Vehicle Performance Ranking
                    </h3>
                    <table className="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr className="border-b border-zinc-300 text-[10px] font-black uppercase text-zinc-600">
                                <th className="py-2">Rank</th>
                                <th className="py-2">Vehicle Name</th>
                                <th className="py-2">Plate Number</th>
                                <th className="py-2 text-center">Reservations</th>
                                <th className="py-2 text-center">Current Status</th>
                                <th className="py-2 text-right">Utilization Share</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200">
                            {vehicle_stats.map((v, idx) => {
                                const maxCount = vehicle_stats[0]?.booking_count || 1;
                                const pct = Math.round((v.booking_count / Math.max(1, maxCount)) * 100);
                                return (
                                    <tr key={v.id}>
                                        <td className="py-2 font-black text-zinc-500">#{idx + 1}</td>
                                        <td className="py-2 font-extrabold text-zinc-900">{v.name}</td>
                                        <td className="py-2 font-mono text-zinc-600">{v.plate_number || 'N/A'}</td>
                                        <td className="py-2 text-center font-bold">{v.booking_count}</td>
                                        <td className="py-2 text-center">
                                            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded border border-zinc-300 bg-zinc-100">
                                                {v.status}
                                            </span>
                                        </td>
                                        <td className="py-2 text-right font-black text-zinc-900">{pct}%</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Executive Report Footer */}
                <div className="pt-4 border-t border-zinc-300 flex items-center justify-between text-[9px] text-zinc-500">
                    <div>ELFAA Car Rental Platform &copy; {new Date().getFullYear()} - Confidential Operations Report</div>
                    <div>Page 1 of 1</div>
                </div>
            </div>

            {/* ================================================================================= */}
            {/* INTERACTIVE ON-SCREEN DASHBOARD VIEW (Hidden when printing)                       */}
            {/* ================================================================================= */}
            <div className="print:hidden space-y-6 select-none transition-colors">
                {/* Header & Time Range Filters */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-xl transition-colors">
                    <div>
                        <h3 className="text-xl font-black uppercase tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
                            <span>Smart Fleet Analytics & Automated Insights</span>
                        </h3>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400">
                            Data-driven operational metrics & automated rule-based fleet recommendations
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {/* Time Range Selector */}
                        <div className="flex flex-wrap items-center gap-1.5 bg-zinc-100 dark:bg-zinc-950 p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-bold">
                            {['today', 'this_week', 'this_month', 'last_month', 'this_year'].map((rangeKey) => (
                                <button
                                    key={rangeKey}
                                    type="button"
                                    onClick={() => setTimeRange(rangeKey)}
                                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                                        timeRange === rangeKey 
                                            ? 'bg-[#FF3B30] text-white shadow font-black' 
                                            : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                                    }`}
                                >
                                    {timeRangeLabels[rangeKey]}
                                </button>
                            ))}
                        </div>

                        {/* Export PDF Executive Report Button */}
                        <button
                            type="button"
                            onClick={handleExportPDF}
                            className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 shadow-lg transition-all cursor-pointer flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span>Export PDF Report</span>
                        </button>
                    </div>
                </div>

                {/* KPI Summary Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 space-y-1 shadow-lg transition-colors">
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Period Revenue</span>
                        <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">₱{summary.total_revenue?.toLocaleString()}</div>
                        <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">{summary.completed_rentals} completed trips</span>
                    </div>

                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 space-y-1 shadow-lg transition-colors">
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Outstanding Payments</span>
                        <div className="text-2xl font-black text-rose-600 dark:text-rose-400">₱{summary.outstanding_payments?.toLocaleString()}</div>
                        <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">Pending verification</span>
                    </div>

                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 space-y-1 shadow-lg transition-colors">
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Total Reservations</span>
                        <div className="text-2xl font-black text-zinc-900 dark:text-white">{summary.total_rentals}</div>
                        <span className="text-[11px] font-semibold text-sky-600 dark:text-sky-400">{summary.active_rentals} active dispatch</span>
                    </div>

                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 space-y-1 shadow-lg transition-colors">
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Fleet Availability</span>
                        <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{availableVehiclesCount} / {totalVehiclesCount}</div>
                        <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400">{summary.maintenance_vehicles} in maintenance</span>
                    </div>
                </div>

                {/* Automated Rule-Based AI Insights Section */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 space-y-4 shadow-xl transition-colors">
                    <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
                        <div>
                            <h4 className="text-base font-black uppercase tracking-wide text-zinc-900 dark:text-white flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                Automated Executive AI Insights
                            </h4>
                            <p className="text-xs text-zinc-600 dark:text-zinc-400">System generated rule-based recommendations from active database records</p>
                        </div>
                        <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                            Real-time AI Engine
                        </span>
                    </div>

                    {insights.length === 0 ? (
                        <div className="py-6 text-center text-xs font-semibold text-zinc-500 dark:text-zinc-400">No abnormal fleet conditions detected for this time range.</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {insights.map((item, idx) => {
                                let cardColor = "bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300";
                                if (item.color === 'amber') cardColor = "bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300";
                                if (item.color === 'rose') cardColor = "bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-300";
                                if (item.color === 'indigo') cardColor = "bg-indigo-500/10 border-indigo-500/30 text-indigo-800 dark:text-indigo-300";
                                if (item.color === 'sky') cardColor = "bg-sky-500/10 border-sky-500/30 text-sky-800 dark:text-sky-300";

                                return (
                                    <div key={idx} className={`p-4 rounded-xl border space-y-2 shadow-sm ${cardColor}`}>
                                        <div className="flex items-center justify-between">
                                            <h5 className="font-extrabold text-sm text-zinc-900 dark:text-white">{item.title}</h5>
                                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-black/10 dark:bg-black/40 border border-current">
                                                {item.badge}
                                            </span>
                                        </div>
                                        <p className="text-xs leading-relaxed opacity-90 font-medium">{item.message}</p>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Vehicle Utilization Leaderboard */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 space-y-4 shadow-xl transition-colors">
                    <h4 className="text-base font-black uppercase tracking-wide text-zinc-900 dark:text-white">
                        Vehicle Utilization Breakdown & Ranking
                    </h4>

                    <div className="space-y-3">
                        {vehicle_stats.map((v) => {
                            const maxCount = vehicle_stats[0]?.booking_count || 1;
                            const pct = Math.round((v.booking_count / Math.max(1, maxCount)) * 100);

                            return (
                                <div key={v.id} className="bg-zinc-50 dark:bg-zinc-950 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-2">
                                    <div className="flex items-center justify-between text-xs font-bold">
                                        <div className="flex items-center gap-2">
                                            <span className="text-zinc-900 dark:text-white font-extrabold">{v.name}</span>
                                            <span className="text-zinc-500 font-mono">({v.plate_number || 'N/A'})</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-zinc-600 dark:text-zinc-400">{v.booking_count} Reservations</span>
                                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                                                v.status === 'available' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20'
                                            }`}>
                                                {v.status}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="w-full h-2 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                                        <div
                                            className="h-full bg-[#FF3B30] rounded-full transition-all duration-500"
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
