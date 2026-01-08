
'use server';

import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { stripe } from '@/lib/stripe';
import { PLANS, PlanId, getStripePriceId } from '@/lib/plans';
import { redirect } from 'next/navigation';

export async function createCheckoutSession(planId: string, interval: 'monthly' | 'annual') {
    try {
        const session = await getSession();
        if (!session || !session.companyId || session.role !== 'admin') {
            return { error: "Acesso negado. Apenas administradores." };
        }

        const user = await prisma.user.findUnique({
            where: { id: session.id }
        });

        // Validate Plan
        const plan = PLANS[planId as PlanId];
        if (!plan || plan.id === 'trial') {
            return { error: "Plano inválido selecionado" };
        }

        // Get the Stripe Price ID
        const stripePriceId = getStripePriceId(planId, interval);

        // DEBUG: Log detalhado para produção
        if (!stripePriceId) {
            console.error(`[Checkout Error] No Stripe price ID found for plan: ${planId}, interval: ${interval}`);
            // Logar status das variaveis de ambiente
            console.error(`[Environment] Environment variables check (keys exist?):`, {
                BASIC_MONTHLY: !!process.env.STRIPE_PRICE_BASIC_MONTHLY,
                PRO_MONTHLY: !!process.env.STRIPE_PRICE_PRO_MONTHLY,
                ENTERPRISE_MONTHLY: !!process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY,
            });
            return { error: `Erro de configuração: Preço não encontrado para plano ${planId} (${interval}). Contate o suporte.` };
        }

        console.log(`[Checkout] Creating session for user ${session.id}, plan ${planId}, price ${stripePriceId}`);

        // Get or create Stripe customer
        let customerId: string | undefined;
        const company = await prisma.company.findUnique({
            where: { id: session.companyId }
        });

        if (company?.stripeCustomerId) {
            customerId = company.stripeCustomerId;
        }

        // Determine Base URL
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';

        if (!appUrl || !appUrl.startsWith('http')) {
            console.error('[Checkout Error] Invalid App URL configured:', appUrl);
            return { error: "Erro de configuração: URL da aplicação inválida. Contate o suporte." };
        }

        // Create Checkout Session using Stripe Price ID
        const checkoutSession = await stripe.checkout.sessions.create({
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [
                {
                    quantity: 1,
                    price: stripePriceId, // Use the Price ID from Stripe
                },
            ],
            metadata: {
                companyId: session.companyId,
                planId: planId,
                interval: interval,
                userId: session.id
            },
            client_reference_id: session.companyId,
            ...(customerId ? { customer: customerId } : { customer_email: user?.email }),
            success_url: `${appUrl}/billing?success=true`,
            cancel_url: `${appUrl}/billing?canceled=true`,
        });

        if (!checkoutSession.url) {
            console.error('[Checkout Error] Stripe session created but no URL:', checkoutSession.id);
            return { error: "Falha ao criar sessão de checkout (URL ausente)" };
        }

        return { url: checkoutSession.url };
    } catch (error: any) {
        console.error('[Checkout Stripe Error] Full error:', error);
        return { error: `Erro Stripe: ${error.message}` };
    }
}

export async function createCustomerPortalSession() {
    const session = await getSession();
    if (!session || !session.companyId || session.role !== 'admin') {
        throw new Error("Acesso negado. Apenas administradores.");
    }

    const company = await prisma.company.findUnique({
        where: { id: session.companyId }
    });

    if (!company?.stripeCustomerId) {
        throw new Error("No Stripe customer found");
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';

    const portalSession = await stripe.billingPortal.sessions.create({
        customer: company.stripeCustomerId,
        return_url: `${appUrl}/billing`,
    });

    return { url: portalSession.url };
}

// Get current subscription details
export async function getSubscriptionDetails() {
    const session = await getSession();
    if (!session || !session.companyId) {
        throw new Error("Unauthorized");
    }

    const company = await prisma.company.findUnique({
        where: { id: session.companyId },
        select: {
            stripeSubscriptionId: true,
            stripeCustomerId: true,
            plan: true,
            status: true
        }
    });

    if (!company?.stripeSubscriptionId) {
        return {
            hasSubscription: false,
            plan: company?.plan || 'trial',
            status: company?.status || 'active'
        };
    }

    try {
        const subscription = await stripe.subscriptions.retrieve(company.stripeSubscriptionId);

        return {
            hasSubscription: true,
            id: subscription.id,
            status: subscription.status,
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            currentPeriodEnd: new Date((subscription as any).current_period_end * 1000).toISOString(),
            currentPeriodStart: new Date((subscription as any).current_period_start * 1000).toISOString(),
            plan: company.plan,
            companyStatus: company.status
        };
    } catch (error) {
        console.error('Get subscription details error:', error);
        return {
            hasSubscription: false,
            plan: company.plan || 'trial',
            status: company.status || 'active'
        };
    }
}

// Get invoices for current company
export async function getInvoices() {
    const session = await getSession();
    if (!session || !session.companyId || session.role !== 'admin') {
        throw new Error("Acesso negado. Apenas administradores.");
    }

    const company = await prisma.company.findUnique({
        where: { id: session.companyId },
        select: { stripeCustomerId: true }
    });

    if (!company?.stripeCustomerId) {
        return [];
    }

    try {
        const invoices = await stripe.invoices.list({
            customer: company.stripeCustomerId,
            limit: 24, // Last 24 invoices
        });

        return invoices.data.map(inv => ({
            id: inv.id,
            number: inv.number,
            status: inv.status,
            amount: (inv.amount_paid || 0) / 100,
            currency: inv.currency,
            created: new Date(inv.created * 1000).toISOString(),
            periodStart: inv.period_start ? new Date(inv.period_start * 1000).toISOString() : null,
            periodEnd: inv.period_end ? new Date(inv.period_end * 1000).toISOString() : null,
            invoicePdf: inv.invoice_pdf,
            hostedUrl: inv.hosted_invoice_url,
        }));
    } catch (error) {
        console.error('Get invoices error:', error);
        return [];
    }
}

// Cancel current subscription
export async function cancelSubscription() {
    const session = await getSession();
    if (!session || !session.companyId || session.role !== 'admin') {
        throw new Error("Acesso negado. Apenas administradores.");
    }

    const company = await prisma.company.findUnique({
        where: { id: session.companyId },
        select: { stripeSubscriptionId: true }
    });

    if (!company?.stripeSubscriptionId) {
        return { success: false, error: 'Você não tem uma assinatura ativa' };
    }

    try {
        // Cancel at period end
        await stripe.subscriptions.update(company.stripeSubscriptionId, {
            cancel_at_period_end: true
        });

        return { success: true, message: 'Sua assinatura será cancelada ao final do período atual' };
    } catch (error: any) {
        console.error('Cancel subscription error:', error);
        return { success: false, error: error.message || 'Erro ao cancelar assinatura' };
    }
}

// Reactivate subscription (if set to cancel at period end)
export async function reactivateSubscription() {
    const session = await getSession();
    if (!session || !session.companyId || session.role !== 'admin') {
        throw new Error("Acesso negado. Apenas administradores.");
    }

    const company = await prisma.company.findUnique({
        where: { id: session.companyId },
        select: { stripeSubscriptionId: true }
    });

    if (!company?.stripeSubscriptionId) {
        return { success: false, error: 'Você não tem uma assinatura' };
    }

    try {
        await stripe.subscriptions.update(company.stripeSubscriptionId, {
            cancel_at_period_end: false
        });

        return { success: true, message: 'Assinatura reativada com sucesso!' };
    } catch (error: any) {
        console.error('Reactivate subscription error:', error);
        return { success: false, error: error.message || 'Erro ao reativar assinatura' };
    }
}
// Update extra seats
export async function manageExtraSeatsAction(newQuantity: number) {
    const session = await getSession();
    if (!session || !session.companyId || session.role !== 'admin') {
        throw new Error("Acesso negado.");
    }

    if (newQuantity < 0) {
        throw new Error("Quantidade inválida.");
    }

    try {
        // Update local DB
        await prisma.company.update({
            where: { id: session.companyId },
            data: { extraUsers: newQuantity }
        });

        // TODO: Integrate with Stripe Subscription Items to charge for these seats
        // This requires a valid PRICE_ID for the "Extra User" product in Stripe.
        // Example:
        // const company = await prisma.company.findUnique({ where: { id: session.companyId } });
        // if (company.stripeSubscriptionId) {
        //    // Logic to find 'extra-seat' item and update quantity
        // }

        return { success: true };
    } catch (error: any) {
        console.error('Manage seats error:', error);
        return { success: false, error: 'Erro ao atualizar assentos.' };
    }
}
