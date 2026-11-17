import { useEffect } from 'react';

/**
 * usePreventHorizontalSwipe
 *
 * Prevents horizontal touchpad/trackpad swipes from triggering the browser's
 * back/forward navigation gesture. Applied globally via layout components.
 *
 * Strategy:
 *  - CSS `overscroll-behavior-x: none` on html/body is the primary guard (see app.css).
 *  - This JS hook adds a secondary wheel-event guard to block purely horizontal
 *    wheel events that would still bubble to the browser navigation handler,
 *    EXCEPT when the event target (or any ancestor) is a genuinely horizontally
 *    scrollable element (tables, carousels, overflowing containers).
 *
 * Safe to call multiple times — a ref-count guard prevents duplicate listeners.
 */

let listenerCount = 0;

function handleWheel(e) {
    // Only act on predominantly horizontal scroll deltas
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;

    // Walk up the DOM: if any ancestor has real horizontal scrollability, allow it
    let el = e.target;
    while (el && el !== document.documentElement) {
        const style = window.getComputedStyle(el);
        const overflowX = style.overflowX;
        if (
            (overflowX === 'auto' || overflowX === 'scroll') &&
            el.scrollWidth > el.clientWidth
        ) {
            return; // let the element scroll naturally
        }
        el = el.parentElement;
    }

    // No scrollable ancestor found — block browser nav swipe
    e.preventDefault();
}

export function usePreventHorizontalSwipe() {
    useEffect(() => {
        if (listenerCount === 0) {
            window.addEventListener('wheel', handleWheel, { passive: false });
        }
        listenerCount++;

        return () => {
            listenerCount--;
            if (listenerCount === 0) {
                window.removeEventListener('wheel', handleWheel);
            }
        };
    }, []);
}
