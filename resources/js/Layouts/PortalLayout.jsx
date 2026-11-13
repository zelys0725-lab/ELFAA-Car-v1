import { useState, useEffect } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import Dropdown from '@/Components/Dropdown';
import CarLoader from '@/Components/CarLoader';
import ApplicationLogo from '@/Components/ApplicationLogo';
import { 
    LayoutDashboard, 
    CalendarDays, 
    CalendarCheck, 
    FileText, 
    ShieldCheck, 
    Receipt, 
    CreditCard, 
    Car, 
    Tag, 
    Package, 
    BarChart3, 
    Users, 
    Settings, 
    Moon, 
    Sun, 
    Menu, 
    X,
    LogOut,
    SlidersHorizontal,
    User,
    ChevronDown,
    ChevronsUpDown,
    Radio,
    CheckSquare,
    Mail,
    Phone,
    MapPin,
    Clock,
    Lock,
    Unlock,
    Eye,
    EyeOff
} from 'lucide-react';

export default function PortalLayout({ role, header, children, sidebarTabs = [], activeTab = '', setActiveTab = null }) {
    const user = usePage().props.auth.user;
    const [showingMobileMenu, setShowingMobileMenu] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Track Inertia router page transitions
    useEffect(() => {
        const removeStartListener = router.on('start', () => setIsLoading(true));
        const removeFinishListener = router.on('finish', () => setIsLoading(false));
        return () => {
            removeStartListener();
            removeFinishListener();
        };
    }, []);

    // Light / Dark Theme Mode management
    const [theme, setTheme] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('theme') || 'dark'; // Dark theme as default mockup style
        }
        return 'dark';
    });

    // Automatic Session Lock Timer: 5 minutes of inactivity (changed from 15 minutes)
    const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
    const [isSessionLocked, setIsSessionLocked] = useState(false);
    const [lockPassword, setLockPassword] = useState('');
    const [unlockError, setUnlockError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isUnlocking, setIsUnlocking] = useState(false);

    useEffect(() => {
        let lastActivity = Date.now();
        const updateActivity = () => {
            lastActivity = Date.now();
        };

        const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
        events.forEach(e => window.addEventListener(e, updateActivity, { passive: true }));

        const interval = setInterval(() => {
            if (!isSessionLocked && Date.now() - lastActivity >= INACTIVITY_TIMEOUT_MS) {
                setIsSessionLocked(true);
            }
        }, 5000);

        return () => {
            events.forEach(e => window.removeEventListener(e, updateActivity));
            clearInterval(interval);
        };
    }, [isSessionLocked]);

    const handleUnlock = (e) => {
        e?.preventDefault();
        setUnlockError('');
        setIsUnlocking(true);

        if (!lockPassword.trim()) {
            setUnlockError('Please enter your account password to unlock.');
            setIsUnlocking(false);
            return;
        }

        router.post(route('password.confirm'), {
            password: lockPassword,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setIsSessionLocked(false);
                setLockPassword('');
                setUnlockError('');
                setIsUnlocking(false);
            },
            onError: (err) => {
                setIsUnlocking(false);
                setUnlockError(err?.password || 'Incorrect password. Please verify and try again.');
            }
        });
    };

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);

    const toggleTheme = () => {
        const nextTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(nextTheme);
        localStorage.setItem('theme', nextTheme);
    };

    const { settings } = usePage().props;
    const isAdminOrStaff = role === 'admin' || role === 'staff';
    const logoutRoute = route('logout');

    // Default icon helper for sidebar keys
    const getSidebarIcon = (tabId) => {
        const svgClasses = "w-4 h-4 text-[#FF3B30] mr-3 flex-shrink-0 transition-all duration-150 group-hover:scale-110";
        switch (tabId) {
            case 'analytics':
                return <LayoutDashboard className={svgClasses} />;
            case 'gps_fleet':
                return <Radio className={svgClasses} />;
            case 'daily_schedule':
                return <CalendarDays className={svgClasses} />;
            case 'calendar':
                return <CalendarCheck className={svgClasses} />;
            case 'booking_requests':
                return <CheckSquare className={svgClasses} />;
            case 'bookings':
                return <FileText className={svgClasses} />;
            case 'verifications':
                return <ShieldCheck className={svgClasses} />;
            case 'bill_records':
                return <Receipt className={svgClasses} />;
            case 'vehicles':
                return <Car className={svgClasses} />;
            case 'promos':
                return <Tag className={svgClasses} />;
            case 'addons':
                return <Package className={svgClasses} />;
            case 'reports':
                return <BarChart3 className={svgClasses} />;
            case 'profit_analytics':
                return <BarChart3 className={svgClasses} />;
            case 'users':
                return <Users className={svgClasses} />;
            case 'payment_settings':
                return <CreditCard className={svgClasses} />;
            case 'settings':
                return <Settings className={svgClasses} />;
            case 'profile':
                return <User className={svgClasses} />;
            default:
                return <SlidersHorizontal className={svgClasses} />;
        }
    };

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-850 dark:text-zinc-100 flex flex-col md:flex-row font-sans selection:bg-red-500/30 selection:text-white transition-colors duration-200">
            <CarLoader isVisible={isLoading} />
            {/* 1. LEFT SIDEBAR (Desktop/Tablet) */}
            {isAdminOrStaff && (
                <aside className="hidden md:flex flex-col w-64 bg-zinc-100 dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 flex-shrink-0 h-screen sticky top-0 transition-colors">
                    {/* Header Brand */}
                    <div className="h-16 px-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                        <div className="flex items-center space-x-2.5 overflow-hidden">
                            {settings?.site_logo_image ? (
                                <img 
                                    src={settings.site_logo_image} 
                                    className="h-8 w-auto max-w-[80px] object-contain rounded shrink-0" 
                                    alt={settings?.site_logo || 'Logo'} 
                                />
                            ) : (
                                <ApplicationLogo className="w-7 h-7 fill-[#FF3B30] text-[#FF3B30] shrink-0" />
                            )}
                            <span className="text-sm font-black tracking-widest text-zinc-900 dark:text-white uppercase truncate">
                                {settings?.site_logo || 'ELFAA CARS'}
                            </span>
                        </div>
                        <ChevronsUpDown className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white cursor-pointer" />
                    </div>

                    {/* Navigation Body */}
                    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-7 scrollbar-thin">
                        <div className="space-y-4">
                            {/* Section tabs mapping */}
                            <div className="space-y-1">
                                {sidebarTabs.map((tab) => {
                                    const isActive = activeTab === tab.id;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab?.(tab.id)}
                                            className={`w-full group flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                                                isActive
                                                    ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white font-extrabold focus:outline-none'
                                                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/50 dark:hover:bg-zinc-850/50'
                                            }`}
                                        >
                                            <div className="flex items-center min-w-0">
                                                {getSidebarIcon(tab.id)}
                                                <span className="truncate">{tab.label}</span>
                                            </div>
                                            {tab.badge && (
                                                <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase shrink-0 shadow-sm ${tab.badgeColor || 'bg-red-500 text-white'}`}>
                                                    {tab.badge}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>


                </aside>
            )}

            {/* 2. BODY CONTENT PANEL */}
            <div className="flex-1 flex flex-col h-screen overflow-y-auto bg-zinc-50 dark:bg-zinc-950">
                {/* Header Navbar */}
                <nav className="h-16 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800/80 sticky top-0 z-30 flex items-center justify-between px-6 transition-colors">
                    <div className="flex items-center space-x-3">
                        {/* Sidebar toggle graphic placeholder / columns icon */}
                        {isAdminOrStaff && (
                            <div className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white cursor-pointer select-none">
                                <SlidersHorizontal className="w-4 h-4" />
                            </div>
                        )}
                        {!isAdminOrStaff && (
                            <Link href="/" className="flex items-center gap-2 mr-1 group">
                                {settings?.site_logo_image ? (
                                    <img 
                                        src={settings.site_logo_image} 
                                        className="h-7 w-auto max-w-[90px] object-contain rounded shrink-0" 
                                        alt={settings?.site_logo || 'Logo'} 
                                    />
                                ) : (
                                    <div className="h-7 w-7 rounded-lg bg-[#FF3B30] flex items-center justify-center p-1 shrink-0">
                                        <ApplicationLogo className="w-full h-full fill-white" />
                                    </div>
                                )}
                                <span className="text-xs font-black tracking-widest text-zinc-900 dark:text-white uppercase truncate">
                                    {settings?.site_logo || 'ELFAA'}
                                </span>
                            </Link>
                        )}
                        <span className="text-zinc-300 dark:text-zinc-700 hidden sm:inline">|</span>
                        <h1 className="text-sm font-bold text-zinc-900 dark:text-white tracking-wide uppercase">
                            {header || (role === 'client' ? 'Customer portal' : 'Workspace')}
                        </h1>
                    </div>

                    <div className="flex items-center space-x-3">
                        {/* Auto-Lock Security Pill (5-Minute Inactivity) */}
                        <button
                            type="button"
                            onClick={() => setIsSessionLocked(true)}
                            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[10px] font-bold text-zinc-600 dark:text-zinc-400 hover:border-amber-500/40 hover:text-amber-500 transition-colors cursor-pointer"
                            title="Session automatically locks after 5 minutes of inactivity. Click to lock immediately."
                        >
                            <Lock className="w-3 h-3 text-amber-500" />
                            <span>Auto-Lock: 5m</span>
                        </button>

                        {/* Theme Toggle in Header Navbar */}
                        <button 
                            onClick={toggleTheme} 
                            className="p-2 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
                            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                        >
                            {theme === 'light' ? (
                                <Moon className="w-4 h-4 text-zinc-600" />
                            ) : (
                                <Sun className="w-4 h-4 text-amber-400" />
                            )}
                        </button>

                        {/* Top navigation for client/customer */}
                        {!isAdminOrStaff && (
                            <div className="flex items-center gap-4 overflow-x-auto max-w-[320px] xs:max-w-[420px] sm:max-w-none whitespace-nowrap scrollbar-none py-1 mr-2">
                                <div className="flex items-center gap-3 pr-4">
                                    {sidebarTabs.map(tab => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab?.(tab.id)}
                                            className={`text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                                                activeTab === tab.id
                                                    ? 'text-[#FF3B30] font-black'
                                                    : 'text-zinc-550 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                                            }`}
                                        >
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Topbar User Account Card & Menu for Admin/Staff/Client */}
                        <div className="relative">
                            <Dropdown>
                                <Dropdown.Trigger>
                                    <button className="inline-flex items-center gap-2.5 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-semibold rounded-xl text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer transition-colors shadow-sm">
                                        <div className="h-6 w-6 rounded-full bg-red-500/10 dark:bg-red-500/20 text-[#FF3B30] flex items-center justify-center flex-shrink-0">
                                            <User className="w-3.5 h-3.5" />
                                        </div>
                                        <span className="font-bold text-xs truncate max-w-[120px]">{user.name}</span>
                                        <ChevronDown className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500" />
                                    </button>
                                </Dropdown.Trigger>
                                <Dropdown.Content contentClasses="py-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 shadow-xl min-w-[200px]">
                                    <div className="px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
                                        <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">{user.name}</p>
                                        <p className="text-[10px] text-zinc-500 truncate">{user.email}</p>
                                        <p className="text-[9px] font-black uppercase text-red-500 mt-0.5">{user.role}</p>
                                    </div>
                                    <Link href={user.role === 'client' ? (route('client.dashboard') + '?tab=security') : route('profile.edit')} className="flex items-center gap-2 w-full px-4 py-2 text-left text-xs font-bold leading-5 hover:bg-zinc-100 dark:hover:bg-zinc-850 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white border-b border-zinc-100 dark:border-zinc-800/60">
                                        <ShieldCheck className="w-3.5 h-3.5 text-[#FF3B30]" />
                                        <span>Security & Profile (2FA)</span>
                                    </Link>
                                    <button 
                                        type="button" 
                                        onClick={() => setIsSessionLocked(true)} 
                                        className="flex items-center gap-2 w-full px-4 py-2 text-left text-xs font-bold leading-5 hover:bg-zinc-100 dark:hover:bg-zinc-850 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white border-b border-zinc-100 dark:border-zinc-800/60 cursor-pointer"
                                    >
                                        <Lock className="w-3.5 h-3.5 text-amber-500" />
                                        <span>Lock Screen (5m Auto)</span>
                                    </button>
                                    <Link href={logoutRoute} method="post" as="button" className="block w-full px-4 py-2 text-left text-xs font-bold leading-5 hover:bg-zinc-100 dark:hover:bg-zinc-850 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white">
                                        Sign Out
                                    </Link>
                                </Dropdown.Content>
                            </Dropdown>
                        </div>

                        {/* Mobile sidebar toggle */}
                        {isAdminOrStaff && (
                            <div className="flex md:hidden items-center">
                                <button
                                    onClick={() => setShowingMobileMenu(!showingMobileMenu)}
                                    className="p-1 rounded text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white focus:outline-none"
                                >
                                    {showingMobileMenu ? (
                                        <X className="h-6 w-6" />
                                    ) : (
                                        <Menu className="h-6 w-6" />
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </nav>

                {/* Mobile Dropdown Menu */}
                {isAdminOrStaff && showingMobileMenu && (
                    <div className="md:hidden bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-4 py-4 space-y-3 transition-colors">
                        <div className="space-y-1">
                            {sidebarTabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => {
                                        setActiveTab?.(tab.id);
                                        setShowingMobileMenu(false);
                                    }}
                                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                                        activeTab === tab.id
                                            ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white font-extrabold'
                                            : 'text-zinc-550 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-850 hover:text-zinc-900 dark:hover:text-white'
                                    }`}
                                >
                                    <div className="flex items-center min-w-0">
                                        {getSidebarIcon(tab.id)}
                                        <span className="truncate">{tab.label}</span>
                                    </div>
                                    {tab.badge && (
                                        <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase ${tab.badgeColor || 'bg-red-500 text-white'}`}>
                                            {tab.badge}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                        <div className="border-t border-zinc-200 dark:border-zinc-800 pt-3 flex items-center justify-between">
                            <div className="text-xs text-zinc-500 dark:text-zinc-400">Theme Mode:</div>
                            <button onClick={() => { toggleTheme(); setShowingMobileMenu(false); }} className="text-xs text-red-600 hover:text-red-500 font-bold uppercase transition-colors">
                                Toggle light/dark
                            </button>
                        </div>
                        <div className="border-t border-zinc-200 dark:border-zinc-800 pt-3">
                            <Link href={logoutRoute} method="post" as="button" className="text-xs font-bold text-red-650 hover:text-red-500 uppercase text-left w-full transition-colors">
                                Sign Out
                            </Link>
                        </div>
                    </div>
                )}

                {/* Main Content Area */}
                <main className="flex-1 p-6 md:p-8 bg-zinc-50 dark:bg-zinc-950 transition-colors">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>

                {/* 3. Customer UI Footer */}
                {!isAdminOrStaff && (
                    <footer className="mt-auto border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 py-8 px-6 transition-colors">
                        <div className="max-w-7xl mx-auto space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                                {/* Col 1: Brand & Identity */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2.5">
                                        {settings?.site_logo_image ? (
                                            <img 
                                                src={settings.site_logo_image} 
                                                className="h-8 w-auto max-w-[110px] object-contain rounded shrink-0" 
                                                alt={settings?.site_logo || 'Logo'} 
                                            />
                                        ) : (
                                            <div className="h-8 w-8 rounded-lg bg-[#FF3B30] flex items-center justify-center p-1.5 shrink-0 shadow-sm">
                                                <ApplicationLogo className="w-full h-full fill-white" />
                                            </div>
                                        )}
                                        <div>
                                            <span className="font-black text-sm tracking-tight text-zinc-900 dark:text-white uppercase block leading-none">
                                                {settings?.site_logo || 'ELFAA CAR RENTAL'}
                                            </span>
                                            <span className="text-[9px] uppercase font-bold text-[#FF3B30] tracking-wider block mt-0.5">
                                                Premium Self-Drive Fleet
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-sm">
                                        Reliable, clean, and fully-insured self-drive car rentals serving Batangas, Laguna, and surrounding areas.
                                    </p>
                                </div>

                                {/* Col 2: Customer Support & Contact Info */}
                                <div className="space-y-2.5">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-[#FF3B30] block">
                                        Customer Support & Hotlines
                                    </span>
                                    <div className="space-y-2 text-xs">
                                        {/* Contact Email */}
                                        <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                                            <div className="w-6 h-6 rounded-md bg-red-500/10 text-[#FF3B30] flex items-center justify-center shrink-0">
                                                <Mail className="w-3.5 h-3.5" />
                                            </div>
                                            <div>
                                                <span className="text-[10px] text-zinc-400 block font-semibold">Support Email</span>
                                                <a 
                                                    href={`mailto:${settings?.contact_email || 'elfaacarrental@gmail.com'}`}
                                                    className="font-bold hover:text-[#FF3B30] transition-colors"
                                                >
                                                    {settings?.contact_email || 'elfaacarrental@gmail.com'}
                                                </a>
                                            </div>
                                        </div>

                                        {/* Contact Phone / Hotline */}
                                        <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                                            <div className="w-6 h-6 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                                                <Phone className="w-3.5 h-3.5" />
                                            </div>
                                            <div>
                                                <span className="text-[10px] text-zinc-400 block font-semibold">Direct Phone / Hotline</span>
                                                <a 
                                                    href={`tel:${settings?.contact_phone || '0917-888-9999'}`}
                                                    className="font-mono font-bold hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                                                >
                                                    {settings?.contact_phone || '0917-888-9999'}
                                                </a>
                                            </div>
                                        </div>

                                        {/* Operating Hours */}
                                        <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 pt-0.5">
                                            <Clock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                                            <span className="text-[11px]">Operating: Daily 8:00 AM – 8:00 PM (24/7 Roadside Assistance)</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Col 3: Garage HQ & Service Quicklinks */}
                                <div className="space-y-2.5">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block">
                                        Garage Dispatch & Quick Access
                                    </span>
                                    <div className="flex items-start gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                                        <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                                        <span className="text-[11px] leading-relaxed">
                                            Main HQ: Mercedes Homes Padre Pio, Sto. Tomas, Batangas (Pick-up Hubs at SM Sto. Tomas, Tanauan & Calamba)
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-2 pt-1">
                                        <button
                                            type="button"
                                            onClick={() => setActiveTab?.('fleet')}
                                            className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-[#FF3B30] transition-colors"
                                        >
                                            Browse Fleet
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setActiveTab?.('dashboard')}
                                            className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-[#FF3B30] transition-colors"
                                        >
                                            Reservation Hub
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setActiveTab?.('promos')}
                                            className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-[#FF3B30] transition-colors"
                                        >
                                            Promos
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Bottom Note & Copyright */}
                            <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-zinc-400">
                                <span>
                                    © {new Date().getFullYear()} {settings?.site_logo || 'ELFAA CAR RENTAL'}. All rights reserved.
                                </span>
                                <span className="text-[10px] font-medium text-zinc-500">
                                    Need urgent assistance? Call our direct hotline anytime at <strong className="text-zinc-700 dark:text-zinc-300 font-mono">{settings?.contact_phone || '0917-888-9999'}</strong>
                                </span>
                            </div>
                        </div>
                    </footer>
                )}
            </div>

            {/* Automatic Session Lock Overlay (5-Minute Inactivity Protection) */}
            {isSessionLocked && (
                <div 
                    className="fixed inset-0 z-[9999] bg-zinc-950/90 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="session-lock-title"
                >
                    <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-7 shadow-2xl text-center space-y-5 relative overflow-hidden">
                        {/* Top Accent Gradient */}
                        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-red-600 via-[#FF3B30] to-amber-500" />
                        
                        <div className="mx-auto w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/25 flex items-center justify-center text-[#FF3B30] shadow-inner">
                            <Lock className="w-8 h-8 animate-pulse" />
                        </div>

                        <div>
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-[#FF3B30] text-[10px] font-black uppercase tracking-wider mb-2">
                                <Clock className="w-3 h-3" />
                                <span>Auto-Locked • 5m Inactivity Protection</span>
                            </div>
                            <h2 id="session-lock-title" className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">
                                Session Locked
                            </h2>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto leading-relaxed">
                                Your session was automatically locked after <strong>5 minutes of inactivity</strong> to protect sensitive customer data and fleet operations.
                            </p>
                        </div>

                        {/* User Profile Card */}
                        <div className="p-3.5 bg-zinc-50 dark:bg-zinc-950/70 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex items-center gap-3 text-left">
                            <div className="w-10 h-10 rounded-xl bg-[#FF3B30]/15 text-[#FF3B30] font-black text-sm flex items-center justify-center shrink-0">
                                {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="font-extrabold text-sm text-zinc-900 dark:text-white truncate">{user.name}</div>
                                <div className="text-[11px] text-zinc-500 truncate">{user.email}</div>
                            </div>
                            <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-red-500/15 text-[#FF3B30] border border-red-500/25">
                                {user.role}
                            </span>
                        </div>

                        {/* Unlock Form */}
                        <form onSubmit={handleUnlock} className="space-y-3.5 text-left">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                                    Enter Account Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={lockPassword}
                                        onChange={(e) => { setLockPassword(e.target.value); setUnlockError(''); }}
                                        placeholder="Enter password..."
                                        className="w-full h-11 px-3.5 pr-10 text-xs rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:border-[#FF3B30] focus:ring-1 focus:ring-[#FF3B30]"
                                        autoFocus
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {unlockError && (
                                    <p className="text-[11px] font-bold text-red-500 mt-1">{unlockError}</p>
                                )}
                            </div>

                            <div className="flex gap-2 pt-1">
                                <button
                                    type="submit"
                                    disabled={isUnlocking}
                                    className="flex-1 h-11 rounded-xl bg-[#FF3B30] hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-red-500/25 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                                >
                                    <Unlock className="w-4 h-4" />
                                    <span>{isUnlocking ? 'Verifying...' : 'Unlock Session'}</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setIsSessionLocked(false); setLockPassword(''); setUnlockError(''); }}
                                    className="px-4 h-11 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-bold transition-colors cursor-pointer"
                                    title="Quick resume session"
                                >
                                    Resume
                                </button>
                            </div>
                        </form>

                        <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs">
                            <span className="text-[11px] text-zinc-400">Not {user.name.split(' ')[0]}?</span>
                            <Link
                                href={logoutRoute}
                                method="post"
                                as="button"
                                className="text-[11px] font-extrabold uppercase tracking-wider text-red-500 hover:underline cursor-pointer"
                            >
                                Sign Out →
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
