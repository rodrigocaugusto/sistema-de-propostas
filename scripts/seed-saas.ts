
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seed...');

    // 1. Create the Default Company (System/SaaS Owner Company or the first Tenant)
    const company = await prisma.company.create({
        data: {
            name: 'Minha Empresa SaaS',
            slug: 'minha-empresa',
            email: 'contato@minhaempresa.com',
            plan: 'enterprise',
            status: 'active',
            webhookUrl: null,
        },
    });

    console.log(`✅ Company created: ${company.name} (${company.id})`);

    // 2. Create the Super Admin User
    const hashedPassword = await bcrypt.hash('123456', 12);

    const admin = await prisma.user.create({
        data: {
            name: 'Rodrigo Admin',
            email: 'admin@sistema.com',
            password: hashedPassword,
            role: 'admin',
            isSuperAdmin: true,
            companyId: company.id,
        },
    });

    console.log(`✅ Super Admin created: ${admin.email} (Password: 123456)`);
    console.log(`🔑 Login at /login`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
