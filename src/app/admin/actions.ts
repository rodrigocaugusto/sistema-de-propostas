
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

// Update company details
export async function updateCompany(companyId: string, data: {
    name?: string;
    email?: string;
    responsible?: string;
    plan?: string;
    phone?: string;
}) {
    await checkSuperAdmin();

    try {
        await prisma.company.update({
            where: { id: companyId },
            data: {
                ...(data.name && { name: data.name }),
                ...(data.email && { email: data.email }),
                ...(data.responsible && { responsible: data.responsible }),
                ...(data.plan && { plan: data.plan }),
                ...(data.phone && { phone: data.phone }),
            }
        });

        revalidatePath('/admin');
        return { success: true };
    } catch (error: any) {
        console.error('Update company error:', error);
        return { success: false, error: error.message || 'Erro ao atualizar empresa' };
    }
}

// Get company invoices from Stripe
export async function getCompanyInvoices(companyId: string) {
    await checkSuperAdmin();

    const company = await prisma.company.findUnique({
        where: { id: companyId },
        select: { stripeCustomerId: true }
    });

    if (!company?.stripeCustomerId) {
        return [];
    }

    try {
        const { getStripe } = await import('@/lib/stripe');
        const stripe = getStripe();

        const invoices = await stripe.invoices.list({
            customer: company.stripeCustomerId,
            limit: 24,
        });

        return invoices.data.map(inv => ({
            id: inv.id,
            number: inv.number,
            status: inv.status,
            amount: (inv.amount_paid || 0) / 100,
            currency: inv.currency,
            created: new Date(inv.created * 1000).toISOString(),
            invoicePdf: inv.invoice_pdf,
        }));
    } catch (error) {
        console.error('Get invoices error:', error);
        return [];
    }
}

// Get admin dashboard stats with revenue
export async function getAdminStats() {
    await checkSuperAdmin();

    try {
        const { getStripe } = await import('@/lib/stripe');
        const stripe = getStripe();

        // Get all companies with subscription
        const companies = await prisma.company.findMany({
            where: { stripeCustomerId: { not: null } },
            select: { stripeCustomerId: true, plan: true, status: true }
        });

        let totalRevenue = 0;
        let monthlyRevenue = 0;
        let activeSubscriptions = 0;

        // Get this month's start date
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        // Calculate revenue from paid invoices
        for (const company of companies) {
            if (!company.stripeCustomerId) continue;

            try {
                const invoices = await stripe.invoices.list({
                    customer: company.stripeCustomerId,
                    status: 'paid',
                    limit: 100,
                });

                for (const inv of invoices.data) {
                    const amount = (inv.amount_paid || 0) / 100;
                    totalRevenue += amount;

                    const invoiceDate = new Date(inv.created * 1000);
                    if (invoiceDate >= startOfMonth) {
                        monthlyRevenue += amount;
                    }
                }

                // Check if has active subscription
                const subs = await stripe.subscriptions.list({
                    customer: company.stripeCustomerId,
                    status: 'active',
                    limit: 1,
                });
                if (subs.data.length > 0) {
                    activeSubscriptions++;
                }
            } catch (error) {
                // Skip if customer not found
                continue;
            }
        }

        // Get proposal stats
        const totalProposals = await prisma.proposal.count();
        const acceptedProposals = await prisma.proposal.count({
            where: { status: 'accepted' }
        });
        const proposalValue = await prisma.proposal.aggregate({
            _sum: {
                totalOneTime: true,
                totalRecurring: true
            }
        });

        return {
            totalRevenue,
            monthlyRevenue,
            activeSubscriptions,
            totalCompanies: companies.length,
            totalProposals,
            acceptedProposals,
            proposalValueOneTime: proposalValue._sum.totalOneTime || 0,
            proposalValueRecurring: proposalValue._sum.totalRecurring || 0,
        };
    } catch (error) {
        console.error('Get admin stats error:', error);
        return null;
    }
}

export async function adminGeneratePasswordForUser() {
    await checkSuperAdmin();
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return { password };
}

export async function adminResetUserPassword(companyId: string, newPassword: string) {
    await checkSuperAdmin();
    try {
        const company = await prisma.company.findUnique({
            where: { id: companyId },
            include: { users: { where: { role: 'admin' }, take: 1 } }
        });

        if (!company || company.users.length === 0) {
            // Fallback: try any user
            const anyUser = await prisma.user.findFirst({ where: { companyId } });
            if (!anyUser) return { success: false, error: "Nenhum usuário encontrado." };

            // Use this user
            const hashedPassword = await hashPassword(newPassword);
            await prisma.user.update({
                where: { id: anyUser.id },
                data: { password: hashedPassword }
            });
            await import('@/lib/email').then(mod => mod.sendPasswordResetEmail(anyUser.email, {
                userName: anyUser.name || 'Usuário',
                newPassword,
                companyName: company?.name || 'Sistema de Propostas'
            }));
            return { success: true, message: `Senha resetada para ${anyUser.email}` };
        }

        const user = company.users[0];
        const hashedPassword = await hashPassword(newPassword);

        await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword }
        });

        await import('@/lib/email').then(mod => mod.sendPasswordResetEmail(user.email, {
            userName: user.name || 'Admin',
            newPassword,
            companyName: company.name
        }));

        return { success: true, message: `Senha resetada para ${user.email}` };
    } catch (err: any) {
        console.error("Reset error:", err);
        return { success: false, error: err.message || "Erro ao resetar senha." };
    }
}
