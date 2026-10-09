import React, { useState } from 'react';
import { useForm, router } from '@inertiajs/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Button, Input } from '@/Components/Shadcn';
import { Receipt, Plus, Search, Filter, Trash2, Edit, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

export default function BillRecordsManager({ billRecords = [], showConfirm }) {
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedStatus, setSelectedStatus] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editingBill, setEditingBill] = useState(null);

    const billForm = useForm({
        biller_name: '',
        bill_category: 'Electricity',
        account_number: '',
        amount: '',
        due_date: '',
        payment_date: '',
        status: 'pending',
        notes: '',
    });

    const openAddModal = () => {
        billForm.reset();
        setEditingBill(null);
        setModalOpen(true);
    };

    const openEditModal = (bill) => {
        setEditingBill(bill.id);
        billForm.setData({
            biller_name: bill.biller_name || '',
            bill_category: bill.bill_category || 'Electricity',
            account_number: bill.account_number || '',
            amount: bill.amount || '',
            due_date: bill.due_date ? bill.due_date.substring(0, 10) : '',
            payment_date: bill.payment_date ? bill.payment_date.substring(0, 10) : '',
            status: bill.status || 'pending',
            notes: bill.notes || '',
        });
        setModalOpen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const actionUrl = editingBill 
            ? route('admin.bill_records.update', editingBill) 
            : route('admin.bill_records.store');

        billForm.post(actionUrl, {
            preserveScroll: true,
            onSuccess: () => {
                setModalOpen(false);
                billForm.reset();
            }
        });
    };

    const handleDelete = (billId) => {
        showConfirm({
            title: 'Delete Bill Record',
            message: 'Are you sure you want to delete this bill record? This action cannot be undone.',
            actionLabel: 'Delete Bill',
            actionClass: 'bg-rose-600 hover:bg-rose-700 text-white',
            onConfirm: () => router.post(route('admin.bill_records.destroy', billId)),
        });
    };

    // Calculate Summary Stats
    const totalAmount = billRecords.reduce((sum, b) => sum + parseFloat(b.amount || 0), 0);
    const paidAmount = billRecords.filter(b => b.status === 'paid').reduce((sum, b) => sum + parseFloat(b.amount || 0), 0);
    const pendingAmount = billRecords.filter(b => b.status === 'pending').reduce((sum, b) => sum + parseFloat(b.amount || 0), 0);
    const overdueAmount = billRecords.filter(b => b.status === 'overdue').reduce((sum, b) => sum + parseFloat(b.amount || 0), 0);

    // Filtering
    const categories = ['All', 'Electricity', 'Water', 'Internet', 'Vehicle Fleet', 'Maintenance', 'Other'];
    const statuses = ['All', 'pending', 'paid', 'overdue', 'cancelled'];

    const filteredRecords = billRecords.filter(b => {
        const matchesCategory = selectedCategory === 'All' || b.bill_category === selectedCategory;
        const matchesStatus = selectedStatus === 'All' || b.status === selectedStatus;
        const matchesSearch = !searchQuery || 
            b.biller_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            (b.account_number && b.account_number.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesCategory && matchesStatus && matchesSearch;
    });

    const getStatusBadge = (status) => {
        switch (status) {
            case 'paid':
                return <Badge className="bg-green-600 text-white font-bold uppercase text-[10px]">Paid</Badge>;
            case 'overdue':
                return <Badge className="bg-rose-600 text-white font-bold uppercase text-[10px]">Overdue</Badge>;
            case 'cancelled':
                return <Badge className="bg-zinc-600 text-white font-bold uppercase text-[10px]">Cancelled</Badge>;
            default:
                return <Badge className="bg-amber-500 text-white font-bold uppercase text-[10px]">Pending</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            {/* Overview Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl shadow-md text-left transition-colors">
                    <div className="text-[10px] uppercase font-black text-zinc-400 tracking-wider">Total Bill Records</div>
                    <div className="text-xl font-extrabold text-zinc-900 dark:text-white mt-1">₱{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                    <div className="text-[10px] text-zinc-500 mt-1">{billRecords.length} Total Registered Bills</div>
                </Card>

                <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl shadow-md text-left transition-colors">
                    <div className="text-[10px] uppercase font-black text-green-500 tracking-wider">Paid Bills</div>
                    <div className="text-xl font-extrabold text-green-600 dark:text-green-400 mt-1">₱{paidAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                    <div className="text-[10px] text-zinc-500 mt-1">{billRecords.filter(b => b.status === 'paid').length} Settled Invoices</div>
                </Card>

                <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl shadow-md text-left transition-colors">
                    <div className="text-[10px] uppercase font-black text-amber-500 tracking-wider">Pending Payables</div>
                    <div className="text-xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">₱{pendingAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                    <div className="text-[10px] text-zinc-500 mt-1">{billRecords.filter(b => b.status === 'pending').length} Awaiting Payment</div>
                </Card>

                <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl shadow-md text-left transition-colors">
                    <div className="text-[10px] uppercase font-black text-rose-500 tracking-wider">Overdue Alerts</div>
                    <div className="text-xl font-extrabold text-rose-600 dark:text-rose-400 mt-1">₱{overdueAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                    <div className="text-[10px] text-zinc-500 mt-1">{billRecords.filter(b => b.status === 'overdue').length} Overdue Payments</div>
                </Card>
            </div>

            {/* Bill Records Table & Filters */}
            <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl rounded-xl overflow-hidden text-left transition-colors">
                <CardHeader className="px-6 pt-5 pb-4 border-b border-zinc-100 dark:border-zinc-800/80">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <CardTitle className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-white flex items-center gap-2">
                                <Receipt className="w-4 h-4 text-[#FF3B30]" /> Utility & Recurring Bill Records Management
                            </CardTitle>
                            <CardDescription className="text-zinc-500 dark:text-zinc-400 text-xs mt-0.5">
                                Track electricity, water, internet, fleet, and operational utility bills, due dates, and payment history.
                            </CardDescription>
                        </div>
                        <Button
                            onClick={openAddModal}
                            className="bg-[#FF3B30] hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider px-4 h-9 cursor-pointer"
                        >
                            + Record New Bill
                        </Button>
                    </div>

                    {/* Filter controls */}
                    <div className="mt-4 flex flex-col sm:flex-row gap-3">
                        <input
                            type="text"
                            placeholder="Search biller name or account number..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-9 flex-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:border-[#FF3B30] focus:ring-0"
                        />
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="h-9 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 text-xs text-zinc-900 dark:text-white focus:border-[#FF3B30] focus:ring-0"
                        >
                            {categories.map((c, i) => (
                                <option key={i} value={c}>{c === 'All' ? 'All Categories' : c}</option>
                            ))}
                        </select>
                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="h-9 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 text-xs text-zinc-900 dark:text-white focus:border-[#FF3B30] focus:ring-0"
                        >
                            {statuses.map((s, i) => (
                                <option key={i} value={s}>{s === 'All' ? 'All Statuses' : s.toUpperCase()}</option>
                            ))}
                        </select>
                    </div>
                </CardHeader>

                <CardContent className="p-0 overflow-x-auto">
                    {filteredRecords.length === 0 ? (
                        <p className="text-center py-12 text-zinc-500 text-xs font-medium">No bill records found matching your filters.</p>
                    ) : (
                        <table className="w-full text-left border-collapse min-w-[750px]">
                            <thead>
                                <tr className="bg-zinc-50 dark:bg-zinc-950/80 border-b border-zinc-200 dark:border-zinc-800 text-[10px] font-black uppercase text-zinc-500 dark:text-zinc-400">
                                    <th className="p-3.5 pl-6">Biller & Account</th>
                                    <th className="p-3.5">Category</th>
                                    <th className="p-3.5">Amount</th>
                                    <th className="p-3.5">Due Date</th>
                                    <th className="p-3.5">Payment Date</th>
                                    <th className="p-3.5">Status</th>
                                    <th className="p-3.5 text-right pr-6">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-xs">
                                {filteredRecords.map((bill) => (
                                    <tr key={bill.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-950/40 transition-colors">
                                        <td className="p-3.5 pl-6">
                                            <div className="font-extrabold text-zinc-900 dark:text-white text-xs">{bill.biller_name}</div>
                                            <div className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
                                                Acc #: {bill.account_number || 'N/A'}
                                            </div>
                                        </td>
                                        <td className="p-3.5">
                                            <span className="inline-block px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[10px] font-bold text-zinc-700 dark:text-zinc-300 uppercase">
                                                {bill.bill_category}
                                            </span>
                                        </td>
                                        <td className="p-3.5 font-extrabold text-zinc-900 dark:text-white">
                                            ₱{parseFloat(bill.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="p-3.5 font-semibold text-zinc-700 dark:text-zinc-300">
                                            {bill.due_date ? bill.due_date.substring(0, 10) : 'N/A'}
                                        </td>
                                        <td className="p-3.5 text-zinc-500">
                                            {bill.payment_date ? bill.payment_date.substring(0, 10) : '—'}
                                        </td>
                                        <td className="p-3.5">
                                            {getStatusBadge(bill.status)}
                                        </td>
                                        <td className="p-3.5 text-right pr-6 space-x-2">
                                            <button
                                                onClick={() => openEditModal(bill)}
                                                className="px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white rounded text-[11px] font-bold transition-colors cursor-pointer"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(bill.id)}
                                                className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded text-[11px] font-bold transition-colors cursor-pointer"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </CardContent>
            </Card>

            {/* Modal Form for Add/Edit Bill */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
                    <div className="z-10 w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-xl shadow-2xl text-left animate-in fade-in zoom-in-95 duration-200">
                        <h3 className="text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-white">
                            {editingBill ? 'Edit Bill Record' : 'Record New Utility Bill'}
                        </h3>

                        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-500 mb-1">Biller / Service Provider</label>
                                    <Input
                                        type="text"
                                        placeholder="e.g. Meralco, Maynilad, PLDT"
                                        value={billForm.data.biller_name}
                                        onChange={(e) => billForm.setData('biller_name', e.target.value)}
                                        required
                                        className="h-9 text-xs bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-500 mb-1">Bill Category</label>
                                    <select
                                        value={billForm.data.bill_category}
                                        onChange={(e) => billForm.setData('bill_category', e.target.value)}
                                        className="w-full h-9 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 text-xs text-zinc-900 dark:text-white focus:border-[#FF3B30] focus:ring-0"
                                    >
                                        <option value="Electricity">Electricity (Meralco, VECO, etc.)</option>
                                        <option value="Water">Water (Maynilad, Manila Water)</option>
                                        <option value="Internet">Internet (PLDT, Globe, Converge)</option>
                                        <option value="Vehicle Fleet">Vehicle Fleet & Tolls</option>
                                        <option value="Maintenance">Fleet Maintenance Dues</option>
                                        <option value="Other">Other Recurring Utility</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-500 mb-1">Account / Reference No.</label>
                                    <Input
                                        type="text"
                                        placeholder="e.g. 1234-5678-90"
                                        value={billForm.data.account_number}
                                        onChange={(e) => billForm.setData('account_number', e.target.value)}
                                        className="h-9 text-xs bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-500 mb-1">Amount (PHP ₱)</label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={billForm.data.amount}
                                        onChange={(e) => billForm.setData('amount', e.target.value)}
                                        required
                                        className="h-9 text-xs bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-500 mb-1">Due Date</label>
                                    <Input
                                        type="date"
                                        value={billForm.data.due_date}
                                        onChange={(e) => billForm.setData('due_date', e.target.value)}
                                        required
                                        className="h-9 text-xs bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-500 mb-1">Payment Date</label>
                                    <Input
                                        type="date"
                                        value={billForm.data.payment_date}
                                        onChange={(e) => billForm.setData('payment_date', e.target.value)}
                                        className="h-9 text-xs bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-500 mb-1">Status</label>
                                    <select
                                        value={billForm.data.status}
                                        onChange={(e) => billForm.setData('status', e.target.value)}
                                        className="w-full h-9 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-2 text-xs text-zinc-900 dark:text-white focus:border-[#FF3B30] focus:ring-0"
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="paid">Paid</option>
                                        <option value="overdue">Overdue</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-500 mb-1">Notes / Remarks</label>
                                <textarea
                                    rows="2"
                                    placeholder="Optional payment reference or notes..."
                                    value={billForm.data.notes}
                                    onChange={(e) => billForm.setData('notes', e.target.value)}
                                    className="w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-2 text-xs text-zinc-900 dark:text-white focus:border-[#FF3B30] focus:ring-0"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                                <Button type="button" variant="ghost" size="sm" onClick={() => setModalOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" size="sm" disabled={billForm.processing} className="bg-[#FF3B30] hover:bg-red-700 text-white font-bold">
                                    {billForm.processing ? 'Saving...' : editingBill ? 'Update Bill' : 'Save Bill Record'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
