import React, { useState, useEffect } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Badge, Button, Dialog, DialogContent, DialogHeader, DialogTitle } from '@/Components/Shadcn';
import { Sun, Moon } from 'lucide-react';
import CustomerAvailabilityPicker from '@/Components/CustomerAvailabilityPicker';
import VehicleImage from '@/Components/VehicleImage';
import ElfaaChatbot from '@/Components/ElfaaChatbot';
import ModernHero from '@/Components/ModernHero';

export default function Welcome({ auth, vehicles = [], promos = [], addOns = [] }) {
    const { settings } = usePage().props;
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [availabilityVehicle, setAvailabilityVehicle] = useState(null);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [transmissionFilter, setTransmissionFilter] = useState('All');
    const [typeFilter, setTypeFilter] = useState('All');
    const [activeSection, setActiveSection] = useState('home');
    const [lightboxImage, setLightboxImage] = useState(null);
    const [isDarkMode, setIsDarkMode] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('theme') !== 'light';
        }
        return true;
    });

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDarkMode]);

    // Track scroll position to highlight navigation items
    useEffect(() => {
        const handleScroll = () => {
            const promosEl = document.getElementById('promos');
            const fleetEl = document.getElementById('fleet');
            const scrollPos = window.scrollY + 200;

            if (fleetEl && scrollPos >= fleetEl.offsetTop) {
                setActiveSection('fleet');
            } else if (promosEl && scrollPos >= promosEl.offsetTop) {
                setActiveSection('promos');
            } else {
                setActiveSection('home');
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleBookClick = (vehicle) => {
        if (!auth.user) {
            setSelectedVehicle(vehicle);
            setShowAuthModal(true);
        } else {
            // Logged in, redirect to renter dashboard booking modal
            window.location.href = '/client/dashboard?select_vehicle=' + vehicle.id;
        }
    };

    const vehicleTypes = ['All', ...new Set(vehicles.map(v => v.type))];
    const filteredVehicles = vehicles.filter(v => {
        const matchesTransmission = transmissionFilter === 'All' || v.transmission === transmissionFilter;
        const matchesType = typeFilter === 'All' || v.type === typeFilter;
        return matchesTransmission && matchesType;
    });

    const currentYear = new Date().getFullYear();

    return (
        <>
        <div 
            className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100 font-sans selection:bg-[#FF3B30] selection:text-white"
            onContextMenu={(e) => {
                // Prevent default context menu on public website assets
                e.preventDefault();
            }}
        >
            <Head title="ELFAA CAR RENTAL | Premium Self-Drive Fleet" />

            {/* Navigation Header */}
            <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100 dark:bg-gray-950/90 dark:border-gray-900 shadow-sm transition-all">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {settings?.site_logo_image ? (
                            <img src={settings.site_logo_image} className="h-10 max-w-[150px] object-contain rounded" alt={settings?.site_logo || 'Logo'} />
                        ) : (
                            <Link href="/" className="flex items-center gap-2">
                                <div className="h-10 w-10 rounded-lg bg-[#FF3B30] flex items-center justify-center text-white font-black text-xl tracking-tighter shadow-md">
                                    {settings?.site_logo ? settings.site_logo.charAt(0) : 'E'}
                                </div>
                                <div>
                                    <span className="font-black text-lg tracking-tight text-gray-900 dark:text-white uppercase leading-none block">
                                        {settings?.site_logo || 'ELFAA'}
                                    </span>
                                    <span className="text-[10px] uppercase font-bold text-[#FF3B30] block tracking-widest mt-0.5">
                                        CAR RENTAL
                                    </span>
                                </div>
                            </Link>
                        )}
                    </div>

                    <nav className="hidden md:flex items-center gap-8 text-sm font-semibold">
                        <a 
                            href="#home" 
                            className={`transition-colors py-1 border-b-2 ${
                                activeSection === 'home' 
                                    ? 'text-[#FF3B30] border-[#FF3B30]' 
                                    : 'text-gray-600 dark:text-gray-300 border-transparent hover:text-[#FF3B30]'
                            }`}
                        >
                            Home
                        </a>
                        <a 
                            href="#promos" 
                            className={`transition-colors py-1 border-b-2 ${
                                activeSection === 'promos' 
                                    ? 'text-[#FF3B30] border-[#FF3B30]' 
                                    : 'text-gray-600 dark:text-gray-300 border-transparent hover:text-[#FF3B30]'
                            }`}
                        >
                            Promos & Offers
                        </a>
                        <a 
                            href="#fleet" 
                            className={`transition-colors py-1 border-b-2 ${
                                activeSection === 'fleet' 
                                    ? 'text-[#FF3B30] border-[#FF3B30]' 
                                    : 'text-gray-600 dark:text-gray-300 border-transparent hover:text-[#FF3B30]'
                            }`}
                        >
                            Our Fleet
                        </a>
                    </nav>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsDarkMode(!isDarkMode)}
                            className="p-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors shadow-sm"
                            title="Toggle Light / Dark Mode"
                        >
                            {isDarkMode ? <Sun className="w-4.5 h-4.5 text-amber-400" /> : <Moon className="w-4.5 h-4.5 text-slate-700" />}
                        </button>
                        <a href="#fleet" className="hidden sm:inline-block">
                            <Button variant="outline" size="sm" className="font-bold border-[#FF3B30]/40 text-[#FF3B30] hover:bg-[#FF3B30]/10">
                                Book Now
                            </Button>
                        </a>
                        {auth.user ? (
                            <Link 
                                href={auth.user.role === 'client' ? '/client/dashboard' : '/admin/dashboard'}
                            >
                                <Button variant="default" size="sm" className="bg-[#FF3B30] hover:bg-red-700 font-extrabold">
                                    Dashboard
                                </Button>
                            </Link>
                        ) : (
                            <>
                                <Link href={route('login')}>
                                    <Button variant="ghost" size="sm" className="font-bold">Sign In</Button>
                                </Link>
                                <Link href={route('register')}>
                                    <Button variant="default" size="sm" className="bg-[#FF3B30] hover:bg-red-700 font-extrabold">
                                        Sign Up
                                    </Button>
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <ModernHero settings={settings} setLightboxImage={setLightboxImage} />

            {/* Promos Section */}
            <section id="promos" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-2xl mx-auto mb-12">
                    <Badge variant="secondary" className="font-bold">Active Campaign</Badge>
                    <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mt-2">
                        ELFAA Exclusive Promos & Discounts
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
                        Apply these exclusive rental discounts on your next self-drive trip booking.
                    </p>
                </div>

                {promos.length === 0 ? (
                    <div className="text-center py-10 bg-white dark:bg-gray-900 rounded-xl border border-gray-150 dark:border-gray-800 text-gray-500">
                        No active promotions currently available. Please check back later.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {promos.map((promo) => (
                            <Card key={promo.id} className="overflow-hidden hover:shadow-md transition-shadow group flex flex-col md:flex-row bg-white border border-gray-200 dark:border-gray-800 dark:bg-gray-900">
                                {promo.image_url && (
                                    <div 
                                        className="w-full md:w-2/5 h-48 md:h-auto overflow-hidden relative cursor-pointer"
                                        onClick={() => setLightboxImage(promo.image_url)}
                                        title="Click to view promo image"
                                    >
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
                                            <Badge variant="success" className="uppercase font-bold tracking-wide bg-emerald-500 text-white">
                                                {promo.discount_text}
                                            </Badge>
                                        </div>
                                        <h3 className="font-extrabold text-lg text-gray-900 dark:text-white mb-1">
                                            {promo.title}
                                        </h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {promo.description}
                                        </p>
                                    </div>
                                    <div className="mt-4 text-xs font-semibold text-[#FF3B30]">
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
                            <Badge variant="secondary" className="font-bold">Fleet Catalog</Badge>
                            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mt-2">
                                Choose Your Next Self-Drive Car
                            </h2>
                            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
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
                                            ? 'bg-[#FF3B30] text-white border-[#FF3B30]' 
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
                            <Card key={vehicle.id} className="overflow-hidden hover:shadow-lg transition-transform duration-300 flex flex-col justify-between bg-white border border-gray-200 dark:border-gray-800 dark:bg-gray-950 text-gray-900 dark:text-white">
                                <div>
                                    <div 
                                        className="h-48 overflow-hidden relative bg-slate-100 dark:bg-slate-900 cursor-pointer group"
                                        onClick={() => {
                                            const firstImg = Array.isArray(vehicle.images) ? vehicle.images[0] : vehicle.images;
                                            if (firstImg) setLightboxImage(firstImg);
                                        }}
                                        title="Click to view vehicle photo"
                                    >
                                        <VehicleImage 
                                            images={vehicle.images} 
                                            name={vehicle.name} 
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                        <Badge className="absolute top-3 right-3 bg-[#FF3B30] text-white uppercase font-bold tracking-wider shadow-sm">
                                            {vehicle.type}
                                        </Badge>
                                    </div>

                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-xl font-bold">{vehicle.name}</CardTitle>
                                        <CardDescription>{vehicle.meetup_location || 'ELFAA Hub'}</CardDescription>
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

                                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
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
                                        <div className="text-lg font-black text-[#FF3B30]">
                                            PHP {parseFloat(vehicle.price_per_day).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button 
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setAvailabilityVehicle(vehicle)}
                                            className="text-[11px] font-bold border-gray-300 dark:border-gray-700"
                                        >
                                            Availability
                                        </Button>
                                        <Button 
                                            variant="default"
                                            onClick={() => handleBookClick(vehicle)}
                                            className="shadow-sm font-extrabold bg-[#FF3B30] hover:bg-red-700 text-white"
                                        >
                                            Book Now
                                        </Button>
                                    </div>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-950 text-gray-400 border-t border-gray-800 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-3">
                        {settings?.site_logo_image ? (
                            <img src={settings.site_logo_image} className="h-8 max-w-[120px] object-contain rounded" alt={settings?.site_logo || 'Logo'} />
                        ) : (
                            <>
                                <div className="h-8 w-8 rounded bg-[#FF3B30] flex items-center justify-center text-white font-black text-lg shadow">
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
                            <div className="text-[11px] text-gray-400 space-y-0.5 mt-1">
                                {settings?.contact_email && <p>Email: {settings.contact_email}</p>}
                                {settings?.contact_phone && <p>Phone: {settings.contact_phone}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Social Media Links */}
                    <div className="flex items-center gap-4">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Follow Us:</span>
                        <a
                            href="https://facebook.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-full bg-gray-900 hover:bg-[#FF3B30] text-gray-300 hover:text-white transition-colors"
                            title="Facebook"
                        >
                            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                        </a>
                        <a
                            href="https://instagram.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-full bg-gray-900 hover:bg-[#FF3B30] text-gray-300 hover:text-white transition-colors"
                            title="Instagram"
                        >
                            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                        </a>
                        <a
                            href="https://twitter.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-full bg-gray-900 hover:bg-[#FF3B30] text-gray-300 hover:text-white transition-colors"
                            title="Twitter / X"
                        >
                            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                        </a>
                        <a
                            href="https://whatsapp.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-full bg-gray-900 hover:bg-[#FF3B30] text-gray-300 hover:text-white transition-colors"
                            title="WhatsApp"
                        >
                            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-1.099 4.019 4.142-1.087z"/></svg>
                        </a>
                    </div>

                    <p className="text-xs text-gray-500">
                        &copy; {currentYear} {settings?.site_logo || 'ELFAA CAR RENTAL'}. Built using Laravel 12 + Inertia React. All rights reserved.
                    </p>
                </div>
            </footer>

            {/* Reservation / Auth Modal Trigger */}
            <Dialog open={showAuthModal} onOpenChange={setShowAuthModal}>
                <DialogHeader>
                    <DialogTitle>Required Customer Registration</DialogTitle>
                </DialogHeader>
                <DialogContent className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        To request a reservation for <strong className="text-gray-900 dark:text-white">{selectedVehicle?.name}</strong>, you need to sign in or create an ELFAA customer account first.
                    </p>
                    <div className="flex flex-col gap-2 pt-4">
                        <Link href={route('login')} className="w-full">
                            <Button className="w-full bg-[#FF3B30] hover:bg-red-700 font-extrabold" variant="default">
                                Login to Account
                            </Button>
                        </Link>
                        <Link href={route('register')} className="w-full">
                            <Button className="w-full font-bold" variant="outline">
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

            {/* Public Vehicle Availability Calendar Modal */}
            <Dialog open={!!availabilityVehicle} onOpenChange={() => setAvailabilityVehicle(null)}>
                <DialogHeader>
                    <DialogTitle>Vehicle Availability Schedule</DialogTitle>
                </DialogHeader>
                <DialogContent className="max-w-md">
                    {availabilityVehicle && (
                        <CustomerAvailabilityPicker vehicle={availabilityVehicle} />
                    )}
                </DialogContent>
            </Dialog>

            {/* Lightbox / Image Modal */}
            {lightboxImage && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md transition-opacity"
                    onClick={() => setLightboxImage(null)}
                >
                    <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-xl">
                        <img 
                            src={lightboxImage} 
                            alt="Full view" 
                            className="w-full h-full object-contain rounded-xl shadow-2xl"
                        />
                        <button
                            type="button"
                            onClick={() => setLightboxImage(null)}
                            className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-[#FF3B30] text-white rounded-full transition-colors text-xs font-black"
                            title="Close full view"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}
        </div>

        {/* Floating AI Chatbot */}
        <ElfaaChatbot vehicles={vehicles} promos={promos} addOns={addOns} />
        </>
    );
}
