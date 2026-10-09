import { useState, useEffect } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import Dropdown from '@/Components/Dropdown';
import CarLoader from '@/Components/CarLoader';
import { 
    LayoutDashboard, 
    CalendarDays, 
    CalendarCheck, 
    FileText, 
    ShieldCheck, 
    Receipt, 
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
    SlidersHorizontal
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
        const svgClasses = "w-4 h-4 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors mr-3 flex-shrink-0";
        switch (tabId) {
            case 'analytics':
                return <LayoutDashboard className={svgClasses} />;
            case 'daily_schedule':
                return <CalendarDays className={svgClasses} />;
            case 'calendar':
                return <CalendarCheck className={svgClasses} />;
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
            case 'users':
                return <Users className={svgClasses} />;
            case 'settings':
                return <Settings className={svgClasses} />;
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
                        {settings?.site_logo_image ? (
                            <img src={settings.site_logo_image} className="h-8 max-w-[150px] object-contain rounded" alt={settings?.site_logo || 'Logo'} />
                        ) : (
                            <div className="flex items-center space-x-2.5">
                                <div className="h-7 w-7 rounded bg-red-650 flex items-center justify-center font-black text-white text-[12px] tracking-wider uppercase">
                                    {settings?.site_logo ? settings.site_logo.slice(0, 2) : 'EK'}
                                </div>
                                <span className="text-sm font-black tracking-widest text-zinc-900 dark:text-white uppercase">
                                    {settings?.site_logo || 'ELFAA CARS'}
                                </span>
                            </div>
                        )}
                        <svg className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white cursor-pointer" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                        </svg>
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
                                            className={`w-full group flex items-center px-3 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                                                isActive
                                                    ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white font-extrabold focus:outline-none'
                                                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/50 dark:hover:bg-zinc-850/50'
                                            }`}
                                        >
                                            {getSidebarIcon(tab.id)}
                                            {tab.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Footer Controls & Settings */}
                    <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 space-y-4">
                        <div className="space-y-1">
                            <button onClick={toggleTheme} className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-300 flex items-center transition-all cursor-pointer hover:bg-zinc-200/50 dark:hover:bg-zinc-850/50">
                                {theme === 'light' ? (
                                    <>
                                        <svg className="w-4 h-4 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                        </svg>
                                        Light Theme
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M14 12a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                        Dark Theme
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </aside>
            )}

            {/* 2. BODY CONTENT PANEL */}
            <div className="flex-1 flex flex-col h-screen overflow-y-auto bg-zinc-50 dark:bg-zinc-950">
                {/* Header Navbar */}
                <nav className="h-16 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800/80 sticky top-0 z-30 flex items-center justify-between px-6 transition-colors">
                    <div className="flex items-center space-x-4">
                        {/* Sidebar toggle graphic placeholder / columns icon */}
                        {isAdminOrStaff && (
                            <div className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white cursor-pointer select-none">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                                </svg>
                            </div>
                        )}
                        <h1 className="text-sm font-bold text-zinc-900 dark:text-white tracking-wide uppercase">
                            {header || (role === 'client' ? 'Customer portal' : 'Workspace')}
                        </h1>
                    </div>

                    <div className="flex items-center space-x-4">
                        {/* Theme Toggle in Header Navbar */}
                        <button 
                            onClick={toggleTheme} 
                            className="p-2 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
                            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                        >
                            {theme === 'light' ? (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M14 12a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            )}
                        </button>

                        {/* Top navigation for client/customer */}
                        {!isAdminOrStaff && (
                            <div className="flex items-center gap-4 overflow-x-auto max-w-[320px] xs:max-w-[420px] sm:max-w-none whitespace-nowrap scrollbar-none py-1 mr-2">
                                <div className="flex items-center gap-3 pr-4">
                                    <Link href="/" className="text-xs font-bold text-zinc-550 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white uppercase tracking-wider">
                                        Home
                                    </Link>
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
                                        <div className="h-6 w-6 rounded-full bg-zinc-300 dark:bg-zinc-800 overflow-hidden flex-shrink-0">
                                            <img 
                                                src={`https://api.dicebear.com/7.x/identicon/svg?seed=${user.name}`} 
                                                alt={user.name} 
                                                className="h-full w-full object-cover"
                                            />
                                        </div>
                                        <span className="font-bold text-xs truncate max-w-[120px]">{user.name}</span>
                                        <svg className="h-4 w-4 text-zinc-400 dark:text-zinc-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/>
                                        </svg>
                                    </button>
                                </Dropdown.Trigger>
                                <Dropdown.Content contentClasses="py-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 shadow-xl min-w-[200px]">
                                    <div className="px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
                                        <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">{user.name}</p>
                                        <p className="text-[10px] text-zinc-500 truncate">{user.email}</p>
                                        <p className="text-[9px] font-black uppercase text-red-500 mt-0.5">{user.role}</p>
                                    </div>
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
                                    <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                                        <path className={!showingMobileMenu ? 'inline-flex' : 'hidden'} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                                        <path className={showingMobileMenu ? 'inline-flex' : 'hidden'} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
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
                                    className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider block transition-colors ${
                                        activeTab === tab.id
                                            ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white font-extrabold'
                                            : 'text-zinc-550 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-850 hover:text-zinc-900 dark:hover:text-white'
                                    }`}
                                >
                                    {tab.label}
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
                <main className="flex-1 p-6 md:p-8 bg-zinc-50 dark:bg-zinc-950 overflow-y-auto transition-colors">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
