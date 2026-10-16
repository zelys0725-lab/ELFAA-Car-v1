import React, { useState } from 'react';
import { Car } from 'lucide-react';

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
                
                {/* Modern Car Icon */}
                <Car className="w-16 h-16 text-[#FF3B30] mb-2 drop-shadow-lg stroke-[1.5]" />
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
