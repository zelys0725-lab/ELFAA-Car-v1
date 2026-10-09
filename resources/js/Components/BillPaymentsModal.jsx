import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Badge, Button, Input } from '@/Components/Shadcn';

export default function BillPaymentsModal({ isOpen, onClose, initialCategory = 'electricity' }) {
    const [activeTab, setActiveTab] = useState(initialCategory); // 'electricity' | 'water' | 'internet' | 'other' | 'history'
    const [paymentSuccess, setPaymentSuccess] = useState(null);

    // Sync initialCategory when modal opens
    useEffect(() => {
        if (isOpen && initialCategory) {
            setActiveTab(initialCategory);
            setPaymentSuccess(null);
        }
    }, [isOpen, initialCategory]);

    // Biller options per category
    const billerOptions = {
        electricity: [
            { id: 'meralco', name: 'Meralco (Manila Electric Company)', code: 'MER', logo: '⚡' },
            { id: 'veco', name: 'Visayan Electric (VECO)', code: 'VECO', logo: '💡' },
            { id: 'davao_light', name: 'Davao Light & Power', code: 'DLPC', logo: '🔌' },
            { id: 'cagelco', name: 'CAGELCO Electric Cooperative', code: 'CAG', logo: '⚡' },
        ],
        water: [
            { id: 'maynilad', name: 'Maynilad Water Services', code: 'MAYN', logo: '💧' },
            { id: 'manila_water', name: 'Manila Water Company', code: 'MWC', logo: '🌊' },
            { id: 'primewater', name: 'PrimeWater Infrastructure', code: 'PWI', logo: '🚰' },
            { id: 'subic_water', name: 'Subic Water & Sewerage', code: 'SUB', logo: '💧' },
        ],
        internet: [
            { id: 'pldt', name: 'PLDT Home Fiber / DSL', code: 'PLDT', logo: '🌐' },
            { id: 'globe', name: 'Globe At Home / Broadband', code: 'GLOBE', logo: '📡' },
            { id: 'converge', name: 'Converge ICT FiberX', code: 'CNVRG', logo: '⚡' },
            { id: 'sky', name: 'Sky Fiber Cable & Internet', code: 'SKY', logo: '📺' },
            { id: 'dito', name: 'DITO Telecommunity Broadband', code: 'DITO', logo: '📱' },
        ],
        other: [
            { id: 'hoa', name: 'HOA Village / Subdivision Dues', code: 'HOA', logo: '🏠' },
            { id: 'trash', name: 'Municipal Sanitation & Waste Bill', code: 'WST', logo: '♻️' },
            { id: 'fleet', name: 'Fleet Maintenance & Car Servicing', code: 'FLT', logo: '🚗' },
            { id: 'toll', name: 'RFID AutoSweep / EasyTrip Toll', code: 'RFID', logo: '🛣️' },
            { id: 'insurance', name: 'Comprehensive Vehicle Insurance', code: 'INS', logo: '🛡️' },
        ]
    };

    // Default form state
    const [formData, setFormData] = useState({
        biller_id: 'meralco',
        account_number: '',
        account_name: '',
        due_date: new Date().toISOString().split('T')[0],
        amount: '',
        payment_method: 'gcash', // gcash | maya | online_bank | card | cash
        reference_no: '',
        notes: '',
    });

    // Preset mock payment history
    const [paymentHistory, setPaymentHistory] = useState([
        {
            id: 'BILL-84920',
            category: 'electricity',
            biller_name: 'Meralco (Manila Electric Company)',
            account_number: '1094857201',
            account_name: 'ELFAA HQ Office',
            amount: 14250.00,
            due_date: '2026-10-15',
            paid_date: '2026-10-05',
            payment_method: 'GCash',
            reference_no: 'GC-993821049',
            status: 'Paid & Verified'
        },
        {
            id: 'BILL-71049',
            category: 'water',
            biller_name: 'Maynilad Water Services',
            account_number: '5540938210',
            account_name: 'Depot Fleet Hub 1',
            amount: 3180.50,
            due_date: '2026-10-18',
            paid_date: '2026-10-02',
            payment_method: 'Maya',
            reference_no: 'MY-482019482',
            status: 'Paid & Verified'
        },
        {
            id: 'BILL-63912',
            category: 'internet',
            biller_name: 'PLDT Home Fiber / DSL',
            account_number: '0289410934',
            account_name: 'ELFAA Booking Center',
            amount: 4599.00,
            due_date: '2026-10-20',
            paid_date: '2026-09-28',
            payment_method: 'Online Bank',
            reference_no: 'BDO-847291039',
            status: 'Paid & Verified'
        }
    ]);

    // Auto-update default biller when category tab changes
    useEffect(() => {
        if (activeTab !== 'history' && billerOptions[activeTab]?.length > 0) {
            setFormData(prev => ({
                ...prev,
                biller_id: billerOptions[activeTab][0].id
            }));
        }
    }, [activeTab]);

    if (!isOpen) return null;

    const currentBillers = billerOptions[activeTab] || billerOptions.electricity;

    const handleSubmitPayment = (e) => {
        e.preventDefault();
        const selectedBillerObj = currentBillers.find(b => b.id === formData.biller_id) || currentBillers[0];
        const newRefCode = formData.reference_no.trim() || `REF-${Math.floor(10000000 + Math.random() * 90000000)}`;
        const billId = `BILL-${Math.floor(10000 + Math.random() * 90000)}`;
        
        const methodLabels = {
            gcash: 'GCash',
            maya: 'Maya',
            online_bank: 'Online Bank Transfer',
            card: 'Credit / Debit Card',
            cash: 'Over-the-Counter Cash'
        };

        const newRecord = {
            id: billId,
            category: activeTab,
            biller_name: selectedBillerObj.name,
            account_number: formData.account_number || 'ACC-9948201',
            account_name: formData.account_name || 'ELFAA Customer',
            amount: parseFloat(formData.amount) || 0,
            due_date: formData.due_date,
            paid_date: new Date().toISOString().split('T')[0],
            payment_method: methodLabels[formData.payment_method] || 'GCash',
            reference_no: newRefCode,
            status: 'Paid & Verified'
        };

        setPaymentHistory(prev => [newRecord, ...prev]);
        setPaymentSuccess(newRecord);
    };

    const resetForm = () => {
        setPaymentSuccess(null);
        setFormData({
            biller_id: currentBillers[0]?.id || 'meralco',
            account_number: '',
            account_name: '',
            due_date: new Date().toISOString().split('T')[0],
            amount: '',
            payment_method: 'gcash',
            reference_no: '',
            notes: '',
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
            {/* Backdrop overlay */}
            <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />

            {/* Main Modal Box */}
            <div className="relative z-10 w-full max-w-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-zinc-900 dark:text-zinc-100 transition-colors">
                
                {/* Modal Header */}
                <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-[#FF3B30]/10 border border-[#FF3B30]/20 flex items-center justify-center text-xl">
                            💳
                        </div>
                        <div>
                            <h2 className="text-base font-black text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                                Bill Payments Express
                                <Badge className="bg-[#FF3B30] text-white font-bold text-[9px] uppercase tracking-widest px-2 py-0.5">
                                    Instant Pay
                                </Badge>
                            </h2>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                Pay electricity, water, internet, and recurring bills effortlessly.
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="h-8 w-8 rounded-lg bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 flex items-center justify-center font-bold text-lg transition-colors cursor-pointer"
                    >
                        ✕
                    </button>
                </div>

                {/* Bill Category Tabs Navigation */}
                <div className="px-6 pt-3 bg-zinc-100/50 dark:bg-zinc-900/60 border-b border-zinc-200 dark:border-zinc-800 flex flex-wrap gap-2 overflow-x-auto scrollbar-none">
                    {[
                        { id: 'electricity', label: 'Electricity Bills', icon: '⚡' },
                        { id: 'water', label: 'Water Bills', icon: '💧' },
                        { id: 'internet', label: 'Internet Bills', icon: '🌐' },
                        { id: 'other', label: 'Other Recurring', icon: '🔄' },
                        { id: 'history', label: `History (${paymentHistory.length})`, icon: '📋' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => { setActiveTab(tab.id); setPaymentSuccess(null); }}
                            className={`px-4 py-2.5 rounded-t-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer border-b-2 ${
                                activeTab === tab.id
                                    ? 'bg-white dark:bg-zinc-900 text-[#FF3B30] border-[#FF3B30] shadow-sm'
                                    : 'text-zinc-500 dark:text-zinc-400 border-transparent hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/50 dark:hover:bg-zinc-800/40'
                            }`}
                        >
                            <span>{tab.icon}</span>
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Modal Body Content */}
                <div className="p-6 overflow-y-auto flex-1 space-y-6">

                    {/* SUCCESS RECEIPT VIEW */}
                    {paymentSuccess ? (
                        <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl text-center space-y-5 animate-in zoom-in-95 duration-200">
                            <div className="h-16 w-16 bg-green-500/10 border border-green-500/20 text-green-500 rounded-full flex items-center justify-center text-3xl mx-auto">
                                ✓
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-zinc-900 dark:text-white uppercase tracking-wider">
                                    Bill Payment Successful!
                                </h3>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                                    Transaction reference <strong className="text-zinc-900 dark:text-white font-mono">{paymentSuccess.reference_no}</strong> has been processed.
                                </p>
                            </div>

                            {/* Digital Receipt Card */}
                            <div className="max-w-md mx-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-xl text-left space-y-3 font-mono text-xs shadow-sm">
                                <div className="flex justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
                                    <span className="text-zinc-500">Receipt ID:</span>
                                    <span className="font-bold text-zinc-900 dark:text-white">{paymentSuccess.id}</span>
                                </div>
                                <div className="flex justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
                                    <span className="text-zinc-500">Biller:</span>
                                    <span className="font-bold text-zinc-900 dark:text-white truncate max-w-[200px]">{paymentSuccess.biller_name}</span>
                                </div>
                                <div className="flex justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
                                    <span className="text-zinc-500">Account No:</span>
                                    <span className="font-bold text-zinc-900 dark:text-white">{paymentSuccess.account_number}</span>
                                </div>
                                <div className="flex justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
                                    <span className="text-zinc-500">Account Name:</span>
                                    <span className="font-bold text-zinc-900 dark:text-white">{paymentSuccess.account_name}</span>
                                </div>
                                <div className="flex justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
                                    <span className="text-zinc-500">Payment Channel:</span>
                                    <span className="font-bold text-zinc-900 dark:text-white">{paymentSuccess.payment_method}</span>
                                </div>
                                <div className="flex justify-between pt-1 text-sm font-black">
                                    <span className="text-zinc-900 dark:text-white">Amount Paid:</span>
                                    <span className="text-[#FF3B30]">PHP {paymentSuccess.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                </div>
                            </div>

                            <div className="flex justify-center gap-3 pt-2">
                                <Button 
                                    onClick={resetForm} 
                                    className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 font-bold text-xs uppercase"
                                >
                                    Pay Another Bill
                                </Button>
                                <Button 
                                    onClick={() => setActiveTab('history')} 
                                    variant="outline" 
                                    className="font-bold text-xs uppercase"
                                >
                                    View Payment History
                                </Button>
                            </div>
                        </div>
                    ) : activeTab === 'history' ? (
                        /* PAYMENT HISTORY LOG VIEW */
                        <div className="space-y-4 text-left">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-white">
                                    Recent Bill Transactions Log
                                </h3>
                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                                    Total Paid: PHP {paymentHistory.reduce((acc, p) => acc + p.amount, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </span>
                            </div>

                            {paymentHistory.length === 0 ? (
                                <div className="text-center py-12 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-400 text-xs">
                                    No bill payments recorded yet.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {paymentHistory.map((item) => (
                                        <div 
                                            key={item.id} 
                                            className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                                        >
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-extrabold text-zinc-900 dark:text-white">{item.biller_name}</span>
                                                    <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20 text-[9px] uppercase font-black">
                                                        ✓ {item.status}
                                                    </Badge>
                                                </div>
                                                <div className="text-[11px] text-zinc-500 dark:text-zinc-400 space-x-2">
                                                    <span>Account: <strong className="text-zinc-700 dark:text-zinc-300">{item.account_number}</strong></span>
                                                    <span>•</span>
                                                    <span>Ref: <strong className="font-mono text-zinc-700 dark:text-zinc-300">{item.reference_no}</strong></span>
                                                    <span>•</span>
                                                    <span>Paid: {item.paid_date}</span>
                                                </div>
                                            </div>

                                            <div className="text-right sm:self-center">
                                                <div className="text-sm font-black text-[#FF3B30]">
                                                    PHP {item.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                </div>
                                                <div className="text-[10px] text-zinc-400 uppercase font-bold">
                                                    via {item.payment_method}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        /* BILL PAYMENT FORM VIEW */
                        <form onSubmit={handleSubmitPayment} className="space-y-5 text-left">
                            
                            {/* Biller Select Cards Grid */}
                            <div>
                                <label className="block text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-2">
                                    Select Authorized Biller Provider
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {currentBillers.map((biller) => {
                                        const isSelected = formData.biller_id === biller.id;
                                        return (
                                            <div
                                                key={biller.id}
                                                onClick={() => setFormData(prev => ({ ...prev, biller_id: biller.id }))}
                                                className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                                                    isSelected
                                                        ? 'border-[#FF3B30] bg-[#FF3B30]/5 shadow-sm text-zinc-900 dark:text-white'
                                                        : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className="text-2xl">{biller.logo}</span>
                                                    <div>
                                                        <div className="text-xs font-extrabold">{biller.name}</div>
                                                        <div className="text-[10px] font-mono text-zinc-400 uppercase">Code: {biller.code}</div>
                                                    </div>
                                                </div>
                                                <input 
                                                    type="radio" 
                                                    name="biller_id" 
                                                    checked={isSelected}
                                                    onChange={() => {}}
                                                    className="text-[#FF3B30] focus:ring-0"
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Two-column Input Form */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5">
                                        Account / CAN Number
                                    </label>
                                    <Input
                                        type="text"
                                        placeholder="e.g. 1094857201"
                                        value={formData.account_number}
                                        onChange={(e) => setFormData(prev => ({ ...prev, account_number: e.target.value }))}
                                        required
                                        className="h-10 text-xs bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 focus:border-[#FF3B30]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5">
                                        Account Holder Name
                                    </label>
                                    <Input
                                        type="text"
                                        placeholder="e.g. Juan De La Cruz"
                                        value={formData.account_name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, account_name: e.target.value }))}
                                        required
                                        className="h-10 text-xs bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 focus:border-[#FF3B30]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5">
                                        Bill Due Date
                                    </label>
                                    <Input
                                        type="date"
                                        value={formData.due_date}
                                        onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                                        required
                                        className="h-10 text-xs bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 focus:border-[#FF3B30]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5">
                                        Bill Amount (PHP)
                                    </label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min="1"
                                        placeholder="0.00"
                                        value={formData.amount}
                                        onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                                        required
                                        className="h-10 text-xs font-bold bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 focus:border-[#FF3B30]"
                                    />
                                </div>
                            </div>

                            {/* Payment Method Selector */}
                            <div>
                                <label className="block text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-2">
                                    Select Payment Method
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                                    {[
                                        { id: 'gcash', label: 'GCash', icon: '📲' },
                                        { id: 'maya', label: 'Maya', icon: '💚' },
                                        { id: 'online_bank', label: 'Online Bank', icon: '🏦' },
                                        { id: 'card', label: 'Card', icon: '💳' },
                                        { id: 'cash', label: 'OTC Cash', icon: '💵' }
                                    ].map(m => (
                                        <button
                                            key={m.id}
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, payment_method: m.id }))}
                                            className={`p-2.5 rounded-lg border text-center transition-all cursor-pointer ${
                                                formData.payment_method === m.id
                                                    ? 'border-[#FF3B30] bg-[#FF3B30]/10 font-black text-zinc-900 dark:text-white'
                                                    : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                                            }`}
                                        >
                                            <div className="text-base">{m.icon}</div>
                                            <div className="text-[10px] uppercase tracking-wider mt-1">{m.label}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Reference Code / Proof optional input */}
                            <div>
                                <label className="block text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5">
                                    Reference / Transaction Reference No. (Optional)
                                </label>
                                <Input
                                    type="text"
                                    placeholder="Leave empty to auto-generate digital receipt reference"
                                    value={formData.reference_no}
                                    onChange={(e) => setFormData(prev => ({ ...prev, reference_no: e.target.value }))}
                                    className="h-10 text-xs bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 focus:border-[#FF3B30]"
                                />
                            </div>

                            {/* Submit Footer */}
                            <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                                <span className="text-xs text-zinc-500 font-semibold">
                                    Estimated Processing Time: <strong className="text-green-500">Real-Time Instant</strong>
                                </span>
                                <div className="flex gap-2">
                                    <Button 
                                        type="button" 
                                        variant="ghost" 
                                        onClick={onClose}
                                        className="text-xs font-bold uppercase"
                                    >
                                        Cancel
                                    </Button>
                                    <Button 
                                        type="submit" 
                                        className="bg-[#FF3B30] hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider h-10 px-6 rounded-lg shadow-md"
                                    >
                                        Process Bill Payment →
                                    </Button>
                                </div>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
