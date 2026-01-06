import { NextResponse } from 'next/server';
import { getCompany } from '@/lib/db';

export async function GET() {
    try {
        const company = await getCompany();

        if (!company) {
            return NextResponse.json(null);
        }

        return NextResponse.json({
            name: company.name,
            logoUrl: company.logoUrl,
        });
    } catch (error) {
        console.error('Error fetching company:', error);
        return NextResponse.json(null);
    }
}
