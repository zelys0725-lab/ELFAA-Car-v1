import React, { useState, useEffect } from 'react';
import PortalLayout from '@/Layouts/PortalLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Badge, Button, Input } from '@/Components/Shadcn';
import CustomerAvailabilityPicker from '@/Components/CustomerAvailabilityPicker';
import VehicleImage from '@/Components/VehicleImage';
import ElfaaChatbot from '@/Components/ElfaaChatbot';

export default function Dashboard({ auth, bookings = [], vehicles = [], documents = [], addOns = [], promos = [], selectedVehicleId = null }) {
    const [selectedType, setSelectedType] = useState('All');
    const [selectedSeats, setSelectedSeats] = useState('All');
    const [selectedCar, setSelectedCar] = useState(null);
    const [daysCount, setDaysCount] = useState(0);
    const [ratingBooking, setRatingBooking] = useState(null);
    const [ratingStars, setRatingStars] = useState(5);
    const [ratingComment, setRatingComment] = useState('');

    // Booking form
    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        vehicle_id: selectedVehicleId || '',
        start_datetime: '',
        end_datetime: '',
        pickup_location: 'Sto Tomas Hub',
        payment_method: 'cash',
        promo_code: '',
    });

    // Identity update form
    const identityForm = useForm({
        drivers_license_number: auth.user.drivers_license_number || '',
        id_number: auth.user.id_number || '',
        id_type: auth.user.id_type || 'Passport',
    });

    // Upload document form
    const [docType, setDocType] = useState('gov_id_1');
    const [docFile, setDocFile] = useState(null);
    const [uploadingDoc, setUploadingDoc] = useState(false);
    const [uploadError, setUploadError] = useState('');

    // Unique vehicle types list helper
    const vehicleTypes = ['All', ...new Set(vehicles.map(v => v.type))];
    // Unique seats list helper(sorted numerically)
    const seatsOptions = ['All', ...new Set(vehicles.map(v => v.seats.toString()).sort((a,b) => parseInt(a) - parseInt(b)))];
    
    // Filtered vehicles based on selected type and seating capacity
    const filteredVehicles = vehicles.filter(v => {
        const matchesType = selectedType === 'All' || v.type === selectedType;
        const matchesSeats = selectedSeats === 'All' || v.seats.toString() === selectedSeats;
        return matchesType && matchesSeats;
    });

    useEffect(() => {
        if (data.vehicle_id) {
            const car = vehicles.find(v => v.id.toString() === data.vehicle_id.toString());
            setSelectedCar(car);
        } else {
            setSelectedCar(null);
        }
    }, [data.vehicle_id, vehicles]);

    // Realtime pricing calculations with promos
    const [originalPrice, setOriginalPrice] = useState(0);
    const [discountAmount, setDiscountAmount] = useState(0);
    const [finalPrice, setFinalPrice] = useState(0);

    useEffect(() => {
        if (data.start_datetime && data.end_datetime) {
            const start = new Date(data.start_datetime);
            const end = new Date(data.end_datetime);
            if (end > start) {
                const diffTime = Math.abs(end - start);
                const diffHours = diffTime / (1000 * 60 * 60);
                const days = Math.max(1, Math.ceil(diffHours / 24));
                setDaysCount(days);
            } else {
                setDaysCount(0);
            }
        } else {
            setDaysCount(0);
        }
    }, [data.start_datetime, data.end_datetime]);

    useEffect(() => {
        if (selectedCar && daysCount > 0) {
            const orig = daysCount * parseFloat(selectedCar.price_per_day);
            setOriginalPrice(orig);

            let disc = 0;
            if (data.promo_code) {
                const matchedPromo = promos.find(p => p.promo_code === data.promo_code);
                if (matchedPromo) {
                    const value = parseFloat(matchedPromo.discount_value);
                    if (matchedPromo.discount_type === 'percentage') {
                        disc = (value / 100.00) * orig;
                    } else {
                        disc = value;
                    }
                }
            }
            const finalDisc = Math.min(disc, orig);
            setDiscountAmount(finalDisc);
            setFinalPrice(orig - finalDisc);
        } else {
            setOriginalPrice(0);
            setDiscountAmount(0);
            setFinalPrice(0);
        }
    }, [selectedCar, daysCount, data.promo_code, promos]);

    const handleBookingSubmit = (e) => {
        e.preventDefault();
        clearErrors();
        post(route('client.bookings.store'), {
            onSuccess: () => {
                reset();
                setDaysCount(0);
            }
        });
    };

    const handleIdentitySubmit = (e) => {
        e.preventDefault();
        identityForm.post(route('client.identity.update'), {
            preserveScroll: true,
        });
    };

    const handleUploadDoc = (e) => {
        e.preventDefault();
        if (!docFile) {
            setUploadError('Please select a file to upload.');
            return;
        }

        setUploadingDoc(true);
        setUploadError('');

        const formData = new FormData();
        formData.append('type', docType);
        formData.append('file', docFile);

        router.post(route('client.documents.store'), formData, {
            onFinish: () => {
                setUploadingDoc(false);
                setDocFile(null);
                const fileInput = document.getElementById('doc-file-input');
                if (fileInput) fileInput.value = '';
            },
            onError: (err) => {
                setUploadError(err.file || 'Failed to upload document.');
            }
        });
    };

    const handleCancelBooking = (bookingId) => {
        if (confirm('Cancel this booking request?')) {
            router.post(route('client.bookings.cancel', bookingId));
        }
    };

    const handleOpenRating = (booking) => {
        setRatingBooking(booking);
        setRatingStars(5);
        setRatingComment('');
    };

    const handleRatingSubmit = (e) => {
        e.preventDefault();
        router.post(route('client.bookings.rate', ratingBooking.id), {
            stars: ratingStars,
            comment: ratingComment,
        }, {
            onSuccess: () => {
                setRatingBooking(null);
            }
        });
    };

    const getDocStatus = (type) => {
        const doc = documents.find(d => d.type === type);
        if (!doc) return { label: 'Missing', textClass: 'text-rose-500', dotClass: 'bg-rose-500', info: null };
        if (doc.status === 'verified') return { label: 'Verified', textClass: 'text-green-500', dotClass: 'bg-green-500', info: doc };
        if (doc.status === 'rejected') return { label: 'Rejected', textClass: 'text-rose-500', dotClass: 'bg-rose-500', info: doc };
        return { label: 'Pending Review', textClass: 'text-amber-500', dotClass: 'bg-amber-500', info: doc };
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'confirmed':
                return { label: 'Confirmed', bgClass: 'bg-green-500/10', borderClass: 'border-green-500/20', textClass: 'text-green-600 dark:text-green-400', dotClass: 'bg-green-500' };
            case 'completed':
                return { label: 'Completed', bgClass: 'bg-blue-500/10', borderClass: 'border-blue-500/20', textClass: 'text-blue-600 dark:text-blue-400', dotClass: 'bg-blue-500' };
            case 'rejected':
                return { label: 'Rejected', bgClass: 'bg-rose-500/10', borderClass: 'border-rose-500/20', textClass: 'text-rose-600 dark:text-rose-400', dotClass: 'bg-rose-500' };
            case 'cancelled':
                return { label: 'Cancelled', bgClass: 'bg-zinc-500/10', borderClass: 'border-zinc-500/20', textClass: 'text-zinc-600 dark:text-zinc-400', dotClass: 'bg-zinc-500' };
            default: // pending
                return { label: 'Pending Approval', bgClass: 'bg-amber-500/10', borderClass: 'border-amber-500/20', textClass: 'text-amber-600 dark:text-amber-400', dotClass: 'bg-amber-500' };
        }
    };

    const govId1 = getDocStatus('gov_id_1');
    const govId2 = getDocStatus('gov_id_2');
    const billingProof = getDocStatus('proof_of_billing');

    const allDocsVerified = govId1.label === 'Verified' && govId2.label === 'Verified' && billingProof.label === 'Verified';

    const [activeTab, setActiveTab] = useState('dashboard');

    const tabsConfig = [
        { id: 'dashboard', label: 'Reservation Hub' },
        { id: 'fleet', label: 'Browse Fleet' },
        { id: 'promos', label: 'Promo Campaigns' }
    ];

    return (
        <>
            <PortalLayout 
            role="client" 
            sidebarTabs={tabsConfig} 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            header="Renter Workspace"
        >
            <Head title="Renter Workspace | ELFAA CAR RENTAL" />

            <div className="space-y-8 text-zinc-700 dark:text-zinc-300">
                {/* FLEET FILTERS (Vehicle type and Seats capacity) */}
                <div className="flex flex-col sm:flex-row gap-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-xl shadow-md transition-colors text-left">
                    <div className="flex-1">
                        <label className="block text-[10px] font-black text-zinc-500 dark:text-zinc-500 uppercase tracking-wider mb-1.5">Filter Vehicle Type</label>
                        <select
                            value={selectedType}
                            onChange={(e) => setSelectedType(e.target.value)}
                            className="w-full h-10 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 text-xs text-zinc-900 dark:text-white focus:border-[#FF3B30] focus:ring-0 focus:outline-none cursor-pointer"
                        >
                            {vehicleTypes.map((t, idx) => (
                                <option key={idx} value={t}>{t === 'All' ? 'All Types' : t}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex-1">
                        <label className="block text-[10px] font-black text-zinc-500 dark:text-zinc-500 uppercase tracking-wider mb-1.5">Filter Seating Capacity</label>
                        <select
                            value={selectedSeats}
                            onChange={(e) => setSelectedSeats(e.target.value)}
                            className="w-full h-10 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 text-xs text-zinc-900 dark:text-white focus:border-[#FF3B30] focus:ring-0 focus:outline-none cursor-pointer"
                        >
                            <option value="All">All Seats</option>
                            {seatsOptions.filter(s => s !== 'All').map((s, idx) => (
                                <option key={idx} value={s}>{s} Seats</option>
                            ))}
                        </select>
                    </div>
                </div>

                {activeTab === 'dashboard' && (
                    <>
                        {/* 1. IDENTITY DOCUMENT VERIFICATION PANEL */}
                        <Card className={`border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 border-l-4 ${allDocsVerified ? 'border-l-green-500' : 'border-l-amber-500'} shadow-lg rounded-xl overflow-hidden transition-colors`}>
                            <CardHeader className="pb-3 px-6 pt-5">
                                <CardTitle className="flex items-center gap-2.5 text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-white">
                                    <span className={`text-lg ${allDocsVerified ? 'text-green-500' : 'text-amber-500'}`}>
                                        {allDocsVerified ? '✓' : '⚠'}
                                    </span>
                                    Identity & Credentials Hub
                                </CardTitle>
                                <CardDescription className="text-zinc-500 dark:text-zinc-400 text-xs">
                                    Manage your driver's license, identity numbers, and document uploads for rental authorization.
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="space-y-6 px-6 pb-6">
                                {/* Identity Numbers Form */}
                                <form onSubmit={handleIdentitySubmit} className="p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950/40 text-left space-y-4">
                                    <h4 className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-white">
                                        Identity Details
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-wider mb-1">
                                                Driver's License Number
                                            </label>
                                            <Input
                                                type="text"
                                                placeholder="N01-12-345678"
                                                value={identityForm.data.drivers_license_number}
                                                onChange={(e) => identityForm.setData('drivers_license_number', e.target.value)}
                                                className="h-9 text-xs bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-wider mb-1">
                                                Gov ID Type
                                            </label>
                                            <select
                                                value={identityForm.data.id_type}
                                                onChange={(e) => identityForm.setData('id_type', e.target.value)}
                                                className="w-full h-9 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 text-xs text-zinc-900 dark:text-white focus:border-[#FF3B30] focus:ring-0"
                                            >
                                                <option value="Passport">Passport</option>
                                                <option value="UMID">UMID</option>
                                                <option value="SSS">SSS ID</option>
                                                <option value="PhilHealth">PhilHealth ID</option>
                                                <option value="National ID">National ID (PhilSys)</option>
                                                <option value="Voter ID">Voter ID</option>
                                                <option value="Other">Other Government ID</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-wider mb-1">
                                                Gov ID Number
                                            </label>
                                            <Input
                                                type="text"
                                                placeholder="ID Number"
                                                value={identityForm.data.id_number}
                                                onChange={(e) => identityForm.setData('id_number', e.target.value)}
                                                className="h-9 text-xs bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-end pt-1">
                                        <Button
                                            type="submit"
                                            disabled={identityForm.processing}
                                            size="sm"
                                            className="bg-[#FF3B30] hover:bg-red-700 text-white font-bold text-xs"
                                        >
                                            {identityForm.processing ? 'Saving...' : 'Save Identity Info'}
                                        </Button>
                                    </div>
                                </form>

                                {/* Document Upload Statuses */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {[
                                        { title: "Driver's License (Gov ID 1)", status: govId1 },
                                        { title: "Secondary Official Photo ID", status: govId2 },
                                        { title: "Proof of Billing Address", status: billingProof }
                                    ].map((docMeta, idx) => (
                                        <div key={idx} className="p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950/40 flex flex-col justify-between h-20 transition-colors">
                                            <span className="text-[10px] uppercase font-black text-zinc-500 dark:text-zinc-400 tracking-wider">{docMeta.title}</span>
                                            <div className="flex items-center justify-between mt-1">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] uppercase font-black bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 ${docMeta.status.textClass}`}>
                                                    <span className={`h-1.5 w-1.5 rounded-full ${docMeta.status.dotClass}`} />
                                                    {docMeta.status.label}
                                                </span>
                                                {docMeta.status.info?.reject_reason && (
                                                    <span className="text-[10px] text-red-500 font-bold max-w-[150px] truncate" title={docMeta.status.info.reject_reason}>
                                                        Refusal: {docMeta.status.info.reject_reason}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* File Upload action */}
                                <form onSubmit={handleUploadDoc} className="border-t border-zinc-200 dark:border-zinc-800/80 pt-4 flex flex-col md:flex-row items-end gap-3">
                                    <div className="w-full md:w-1/3 text-left">
                                        <label className="block text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5">Document Type</label>
                                        <select 
                                            value={docType}
                                            onChange={(e) => setDocType(e.target.value)}
                                            className="w-full h-10 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 text-xs text-zinc-900 dark:text-white focus:border-[#FF3B30] focus:ring-0 focus:outline-none transition-colors"
                                        >
                                            <option value="gov_id_1">Driver's License (Gov ID 1)</option>
                                            <option value="gov_id_2">Second Official ID (Gov ID 2)</option>
                                            <option value="proof_of_billing">Proof of Billing</option>
                                        </select>
                                    </div>
                                    <div className="w-full md:w-1/2 text-left">
                                        <label className="block text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5">File Spec (JPG, PNG, PDF max 5MB)</label>
                                        <Input 
                                            id="doc-file-input"
                                            type="file" 
                                            accept="image/*,.pdf"
                                            onChange={(e) => setDocFile(e.target.files[0])}
                                            className="h-10 text-xs bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white py-1.5 focus:border-[#FF3B30]"
                                        />
                                    </div>
                                    <button type="submit" disabled={uploadingDoc} className="w-full md:w-auto h-10 px-5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 rounded-lg border border-zinc-800 dark:border-transparent font-black text-xs uppercase tracking-wider hover:bg-zinc-800 dark:hover:bg-zinc-150 transition-colors disabled:opacity-50 cursor-pointer">
                                        {uploadingDoc ? 'Uploading...' : 'Upload File'}
                                    </button>
                                </form>
                                {uploadError && <p className="text-xs text-red-500 text-left">{uploadError}</p>}
                            </CardContent>
                        </Card>

                        {/* 2. DUAL COLUMN WORKSPACE */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                            {/* LEFT COLUMN: BOOKING FORM */}
                            <div className="lg:col-span-5 space-y-6">
                                <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-lg rounded-xl overflow-hidden transition-colors">
                                    <CardHeader className="px-6 pt-5 pb-3">
                                        <CardTitle className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-white text-left">Request a Reservation</CardTitle>
                                        <CardDescription className="text-zinc-500 dark:text-zinc-400 text-xs text-left">
                                            Instantiate vehicle reservations. Conflicts are examined in real-time.
                                        </CardDescription>
                                    </CardHeader>
                                    <form onSubmit={handleBookingSubmit} id="booking-request-form">
                                        <CardContent className="space-y-4 px-6">
                                            <div className="text-left">
                                                <label className="block text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5">Select Fleet Vehicle</label>
                                                <select 
                                                    value={data.vehicle_id}
                                                    onChange={(e) => setData('vehicle_id', e.target.value)}
                                                    className="w-full h-10 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 text-xs text-zinc-900 dark:text-white focus:border-[#FF3B30] focus:ring-0 focus:outline-none transition-colors"
                                                    required
                                                >
                                                    <option value="">-- Choose Car --</option>
                                                    {filteredVehicles.map(v => (
                                                        <option key={v.id} value={v.id} className="text-zinc-900 dark:text-white">{v.name} (PHP {parseFloat(v.price_per_day).toLocaleString()}/day)</option>
                                                    ))}
                                                </select>
                                                 {data.vehicle_id && (
                                                     <div className="mt-3">
                                                         <CustomerAvailabilityPicker
                                                             vehicle={vehicles.find(v => v.id.toString() === data.vehicle_id.toString())}
                                                             startDate={data.start_datetime}
                                                             endDate={data.end_datetime}
                                                         />
                                                     </div>
                                                 )}
                                                 {errors.vehicle_id && <p className="text-xs text-red-500 mt-1">{errors.vehicle_id}</p>}
                                             </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                                                <div>
                                                    <label className="block text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5">Pickup Date/Time</label>
                                                    <Input 
                                                        type="datetime-local" 
                                                        value={data.start_datetime}
                                                        onChange={(e) => setData('start_datetime', e.target.value)}
                                                        required
                                                        className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white h-10 focus:border-[#FF3B30]"
                                                    />
                                                    {errors.start_datetime && <p className="text-xs text-red-500 mt-1">{errors.start_datetime}</p>}
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5">Return Date/Time</label>
                                                    <Input 
                                                        type="datetime-local" 
                                                        value={data.end_datetime}
                                                        onChange={(e) => setData('end_datetime', e.target.value)}
                                                        required
                                                        className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white h-10 focus:border-[#FF3B30]"
                                                    />
                                                    {errors.end_datetime && <p className="text-xs text-red-500 mt-1">{errors.end_datetime}</p>}
                                                </div>
                                            </div>

                                            <div className="text-left">
                                                <label className="block text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5">Pickup Meetup Location</label>
                                                <Input 
                                                    placeholder="ELFAA Office, Airport Terminal 3, etc." 
                                                    value={data.pickup_location}
                                                    onChange={(e) => setData('pickup_location', e.target.value)}
                                                    required
                                                    className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white h-10 focus:border-[#FF3B30]"
                                                />
                                                {errors.pickup_location && <p className="text-xs text-red-500 mt-1">{errors.pickup_location}</p>}
                                            </div>

                                            <div className="text-left">
                                                <label className="block text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5">Apply Promo Code</label>
                                                <select 
                                                    value={data.promo_code}
                                                    onChange={(e) => setData('promo_code', e.target.value)}
                                                    className="w-full h-10 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 text-xs text-zinc-900 dark:text-white focus:border-[#FF3B30] focus:ring-0 focus:outline-none transition-colors"
                                                >
                                                    <option value="">-- Apply Promo --</option>
                                                    {promos.map(p => (
                                                        <option key={p.id} value={p.promo_code}>{p.title} ({p.discount_text})</option>
                                                    ))}
                                                </select>
                                                {errors.promo_code && <p className="text-xs text-red-500 mt-1">{errors.promo_code}</p>}
                                            </div>

                                            <div className="text-left">
                                                <label className="block text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5">Payment Option</label>
                                                <div className="grid grid-cols-2 gap-3 mt-1">
                                                    <button 
                                                        type="button"
                                                        onClick={() => setData('payment_method', 'cash')}
                                                        className={`h-10 border rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center transition-all cursor-pointer ${
                                                            data.payment_method === 'cash' 
                                                                ? 'border-[#FF3B30] bg-red-500/10 text-zinc-900 dark:text-white shadow-sm'
                                                                : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-400'
                                                        }`}
                                                    >
                                                        Cash Payment
                                                    </button>
                                                    <button 
                                                        type="button"
                                                        onClick={() => setData('payment_method', 'online')}
                                                        className={`h-10 border rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center transition-all cursor-pointer ${
                                                            data.payment_method === 'online' 
                                                                ? 'border-[#FF3B30] bg-red-500/15 text-zinc-900 dark:text-white shadow-sm'
                                                                : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-400'
                                                        }`}
                                                    >
                                                        Online Pay
                                                    </button>
                                                </div>
                                                {errors.payment_method && <p className="text-xs text-red-500 mt-1">{errors.payment_method}</p>}
                                            </div>
                                        </CardContent>

                                        <CardFooter className="flex flex-col gap-4 border-t border-zinc-200 dark:border-zinc-800 px-6 pt-5 pb-5">
                                            {selectedCar && (
                                                <div className="w-full flex flex-col gap-2 p-3.5 bg-zinc-50 dark:bg-zinc-950/60 rounded-xl border border-zinc-200 dark:border-zinc-800">
                                                    <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
                                                        <div className="text-left">
                                                            <span className="block text-xs font-black text-zinc-900 dark:text-white">{selectedCar.name}</span>
                                                            <span className="block text-[10px] text-zinc-500 uppercase tracking-widest">{selectedCar.transmission} • {selectedCar.fuel_type}</span>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="block text-xs font-black text-[#FF3B30]">PHP {parseFloat(selectedCar.price_per_day).toLocaleString('en-US')}/day</span>
                                                        </div>
                                                    </div>
                                                    {daysCount > 0 && (
                                                        <div className="text-left space-y-1 text-[11px] font-semibold">
                                                            <div className="flex justify-between">
                                                                <span className="text-zinc-500">Days Count:</span>
                                                                <span className="text-zinc-900 dark:text-white">{daysCount} days</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-zinc-500">Regular Price:</span>
                                                                <span className="text-zinc-900 dark:text-white">PHP {originalPrice.toLocaleString()}</span>
                                                            </div>
                                                            {discountAmount > 0 && (
                                                                <div className="flex justify-between text-green-600">
                                                                    <span>Promo Discount ({data.promo_code}):</span>
                                                                    <span>- PHP {discountAmount.toLocaleString()}</span>
                                                                </div>
                                                            )}
                                                            <div className="flex justify-between border-t border-zinc-200 dark:border-zinc-800 pt-1 text-xs font-black">
                                                                <span className="text-zinc-900 dark:text-white">Estimated Total:</span>
                                                                <span className="text-[#FF3B30]">PHP {finalPrice.toLocaleString()}</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            <Button 
                                                type="submit" 
                                                disabled={processing} 
                                                className="w-full bg-[#FF3B30] hover:bg-red-700 text-white font-black uppercase text-xs tracking-wider h-11 rounded-lg"
                                            >
                                                {processing ? 'Submitting Reservation...' : 'Submit Booking Request'}
                                            </Button>
                                        </CardFooter>
                                    </form>
                                </Card>
                            </div>

                            {/* RIGHT COLUMN: BOOKINGS LISTING */}
                            <div className="lg:col-span-7 space-y-6">
                                <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-lg rounded-xl overflow-hidden transition-colors">
                                    <CardHeader className="px-6 pt-5 pb-3">
                                        <CardTitle className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-white text-left">Your Booking Log</CardTitle>
                                        <CardDescription className="text-zinc-500 dark:text-zinc-400 text-xs text-left">
                                            Self-tour logs are updated in real-time. Contact Support for assistance.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="px-6 pb-6">
                                        {bookings.length === 0 ? (
                                            <div className="text-center py-12">
                                                <p className="text-zinc-400 text-xs font-medium">No booking requests found.</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {bookings.map((booking) => {
                                                    const startStr = booking.start_datetime ? new Date(booking.start_datetime).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
                                                    const endStr = booking.end_datetime ? new Date(booking.end_datetime).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
                                                    const currentStatus = getStatusBadge(booking.status);

                                                    return (
                                                        <div key={booking.id} className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 hover:border-zinc-300 dark:hover:border-zinc-800 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
                                                            <div className="space-y-1.5 flex-1 min-w-0">
                                                                <div className="flex items-center justify-between md:justify-start gap-4">
                                                                    <h4 className="font-extrabold text-xs text-zinc-900 dark:text-white truncate">{booking.vehicle?.name || 'Unknown fleet'}</h4>
                                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] uppercase font-black border ${currentStatus.bgClass} ${currentStatus.borderClass} ${currentStatus.textClass}`}>
                                                                        <span className={`h-1 w-1 rounded-full ${currentStatus.dotClass}`} />
                                                                        {currentStatus.label}
                                                                    </span>
                                                                </div>
                                                                <div className="text-[11px] text-zinc-600 dark:text-zinc-400 font-semibold space-y-0.5">
                                                                    <span className="block">Pickup: {startStr}</span>
                                                                    <span className="block">Return: {endStr}</span>
                                                                    <span className="block">Depot: <span className="text-zinc-700 dark:text-zinc-300">{booking.pickup_location}</span></span>
                                                                </div>
                                                                <div className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 pt-0.5">
                                                                    Total: <span className="text-[#FF3B30]">PHP {parseFloat(booking.total_price).toLocaleString()}</span> via <span className="uppercase text-zinc-600 font-extrabold">{booking.payment_method}</span>
                                                                </div>
                                                            </div>

                                                            <div className="w-full md:w-auto flex flex-col items-stretch md:items-end gap-2">
                                                                {booking.status === 'pending' && (
                                                                    <button 
                                                                        onClick={() => handleCancelBooking(booking.id)}
                                                                        className="px-3 h-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/15 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                                                                    >
                                                                        Cancel Request
                                                                    </button>
                                                                )}
                                                                {booking.status === 'completed' && !booking.rating && (
                                                                    <button 
                                                                        onClick={() => handleOpenRating(booking)}
                                                                        className="px-3 h-8 bg-[#FF3B30] text-white hover:bg-red-700 rounded-lg text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
                                                                    >
                                                                        Leave Review
                                                                    </button>
                                                                )}
                                                                {booking.rating && (
                                                                    <div className="text-right">
                                                                        <div className="text-amber-500 text-xs font-black">
                                                                            {'★'.repeat(booking.rating.stars)}{'☆'.repeat(5 - booking.rating.stars)}
                                                                        </div>
                                                                        <p className="text-[10px] text-zinc-500 dark:text-zinc-500 italic max-w-[150px] truncate" title={booking.rating.comment}>
                                                                            "{booking.rating.comment || 'No comment'}"
                                                                        </p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </>
                )}

                {/* BROWSE FLEET TAB */}
                {activeTab === 'fleet' && (
                    <div className="space-y-6">
                        <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-lg rounded-xl overflow-hidden transition-colors">
                            <CardHeader className="px-6 pt-5 pb-3">
                                <CardTitle className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-white text-left">Available Fleet Catalog</CardTitle>
                                <CardDescription className="text-zinc-500 dark:text-zinc-400 text-xs text-left">
                                    Displaying vehicles matching: <strong className="text-zinc-900 dark:text-white">Type: {selectedType} | Seats: {selectedSeats}</strong>
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="px-6 pb-6">
                                {filteredVehicles.length === 0 ? (
                                    <p className="text-center py-12 text-zinc-500 dark:text-zinc-400 text-xs font-medium">No vehicles matching selected vehicle filters.</p>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                        {filteredVehicles.map((car) => (
                                            <Card key={car.id} className="overflow-hidden bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between text-zinc-900 dark:text-white text-left transition-colors">
                                                <div>
                                                    <div className="h-44 overflow-hidden relative bg-zinc-100 dark:bg-zinc-900">
                                                        <img 
                                                            src={car.images?.[0] || 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=800'} 
                                                            alt={car.name} 
                                                            className="w-full h-full object-cover"
                                                        />
                                                        <Badge className="absolute top-3 right-3 bg-[#FF3B30] uppercase font-bold tracking-wider">
                                                            {car.type}
                                                        </Badge>
                                                    </div>

                                                    <CardHeader className="pb-2">
                                                        <CardTitle className="text-md font-bold">{car.name}</CardTitle>
                                                        <CardDescription className="text-zinc-500 dark:text-zinc-400 text-xs">{car.meetup_location || 'ELFAA Hub'}</CardDescription>
                                                    </CardHeader>

                                                    <CardContent className="space-y-4">
                                                        <div className="grid grid-cols-3 gap-2 py-2 text-center text-[10px] uppercase font-bold bg-zinc-100 dark:bg-zinc-900/50 rounded-lg text-zinc-600 dark:text-zinc-400">
                                                            <div>
                                                                <span className="block font-black text-zinc-900 dark:text-zinc-200">{car.seats}</span>
                                                                Seats
                                                            </div>
                                                            <div>
                                                                <span className="block font-black text-zinc-900 dark:text-zinc-200">{car.transmission}</span>
                                                                Gear
                                                            </div>
                                                            <div>
                                                                <span className="block font-black text-zinc-900 dark:text-zinc-200">{car.fuel_type}</span>
                                                                Fuel
                                                            </div>
                                                        </div>

                                                        <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">{car.description}</p>
                                                    </CardContent>
                                                </div>

                                                <CardFooter className="flex items-center justify-between pt-4 bg-zinc-100/50 dark:bg-zinc-900/40 border-t border-zinc-200 dark:border-zinc-800">
                                                    <div>
                                                        <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Rate/day</div>
                                                        <div className="text-sm font-black text-[#FF3B30]">
                                                            PHP {parseFloat(car.price_per_day).toLocaleString()}
                                                        </div>
                                                    </div>
                                                    <button 
                                                        onClick={() => {
                                                            setData('vehicle_id', car.id.toString());
                                                            setActiveTab('dashboard');
                                                            setTimeout(() => {
                                                                const formEl = document.getElementById('booking-request-form');
                                                                if (formEl) formEl.scrollIntoView({ behavior: 'smooth' });
                                                            }, 100);
                                                        }}
                                                        className="px-4 py-2 bg-[#FF3B30] hover:bg-red-700 text-white rounded-lg text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
                                                    >
                                                        Book Selection
                                                    </button>
                                                </CardFooter>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* SPECIAL PROMO CAMPAIGNS TAB */}
                {activeTab === 'promos' && (
                    <div className="space-y-6">
                        <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-lg rounded-xl overflow-hidden transition-colors">
                            <CardHeader className="px-6 pt-5 pb-3">
                                <CardTitle className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-white text-left">Active Promotions</CardTitle>
                                <CardDescription className="text-zinc-500 dark:text-zinc-400 text-xs text-left">
                                    Use these special campaign details during checkout on your reservation form.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="px-6 pb-6">
                                {promos.length === 0 ? (
                                    <p className="text-center py-12 text-zinc-500 dark:text-zinc-400 text-xs font-medium">No active promo campaigns currently.</p>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {promos.map((promo) => (
                                            <Card key={promo.id} className="overflow-hidden bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row text-zinc-900 dark:text-white text-left transition-colors">
                                                {promo.image_url && (
                                                    <div className="w-full md:w-2/5 h-40 md:h-auto overflow-hidden relative">
                                                        <img 
                                                            src={promo.image_url} 
                                                            alt={promo.title}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                )}
                                                <div className="p-5 flex flex-col justify-between flex-1 space-y-4">
                                                    <div>
                                                        <Badge className="bg-green-600 uppercase font-black text-[10px] mb-2 tracking-wider text-white">
                                                            {promo.discount_text}
                                                        </Badge>
                                                        <h3 className="font-extrabold text-sm text-zinc-900 dark:text-white">{promo.title}</h3>
                                                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{promo.description}</p>
                                                    </div>
                                                    {promo.promo_code && (
                                                        <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                                                            <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                                                                Code: <code className="bg-zinc-200 dark:bg-zinc-900 px-2 py-0.5 rounded text-zinc-900 dark:text-white font-mono font-bold text-xs">{promo.promo_code}</code>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>

            {/* LEAVE REVIEW DIALOG */}
            {ratingBooking && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setRatingBooking(null)} />
                    <div className="z-10 w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-xl text-zinc-900 dark:text-white shadow-2xl text-left transition-colors animate-in fade-in zoom-in-95 duration-200">
                        <h2 className="font-extrabold text-lg">Leave a Review</h2>
                        <form onSubmit={handleRatingSubmit} className="space-y-4 mt-4">
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                Share your travel experience renting the <strong className="text-zinc-900 dark:text-white">{ratingBooking.vehicle?.name}</strong>.
                            </p>
                            
                            <div>
                                <label className="block text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Stars Rating</label>
                                <div className="flex gap-2 text-2xl">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button 
                                            key={star} 
                                            type="button" 
                                            onClick={() => setRatingStars(star)} 
                                            className={`${star <= ratingStars ? 'text-amber-500' : 'text-zinc-300 dark:text-zinc-700'} hover:scale-115 transition-transform cursor-pointer`}
                                        >
                                            ★
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5">Review Comment</label>
                                <textarea 
                                    rows="3"
                                    className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-2.5 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-[#FF3B30]"
                                    placeholder="Write your review here..."
                                    value={ratingComment}
                                    onChange={(e) => setRatingComment(e.target.value)}
                                    maxLength="500"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                                <Button type="button" variant="ghost" onClick={() => setRatingBooking(null)}>
                                    Cancel
                                </Button>
                                <Button type="submit" className="bg-[#FF3B30] hover:bg-red-700 text-white">
                                    Submit Review
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </PortalLayout>

        {/* Floating AI Chatbot — booking-aware */}
        <ElfaaChatbot vehicles={vehicles} promos={promos} addOns={addOns} bookings={bookings} />
        </>
    );
}
