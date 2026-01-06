
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🔄 Updating database with real admin parameters...');

    // 1. Clean up old test user
    const oldUser = await prisma.user.findUnique({
        where: { email: 'admin@sistema.com' }
    });

    if (oldUser) {
        await prisma.user.delete({
            where: { id: oldUser.id }
        });
        console.log('🗑️  Old test user (admin@sistema.com) deleted.');
    }

    // 2. Setup Digital Leads Company
    // Try to find the company we seeded earlier to update it, or create new.
    let company = await prisma.company.findFirst({
        where: { slug: 'minha-empresa' }
    });

    if (company) {
        company = await prisma.company.update({
            where: { id: company.id },
            data: {
                name: 'Digital Leads',
                slug: 'digital-leads',
                email: 'rodrigo@digitalleads.com.br',
                plan: 'enterprise', // Master account
                status: 'active'
            }
        });
        console.log('🏢 Company updated to Digital Leads.');
    } else {
        // If not found (maybe run multiple times), look for digital-leads or create
        company = await prisma.company.findFirst({
            where: { slug: 'digital-leads' }
        });

        if (!company) {
            company = await prisma.company.create({
                data: {
                    name: 'Digital Leads',
                    slug: 'digital-leads',
                    email: 'rodrigo@digitalleads.com.br',
                    plan: 'enterprise',
                    status: 'active',
                },
            });
            console.log('🏢 Company Digital Leads created.');
        }
    }

    // 3. Create the Real Admin User
    // Ensure user doesn't exist yet to avoid unique constraint error
    const existingRealUser = await prisma.user.findUnique({
        where: { email: 'rodrigo@digitalleads.com.br' }
    });

    if (existingRealUser) {
        // Update password if exists
        const hashedPassword = await bcrypt.hash('Murd0ck!98245@#$m', 12);
        await prisma.user.update({
            where: { id: existingRealUser.id },
            data: {
                password: hashedPassword,
                isSuperAdmin: true,
                companyId: company.id,
                role: 'admin'
            }
        });
        console.log('✅ User rodrigo@digitalleads.com.br updated with new password.');
    } else {
        const hashedPassword = await bcrypt.hash('Murd0ck!98245@#$m', 12);

        await prisma.user.create({
            data: {
                name: 'Rodrigo',
                email: 'rodrigo@digitalleads.com.br',
                password: hashedPassword,
                role: 'admin',
                isSuperAdmin: true,
                companyId: company.id,
            },
        });
        console.log('✅ User rodrigo@digitalleads.com.br created successfully.');
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
