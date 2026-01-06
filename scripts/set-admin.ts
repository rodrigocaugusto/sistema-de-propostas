
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting update for admin user...');

    const myEmail = 'rodrigo@digitalleads.com.br';
    // Assuming the previous seed ran and created a company, we just need to find it and update the user or create a new one.

    // 1. Find the "Minha Empresa SaaS" or create if missing (idempotent)
    let company = await prisma.company.findUnique({
        where: { slug: 'minha-empresa' }
    });

    if (!company) {
        console.log("Company not found, creating...");
        company = await prisma.company.create({
            data: {
                name: 'Minha Empresa SaaS',
                slug: 'minha-empresa',
                email: 'contato@minhaempresa.com',
                plan: 'enterprise',
                status: 'active',
            }
        });
    }

    // 2. Upsert the User with your credentials
    const hashedPassword = await bcrypt.hash('Murd0ck!98245@', 12);

    const user = await prisma.user.upsert({
        where: { email: myEmail },
        update: {
            isSuperAdmin: true,
            companyId: company.id,
            role: 'admin',
            password: hashedPassword, // Reset password to ensure access
        },
        create: {
            name: 'Rodrigo',
            email: myEmail,
            password: hashedPassword,
            role: 'admin',
            isSuperAdmin: true,
            companyId: company.id,
        }
    });

    console.log(`✅ Admin updated/created: ${user.email} (Password: Murd0ck!98245@)`);
    console.log(`✅ Linked to Company: ${company.name}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
