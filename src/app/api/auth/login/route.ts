import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyPassword, createToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, password, honeypot } = body;

        console.log(`[LOGIN API] Attempt for: ${email}`);

        // Honeypot check
        if (honeypot) {
            return NextResponse.json({ success: false, error: 'Credenciais inválidas' });
        }

        if (!email || !password) {
            return NextResponse.json({ success: false, error: 'Email e senha são obrigatórios' });
        }

        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });

        if (!user) {
            console.log(`[LOGIN API] User not found: ${email}`);
            return NextResponse.json({ success: false, error: 'Credenciais inválidas' });
        }

        if (!user.isActive) {
            return NextResponse.json({ success: false, error: 'Usuário desativado.' });
        }

        if (user.lockoutUntil && user.lockoutUntil > new Date()) {
            return NextResponse.json({
                success: false,
                error: 'Conta bloqueada temporariamente. Tente em 15 minutos.'
            });
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
            console.log(`[LOGIN API] Invalid password for: ${email}`);
            return NextResponse.json({ success: false, error: 'Credenciais inválidas' });
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

        console.log(`[LOGIN API] SUCCESS for ${email}`);

        // Set cookie and return response
        const cookieStore = await cookies();
        cookieStore.set('auth-token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: '/',
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('[LOGIN API] Error:', error);
        return NextResponse.json({
            success: false,
            error: 'Erro ao fazer login.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}
