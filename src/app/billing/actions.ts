
'use server';

import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { stripe } from '@/lib/stripe';
import { PLANS, PlanId } from '@/lib/plans';
import { redirect } from 'next/navigation';

export async function createCheckoutSession(planId: string, interval: 'monthly' | 'annual') {
    const session = await getSession();
    if (!session || !session.companyId || session.role !== 'admin') {
        throw new Error("Acesso negado. Apenas administradores.");
    }

    const user = await prisma.user.findUnique({
        where: { id: session.id }
    });

    // Validate Plan
    const plan = PLANS[planId as PlanId];
    if (!plan || plan.id === 'trial') {
        throw new Error("Invalid plan selected");
    }

    const price = interval === 'monthly' ? plan.prices.monthly : plan.prices.annual;
    const priceInCents = Math.round(price * 100);

    // Create Checkout Session
    const checkoutSession = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
            {
                quantity: 1,
                price_data: {
                    currency: 'brl',
                    product_data: {
                        name: `Plano ${plan.name} (${interval === 'monthly' ? 'Mensal' : 'Anual'})`,
                        description: plan.description,
                    },
                    unit_amount: priceInCents,
                    recurring: {
                        interval: interval === 'monthly' ? 'month' : 'year',
                    },
                },
            },
        ],
        metadata: {
            companyId: session.companyId,
            planId: planId,
            interval: interval,
            userId: session.id
        },
        client_reference_id: session.companyId,
        customer_email: user?.email,
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?success=true`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?canceled=true`,
    });

    if (!checkoutSession.url) {
        throw new Error("Failed to create checkout session");
    }

    return { url: checkoutSession.url };
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

    const portalSession = await stripe.billingPortal.sessions.create({
        customer: company.stripeCustomerId,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
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

