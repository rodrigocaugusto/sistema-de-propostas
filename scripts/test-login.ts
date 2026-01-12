import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function testLogin() {
    console.log('🔍 Testing login for rodrigo@digitalleads.com.br...\n');

    const user = await prisma.user.findUnique({
        where: { email: 'rodrigo@digitalleads.com.br' },
        select: {
            id: true,
            email: true,
            password: true,
            isActive: true,
            lockoutUntil: true,
            failedLoginAttempts: true,
            isSuperAdmin: true,
            companyId: true,
        }
    });

    if (!user) {
        console.log('❌ USER NOT FOUND in database!');
        return;
    }

    console.log('✅ User found:', user.email);
    console.log('   - isActive:', user.isActive);
    console.log('   - isSuperAdmin:', user.isSuperAdmin);
    console.log('   - companyId:', user.companyId);
    console.log('   - lockoutUntil:', user.lockoutUntil);
    console.log('   - failedAttempts:', user.failedLoginAttempts);
    console.log('');

    // Test the password
    const testPassword = 'Murd0ck!98245@#$m';
    console.log('🔐 Testing password:', testPassword);

    const match = await bcrypt.compare(testPassword, user.password);
    console.log('   - Password Match:', match ? '✅ YES' : '❌ NO');

    if (!match) {
        console.log('\n⚠️  Password does not match! The stored hash is different.');
        console.log('   Stored hash (first 20 chars):', user.password.substring(0, 20) + '...');

        // Generate a new hash to compare
        const newHash = await bcrypt.hash(testPassword, 12);
        console.log('   New hash would be:', newHash.substring(0, 20) + '...');
    }

    console.log('\n--- Summary ---');
    if (user.isActive && match && !user.lockoutUntil && user.companyId) {
        console.log('✅ Login should work!');
    } else {
        const issues = [];
        if (!user.isActive) issues.push('User is inactive');
        if (!match) issues.push('Password mismatch');
        if (user.lockoutUntil && user.lockoutUntil > new Date()) issues.push('Account locked');
        if (!user.companyId) issues.push('No company ID');
        console.log('❌ Login issues:', issues.join(', '));
    }

    await prisma.$disconnect();
}

testLogin().catch(e => {
    console.error('Error:', e);
    process.exit(1);
});
