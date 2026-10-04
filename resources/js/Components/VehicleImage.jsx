import React, { useState } from 'react';

export default function VehicleImage({ images, name = 'Vehicle', className = '', onClick = null, title = '' }) {
    const [hasError, setHasError] = useState(false);

    // Extract first image path if available
    let primaryImage = null;
    if (Array.isArray(images) && images.length > 0) {
        primaryImage = images[0];
    } else if (typeof images === 'string' && images.trim().length > 0) {
        try {
            const parsed = JSON.parse(images);
            if (Array.isArray(parsed) && parsed.length > 0) {
                primaryImage = parsed[0];
            } else {
                primaryImage = images;
            }
        } catch (e) {
            primaryImage = images;
        }
    }

    const showPlaceholder = !primaryImage || hasError;

    if (showPlaceholder) {
        return (
            <div 
                className={`relative bg-gradient-to-br from-slate-800 via-zinc-900 to-slate-950 flex flex-col items-center justify-center p-6 text-slate-400 select-none overflow-hidden ${className}`}
                onClick={onClick}
                title={title || name}
            >
                {/* Background grid pattern */}
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px]" />
                
                {/* Modern Car SVG Silhouette */}
                <svg className="w-20 h-20 text-rose-500/80 mb-2 drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.85 7h10.29l1.04 3H5.81l1.04-3zM19 17H5v-4.66l.12-.34h13.77l.11.34V17z" />
                    <circle cx="7.5" cy="14.5" r="1.5" />
                    <circle cx="16.5" cy="14.5" r="1.5" />
                </svg>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300 z-10 text-center px-2">
                    {name}
                </span>
                <span className="text-[10px] text-slate-400 font-medium z-10 mt-0.5">
                    ELFAA Fleet Vehicle
                </span>
            </div>
        );
    }

    return (
        <img 
            src={primaryImage} 
            alt={name} 
            onError={() => setHasError(true)}
            className={className}
            onClick={onClick}
            title={title || name}
        />
    );
}
