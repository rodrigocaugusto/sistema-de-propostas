import { NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { PLANS, PlanId } from '@/lib/plans';

// Stripe Price IDs - Configure these in your Stripe Dashboard
const STRIPE_PRICE_IDS: Record<string, { monthly: string; annual: string }> = {
    basic: {
        monthly: process.env.STRIPE_PRICE_BASIC_MONTHLY || '',
        annual: process.env.STRIPE_PRICE_BASIC_ANNUAL || '',
    },
    pro: {
        monthly: process.env.STRIPE_PRICE_PRO_MONTHLY || '',
        annual: process.env.STRIPE_PRICE_PRO_ANNUAL || '',
    },
    enterprise: {
        monthly: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY || '',
        annual: process.env.STRIPE_PRICE_ENTERPRISE_ANNUAL || '',
    },
};

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { planId, billingPeriod, email } = body as {
            planId: PlanId;
            billingPeriod: 'monthly' | 'annual';
            email?: string;
        };

        // Validate plan
        if (!planId || !PLANS[planId] || planId === 'trial') {
            return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
        }

        const priceIds = STRIPE_PRICE_IDS[planId];
        if (!priceIds) {
            return NextResponse.json({ error: 'Plan not configured' }, { status: 400 });
        }

        const priceId = billingPeriod === 'annual' ? priceIds.annual : priceIds.monthly;
        if (!priceId) {
            return NextResponse.json({ error: 'Price not configured' }, { status: 400 });
        }

        const stripe = getStripe();

        // Create Checkout Session
        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            customer_email: email || undefined,
            metadata: {
                planId,
                billingPeriod,
                isNewSignup: 'true', // Flag to indicate this is a new user signup
            },
            success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.digitalleads.com.br'}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.digitalleads.com.br'}/?canceled=true`,
            allow_promotion_codes: true,
            billing_address_collection: 'required',
            subscription_data: {
                metadata: {
                    planId,
                    billingPeriod,
                },
            },
        });

        return NextResponse.json({ url: session.url });
    } catch (error: any) {
        console.error('Checkout error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create checkout session' },
            { status: 500 }
        );
    }
}
