import { NextResponse } from 'next/server';

export async function POST() {
    console.log('[LOGIN TEST] hit');
    return NextResponse.json({ success: true, message: 'login-test works' });
}
