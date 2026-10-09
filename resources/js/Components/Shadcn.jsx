import React, { createContext, useContext, useState, useEffect } from 'react';

// ================= BUTTON =================
export const Button = React.forwardRef(({ 
    className = "", 
    variant = "default", 
    size = "default", 
    asChild = false,
    ...props 
}, ref) => {
    const baseStyles = "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 cursor-pointer";
    
    const variants = {
        default: "bg-brand text-white shadow hover:bg-brand-dark active:scale-[0.98] transition-transform",
        destructive: "bg-red-650 text-white shadow-sm hover:bg-red-700 active:scale-[0.98]",
        outline: "border border-gray-200 bg-white shadow-sm hover:bg-gray-50 text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800",
        secondary: "bg-gray-100 text-gray-900 shadow-sm hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-150 dark:hover:bg-gray-700",
        ghost: "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300",
        link: "text-brand underline-offset-4 hover:underline",
    };

    const sizes = {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-11 rounded-md px-8",
        icon: "h-9 w-9",
    };

    const cn = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`;

    return <button className={cn} ref={ref} {...props} />;
});
Button.displayName = "Button";

// ================= CARD =================
export const Card = React.forwardRef(({ className = "", ...props }, ref) => (
    <div
        ref={ref}
        className={`rounded-xl border border-gray-200 bg-white text-gray-950 shadow-sm dark:border-gray-800 dark:bg-gray-950 dark:text-gray-50 ${className}`}
        {...props}
    />
));
Card.displayName = "Card";

export const CardHeader = React.forwardRef(({ className = "", ...props }, ref) => (
    <div ref={ref} className={`flex flex-col space-y-1.5 p-6 ${className}`} {...props} />
));
CardHeader.displayName = "CardHeader";

export const CardTitle = React.forwardRef(({ className = "", ...props }, ref) => (
    <h3
        ref={ref}
        className={`text-xl font-bold leading-none tracking-tight text-gray-900 dark:text-white ${className}`}
        {...props}
    />
));
CardTitle.displayName = "CardTitle";

export const CardDescription = React.forwardRef(({ className = "", ...props }, ref) => (
    <p
        ref={ref}
        className={`text-sm text-gray-550 dark:text-gray-450 ${className}`}
        {...props}
    />
));
CardDescription.displayName = "CardDescription";

export const CardContent = React.forwardRef(({ className = "", ...props }, ref) => (
    <div ref={ref} className={`p-6 pt-0 ${className}`} {...props} />
));
CardContent.displayName = "CardContent";

export const CardFooter = React.forwardRef(({ className = "", ...props }, ref) => (
    <div ref={ref} className={`flex items-center p-6 pt-0 border-t border-gray-100 dark:border-gray-900 mt-4 ${className}`} {...props} />
));
CardFooter.displayName = "CardFooter";

// ================= BADGE =================
export function Badge({ className = "", variant = "default", ...props }) {
    const base = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";
    const variants = {
        default: "border-transparent bg-brand text-white shadow hover:bg-brand-dark",
        secondary: "border-transparent bg-gray-150 text-gray-900 dark:bg-gray-800 dark:text-gray-150",
        destructive: "border-transparent bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
        outline: "text-gray-950 border border-gray-200 dark:text-gray-50 dark:border-gray-800",
        success: "border-transparent bg-emerald-600 text-white dark:bg-emerald-600 dark:text-white font-bold shadow-sm",
    };

    return <div className={`${base} ${variants[variant]} ${className}`} {...props} />;
}

// ================= INPUT =================
export const Input = React.forwardRef(({ className = "", type = "text", ...props }, ref) => {
    return (
        <input
            type={type}
            ref={ref}
            className={`flex h-9 w-full rounded-md border border-gray-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-50 dark:focus-visible:ring-brand ${className}`}
            {...props}
        />
    );
});
Input.displayName = "Input";

// ================= DIALOG / MODAL (Shadcn pattern) =================
export function Dialog({ open, onOpenChange, children }) {
    useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [open]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
                onClick={() => onOpenChange?.(false)}
            />
            {/* Dialog Panel */}
            <div className="z-10 w-full max-w-md scale-100 overflow-hidden rounded-xl border border-gray-200 bg-white p-6 shadow-2xl transition-all dark:border-gray-800 dark:bg-gray-950 dark:text-gray-50 animate-in fade-in zoom-in-95 duration-200">
                {children}
            </div>
        </div>
    );
}

export function DialogContent({ children, className = "" }) {
    return <div className={`mt-2 ${className}`}>{children}</div>;
}

export function DialogHeader({ className = "", ...props }) {
    return <div className={`flex flex-col space-y-1.5 text-center sm:text-left ${className}`} {...props} />;
}

export function DialogTitle({ className = "", ...props }) {
    return <h2 className={`text-lg font-bold leading-none tracking-tight text-gray-900 dark:text-white ${className}`} {...props} />;
}
