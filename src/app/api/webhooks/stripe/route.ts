
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/db';
import Stripe from 'stripe';

export async function POST(req: Request) {
    const body = await req.text();
    const signature = (await headers()).get('Stripe-Signature') as string;

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET || ''
        );
    } catch (error: any) {
        return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
    }

    const session = event.data.object as Stripe.Checkout.Session;

    if (event.type === 'checkout.session.completed') {
        const subscriptionId = session.subscription as string;
        const companyId = session.metadata?.companyId;
        const planId = session.metadata?.planId;

        if (!companyId || !planId) {
            return new NextResponse('Webhook Error: Missing metadata', { status: 400 });
        }

        // Update Company Plan
        await prisma.company.update({
            where: { id: companyId },
            data: {
                stripeSubscriptionId: subscriptionId,
                stripeCustomerId: session.customer as string,
                plan: planId,
                status: 'active'
            }
        });
    }

    if (event.type === 'invoice.payment_succeeded') {
        const subscriptionId = session.subscription as string;
        // Ensure status is active on recurring payments
        const company = await prisma.company.findFirst({
            where: { stripeSubscriptionId: subscriptionId }
        });

        if (company) {
            await prisma.company.update({
                where: { id: company.id },
                data: { status: 'active' }
            });
        }
    }

    if (event.type === 'customer.subscription.deleted' || event.type === 'customer.subscription.updated') {
        const subscription = event.data.object as Stripe.Subscription;

        const company = await prisma.company.findFirst({
            where: { stripeSubscriptionId: subscription.id }
        });

        if (company) {
            // If canceled or unpaid, suspend? Or revert to free?
            // For now, if status is not active, mark as suspended
            if (subscription.status !== 'active' && subscription.status !== 'trialing') {
                await prisma.company.update({
                    where: { id: company.id },
                    data: { status: 'suspended' } // Or revert to 'free' plan
                });
            } else {
                // Check if plan changed in stripe (advanced), for now just keep active
                await prisma.company.update({
                    where: { id: company.id },
                    data: { status: 'active' }
                });
            }
        }
    }

    return new NextResponse(null, { status: 200 });
}
