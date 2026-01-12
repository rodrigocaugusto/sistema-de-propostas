import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';

// Test login flow step by step to identify where it fails
export async function POST(request: Request) {
    const steps: { step: string; status: 'ok' | 'error'; details?: any }[] = [];

    try {
        const body = await request.json();
        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
        }

        // Step 1: Test database connection
        try {
            const count = await prisma.user.count();
            steps.push({ step: '1. Database connection', status: 'ok', details: { userCount: count } });
        } catch (dbError: any) {
            steps.push({ step: '1. Database connection', status: 'error', details: dbError.message });
            return NextResponse.json({ steps, finalError: 'Database connection failed' });
        }

        // Step 2: Find user
        let user: any;
        try {
            user = await prisma.user.findUnique({
                where: { email: email.toLowerCase() },
            });

            if (!user) {
                steps.push({ step: '2. Find user', status: 'error', details: 'User not found' });
                return NextResponse.json({ steps, finalError: 'User not found' });
            }

            steps.push({
                step: '2. Find user',
                status: 'ok',
                details: {
                    email: user.email,
                    isActive: user.isActive,
                    isSuperAdmin: user.isSuperAdmin,
                    companyId: user.companyId,
                    hasPassword: !!user.password,
                }
            });
        } catch (findError: any) {
            steps.push({ step: '2. Find user', status: 'error', details: findError.message });
            return NextResponse.json({ steps, finalError: 'Find user failed' });
        }

        // Step 3: Verify password
        try {
            const isValid = await bcrypt.compare(password, user.password);
            steps.push({ step: '3. Password verification', status: isValid ? 'ok' : 'error', details: { match: isValid } });

            if (!isValid) {
                return NextResponse.json({ steps, finalError: 'Password mismatch' });
            }
        } catch (pwError: any) {
            steps.push({ step: '3. Password verification', status: 'error', details: pwError.message });
            return NextResponse.json({ steps, finalError: 'Password verification failed' });
        }

        // Step 4: Create JWT token
        try {
            const JWT_SECRET = new TextEncoder().encode(
                process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'
            );

            const token = await new SignJWT({
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                companyId: user.companyId || undefined,
                isSuperAdmin: user.isSuperAdmin,
            })
                .setProtectedHeader({ alg: 'HS256' })
                .setIssuedAt()
                .setExpirationTime('7d')
                .sign(JWT_SECRET);

            steps.push({
                step: '4. JWT creation',
                status: 'ok',
                details: {
                    tokenLength: token.length,
                    jwtSecretSet: !!process.env.JWT_SECRET,
                }
            });
        } catch (jwtError: any) {
            steps.push({ step: '4. JWT creation', status: 'error', details: jwtError.message });
            return NextResponse.json({ steps, finalError: 'JWT creation failed' });
        }

        // Step 5: Update last login (this might fail if there's a DB write issue)
        try {
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    lastLogin: new Date(),
                    failedLoginAttempts: 0,
                    lockoutUntil: null
                },
            });
            steps.push({ step: '5. Update lastLogin', status: 'ok' });
        } catch (updateError: any) {
            steps.push({ step: '5. Update lastLogin', status: 'error', details: updateError.message });
            return NextResponse.json({ steps, finalError: 'Database update failed' });
        }

        // All steps passed
        return NextResponse.json({
            steps,
            finalResult: 'SUCCESS - All login steps passed',
            note: 'If login still fails, the issue is likely with cookie/session setting in Server Actions'
        });

    } catch (error: any) {
        return NextResponse.json({
            steps,
            finalError: 'Unexpected error',
            errorMessage: error.message,
            errorStack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 });
    }
}
