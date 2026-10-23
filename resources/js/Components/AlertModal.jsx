import { useEffect } from 'react';
import Swal from 'sweetalert2';

/**
 * AlertModal – powered by SweetAlert2.
 *
 * Drop-in replacement: same props as before, now shows a beautiful SweetAlert2 popup.
 *
 * Usage:
 *   const [alert, setAlert] = useState(null);
 *   setAlert({ type: 'success', title: 'Saved!', message: 'Record saved.' });
 *   <AlertModal alert={alert} onClose={() => setAlert(null)} />
 *
 * Props:
 *   alert   – null | { type: 'success'|'error'|'warning'|'info', title?: string, message?: string }
 *   onClose – callback to clear the alert
 */
export default function AlertModal({ alert, onClose }) {
    useEffect(() => {
        if (!alert) return;

        const isDark = document.documentElement.classList.contains('dark');

        Swal.fire({
            icon: alert.type === 'success' ? 'success'
                : alert.type === 'error'   ? 'error'
                : alert.type === 'warning' ? 'warning'
                : 'info',
            title: alert.title || (alert.type === 'success' ? 'Success!' : 'Something went wrong'),
            text: alert.message || undefined,
            confirmButtonText: 'OK',
            confirmButtonColor: alert.type === 'success' ? '#16a34a' : '#e11d48',
            background: isDark ? '#18181b' : '#ffffff',
            color: isDark ? '#f4f4f5' : '#18181b',
            customClass: {
                popup: 'elfaa-swal-popup',
                confirmButton: 'elfaa-swal-btn',
            },
            buttonsStyling: true,
        }).then(() => {
            onClose();
        });
    }, [alert]);

    // SweetAlert2 renders itself into its own DOM portal – no JSX needed
    return null;
}

/**
 * showSwal – imperative helper for one-off SweetAlert2 calls (e.g. confirm dialogs).
 *
 * Usage:
 *   const confirmed = await showSwal({ type: 'warning', title: 'Are you sure?', message: '...', showCancel: true });
 *   if (confirmed) { ... }
 */
export async function showSwal({ type = 'warning', title, message, confirmText = 'Yes', cancelText = 'Cancel', showCancel = false } = {}) {
    const isDark = document.documentElement.classList.contains('dark');

    const result = await Swal.fire({
        icon: type,
        title: title || 'Confirm',
        text: message || undefined,
        showCancelButton: showCancel,
        confirmButtonText: confirmText,
        cancelButtonText: cancelText,
        confirmButtonColor: type === 'success' ? '#16a34a' : type === 'error' ? '#e11d48' : '#d97706',
        cancelButtonColor: '#71717a',
        background: isDark ? '#18181b' : '#ffffff',
        color: isDark ? '#f4f4f5' : '#18181b',
        reverseButtons: true,
        customClass: {
            popup: 'elfaa-swal-popup',
        },
        buttonsStyling: true,
    });

    return result.isConfirmed;
}
