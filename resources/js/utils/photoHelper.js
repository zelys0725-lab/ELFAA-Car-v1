/**
 * Resolves inspection, document, or vehicle photo URLs safely.
 * Handles Unsplash/external URLs, absolute paths, /storage/ paths, and relative storage paths.
 * Automatically normalizes localhost/127.0.0.1 URLs so other devices (mobiles/tablets) don't break.
 */
export function resolvePhotoUrl(path) {
    if (!path || typeof path !== 'string') return '';
    let trimmed = path.trim();
    if (!trimmed) return '';

    // If an absolute localhost/127.0.0.1 URL is stored in DB or generated, convert to relative URL
    // so other devices (mobiles, tablets, LAN devices) fetch from the actual host they are connected to!
    if (
        trimmed.startsWith('http://localhost') ||
        trimmed.startsWith('http://127.0.0.1') ||
        trimmed.startsWith('https://localhost')
    ) {
        try {
            const parsed = new URL(trimmed);
            trimmed = parsed.pathname + parsed.search;
        } catch {
            trimmed = trimmed.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/, '');
        }
    }

    if (
        trimmed.startsWith('http://') ||
        trimmed.startsWith('https://') ||
        trimmed.startsWith('data:') ||
        trimmed.startsWith('blob:')
    ) {
        return trimmed;
    }
    if (
        trimmed.startsWith('/storage/') ||
        trimmed.startsWith('/uploads/') ||
        trimmed.startsWith('/documents/')
    ) {
        return trimmed;
    }
    if (
        trimmed.startsWith('storage/') ||
        trimmed.startsWith('uploads/') ||
        trimmed.startsWith('documents/')
    ) {
        return `/${trimmed}`;
    }
    return `/storage/${trimmed.replace(/^\/+/, '')}`;
}
