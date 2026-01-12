
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

// IMPORTANT: This is a dangerous endpoint! 
// It should be protected by a secret key and removed after use.
const ADMIN_SECRET = process.env.ADMIN_RESET_SECRET || 'CHANGE_THIS_SECRET_KEY';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { secret, email, newPassword } = body;

        // Validate secret key
        if (!secret || secret !== ADMIN_SECRET) {
            return NextResponse.json({
                error: 'Unauthorized - Invalid secret key'
            }, { status: 401 });
        }

        if (!email || !newPassword) {
            return NextResponse.json({
                error: 'Email and newPassword are required'
            }, { status: 400 });
        }

        if (newPassword.length < 6) {
            return NextResponse.json({
                error: 'Password must be at least 6 characters'
            }, { status: 400 });
        }

        // Find the user
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
            select: {
                id: true,
                email: true,
                name: true,
                isSuperAdmin: true,
            }
        });

        if (!user) {
            return NextResponse.json({
                error: 'User not found'
            }, { status: 404 });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 12);

        // Update user: reset password, unlock, activate
        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                isActive: true,
                failedLoginAttempts: 0,
                lockoutUntil: null,
            }
        });

        return NextResponse.json({
            success: true,
            message: `Password reset successful for ${user.email}`,
            user: {
                email: user.email,
                name: user.name,
                isSuperAdmin: user.isSuperAdmin,
            }
        });

    } catch (error: any) {
        console.error('Reset superadmin error:', error);
        return NextResponse.json({
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }, { status: 500 });
    }
}

// Also provide GET to check if a user exists (for debugging)
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
        return NextResponse.json({
            error: 'Email query parameter required'
        }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        select: {
            id: true,
            email: true,
            name: true,
            isActive: true,
            isSuperAdmin: true,
            failedLoginAttempts: true,
            lockoutUntil: true,
            companyId: true,
        }
    });

    if (!user) {
        return NextResponse.json({
            found: false,
            email
        });
    }

    return NextResponse.json({
        found: true,
        user: {
            ...user,
            lockoutUntil: user.lockoutUntil?.toISOString() || null,
        }
    });
}
