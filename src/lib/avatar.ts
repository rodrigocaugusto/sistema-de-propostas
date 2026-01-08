import crypto from 'crypto';

/**
 * Generates a Gravatar URL for the given email
 * @param email - User email address
 * @param size - Image size in pixels (default: 80)
 * @param defaultImage - Default image type ('mp' = mystery person, 'identicon', 'retro', etc.)
 */
export function getGravatarUrl(email: string, size: number = 80, defaultImage: string = 'mp'): string {
    const hash = crypto
        .createHash('md5')
        .update(email.toLowerCase().trim())
        .digest('hex');

    return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=${defaultImage}`;
}

/**
 * Gets the best avatar URL for a user
 * Priority: 1. Custom avatarUrl, 2. Gravatar
 */
export function getUserAvatarUrl(
    email: string,
    avatarUrl?: string | null,
    size: number = 80
): string {
    if (avatarUrl) {
        return avatarUrl;
    }
    return getGravatarUrl(email, size);
}

/**
 * Gets user initials from name
 */
export function getUserInitials(name: string): string {
    return name
        .split(' ')
        .map(part => part.charAt(0))
        .slice(0, 2)
        .join('')
        .toUpperCase();
}
