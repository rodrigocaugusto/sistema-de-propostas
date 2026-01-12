import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyPassword, createToken } from '@/lib/auth';

export const runtime = 'nodejs'; // Ensure stable runtime for Prisma/Bcrypt
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, password, honeypot } = body;

        console.log(`[LOGIN API] Attempt for: ${email}`);

        // Honeypot check
        if (honeypot) {
            console.warn(`[LOGIN API] BLOCKED BY HONEYPOT: Field was filled with '${honeypot}'`);
            return NextResponse.json({ success: false, error: 'Credenciais inválidas' });
        }

        if (!email || !password) {
            return NextResponse.json({ success: false, error: 'Email e senha são obrigatórios' });
        }

        // Find user
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

        // Verify password
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

        // Login successful - Update last login
        // Login successful - Update last login
        // Use waitUntil (if available in future Next.js versions for Route Handlers) or just await
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

        // MANUAL COOKIE SETTING (More robust for Route Handlers)
        const isProduction = process.env.NODE_ENV === 'production';
        const cookieName = 'auth-token';
        const maxAge = 60 * 60 * 24 * 7; // 7 days

        let cookieValue = `${cookieName}=${token}; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Lax`;
        if (isProduction) {
            cookieValue += '; Secure';
        }

        const response = NextResponse.json(
            { success: true },
            { status: 200 }
        );

        response.headers.set('Set-Cookie', cookieValue);

        return response;

    } catch (error: any) {
        console.error('[LOGIN API] Error:', error);
        return NextResponse.json({
            success: false,
            error: 'Erro ao fazer login.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }, { status: 500 });
    }
}
