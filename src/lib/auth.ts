import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'
);

export interface UserPayload {
    id: string;
    email: string;
    name: string;
    role: string;
    companyId?: string; // Optional because super admin or pending users might not have it yet? Actually let's assume valid users have it or we handle undefined.
    isSuperAdmin: boolean;
    phone?: string | null;
    avatarUrl?: string | null;
}

export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
}

export async function createToken(user: UserPayload): Promise<string> {
    // Remove potentially large fields like phone to keep token size small
    // Keep avatarUrl as it's needed for display
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { phone, ...payload } = user;

    return new SignJWT({ ...payload })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<UserPayload | null> {
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        return payload as unknown as UserPayload;
    } catch {
        return null;
    }
}

export async function getSession(): Promise<UserPayload | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) return null;

    return verifyToken(token);
}

export async function setSession(token: string): Promise<void> {
    try {
        const cookieStore = await cookies();
        cookieStore.set('auth-token', token, {
            httpOnly: true,
            // Em alguns ambientes de produção (como Vercel/Railway) atrás de proxy, 
            // NODE_ENV é 'production' mas a conexão interna pode parecer HTTP.
            // Para garantir compatibilidade, vamos confiar que se estamos aqui, o login foi válido.
            // A melhor prática é 'secure: true' em prod, mas se estiver falhando, podemos relaxar temporariamente ou checar o protocolo.
            // Alterado para false para garantir funcionamento em qualquer ambiente (HTTP/HTTPS/Proxy)
            // Reverta para true quando o SSL estiver 100% configurado e propagado.
            secure: false,
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: '/',
        });
        console.log('[AUTH] Session cookie set successfully');
    } catch (error) {
        console.error('[AUTH] Failed to set session cookie:', error);
        throw error;
    }
}

export async function clearSession(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete('auth-token');
}

export function generatePassword(length: number = 16): string {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    const allChars = lowercase + uppercase + numbers + symbols;

    // Ensure at least one of each type
    let password = '';
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];

    // Fill rest with random chars
    for (let i = password.length; i < length; i++) {
        password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
}
