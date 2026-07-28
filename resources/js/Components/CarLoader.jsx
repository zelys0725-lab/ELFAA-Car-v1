import React from 'react';

export default function CarLoader({ isVisible = true, text = "Loading CarKono..." }) {
    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md transition-all duration-300">
            <div className="relative flex flex-col items-center">
                {/* Speed lines background animation */}
                <div className="absolute -inset-x-12 top-1/2 h-0.5 -translate-y-1/2 flex justify-between overflow-hidden opacity-30 pointer-events-none">
                    <div className="w-8 h-full bg-[#FF3B30] animate-[ping_1.2s_infinite]" />
                    <div className="w-12 h-full bg-[#FF3B30] animate-[ping_0.9s_infinite_0.2s]" />
                    <div className="w-6 h-full bg-[#FF3B30] animate-[ping_1.5s_infinite_0.4s]" />
                </div>

                {/* Animated Sports Car SVG */}
                <div className="relative w-36 h-20 animate-bounce duration-700">
                    <svg viewBox="0 0 200 90" className="w-full h-full drop-shadow-xl" fill="none">
                        {/* Car Body Shadow */}
                        <ellipse cx="100" cy="82" rx="75" ry="6" className="fill-zinc-400/40 dark:fill-black/60 animate-pulse" />

                        {/* Chassis Base */}
                        <path 
                            d="M 20 60 C 20 60, 30 45, 55 42 C 75 40, 100 25, 135 25 C 160 25, 180 40, 188 52 C 195 58, 195 65, 185 65 L 20 65 Z" 
                            className="fill-[#FF3B30] dark:fill-[#FF453A]" 
                        />
                        {/* Car Cabin & Roof */}
                        <path 
                            d="M 65 42 C 75 35, 95 28, 130 28 C 150 28, 168 38, 172 45 Z" 
                            className="fill-zinc-900 dark:fill-zinc-100 opacity-90" 
                        />
                        {/* Front Windshield Glow */}
                        <path 
                            d="M 125 30 L 162 44 L 125 44 Z" 
                            className="fill-sky-400/50" 
                        />

                        {/* Headlight Beam Effect */}
                        <polygon points="185,55 210,48 210,68" className="fill-amber-400/40 animate-pulse" />
                        <circle cx="186" cy="56" r="3" className="fill-amber-300" />

                        {/* Rear Taillight */}
                        <rect x="18" y="52" width="4" height="8" rx="2" className="fill-red-500 animate-pulse" />

                        {/* Side Stripe Styling */}
                        <path d="M 40 55 L 175 55" stroke="currentColor" strokeWidth="2" className="text-white/30" />

                        {/* Front Wheel */}
                        <g className="animate-[spin_0.6s_linear_infinite] origin-[150px_65px]">
                            <circle cx="150" cy="65" r="14" className="fill-zinc-800 stroke-zinc-300 dark:stroke-zinc-600" strokeWidth="3" />
                            <circle cx="150" cy="65" r="6" className="fill-zinc-400 dark:fill-zinc-500" />
                            <line x1="150" y1="51" x2="150" y2="79" stroke="white" strokeWidth="2" />
                            <line x1="136" y1="65" x2="164" y2="65" stroke="white" strokeWidth="2" />
                        </g>

                        {/* Rear Wheel */}
                        <g className="animate-[spin_0.6s_linear_infinite] origin-[50px_65px]">
                            <circle cx="50" cy="65" r="14" className="fill-zinc-800 stroke-zinc-300 dark:stroke-zinc-600" strokeWidth="3" />
                            <circle cx="50" cy="65" r="6" className="fill-zinc-400 dark:fill-zinc-500" />
                            <line x1="50" y1="51" x2="50" y2="79" stroke="white" strokeWidth="2" />
                            <line x1="36" y1="65" x2="64" y2="65" stroke="white" strokeWidth="2" />
                        </g>
                    </svg>
                </div>

                {/* Animated Track Road Line */}
                <div className="w-48 h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden mt-3 relative">
                    <div className="w-16 h-full bg-[#FF3B30] rounded-full animate-[shimmer_1s_infinite_linear] absolute -left-16" 
                         style={{ animation: 'roadMove 0.8s linear infinite' }} />
                </div>

                {/* Loading Text & Branding */}
                <div className="mt-4 flex flex-col items-center">
                    <span className="text-xs font-black tracking-widest uppercase text-zinc-900 dark:text-white flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#FF3B30] animate-ping" />
                        {text}
                    </span>
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-widest mt-1">
                        ELFAA CAR RENTAL PLATFORM
                    </span>
                </div>
            </div>

            <style>{`
                @keyframes roadMove {
                    0% { left: -30%; }
                    100% { left: 100%; }
                }
            `}</style>
        </div>
    );
}
