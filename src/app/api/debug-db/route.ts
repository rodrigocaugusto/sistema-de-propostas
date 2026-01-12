
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function GET(request: Request) {
    // Get email from query param for specific check
    const { searchParams } = new URL(request.url);
    const checkEmail = searchParams.get('email');
    const checkPassword = searchParams.get('password'); // Only for debug! Remove in production

    try {
        // Basic DB connection test
        const userCount = await prisma.user.count();
        const companyCount = await prisma.company.count();

        // Find super admin(s)
        const superAdmins = await prisma.user.findMany({
            where: { isSuperAdmin: true },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                isActive: true,
                lockoutUntil: true,
                failedLoginAttempts: true,
                companyId: true,
                lastLogin: true,
            }
        });

        let loginDiagnostic = null;

        // If email provided, check login feasibility
        if (checkEmail) {
            const user = await prisma.user.findUnique({
                where: { email: checkEmail.toLowerCase() },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    password: true,
                    isActive: true,
                    lockoutUntil: true,
                    failedLoginAttempts: true,
                    isSuperAdmin: true,
                    companyId: true,
                }
            });

            if (!user) {
                loginDiagnostic = { status: 'USER_NOT_FOUND', email: checkEmail };
            } else {
                const issues = [];

                if (!user.isActive) issues.push('USER_INACTIVE');
                if (user.lockoutUntil && user.lockoutUntil > new Date()) {
                    issues.push(`LOCKED_UNTIL: ${user.lockoutUntil.toISOString()}`);
                }
                if (user.failedLoginAttempts > 0) {
                    issues.push(`FAILED_ATTEMPTS: ${user.failedLoginAttempts}`);
                }
                if (!user.companyId) issues.push('NO_COMPANY_ID');

                // If password provided, verify it
                let passwordMatch = null;
                if (checkPassword) {
                    passwordMatch = await bcrypt.compare(checkPassword, user.password);
                    if (!passwordMatch) issues.push('PASSWORD_MISMATCH');
                }

                loginDiagnostic = {
                    status: issues.length === 0 ? 'OK' : 'ISSUES_FOUND',
                    email: user.email,
                    name: user.name,
                    isActive: user.isActive,
                    isSuperAdmin: user.isSuperAdmin,
                    failedAttempts: user.failedLoginAttempts,
                    lockoutUntil: user.lockoutUntil,
                    hasCompanyId: !!user.companyId,
                    companyId: user.companyId,
                    passwordProvided: !!checkPassword,
                    passwordMatch,
                    issues,
                };
            }
        }

        return NextResponse.json({
            status: 'connected',
            database_url_snippet: process.env.DATABASE_URL
                ? process.env.DATABASE_URL.substring(0, 30) + '...'
                : 'undefined',
            environment: process.env.NODE_ENV,
            jwt_secret_set: !!process.env.JWT_SECRET,
            counts: {
                users: userCount,
                companies: companyCount,
            },
            superAdmins: superAdmins.map(sa => ({
                ...sa,
                lockoutUntil: sa.lockoutUntil?.toISOString() || null,
                lastLogin: sa.lastLogin?.toISOString() || null,
            })),
            loginDiagnostic,
            timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        return NextResponse.json({
            status: 'error',
            message: error.message,
            code: error.code,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 });
    }
}
