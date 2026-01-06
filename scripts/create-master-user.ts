import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createMasterUser() {
    const email = 'rodrigo@digitalleads.com.br';
    const password = 'Murd0ck!98245@';
    const name = 'Rodrigo';

    try {
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            console.log('⚠️  Usuário master já existe.');
            console.log(`   Email: ${existingUser.email}`);
            console.log(`   Nome: ${existingUser.name}`);
            console.log(`   Role: ${existingUser.role}`);
            return;
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create the master user
        const user = await prisma.user.create({
            data: {
                email,
                name,
                password: hashedPassword,
                role: 'admin',
                isActive: true,
            },
        });

        console.log('✅ Usuário master criado com sucesso!');
        console.log('');
        console.log('   📧 Email:', user.email);
        console.log('   👤 Nome:', user.name);
        console.log('   🔑 Senha: [a senha que você definiu]');
        console.log('   🛡️  Role:', user.role);
        console.log('');
        console.log('🚀 Acesse http://localhost:3000/login para fazer login.');

    } catch (error) {
        console.error('❌ Erro ao criar usuário master:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createMasterUser();
