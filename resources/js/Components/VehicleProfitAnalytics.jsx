import React, { useState, useEffect, useCallback } from 'react';
import { router } from '@inertiajs/react';
import {
    TrendingUp, TrendingDown, DollarSign, Car, Wrench, ShoppingCart,
    Target, ChevronDown, ChevronUp, Plus, Trash2, X, AlertTriangle,
    CheckCircle, MinusCircle, BarChart3, Calendar, Filter
} from 'lucide-react';

const fmt = (n) => `PHP ${parseFloat(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
const fmtSmall = (n) => parseFloat(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2 });

const BREAK_EVEN_CONFIG = {
    reached:    { label: 'Break-Even Reached', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30', icon: CheckCircle },
    profitable: { label: 'Profitable',          color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30', icon: CheckCircle },
    in_progress:{ label: 'In Progress',          color: 'text-amber-600 dark:text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/30',   icon: Target },
    loss:       { label: 'Net Loss',             color: 'text-rose-600 dark:text-rose-400',      bg: 'bg-rose-500/10 border-rose-500/30',      icon: MinusCircle },
};

function SummaryCard({ icon: Icon, label, value, sub, color = 'text-[#FF3B30]' }) {
    return (
        <div className="flex flex-col gap-1 p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
            <div className={`flex items-center gap-2 text-xs font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400`}>
                <Icon size={14} />
                {label}
            </div>
            <div className={`text-lg font-black ${color}`}>{value}</div>
            {sub && <div className="text-[10px] text-zinc-400">{sub}</div>}
        </div>
    );
}

function ExpenseTypeLabel({ type }) {
    const map = {
        maintenance: { label: 'Maintenance', color: 'text-blue-600 bg-blue-500/10 border-blue-500/20' },
        repair:      { label: 'Repair',      color: 'text-amber-600 bg-amber-500/10 border-amber-500/20' },
        other:       { label: 'Other',       color: 'text-zinc-500 bg-zinc-500/10 border-zinc-500/20' },
    };
    const cfg = map[type] || map.other;
    return (
        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-black uppercase border ${cfg.color}`}>
            {cfg.label}
        </span>
    );
}

export default function VehicleProfitAnalytics({ vehicles: initialVehicles = [] }) {
    const [analytics, setAnalytics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [filterVehicleId, setFilterVehicleId] = useState('');
    const [expandedId, setExpandedId] = useState(null);

    // Add expense modal state
    const [addExpenseFor, setAddExpenseFor] = useState(null); // vehicle id
    const [expenseForm, setExpenseForm] = useState({ expense_type: 'maintenance', amount: '', description: '', expense_date: '' });
    const [expenseSubmitting, setExpenseSubmitting] = useState(false);

    const fetchAnalytics = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (dateFrom) params.set('date_from', dateFrom);
            if (dateTo)   params.set('date_to',   dateTo);
            if (filterVehicleId) params.set('vehicle_id', filterVehicleId);

            const res = await fetch(`/admin/vehicle-analytics?${params.toString()}`, {
                headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            });
            const json = await res.json();
            setAnalytics(json.analytics || []);
        } catch (e) {
            console.error('Failed to fetch analytics:', e);
        } finally {
            setLoading(false);
        }
    }, [dateFrom, dateTo, filterVehicleId]);

    useEffect(() => {
        fetchAnalytics();
    }, [fetchAnalytics]);

    // Summary totals
    const totalRevenue   = analytics.reduce((s, v) => s + v.gross_revenue, 0);
    const totalExpenses  = analytics.reduce((s, v) => s + v.total_expenses, 0);
    const totalNetProfit = analytics.reduce((s, v) => s + v.net_profit, 0);
    const totalRentals   = analytics.reduce((s, v) => s + v.completed_rentals, 0);

    const handleAddExpense = async (e) => {
        e.preventDefault();
        if (!addExpenseFor) return;
        setExpenseSubmitting(true);
        try {
            const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            const res = await fetch('/admin/vehicle-expenses', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': token,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({ vehicle_id: addExpenseFor, ...expenseForm }),
            });
            if (res.ok) {
                setAddExpenseFor(null);
                setExpenseForm({ expense_type: 'maintenance', amount: '', description: '', expense_date: '' });
                fetchAnalytics();
            }
        } finally {
            setExpenseSubmitting(false);
        }
    };

    const handleDeleteExpense = async (expenseId) => {
        if (!confirm('Delete this expense record?')) return;
        const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        await fetch(`/admin/vehicle-expenses/${expenseId}/destroy`, {
            method: 'POST',
            headers: { 'X-CSRF-TOKEN': token, 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        });
        fetchAnalytics();
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-white">Per-Vehicle Profit Analytics</h2>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Revenue, expenses, and break-even status per fleet vehicle.</p>
                </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                    <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">From Date</label>
                    <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                        className="w-full h-9 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 text-xs text-zinc-900 dark:text-white" />
                </div>
                <div>
                    <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">To Date</label>
                    <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                        className="w-full h-9 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 text-xs text-zinc-900 dark:text-white" />
                </div>
                <div>
                    <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Vehicle</label>
                    <select value={filterVehicleId} onChange={e => setFilterVehicleId(e.target.value)}
                        className="w-full h-9 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 text-xs text-zinc-900 dark:text-white">
                        <option value="">All Vehicles</option>
                        {initialVehicles.map(v => (
                            <option key={v.id} value={v.id}>{v.name}</option>
                        ))}
                    </select>
                </div>
                <div className="flex items-end">
                    <button onClick={() => { setDateFrom(''); setDateTo(''); setFilterVehicleId(''); }}
                        className="h-9 px-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors w-full">
                        Clear Filters
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <SummaryCard icon={DollarSign} label="Total Revenue"  value={fmt(totalRevenue)}   color="text-[#FF3B30]" sub={`from ${totalRentals} rentals`} />
                <SummaryCard icon={Wrench}     label="Total Expenses" value={fmt(totalExpenses)}  color="text-amber-600 dark:text-amber-400" />
                <SummaryCard icon={totalNetProfit >= 0 ? TrendingUp : TrendingDown} label="Net Profit / Loss"
                    value={fmt(Math.abs(totalNetProfit))} color={totalNetProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}
                    sub={totalNetProfit < 0 ? 'Net Loss' : 'Net Profit'} />
                <SummaryCard icon={Car} label="Fleet Tracked" value={`${analytics.length} vehicles`} color="text-zinc-700 dark:text-zinc-300" />
            </div>

            {/* Vehicle Table */}
            {loading ? (
                <div className="flex items-center justify-center py-16 text-zinc-400">
                    <div className="flex flex-col items-center gap-3">
                        <div className="h-8 w-8 border-2 border-zinc-200 dark:border-zinc-700 border-t-[#FF3B30] rounded-full animate-spin" />
                        <span className="text-xs">Loading vehicle analytics...</span>
                    </div>
                </div>
            ) : analytics.length === 0 ? (
                <div className="flex items-center justify-center py-16 text-zinc-400 text-xs">No vehicle data available.</div>
            ) : (
                <div className="space-y-3">
                    {analytics.map(v => {
                        const beCfg = BREAK_EVEN_CONFIG[v.break_even_status] || BREAK_EVEN_CONFIG.in_progress;
                        const BeIcon = beCfg.icon;
                        const isExpanded = expandedId === v.id;

                        return (
                            <div key={v.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
                                {/* Row Header */}
                                <button
                                    className="w-full text-left p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                                    onClick={() => setExpandedId(isExpanded ? null : v.id)}
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                        {/* Vehicle info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <Car size={14} className="text-zinc-400 shrink-0" />
                                                <span className="font-black text-xs text-zinc-900 dark:text-white truncate">{v.name}</span>
                                                <span className="text-[9px] text-zinc-400 font-semibold">{v.plate_number}</span>
                                            </div>
                                            <div className="text-[10px] text-zinc-400 mt-0.5">{v.type} · {v.completed_rentals} completed rentals</div>
                                        </div>

                                        {/* Key financials */}
                                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 text-center">
                                            <div>
                                                <div className="text-[9px] text-zinc-400 uppercase tracking-widest">Revenue</div>
                                                <div className="text-xs font-black text-zinc-900 dark:text-white">PHP {fmtSmall(v.gross_revenue)}</div>
                                            </div>
                                            <div>
                                                <div className="text-[9px] text-zinc-400 uppercase tracking-widest">Expenses</div>
                                                <div className="text-xs font-black text-amber-600 dark:text-amber-400">PHP {fmtSmall(v.total_expenses)}</div>
                                            </div>
                                            <div>
                                                <div className="text-[9px] text-zinc-400 uppercase tracking-widest">Net P/L</div>
                                                <div className={`text-xs font-black ${v.net_profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                                    {v.net_profit < 0 ? '-' : ''}PHP {fmtSmall(Math.abs(v.net_profit))}
                                                </div>
                                            </div>
                                            <div className="hidden sm:block">
                                                <div className="text-[9px] text-zinc-400 uppercase tracking-widest">Purchase Cost</div>
                                                <div className="text-xs font-black text-zinc-900 dark:text-white">{v.purchase_cost > 0 ? `PHP ${fmtSmall(v.purchase_cost)}` : '—'}</div>
                                            </div>
                                            <div className="hidden sm:block">
                                                <div className="text-[9px] text-zinc-400 uppercase tracking-widest">Break-Even</div>
                                                <div className={`inline-flex items-center gap-1 text-[9px] font-bold ${beCfg.color}`}>
                                                    <BeIcon size={10} />
                                                    {beCfg.label}
                                                </div>
                                            </div>
                                        </div>

                                        {isExpanded ? <ChevronUp size={14} className="text-zinc-400 shrink-0" /> : <ChevronDown size={14} className="text-zinc-400 shrink-0" />}
                                    </div>
                                </button>

                                {/* Expanded Detail Panel */}
                                {isExpanded && (
                                    <div className="border-t border-zinc-200 dark:border-zinc-800 p-4 space-y-5">

                                        {/* Financial breakdown */}
                                        <div>
                                            <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3">Financial Breakdown</div>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800">
                                                    <div className="text-[9px] text-zinc-400 uppercase tracking-widest">Base Rental Revenue</div>
                                                    <div className="text-sm font-black text-zinc-900 dark:text-white mt-0.5">PHP {fmtSmall(v.rental_revenue)}</div>
                                                </div>
                                                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800">
                                                    <div className="text-[9px] text-zinc-400 uppercase tracking-widest">Location Fees Collected</div>
                                                    <div className="text-sm font-black text-amber-600 dark:text-amber-400 mt-0.5">PHP {fmtSmall(v.location_fee_total)}</div>
                                                </div>
                                                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800">
                                                    <div className="text-[9px] text-zinc-400 uppercase tracking-widest">Discounts Given</div>
                                                    <div className="text-sm font-black text-rose-500 mt-0.5">- PHP {fmtSmall(v.discount_given)}</div>
                                                </div>
                                                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800">
                                                    <div className="text-[9px] text-zinc-400 uppercase tracking-widest">Total Operating Expenses</div>
                                                    <div className="text-sm font-black text-amber-600 dark:text-amber-400 mt-0.5">PHP {fmtSmall(v.total_expenses)}</div>
                                                </div>
                                                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800">
                                                    <div className="text-[9px] text-zinc-400 uppercase tracking-widest">Vehicle Purchase Cost</div>
                                                    <div className="text-sm font-black text-zinc-900 dark:text-white mt-0.5">{v.purchase_cost > 0 ? `PHP ${fmtSmall(v.purchase_cost)}` : 'Not set'}</div>
                                                </div>
                                                <div className={`p-3 rounded-xl border ${beCfg.bg}`}>
                                                    <div className="text-[9px] text-zinc-400 uppercase tracking-widest">Net Profit / Loss</div>
                                                    <div className={`text-sm font-black mt-0.5 ${beCfg.color}`}>
                                                        {v.net_profit < 0 ? '- ' : ''}PHP {fmtSmall(Math.abs(v.net_profit))}
                                                    </div>
                                                    <div className={`text-[9px] font-bold mt-1 flex items-center gap-1 ${beCfg.color}`}>
                                                        <BeIcon size={10} /> {beCfg.label}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Expense Log */}
                                        <div>
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Maintenance & Expense Log</div>
                                                <button
                                                    onClick={() => { setAddExpenseFor(v.id); setExpenseForm({ expense_type: 'maintenance', amount: '', description: '', expense_date: '' }); }}
                                                    className="flex items-center gap-1 px-2.5 h-7 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg text-[10px] font-black hover:opacity-80 transition-opacity"
                                                >
                                                    <Plus size={11} /> Add Expense
                                                </button>
                                            </div>

                                            {v.expenses.length === 0 ? (
                                                <p className="text-xs text-zinc-400 italic">No expense records logged for this vehicle.</p>
                                            ) : (
                                                <div className="space-y-2">
                                                    {v.expenses.map(exp => (
                                                        <div key={exp.id} className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800">
                                                            <div className="flex items-center gap-2 min-w-0">
                                                                <ExpenseTypeLabel type={exp.expense_type} />
                                                                <span className="text-xs text-zinc-700 dark:text-zinc-300 font-semibold truncate">{exp.description || '—'}</span>
                                                            </div>
                                                            <div className="flex items-center gap-3 shrink-0">
                                                                <span className="text-xs font-black text-zinc-900 dark:text-white">PHP {fmtSmall(exp.amount)}</span>
                                                                <span className="text-[10px] text-zinc-400">{exp.expense_date}</span>
                                                                <button onClick={() => handleDeleteExpense(exp.id)}
                                                                    className="text-rose-400 hover:text-rose-600 transition-colors">
                                                                    <Trash2 size={12} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Add Expense Modal */}
            {addExpenseFor && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-md">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 dark:border-zinc-800">
                            <div>
                                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-900 dark:text-white">Log Vehicle Expense</h3>
                                <p className="text-[10px] text-zinc-400 mt-0.5">
                                    {analytics.find(v => v.id === addExpenseFor)?.name}
                                </p>
                            </div>
                            <button onClick={() => setAddExpenseFor(null)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"><X size={16} /></button>
                        </div>
                        <form onSubmit={handleAddExpense} className="p-5 space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">Expense Type</label>
                                <select value={expenseForm.expense_type} onChange={e => setExpenseForm(f => ({ ...f, expense_type: e.target.value }))}
                                    className="w-full h-9 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 text-xs">
                                    <option value="maintenance">Maintenance</option>
                                    <option value="repair">Repair</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">Amount (PHP)</label>
                                <input type="number" step="0.01" min="0" required value={expenseForm.amount}
                                    onChange={e => setExpenseForm(f => ({ ...f, amount: e.target.value }))}
                                    placeholder="0.00"
                                    className="w-full h-9 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 text-xs" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">Description</label>
                                <input type="text" value={expenseForm.description}
                                    onChange={e => setExpenseForm(f => ({ ...f, description: e.target.value }))}
                                    placeholder="e.g. Oil change, brake pads, tire replacement..."
                                    className="w-full h-9 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 text-xs" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">Date</label>
                                <input type="date" required value={expenseForm.expense_date}
                                    onChange={e => setExpenseForm(f => ({ ...f, expense_date: e.target.value }))}
                                    className="w-full h-9 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 text-xs" />
                            </div>
                            <div className="flex gap-3 pt-1">
                                <button type="button" onClick={() => setAddExpenseFor(null)}
                                    className="flex-1 h-9 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" disabled={expenseSubmitting}
                                    className="flex-1 h-9 bg-[#FF3B30] text-white rounded-lg text-xs font-black hover:bg-red-700 transition-colors disabled:opacity-50">
                                    {expenseSubmitting ? 'Saving...' : 'Save Expense'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
