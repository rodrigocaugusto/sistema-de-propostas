
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
                select: {
                    id: true,
                    lastLogin: true,
                    role: true
                }
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

    // Get Stripe details for each company with subscription
    const { getStripe } = await import('@/lib/stripe');
    const stripe = getStripe();

    const enrichedCompanies = await Promise.all(companies.map(async (c) => {
        let subscriptionDetails = null;
        let totalPaid = 0;
        let planValue = 0;

        // Get admin's last login
        const adminUser = c.users.find(u => u.role === 'admin');
        const lastLogin = adminUser?.lastLogin;

        // Calculate trial days remaining
        let trialDaysRemaining: number | null = null;
        if (c.trialEndsAt) {
            const now = new Date();
            const trialEnd = new Date(c.trialEndsAt);
            const diff = trialEnd.getTime() - now.getTime();
            trialDaysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
        }

        // Get Stripe subscription details
        if (c.stripeSubscriptionId) {
            try {
                const sub = await stripe.subscriptions.retrieve(c.stripeSubscriptionId);
                subscriptionDetails = {
                    status: sub.status,
                    cancelAtPeriodEnd: sub.cancel_at_period_end,
                    currentPeriodEnd: new Date((sub as any).current_period_end * 1000),
                    interval: (sub as any).items?.data?.[0]?.price?.recurring?.interval || 'month',
                };
                // Plan value from subscription
                planValue = ((sub as any).items?.data?.[0]?.price?.unit_amount || 0) / 100;
            } catch (e) {
                // Subscription may not exist anymore
            }
        }

        // Get total paid from invoices
        if (c.stripeCustomerId) {
            try {
                const invoices = await stripe.invoices.list({
                    customer: c.stripeCustomerId,
                    status: 'paid',
                    limit: 100,
                });
                totalPaid = invoices.data.reduce((sum, inv) => sum + ((inv.amount_paid || 0) / 100), 0);
            } catch (e) {
                // Customer may not exist
            }
        }

        return {
            ...c,
            createdAt: c.createdAt.toISOString(),
            updatedAt: c.updatedAt.toISOString(),
            trialEndsAt: c.trialEndsAt?.toISOString() || null,
            subscriptionEndsAt: c.subscriptionEndsAt?.toISOString() || null,
            userCount: c.users.length,
            clientCount: c._count.clients,
            proposalCount: c._count.proposals,
            lastLogin: lastLogin?.toISOString() || null,
            trialDaysRemaining,
            subscriptionDetails,
            planValue,
            totalPaid,
        };
    }));

    return enrichedCompanies;
}

// Generate strong password
function generateStrongPassword(): string {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

export async function createCompany(data: {
    name: string;
    email: string;
    responsible: string;
    slug?: string;
    plan?: string;
    sendPasswordEmail?: boolean;
}) {
    await checkSuperAdmin();

    // Generate slug if not provided
    const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    // Generate random password
    const generatedPassword = generateStrongPassword();

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
                        password: await hashPassword(generatedPassword),
                        role: 'admin',
                        isActive: true
                    }
                }
            }
        });

        // Send password email if requested
        if (data.sendPasswordEmail) {
            try {
                const { sendPasswordResetEmail } = await import('@/lib/email');
                await sendPasswordResetEmail(data.email, {
                    userName: data.responsible,
                    newPassword: generatedPassword,
                    companyName: data.name
                });
            } catch (emailError) {
                console.error('Error sending password email:', emailError);
                // Don't fail the operation, just log it
            }
        }

        revalidatePath('/admin');
        return {
            success: true,
            company,
            generatedPassword // Return the password so admin can see/copy it
        };
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
    extraUsers?: number;
    extraProposals?: number;
    trialEndsAt?: string | null;
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
                ...(data.extraUsers !== undefined && { extraUsers: data.extraUsers }),
                ...(data.extraProposals !== undefined && { extraProposals: data.extraProposals }),
                ...(data.trialEndsAt !== undefined && {
                    trialEndsAt: data.trialEndsAt ? new Date(data.trialEndsAt) : null
                }),
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
                companyName: company?.name || 'DL Pro'
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

// Start trial for a company (7 days by default)
export async function startCompanyTrial(companyId: string, days: number = 7) {
    await checkSuperAdmin();

    try {
        const trialEndsAt = new Date();
        trialEndsAt.setDate(trialEndsAt.getDate() + days);

        await prisma.company.update({
            where: { id: companyId },
            data: {
                plan: 'trial',
                trialEndsAt,
                status: 'active'
            }
        });

        revalidatePath('/admin');
        return { success: true, message: `Trial de ${days} dias iniciado` };
    } catch (error: any) {
        return { success: false, error: error.message || 'Erro ao iniciar trial' };
    }
}

// Check and expire trials
export async function checkExpiredTrials() {
    await checkSuperAdmin();

    try {
        const now = new Date();

        // Find companies with expired trials
        const expiredTrials = await prisma.company.findMany({
            where: {
                plan: 'trial',
                trialEndsAt: { lt: now },
                status: 'active'
            }
        });

        // Suspend expired trials
        for (const company of expiredTrials) {
            await prisma.company.update({
                where: { id: company.id },
                data: { status: 'suspended' }
            });
        }

        revalidatePath('/admin');
        return {
            success: true,
            message: `${expiredTrials.length} empresas com trial expirado foram suspensas`
        };
    } catch (error: any) {
        return { success: false, error: error.message || 'Erro ao verificar trials' };
    }
}

// Cancel subscription immediately (not at period end)
export async function cancelSubscriptionImmediately(companyId: string) {
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

        // Cancel immediately
        await stripe.subscriptions.cancel(company.stripeSubscriptionId);

        // Update company status
        await prisma.company.update({
            where: { id: companyId },
            data: {
                status: 'suspended',
                stripeSubscriptionId: null
            }
        });

        revalidatePath('/admin');
        return { success: true, message: 'Assinatura cancelada imediatamente' };
    } catch (error: any) {
        console.error('Cancel subscription immediately error:', error);
        return { success: false, error: error.message || 'Erro ao cancelar assinatura' };
    }
}

// Get detailed subscription info from Stripe
export async function getStripeSubscriptionInfo(companyId: string) {
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

        const sub = await stripe.subscriptions.retrieve(company.stripeSubscriptionId, {
            expand: ['items.data.price.product']
        });

        return {
            id: sub.id,
            status: sub.status,
            cancelAtPeriodEnd: sub.cancel_at_period_end,
            currentPeriodStart: new Date((sub as any).current_period_start * 1000).toISOString(),
            currentPeriodEnd: new Date((sub as any).current_period_end * 1000).toISOString(),
            canceledAt: sub.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : null,
            items: (sub as any).items?.data?.map((item: any) => ({
                priceId: item.price?.id,
                productName: item.price?.product?.name || 'Plano',
                amount: (item.price?.unit_amount || 0) / 100,
                interval: item.price?.recurring?.interval,
                intervalCount: item.price?.recurring?.interval_count,
            })) || []
        };
    } catch (error) {
        console.error('Get subscription info error:', error);
        return null;
    }
}

export async function impersonateUser(userId: string) {
    await checkSuperAdmin();

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            return { success: false, error: 'Usuário não encontrado' };
        }

        const { createToken, setSession } = await import('@/lib/auth');

        const token = await createToken({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            companyId: user.companyId || undefined,
            isSuperAdmin: user.isSuperAdmin,
            phone: (user as any).phone,
            avatarUrl: (user as any).avatarUrl,
        });

        await setSession(token);
        return { success: true };
    } catch (error: any) {
        console.error('Impersonate error:', error);
        return { success: false, error: 'Erro ao acessar como usuário' };
    }
}

export async function impersonateCompanyAdmin(companyId: string) {
    await checkSuperAdmin();

    try {
        // Find the admin user of the company
        const company = await prisma.company.findUnique({
            where: { id: companyId },
            include: {
                users: {
                    where: { role: 'admin' },
                    take: 1
                }
            }
        });

        if (!company || company.users.length === 0) {
            // Fallback: any user
            const anyUser = await prisma.user.findFirst({
                where: { companyId }
            });
            if (!anyUser) return { success: false, error: 'Nenhum usuário encontrado nesta empresa' };
            return impersonateUser(anyUser.id);
        }

        return impersonateUser(company.users[0].id);
    } catch (error: any) {
        console.error('Impersonate company admin error:', error);
        return { success: false, error: 'Erro ao acessar empresa' };
    }
}

// Delete a company and all its related data
export async function deleteCompany(companyId: string) {
    await checkSuperAdmin();

    try {
        const company = await prisma.company.findUnique({
            where: { id: companyId },
            select: {
                stripeSubscriptionId: true,
                stripeCustomerId: true,
                name: true
            }
        });

        if (!company) {
            return { success: false, error: 'Empresa não encontrada' };
        }

        // Cancel Stripe subscription if exists
        if (company.stripeSubscriptionId) {
            try {
                const { getStripe } = await import('@/lib/stripe');
                const stripe = getStripe();
                await stripe.subscriptions.cancel(company.stripeSubscriptionId);
            } catch (stripeError) {
                console.error('Error canceling Stripe subscription:', stripeError);
                // Continue with deletion even if Stripe fails
            }
        }

        // Delete company - Prisma cascade will delete related records
        // (users, clients, proposals, products, etc.)
        await prisma.company.delete({
            where: { id: companyId }
        });

        revalidatePath('/admin');
        return { success: true, message: `Empresa "${company.name}" excluída com sucesso` };
    } catch (error: any) {
        console.error('Delete company error:', error);
        return { success: false, error: error.message || 'Erro ao excluir empresa' };
    }
}

// Get all users from a company
export async function getCompanyUsers(companyId: string) {
    await checkSuperAdmin();

    try {
        const users = await prisma.user.findMany({
            where: { companyId },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isActive: true,
                lastLogin: true,
                createdAt: true
            },
            orderBy: { createdAt: 'asc' }
        });

        return users.map(u => ({
            ...u,
            lastLogin: u.lastLogin?.toISOString() || null,
            createdAt: u.createdAt.toISOString()
        }));
    } catch (error: any) {
        console.error('Get company users error:', error);
        return [];
    }
}

// Delete a user
export async function deleteUser(userId: string) {
    await checkSuperAdmin();

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                company: {
                    include: {
                        users: {
                            where: { role: 'admin' }
                        }
                    }
                }
            }
        });

        if (!user) {
            return { success: false, error: 'Usuário não encontrado' };
        }

        // Prevent deleting the last admin of a company
        if (user.role === 'admin' && user.company?.users.length === 1) {
            return {
                success: false,
                error: 'Não é possível excluir o único administrador da empresa. Exclua a empresa inteira ou adicione outro admin primeiro.'
            };
        }

        // Prevent deleting super admin
        if (user.isSuperAdmin) {
            return { success: false, error: 'Não é possível excluir um Super Admin' };
        }

        await prisma.user.delete({
            where: { id: userId }
        });

        revalidatePath('/admin');
        return { success: true, message: `Usuário "${user.name}" excluído com sucesso` };
    } catch (error: any) {
        console.error('Delete user error:', error);
        return { success: false, error: error.message || 'Erro ao excluir usuário' };
    }
}

// Toggle user active status
export async function toggleUserStatus(userId: string) {
    await checkSuperAdmin();

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { isActive: true, name: true }
        });

        if (!user) {
            return { success: false, error: 'Usuário não encontrado' };
        }

        await prisma.user.update({
            where: { id: userId },
            data: { isActive: !user.isActive }
        });

        revalidatePath('/admin');
        return {
            success: true,
            message: `Usuário "${user.name}" ${user.isActive ? 'desativado' : 'ativado'} com sucesso`
        };
    } catch (error: any) {
        console.error('Toggle user status error:', error);
        return { success: false, error: error.message || 'Erro ao alterar status do usuário' };
    }
}
