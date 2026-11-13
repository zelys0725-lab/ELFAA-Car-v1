/**
 * Website Inspection Protection Utility for ELFAA Platform
 *
 * Implements:
 * 1. Disabling right-click context menu globally.
 * 2. Blocking common DevTools keyboard shortcuts (F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C).
 * 3. Blocking Ctrl+U (View Page Source).
 * 4. Preserves standard user interactions, input typing, form submissions, and clipboard (Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+A, Ctrl+Z).
 */

export function initInspectionProtection() {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    // Guard against multiple initializations
    if (window.__elfaa_inspection_protection_active) return;
    window.__elfaa_inspection_protection_active = true;

    // 1. Disable right-click context menu
    document.addEventListener(
        'contextmenu',
        (e) => {
            e.preventDefault();
            return false;
        },
        { capture: true }
    );

    // 2. Block common DevTools & inspection shortcuts
    document.addEventListener(
        'keydown',
        (e) => {
            const key = (e.key || '').toUpperCase();
            const keyCode = e.keyCode || e.which;
            const isModifier = e.ctrlKey || e.metaKey; // Windows Ctrl or macOS Cmd
            const isShiftOrAlt = e.shiftKey || e.altKey;

            // F12 key
            if (key === 'F12' || keyCode === 123) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }

            // Ctrl + Shift + I (Inspect) or Cmd + Option + I
            // Ctrl + Shift + J (Console) or Cmd + Option + J
            // Ctrl + Shift + C (Element Inspector) or Cmd + Option + C
            // Ctrl + Shift + K (Firefox Web Console)
            if (isModifier && isShiftOrAlt) {
                if (
                    key === 'I' || keyCode === 73 ||
                    key === 'J' || keyCode === 74 ||
                    key === 'C' || keyCode === 67 ||
                    key === 'K' || keyCode === 75
                ) {
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                }
            }

            // Ctrl + U (View Page Source) or Cmd + Option + U
            if (isModifier && (key === 'U' || keyCode === 85)) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }

            // Ctrl + S (Save Page)
            if (isModifier && !e.shiftKey && (key === 'S' || keyCode === 83)) {
                // If the target is an editable element or input, allow standard behavior if any, else block page save
                const tag = (e.target && e.target.tagName ? e.target.tagName.toLowerCase() : '');
                if (tag !== 'input' && tag !== 'textarea') {
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                }
            }
        },
        { capture: true }
    );
}
