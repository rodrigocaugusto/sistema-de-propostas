
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

// Cancel Stripe subscription for a company
export async function cancelCompanySubscription(companyId: string) {
    await checkSuperAdmin();

    const company = await prisma.company.findUnique({
        where: { id: companyId },
        select: { stripeSubscriptionId: true }
    });

    if (!company?.stripeSubscriptionId) {
        return { success: false, error: 'Esta empresa não tem assinatura ativa no Stripe' };
    }

    try {
        const { getStripe } = await import('@/lib/stripe');
        const stripe = getStripe();

        // Cancel at period end (user keeps access until end of billing cycle)
        await stripe.subscriptions.update(company.stripeSubscriptionId, {
            cancel_at_period_end: true
        });

        revalidatePath('/admin');
        return { success: true, message: 'Assinatura será cancelada ao final do período' };
    } catch (error: any) {
        console.error('Cancel subscription error:', error);
        return { success: false, error: error.message || 'Erro ao cancelar assinatura' };
    }
}

// Reactivate a canceled subscription (if still within billing period)
export async function reactivateCompanySubscription(companyId: string) {
    await checkSuperAdmin();

    const company = await prisma.company.findUnique({
        where: { id: companyId },
        select: { stripeSubscriptionId: true }
    });

    if (!company?.stripeSubscriptionId) {
        return { success: false, error: 'Esta empresa não tem assinatura no Stripe' };
    }

    try {
        const { getStripe } = await import('@/lib/stripe');
        const stripe = getStripe();

        // Reactivate by removing cancel_at_period_end
        await stripe.subscriptions.update(company.stripeSubscriptionId, {
            cancel_at_period_end: false
        });

        // Also reactivate status in DB
        await prisma.company.update({
            where: { id: companyId },
            data: { status: 'active' }
        });

        revalidatePath('/admin');
        return { success: true, message: 'Assinatura reativada com sucesso' };
    } catch (error: any) {
        console.error('Reactivate subscription error:', error);
        return { success: false, error: error.message || 'Erro ao reativar assinatura' };
    }
}

// Get subscription details from Stripe
export async function getCompanySubscriptionDetails(companyId: string) {
    await checkSuperAdmin();

    const company = await prisma.company.findUnique({
        where: { id: companyId },
        select: { stripeSubscriptionId: true, stripeCustomerId: true }
    });

    if (!company?.stripeSubscriptionId) {
        return null;
    }

    try {
        const { getStripe } = await import('@/lib/stripe');
        const stripe = getStripe();

        const subscription = await stripe.subscriptions.retrieve(company.stripeSubscriptionId);

        return {
            id: subscription.id,
            status: subscription.status,
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            currentPeriodEnd: new Date((subscription as any).current_period_end * 1000).toISOString(),
            currentPeriodStart: new Date((subscription as any).current_period_start * 1000).toISOString(),
        };
    } catch (error) {
        console.error('Get subscription details error:', error);
        return null;
    }
}

