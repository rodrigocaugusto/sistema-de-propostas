'use server';

import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { verifyPassword, createToken } from '@/lib/auth';

// Alternative login action that returns the token for client-side cookie setting
export async function loginAction(email: string, password: string, honeypot?: string): Promise<{
    success: boolean;
    error?: string;
    token?: string;
}> {
    try {
        console.log(`[LOGIN ACTION] Attempt for: ${email}`);

        if (honeypot) {
            console.log(`[LOGIN ACTION] Bot attempt blocked`);
            return { success: false, error: 'Credenciais inválidas' };
        }

        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });

        if (!user) {
            console.log(`[LOGIN ACTION] User not found: ${email}`);
            return { success: false, error: 'Credenciais inválidas' };
        }

        if (!user.isActive) {
            return { success: false, error: 'Usuário desativado.' };
        }

        if (user.lockoutUntil && user.lockoutUntil > new Date()) {
            return { success: false, error: 'Conta bloqueada temporariamente. Tente em 15 minutos.' };
        }

        const isValid = await verifyPassword(password, user.password);

        if (!isValid) {
            const attempts = user.failedLoginAttempts + 1;
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    failedLoginAttempts: attempts,
                    lockoutUntil: attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null
                }
            });
            return { success: false, error: 'Credenciais inválidas' };
        }

        // Update last login
        await prisma.user.update({
            where: { id: user.id },
            data: {
                lastLogin: new Date(),
                failedLoginAttempts: 0,
                lockoutUntil: null
            },
        });

        // Create token
        const token = await createToken({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            companyId: user.companyId || undefined,
            isSuperAdmin: user.isSuperAdmin,
            phone: (user as any).phone,
            avatarUrl: (user as any).avatarUrl,
        });

        // Try to set cookie via Server Action
        try {
            const cookieStore = await cookies();
            cookieStore.set('auth-token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 * 7,
                path: '/',
            });
            console.log(`[LOGIN ACTION] Cookie set via Server Action`);
        } catch (cookieError) {
            console.log(`[LOGIN ACTION] Could not set cookie via Server Action, returning token`);
            // Return token for client-side handling if cookie fails
            return { success: true, token };
        }

        console.log(`[LOGIN ACTION] SUCCESS for ${email}`);
        return { success: true };

    } catch (error) {
        console.error('[LOGIN ACTION] Error:', error);
        return { success: false, error: 'Erro ao fazer login.' };
    }
}
