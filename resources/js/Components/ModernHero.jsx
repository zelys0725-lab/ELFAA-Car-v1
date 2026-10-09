import React from 'react';
import { motion } from 'motion/react';
import { Link } from '@inertiajs/react';

export default function ModernHero({ settings, setLightboxImage }) {
    return (
        <section id="home" className="relative overflow-hidden py-16 sm:py-24 transition-colors duration-300 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100">
            {/* Ambient Background Glow Mesh */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none overflow-hidden">
                <div className="absolute -top-40 left-1/4 w-[500px] h-[500px] bg-gradient-to-tr from-[#FF3B30]/20 to-red-500/0 rounded-full blur-[120px] dark:from-[#FF3B30]/25 dark:to-transparent" />
                <div className="absolute top-1/3 -right-20 w-[400px] h-[400px] bg-gradient-to-bl from-amber-500/10 to-red-600/0 rounded-full blur-[100px] dark:from-red-900/20" />
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                {/* Left Column: Copy & Actions */}
                <div className="lg:col-span-6 space-y-6 text-left">
                    {/* Badge */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#FF3B30]/30 bg-[#FF3B30]/10 text-[#FF3B30] text-xs font-black uppercase tracking-wider shadow-sm"
                    >
                        <span className="w-2 h-2 rounded-full bg-[#FF3B30] animate-ping" />
                        <span>★ ELFAA CAR RENTAL EXCELLENCE</span>
                    </motion.div>

                    {/* Headline */}
                    <motion.h1
                        initial={{ opacity: 0, y: 25 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] text-slate-900 dark:text-white whitespace-pre-line"
                    >
                        {settings?.home_hero_title || 'Rent Premium Vehicles\nWithout Muddle.'}
                    </motion.h1>

                    {/* Subtitle */}
                    <motion.p
                        initial={{ opacity: 0, y: 25 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="text-base sm:text-lg text-slate-600 dark:text-zinc-400 font-medium leading-relaxed max-w-xl"
                    >
                        {settings?.home_hero_subtitle || "Discover ELFAA CAR RENTAL's modern self-drive fleet. Real-time availability checks guarantee a seamless double-booking-free rental experience."}
                    </motion.p>

                    {/* CTAs */}
                    <motion.div
                        initial={{ opacity: 0, y: 25 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="flex flex-wrap items-center gap-4 pt-2"
                    >
                        <a href="#fleet">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="px-8 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest bg-[#FF3B30] hover:bg-red-700 text-white shadow-xl shadow-[#FF3B30]/30 transition-all flex items-center gap-2 group"
                            >
                                <span>Browse Fleet Catalog</span>
                                <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </motion.button>
                        </a>

                        <a href="#promos">
                            <motion.button
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                className="px-6 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider border border-slate-300 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur text-slate-800 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all shadow-sm"
                            >
                                View Active Promos
                            </motion.button>
                        </a>
                    </motion.div>

                    {/* Highlights pill */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="pt-4 flex flex-wrap items-center gap-6 text-xs font-semibold text-slate-500 dark:text-zinc-400"
                    >
                        <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                            <span>Instant Dispatch Verification</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-[#FF3B30]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span>Premium Self-Drive Car Rentals • Doorstep Delivery</span>
                        </div>
                    </motion.div>
                </div>

                {/* Right Column: Animated Vector Car Showcase */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.2 }}
                    className="lg:col-span-6 relative flex flex-col items-center justify-center"
                >
                    {/* Glowing Backdrop */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-[#FF3B30]/20 via-red-500/10 to-transparent rounded-3xl blur-2xl transform scale-95" />

                    {/* Interactive Frame Wrapper */}
                    <div className="relative w-full rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl p-6 sm:p-8 shadow-2xl overflow-hidden group">
                        
                        {/* Top corner status tag */}
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#FF3B30] bg-[#FF3B30]/10 px-2.5 py-1 rounded-md border border-[#FF3B30]/20">
                                CINEMATIC FLEET SERVICING
                            </span>
                            <span className="text-xs font-bold text-slate-400 dark:text-zinc-500">
                                24/7 RESERVATIONS OPEN
                            </span>
                        </div>

                        {/* Animated SVG Sports Car Graphic */}
                        <div className="relative w-full h-[220px] sm:h-[270px] flex items-center justify-center py-4">
                            <motion.svg
                                animate={{ y: [0, -6, 0] }}
                                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                                className="w-full h-full max-w-[480px] drop-shadow-[0_20px_35px_rgba(255,59,48,0.25)]"
                                viewBox="0 0 600 240"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <defs>
                                    <linearGradient id="bodyGradLight" x1="0" y1="0" x2="600" y2="0" gradientUnits="userSpaceOnUse">
                                        <stop offset="0%" stopColor="#1E293B" />
                                        <stop offset="50%" stopColor="#FF3B30" />
                                        <stop offset="100%" stopColor="#991B1B" />
                                    </linearGradient>
                                    <linearGradient id="glassGrad" x1="0" y1="0" x2="0" y2="100" gradientUnits="userSpaceOnUse">
                                        <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.8" />
                                        <stop offset="100%" stopColor="#0284C7" stopOpacity="0.2" />
                                    </linearGradient>
                                    <filter id="headlightGlow" x="-20%" y="-20%" width="140%" height="140%">
                                        <feGaussianBlur stdDeviation="6" result="blur" />
                                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                    </filter>
                                </defs>

                                {/* Animated Headlight Beam Polygons */}
                                <motion.polygon
                                    animate={{ opacity: [0.35, 0.75, 0.35] }}
                                    transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                                    points="520,135 595,120 595,170 520,150"
                                    fill="url(#headlightBeamGrad)"
                                    style={{ mixBlendMode: 'screen' }}
                                />
                                <defs>
                                    <linearGradient id="headlightBeamGrad" x1="520" y1="140" x2="595" y2="140" gradientUnits="userSpaceOnUse">
                                        <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.8" />
                                        <stop offset="100%" stopColor="#38BDF8" stopOpacity="0" />
                                    </linearGradient>
                                </defs>

                                {/* Underglow shadow */}
                                <ellipse cx="300" cy="192" rx="230" ry="14" fill="#FF3B30" opacity="0.3" filter="url(#headlightGlow)" />

                                {/* Car Chassis Body */}
                                <path
                                    d="M 90,165 
                                       C 90,165 105,125 155,115 
                                       C 190,108 245,75 315,75 
                                       C 390,75 445,108 485,125 
                                       C 525,140 535,155 535,165 
                                       L 530,178 
                                       C 520,183 490,185 450,185 
                                       C 420,185 400,185 360,185 
                                       C 320,185 240,185 180,185 
                                       C 120,185 95,180 90,165 Z"
                                    fill="url(#bodyGradLight)"
                                opacity="1" />

                                {/* Roof Cabin & Windows */}
                                <path
                                    d="M 205,112 C 240,84 310,80 375,84 C 420,105 440,118 440,118 L 205,112 Z"
                                    fill="url(#glassGrad)"
                                    stroke="#0EA5E9"
                                    strokeWidth="1.5"
                                opacity="1" />

                                {/* Side Pillar Line */}
                                <path d="M 315,82 L 325,115" stroke="#1E293B" strokeWidth="2.5" opacity="1" />

                                {/* Headlight LED Lamp */}
                                <circle cx="518" cy="142" r="5.5" fill="#93C5FD" filter="url(#headlightGlow)" opacity="1" />
                                <path d="M 505,138 L 526,134 L 522,148 Z" fill="#60A5FA" opacity="1" />

                                {/* Taillight Red Neon Strip */}
                                <path d="M 92,152 Q 88,160 92,166" stroke="#FF3B30" strokeWidth="5" strokeLinecap="round" filter="url(#headlightGlow)" opacity="1" />

                                {/* Door Trim Line */}
                                <path d="M 230,122 L 380,122 C 390,140 380,172 380,172" stroke="#EF4444" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />

                                {/* Front Wheel */}
                                <g transform="translate(440, 172)">
                                    <circle cx="0" cy="0" r="26" fill="#0F172A" stroke="#334155" strokeWidth="3" />
                                    <circle cx="0" cy="0" r="16" fill="#1E293B" stroke="#FF3B30" strokeWidth="2" />
                                    {/* Rotating Spokes */}
                                    <motion.g
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                                    >
                                        <line x1="-13" y1="0" x2="13" y2="0" stroke="#E2E8F0" strokeWidth="2" />
                                        <line x1="0" y1="-13" x2="0" y2="13" stroke="#E2E8F0" strokeWidth="2" />
                                        <line x1="-9" y1="-9" x2="9" y2="9" stroke="#94A3B8" strokeWidth="1.5" />
                                        <line x1="9" y1="-9" x2="-9" y2="9" stroke="#94A3B8" strokeWidth="1.5" />
                                    </motion.g>
                                    <circle cx="0" cy="0" r="4" fill="#FF3B30" />
                                </g>

                                {/* Rear Wheel */}
                                <g transform="translate(170, 172)">
                                    <circle cx="0" cy="0" r="26" fill="#0F172A" stroke="#334155" strokeWidth="3" />
                                    <circle cx="0" cy="0" r="16" fill="#1E293B" stroke="#FF3B30" strokeWidth="2" />
                                    {/* Rotating Spokes */}
                                    <motion.g
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                                    >
                                        <line x1="-13" y1="0" x2="13" y2="0" stroke="#E2E8F0" strokeWidth="2" />
                                        <line x1="0" y1="-13" x2="0" y2="13" stroke="#E2E8F0" strokeWidth="2" />
                                        <line x1="-9" y1="-9" x2="9" y2="9" stroke="#94A3B8" strokeWidth="1.5" />
                                        <line x1="9" y1="-9" x2="-9" y2="9" stroke="#94A3B8" strokeWidth="1.5" />
                                    </motion.g>
                                    <circle cx="0" cy="0" r="4" fill="#FF3B30" />
                                </g>
                            </motion.svg>
                        </div>

                        {/* Animated Road Lines below vehicle */}
                        <div className="relative w-full h-3 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden flex items-center mt-2">
                            <motion.div
                                animate={{ x: ['0%', '-50%'] }}
                                transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                                className="flex gap-4 w-[200%] shrink-0"
                            >
                                {[...Array(20)].map((_, i) => (
                                    <div key={i} className="h-1 w-8 bg-[#FF3B30]/70 rounded-full shrink-0" />
                                ))}
                            </motion.div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
