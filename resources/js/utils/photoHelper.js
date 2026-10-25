/**
 * Resolves inspection, document, or vehicle photo URLs safely.
 * Handles Unsplash/external URLs, absolute paths, /storage/ paths, and relative storage paths.
 */
export function resolvePhotoUrl(path) {
    if (!path || typeof path !== 'string') return '';
    const trimmed = path.trim();
    if (!trimmed) return '';
    if (
        trimmed.startsWith('http://') ||
        trimmed.startsWith('https://') ||
        trimmed.startsWith('data:') ||
        trimmed.startsWith('blob:')
    ) {
        return trimmed;
    }
    if (trimmed.startsWith('/storage/')) {
        return trimmed;
    }
    if (trimmed.startsWith('storage/')) {
        return `/${trimmed}`;
    }
    return `/storage/${trimmed.replace(/^\/+/, '')}`;
}
