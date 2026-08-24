import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';

export default function Error({ status = 404, message = null }) {
    const { auth } = usePage().props || {};
    const is403 = status === 403;
    const title = is403 ? '403 - Restricted Access Roadblock' : '404 - Wrong Turn Ahead';
    const subtitle = is403 ? 'Security Route Guard Enforced' : 'Route Not Found on the ELFAA Map';
    const description = message || (is403 
        ? 'Your account role does not have permission to view or manage this administrative area.' 
        : 'The page or resource you requested has taken a wrong turn, been renamed, or does not exist.');

    // Determine default dashboard link based on role
    const userRole = auth?.user?.role;
    const dashboardRoute = userRole === 'admin' || userRole === 'staff' 
        ? '/admin/dashboard' 
        : (userRole === 'renter' || userRole === 'client' ? '/client/dashboard' : '/login');

    return (
        <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden select-none font-sans">
            <Head title={`${title} | ELFAA CAR RENTAL`} />

            {/* Background Ambient Glow Effects */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-600/10 blur-[140px] rounded-full pointer-events-none" />
            <div className="absolute bottom-10 right-10 w-80 h-80 bg-zinc-800/20 blur-[100px] rounded-full pointer-events-none" />

            {/* Animated Car & Road SVG Canvas */}
            <div className="w-full max-w-lg mb-6 relative">
                {is403 ? (
                    /* 403 Forbidden: Car Stopped at Security Barrier with Siren & Lock */
                    <div className="relative flex flex-col items-center">
                        <svg className="w-full h-56" viewBox="0 0 600 240" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <defs>
                                <linearGradient id="carBody403" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor="#DC2626" />
                                    <stop offset="100%" stopColor="#991B1B" />
                                </linearGradient>
                                <linearGradient id="barrierGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#EF4444" />
                                    <stop offset="100%" stopColor="#7F1D1D" />
                                </linearGradient>
                                <filter id="glowSiren">
                                    <feGaussianBlur stdDeviation="3" result="blur" />
                                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                </filter>
                            </defs>

                            {/* Road surface */}
                            <rect x="20" y="190" width="560" height="40" fill="#18181B" rx="6" />
                            <line x1="20" y1="210" x2="580" y2="210" stroke="#3F3F46" strokeWidth="3" strokeDasharray="16 16" />

                            {/* Stopped Sportscar Facing Right */}
                            <g className="translate-x-[40px]">
                                {/* Car Body Shadow */}
                                <ellipse cx="170" cy="192" rx="130" ry="10" fill="#000000" opacity="0.6" />

                                {/* Car Wheels */}
                                <g className="animate-[spin_4s_linear_infinite]" style={{ transformOrigin: "80px 185px" }}>
                                    <circle cx="80" cy="185" r="22" fill="#09090B" stroke="#27272A" strokeWidth="4" />
                                    <circle cx="80" cy="185" r="10" fill="#71717A" />
                                </g>
                                <g className="animate-[spin_4s_linear_infinite]" style={{ transformOrigin: "240px 185px" }}>
                                    <circle cx="240" cy="185" r="22" fill="#09090B" stroke="#27272A" strokeWidth="4" />
                                    <circle cx="240" cy="185" r="10" fill="#71717A" />
                                </g>

                                {/* Car Chassis */}
                                <path d="M40 180 L60 145 Q90 120 150 120 L210 125 Q260 135 285 160 L295 180 Z" fill="url(#carBody403)" />
                                {/* Windshield */}
                                <path d="M100 142 L135 126 L195 128 L215 145 Z" fill="#38BDF8" opacity="0.3" />
                                {/* Headlight Glowing Beam hitting barrier */}
                                <polygon points="290,165 480,140 480,200 290,180" fill="#FEF08A" opacity="0.25" />
                                <circle cx="290" cy="170" r="5" fill="#FEF08A" filter="url(#glowSiren)" />
                            </g>

                            {/* Security Barrier Fence */}
                            <rect x="360" y="110" width="16" height="85" fill="#27272A" rx="4" />
                            {/* Barrier Arm pulsating angled */}
                            <g className="animate-[bounce_2s_infinite]">
                                <rect x="365" y="125" width="200" height="14" fill="url(#barrierGrad)" rx="3" transform="rotate(-8 365 125)" />
                                <rect x="405" y="123" width="25" height="14" fill="#FFFFFF" opacity="0.8" transform="rotate(-8 365 125)" />
                                <rect x="465" y="123" width="25" height="14" fill="#FFFFFF" opacity="0.8" transform="rotate(-8 365 125)" />
                                <rect x="525" y="123" width="25" height="14" fill="#FFFFFF" opacity="0.8" transform="rotate(-8 365 125)" />
                            </g>

                            {/* Flashing Police/Security Lights */}
                            <circle cx="368" cy="100" r="10" fill="#EF4444" className="animate-ping" opacity="0.75" />
                            <circle cx="368" cy="100" r="8" fill="#DC2626" />
                            <circle cx="368" cy="100" r="4" fill="#FFFFFF" />

                            {/* Floating Lock Badge */}
                            <g className="animate-pulse">
                                <circle cx="368" cy="50" r="24" fill="#18181B" stroke="#DC2626" strokeWidth="3" />
                                <path d="M360 48 V42 A8 8 0 0 1 376 42 V48 M356 48 H380 V62 H356 Z" stroke="#EF4444" strokeWidth="2.5" fill="none" />
                            </g>
                        </svg>
                    </div>
                ) : (
                    /* 404 Not Found: Car Cruising Down Infinite Animated Highway */
                    <div className="relative flex flex-col items-center">
                        <svg className="w-full h-56" viewBox="0 0 600 240" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <defs>
                                <linearGradient id="carBody404" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor="#EF4444" />
                                    <stop offset="100%" stopColor="#B91C1C" />
                                </linearGradient>
                                <linearGradient id="roadGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#18181B" />
                                    <stop offset="100%" stopColor="#09090B" />
                                </linearGradient>
                                <filter id="tailGlow">
                                    <feGaussianBlur stdDeviation="4" result="blur" />
                                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                </filter>
                            </defs>

                            {/* Animated Highway Road */}
                            <rect x="0" y="170" width="600" height="60" fill="url(#roadGrad)" />
                            <line x1="0" y1="170" x2="600" y2="170" stroke="#27272A" strokeWidth="2" />
                            
                            {/* Road Dashlines moving left endlessly */}
                            <g>
                                <line x1="0" y1="200" x2="600" y2="200" stroke="#E4E4E7" strokeWidth="4" strokeDasharray="30 30" strokeDashoffset="0">
                                    <animate attributeName="stroke-dashoffset" from="60" to="0" dur="0.6s" repeatCount="indefinite" />
                                </line>
                            </g>

                            {/* Speed Trail Lines Behind Car */}
                            <line x1="20" y1="178" x2="140" y2="178" stroke="#EF4444" strokeWidth="2" opacity="0.4" strokeDasharray="10 10">
                                <animate attributeName="stroke-dashoffset" from="0" to="-40" dur="0.4s" repeatCount="indefinite" />
                            </line>
                            <line x1="50" y1="186" x2="160" y2="186" stroke="#F59E0B" strokeWidth="1.5" opacity="0.3" strokeDasharray="8 8">
                                <animate attributeName="stroke-dashoffset" from="0" to="-32" dur="0.3s" repeatCount="indefinite" />
                            </line>

                            {/* Cruising Car Facing Right with Subtle Vibration */}
                            <g className="translate-x-[150px] animate-[bounce_1s_infinite]">
                                {/* Car Body Shadow */}
                                <ellipse cx="150" cy="192" rx="120" ry="8" fill="#000000" opacity="0.7" />

                                {/* Spinning Wheels */}
                                <g className="animate-[spin_0.4s_linear_infinite]" style={{ transformOrigin: "70px 185px" }}>
                                    <circle cx="70" cy="185" r="20" fill="#09090B" stroke="#3F3F46" strokeWidth="4" />
                                    <circle cx="70" cy="185" r="8" fill="#A1A1AA" />
                                    <line x1="70" y1="167" x2="70" y2="203" stroke="#D4D4D8" strokeWidth="2" />
                                    <line x1="52" y1="185" x2="88" y2="185" stroke="#D4D4D8" strokeWidth="2" />
                                </g>

                                <g className="animate-[spin_0.4s_linear_infinite]" style={{ transformOrigin: "230px 185px" }}>
                                    <circle cx="230" cy="185" r="20" fill="#09090B" stroke="#3F3F46" strokeWidth="4" />
                                    <circle cx="230" cy="185" r="8" fill="#A1A1AA" />
                                    <line x1="230" y1="167" x2="230" y2="203" stroke="#D4D4D8" strokeWidth="2" />
                                    <line x1="212" y1="185" x2="248" y2="185" stroke="#D4D4D8" strokeWidth="2" />
                                </g>

                                {/* Car Body */}
                                <path d="M30 180 L50 148 Q80 120 140 120 L198 126 Q245 135 275 160 L285 180 Z" fill="url(#carBody404)" />
                                {/* Windshield */}
                                <path d="M90 142 L125 126 L185 128 L205 145 Z" fill="#38BDF8" opacity="0.35" />
                                {/* Glowing Red Tail Lights */}
                                <circle cx="32" cy="165" r="6" fill="#EF4444" filter="url(#tailGlow)" />
                                {/* Bright Headlight */}
                                <polygon points="280,165 440,145 440,195 280,180" fill="#FEF08A" opacity="0.3" />
                                <circle cx="280" cy="170" r="5" fill="#FEF08A" />
                            </g>

                            {/* Floating 404 Highway Signboard */}
                            <g className="translate-x-[460px] translate-y-[35px]">
                                <rect x="0" y="0" width="100" height="60" fill="#064E3B" stroke="#10B981" strokeWidth="3" rx="6" />
                                <text x="50" y="28" fill="#FFFFFF" fontSize="18" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">404</text>
                                <text x="50" y="46" fill="#A7F3D0" fontSize="9" fontWeight="700" textAnchor="middle" fontFamily="sans-serif">NO OUTLET</text>
                                <rect x="46" y="60" width="8" height="75" fill="#3F3F46" />
                            </g>
                        </svg>
                    </div>
                )}
            </div>

            {/* Error Content */}
            <div className="max-w-md text-center space-y-4 z-10">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-black tracking-widest uppercase bg-red-500/10 text-red-500 border border-red-500/20">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    Status Code: {status}
                </div>

                <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white uppercase">
                    {title}
                </h1>

                <p className="text-xs font-bold uppercase tracking-wider text-red-400">
                    {subtitle}
                </p>

                <p className="text-sm text-zinc-400 leading-relaxed max-w-sm mx-auto">
                    {description}
                </p>

                {/* Navigation Options */}
                <div className="pt-6 flex flex-col sm:flex-row gap-3 justify-center">
                    <Link
                        href={dashboardRoute}
                        className="px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/30 transition-all cursor-pointer text-center"
                    >
                        {is403 ? 'Go to Authorized Dashboard' : 'Return to My Workspace'}
                    </Link>

                    <Link
                        href="/"
                        className="px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 transition-colors cursor-pointer text-center"
                    >
                        Back to Main Site
                    </Link>
                </div>
            </div>

            {/* Footer Tag */}
            <div className="absolute bottom-6 text-[11px] text-zinc-600 font-semibold tracking-wider uppercase">
                ELFAA Car Rental &bull; System Protection & Route Security
            </div>
        </div>
    );
}
