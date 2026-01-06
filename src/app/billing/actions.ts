
'use server';

import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { stripe } from '@/lib/stripe';
import { PLANS, PlanId } from '@/lib/plans';
import { redirect } from 'next/navigation';

export async function createCheckoutSession(planId: string, interval: 'monthly' | 'annual') {
    const session = await getSession();
    if (!session || !session.companyId) {
        throw new Error("Unauthorized");
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
    if (!session || !session.companyId) {
        throw new Error("Unauthorized");
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
