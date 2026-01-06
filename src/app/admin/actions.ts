
'use server';

import { prisma } from '@/lib/db';
import { getSession, hashPassword } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

// Check if current user is super admin
// Check if current user is super admin
async function checkSuperAdmin() {
    const session = await getSession();
    if (!session || !session.id) {
        throw new Error('Unauthorized');
    }

    // Force DB check to ensure permissions are up to date (updates stale session tokens)
    const user = await prisma.user.findUnique({
        where: { id: session.id },
        select: { isSuperAdmin: true }
    });

    if (!user || !user.isSuperAdmin) {
        throw new Error('Unauthorized');
    }
    return session;
}

export async function getCompanies() {
    await checkSuperAdmin();

    const companies = await prisma.company.findMany({
        include: {
            users: {
                select: { id: true } // Just to count
            },
            _count: {
                select: {
                    clients: true,
                    proposals: true
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    return companies.map(c => ({
        ...c,
        createdAt: c.createdAt.toISOString(),
        userCount: c.users.length,
        clientCount: c._count.clients,
        proposalCount: c._count.proposals
    }));
}

export async function createCompany(data: {
    name: string;
    email: string;
    responsible: string;
    slug?: string;
    plan?: string;
}) {
    await checkSuperAdmin();

    // Generate slug if not provided
    const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    try {
        const company = await prisma.company.create({
            data: {
                name: data.name,
                email: data.email,
                responsible: data.responsible,
                slug,
                plan: data.plan || 'pro',
                status: 'active',
                users: {
                    create: {
                        email: data.email,
                        name: data.responsible,
                        password: await hashPassword('123456'), // Default password
                        role: 'admin',
                        isActive: true
                    }
                }
            }
        });

        // We should also create an initial admin user for this company? 
        // Or just let the super admin do it manually later?
        // Let's return the company and maybe in the UI we offer to create a user.

        revalidatePath('/admin');
        return { success: true, company };
    } catch (error) {
        console.error('Create company error:', error);
        return { success: false, error: 'Erro ao criar empresa. Verifique se o Slug já existe.' };
    }
}

export async function toggleCompanyStatus(companyId: string, currentStatus: string) {
    await checkSuperAdmin();

    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';

    await prisma.company.update({
        where: { id: companyId },
        data: { status: newStatus }
    });

    revalidatePath('/admin');
    return { success: true };
}
