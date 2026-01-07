
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('REDEFINIÇÃO FORÇADA DE USUÁRIO - INICIANDO...');
    const email = 'rodrigo@digitalleads.com.br';
    const passwordOriginal = 'Murd0ck!98245@#$m';

    // 1. Verificar se a empresa existe
    const company = await prisma.company.findFirst({
        where: { slug: 'digital-leads' } // A que criamos antes
    });

    if (!company) {
        console.error('❌ ERRO CRÍTICO: Empresa Digital Leads não encontrada. Rodando seed completo novamente...');
        // Fallback: criar a empresa se ela sumiu
        const newCompany = await prisma.company.create({
            data: {
                name: 'Digital Leads',
                slug: 'digital-leads',
                email: email,
                plan: 'enterprise',
                status: 'active'
            }
        });
        console.log('✅ Empresa recriada:', newCompany.id);
        await createUser(newCompany.id, email, passwordOriginal);
    } else {
        console.log('🏢 Empresa encontrada:', company.id);
        await createUser(company.id, email, passwordOriginal);
    }
}

async function createUser(companyId: string, email: string, pass: string) {
    // 2. Apagar usuário se existir (para garantir limpeza)
    try {
        await prisma.user.delete({
            where: { email: email }
        });
        console.log('🗑️  Usuário anterior deletado para evitar conflitos.');
    } catch (e) {
        console.log('ℹ️  Usuário não existia, seguimos para criação.');
    }

    // 3. Criar usuário DO ZERO
    const hashedPassword = await bcrypt.hash(pass, 12);

    const user = await prisma.user.create({
        data: {
            name: 'Rodrigo',
            email: email,
            password: hashedPassword,
            role: 'admin',
            isSuperAdmin: true,
            companyId: companyId,
            isActive: true
        }
    });

    console.log('✅ USUÁRIO RECRIADO COM SUCESSO!');
    console.log('------------------------------------------------');
    console.log('📧 Email:', user.email);
    console.log('🔑 Senha:', pass);
    console.log('🆔 ID:', user.id);
    console.log('🏢 Empresa ID:', companyId);
    console.log('------------------------------------------------');
    console.log('Tente logar agora. Se falhar, verifique se você está acessando o ambiente correto (Prod vs Local).');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
