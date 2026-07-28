import React, { useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Badge, Button, Dialog, DialogContent, DialogHeader, DialogTitle } from '@/Components/Shadcn';

export default function Welcome({ auth, vehicles = [], promos = [], addOns = [] }) {
    const { settings } = usePage().props;
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [transmissionFilter, setTransmissionFilter] = useState('All');
    const [typeFilter, setTypeFilter] = useState('All');

    const handleBookClick = (vehicle) => {
        if (!auth.user) {
            setSelectedVehicle(vehicle);
            setShowAuthModal(true);
        } else {
            // Logged in, redirect to workspace rental flow
            window.location.href = '/client/dashboard?select_vehicle=' + vehicle.id;
        }
    };

    const vehicleTypes = ['All', ...new Set(vehicles.map(v => v.type))];
    const filteredVehicles = vehicles.filter(v => {
        const matchesTransmission = transmissionFilter === 'All' || v.transmission === transmissionFilter;
        const matchesType = typeFilter === 'All' || v.type === typeFilter;
        return matchesTransmission && matchesType;
    });

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100 font-sans">
            <Head title="ELFAA CAR RENTAL | Premium Booking Platform" />

            {/* Navigation Header */}
            <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 dark:bg-gray-950/80 dark:border-gray-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {settings?.site_logo_image ? (
                            <img src={settings.site_logo_image} className="h-10 max-w-[150px] object-contain rounded" alt={settings?.site_logo || 'Logo'} />
                        ) : (
                            <>
                                <div className="h-10 w-10 rounded-lg bg-brand flex items-center justify-center text-white font-black text-xl tracking-tighter shadow-md">
                                    {settings?.site_logo ? settings.site_logo.charAt(0) : 'E'}
                                </div>
                                <div>
                                    <span className="font-black text-lg tracking-tight text-gray-900 dark:text-white uppercase leading-none block">
                                        {settings?.site_logo || 'ELFAA'}
                                    </span>
                                    <span className="text-[10px] uppercase font-bold text-brand block tracking-widest mt-0.5">
                                        CAR RENTAL
                                    </span>
                                </div>
                            </>
                        )}
                    </div>

                    <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
                        <a href="#promos" className="hover:text-brand transition-colors">Promos</a>
                        <a href="#fleet" className="hover:text-brand transition-colors">Our Fleet</a>
                    </nav>

                    <div className="flex items-center gap-3">
                        {auth.user ? (
                            <Link 
                                href={auth.user.role === 'client' ? '/client/dashboard' : '/admin/dashboard'}
                            >
                                <Button variant="default" size="sm">Go to Dashboard</Button>
                            </Link>
                        ) : (
                            <>
                                <Link href={route('login')}>
                                    <Button variant="ghost" size="sm">Sign In</Button>
                                </Link>
                                <Link href={route('register')}>
                                    <Button variant="default" size="sm">Sign Up</Button>
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative overflow-hidden py-20 bg-gradient-to-b from-gray-100 to-gray-50 dark:from-gray-900 dark:to-gray-950">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div className="space-y-6">
                        <Badge variant="outline" className="border-brand text-brand">
                            ★ ELFAA RENTAL EXCELLENCE
                        </Badge>
                        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-gray-900 dark:text-white leading-[1.1] whitespace-pre-line">
                            {settings?.home_hero_title || 'Rent Premium Vehicles\nWithout Muddle.'}
                        </h1>
                        <p className="text-lg text-gray-600 dark:text-gray-400">
                            {settings?.home_hero_subtitle || "Discover ELFAA CAR RENTAL's modern self-drive fleet. Real-time availability checks guarantee a seamless double-booking-free rental experience."}
                        </p>
                        <div className="flex flex-wrap gap-4 pt-2">
                            <a href="#fleet">
                                <Button size="lg" className="px-8 shadow-lg shadow-brand/20">
                                    Browse Fleet
                                </Button>
                            </a>
                        </div>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-brand/10 to-brand-dark/10 rounded-3xl blur-3xl" />
                        <img 
                            src="https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=800" 
                            alt="ELFAA Premium Car Showcase" 
                            className="relative rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 object-cover w-full h-[320px] sm:h-[400px]"
                        />
                    </div>
                </div>
            </section>

            {/* Promos Section */}
            <section id="promos" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-2xl mx-auto mb-12">
                    <Badge variant="secondary">Active Campaign</Badge>
                    <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mt-2">
                        ELFAA Exclusive Promos & Discounts
                    </h2>
                    <p className="text-gray-550 dark:text-gray-400 text-sm mt-2">
                        Apply these exclusive rental discounts on your next self-drive trip booking.
                    </p>
                </div>

                {promos.length === 0 ? (
                    <div className="text-center py-10 bg-white dark:bg-gray-900 rounded-xl border border-gray-150 dark:border-gray-800 text-gray-500">
                        No active promotions at compliance. Please check back later.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {promos.map((promo) => (
                            <Card key={promo.id} className="overflow-hidden hover:shadow-md transition-shadow group flex flex-col md:flex-row bg-white border border-gray-150 dark:border-gray-850 dark:bg-gray-900">
                                {promo.image_url && (
                                    <div className="w-full md:w-2/5 h-48 md:h-auto overflow-hidden relative">
                                        <img 
                                            src={promo.image_url} 
                                            alt={promo.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    </div>
                                )}
                                <div className="p-6 flex flex-col justify-between flex-1">
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <Badge variant="success" className="uppercase font-bold tracking-wide">
                                                {promo.discount_text}
                                            </Badge>
                                        </div>
                                        <h3 className="font-extrabold text-lg text-gray-900 dark:text-white mb-1">
                                            {promo.title}
                                        </h3>
                                        <p className="text-sm text-gray-550 dark:text-gray-400">
                                            {promo.description}
                                        </p>
                                    </div>
                                    <div className="mt-4 text-xs font-semibold text-brand">
                                        Applied automatically during checkout
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </section>

            {/* Fleet Section */}
            <section id="fleet" className="py-20 bg-white dark:bg-gray-900/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12">
                        <div>
                            <Badge variant="secondary">Fleet Catalog</Badge>
                            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mt-2">
                                Choose Your Next Self-Drive Car
                            </h2>
                            <p className="text-gray-550 dark:text-gray-400 text-sm mt-1">
                                Clean. Safe. Fully equipped with automatic configurations.
                            </p>
                        </div>

                        {/* Filter Tabs */}
                        <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
                            {vehicleTypes.map(type => (
                                <button
                                    key={type}
                                    onClick={() => setTypeFilter(type)}
                                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                                        typeFilter === type 
                                            ? 'bg-brand text-white border-brand' 
                                            : 'bg-white text-gray-650 hover:bg-gray-50 border-gray-200 dark:bg-gray-950 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-900'
                                    }`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {filteredVehicles.map((vehicle) => (
                            <Card key={vehicle.id} className="overflow-hidden hover:shadow-lg transition-transform duration-300 flex flex-col justify-between bg-white border border-gray-150 dark:border-gray-800 dark:bg-gray-950 text-gray-900 dark:text-white">
                                <div>
                                    <div className="h-48 overflow-hidden relative bg-gray-100 dark:bg-gray-900">
                                        <img 
                                            src={vehicle.images?.[0] || 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=800'} 
                                            alt={vehicle.name} 
                                            className="w-full h-full object-cover"
                                        />
                                        <Badge className="absolute top-3 right-3 bg-brand uppercase font-bold tracking-wider">
                                            {vehicle.type}
                                        </Badge>
                                    </div>

                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-xl font-bold">{vehicle.name}</CardTitle>
                                        <CardDescription>{vehicle.meetup_location || 'Elfaa Hub'}</CardDescription>
                                    </CardHeader>

                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-3 gap-2 py-2 text-center text-xs bg-gray-50 dark:bg-gray-900/50 rounded-lg text-gray-600 dark:text-gray-400">
                                            <div>
                                                <span className="block font-bold text-gray-900 dark:text-gray-200">
                                                    {vehicle.seats}
                                                </span>
                                                Seats
                                            </div>
                                            <div>
                                                <span className="block font-bold text-gray-900 dark:text-gray-200">
                                                    {vehicle.transmission}
                                                </span>
                                                Gear
                                            </div>
                                            <div>
                                                <span className="block font-bold text-gray-900 dark:text-gray-200">
                                                    {vehicle.fuel_type}
                                                </span>
                                                Fuel
                                            </div>
                                        </div>

                                        <p className="text-xs text-gray-550 dark:text-gray-405 line-clamp-2">
                                            {vehicle.description}
                                        </p>

                                        <div className="flex flex-wrap gap-1.5">
                                            {(vehicle.features || []).slice(0, 3).map((feat, idx) => (
                                                <Badge key={idx} variant="outline" className="text-[10px] py-px px-2 border-gray-200 dark:border-gray-800">
                                                    {feat}
                                                </Badge>
                                            ))}
                                        </div>
                                    </CardContent>
                                </div>

                                <CardFooter className="flex items-center justify-between pt-4 bg-gray-50/50 dark:bg-gray-900/20 border-t border-gray-100 dark:border-gray-900">
                                    <div>
                                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">price per day</div>
                                        <div className="text-lg font-black text-brand">
                                            PHP {parseFloat(vehicle.price_per_day).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </div>
                                    </div>
                                    <Button 
                                        variant="default"
                                        onClick={() => handleBookClick(vehicle)}
                                        className="shadow-sm font-extrabold"
                                    >
                                        Book Now
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>            {/* Footer */}
            <footer className="bg-gray-900 text-gray-400 border-t border-gray-800 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-3">
                        {settings?.site_logo_image ? (
                            <img src={settings.site_logo_image} className="h-8 max-w-[120px] object-contain rounded" alt={settings?.site_logo || 'Logo'} />
                        ) : (
                            <>
                                <div className="h-8 w-8 rounded bg-brand flex items-center justify-center text-white font-black text-lg shadow">
                                    {settings?.site_logo ? settings.site_logo.charAt(0) : 'E'}
                                </div>
                                <div className="text-left">
                                    <span className="font-black text-white uppercase tracking-tight text-sm block">
                                        {settings?.site_logo || 'ELFAA CAR RENTAL'}
                                    </span>
                                </div>
                            </>
                        )}
                        <div className="text-left font-medium">
                            <div className="text-[10px] text-gray-500 space-y-0.5 mt-1">
                                {settings?.contact_email && <p>Email: {settings.contact_email}</p>}
                                {settings?.contact_phone && <p>Phone: {settings.contact_phone}</p>}
                            </div>
                        </div>
                    </div>

                    <p className="text-xs text-gray-550">
                        &copy; 2026 {settings?.site_logo || 'ELFAA CAR RENTAL'}. Built using Laravel 12 + Inertia React. All rights reserved.
                    </p>
                </div>
            </footer>

            {/* Reservation / Auth Modal Trigger */}
            <Dialog open={showAuthModal} onOpenChange={setShowAuthModal}>
                <DialogHeader>
                    <DialogTitle>Required Registration</DialogTitle>
                </DialogHeader>
                <DialogContent className="space-y-4">
                    <p className="text-sm text-gray-650 dark:text-gray-400 mt-2">
                        To request a reservation for <strong className="text-gray-900 dark:text-white">{selectedVehicle?.name}</strong>, you need to sign in or create an ELFAA customer account first.
                    </p>
                    <div className="flex flex-col gap-2 pt-4">
                        <Link href={route('login')} className="w-full">
                            <Button className="w-full" variant="default">
                                Login to Account
                            </Button>
                        </Link>
                        <Link href={route('register')} className="w-full">
                            <Button className="w-full" variant="outline">
                                Register New Account
                            </Button>
                        </Link>
                        <Button 
                            className="w-full mt-1 text-gray-400 hover:text-gray-200" 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setShowAuthModal(false)}
                        >
                            Cancel
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
