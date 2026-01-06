
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
    try {
        const users = await prisma.user.findMany({
            select: { email: true, role: true, name: true, id: true },
            take: 5
        });

        const companies = await prisma.company.findMany({
            select: { name: true, slug: true, email: true },
            take: 5
        });

        return NextResponse.json({
            status: 'connected',
            database_url_snippet: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 20) + '...' : 'undefined',
            users,
            companies,
            timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        return NextResponse.json({
            status: 'error',
            message: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
