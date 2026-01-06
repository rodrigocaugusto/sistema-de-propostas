/**
 * Utility functions for color manipulation and contrast calculation
 */

/**
 * Converts a hex color to RGB components
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    // Remove # if present
    const cleanHex = hex.replace('#', '');

    if (cleanHex.length !== 6 && cleanHex.length !== 3) {
        return null;
    }

    let r: number, g: number, b: number;

    if (cleanHex.length === 3) {
        r = parseInt(cleanHex[0] + cleanHex[0], 16);
        g = parseInt(cleanHex[1] + cleanHex[1], 16);
        b = parseInt(cleanHex[2] + cleanHex[2], 16);
    } else {
        r = parseInt(cleanHex.substring(0, 2), 16);
        g = parseInt(cleanHex.substring(2, 4), 16);
        b = parseInt(cleanHex.substring(4, 6), 16);
    }

    return { r, g, b };
}

/**
 * Calculates the relative luminance of a color
 * Based on WCAG 2.0 formula
 */
export function getLuminance(r: number, g: number, b: number): number {
    const [rs, gs, bs] = [r, g, b].map(c => {
        c = c / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Determines if a background color is dark or light
 * Returns true if dark (should use light text)
 */
export function isDarkColor(hexColor: string): boolean {
    const rgb = hexToRgb(hexColor);
    if (!rgb) return false;

    const luminance = getLuminance(rgb.r, rgb.g, rgb.b);
    return luminance < 0.5;
}

/**
 * Gets the appropriate text color class based on background color
 * Returns Tailwind classes for text color
 */
export function getContrastTextClass(bgColor: string | undefined | null): string {
    if (!bgColor) return 'text-foreground';

    // Handle transparent or default backgrounds
    if (bgColor === 'transparent' || bgColor === 'hsl(var(--background))' || bgColor === 'hsl(var(--card))') {
        return 'text-foreground';
    }

    // Check if it's a hex color
    if (bgColor.startsWith('#')) {
        return isDarkColor(bgColor) ? 'text-white' : 'text-slate-900';
    }

    return 'text-foreground';
}

/**
 * Gets the appropriate muted text color class based on background color
 */
export function getContrastMutedClass(bgColor: string | undefined | null): string {
    if (!bgColor) return 'text-muted-foreground';

    if (bgColor === 'transparent' || bgColor === 'hsl(var(--background))' || bgColor === 'hsl(var(--card))') {
        return 'text-muted-foreground';
    }

    if (bgColor.startsWith('#')) {
        return isDarkColor(bgColor) ? 'text-white/70' : 'text-slate-600';
    }

    return 'text-muted-foreground';
}

/**
 * Gets inline style for text color based on background
 */
export function getContrastTextStyle(bgColor: string | undefined | null): React.CSSProperties {
    if (!bgColor || bgColor === 'transparent') return {};

    if (bgColor.startsWith('#')) {
        return { color: isDarkColor(bgColor) ? '#ffffff' : '#1e293b' };
    }

    return {};
}

/**
 * Gets inline style for muted text color based on background
 */
export function getContrastMutedStyle(bgColor: string | undefined | null): React.CSSProperties {
    if (!bgColor || bgColor === 'transparent') return {};

    if (bgColor.startsWith('#')) {
        return { color: isDarkColor(bgColor) ? 'rgba(255,255,255,0.7)' : '#475569' };
    }

    return {};
}
