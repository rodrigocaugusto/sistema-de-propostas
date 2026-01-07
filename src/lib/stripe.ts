
import Stripe from 'stripe';

let stripeInstance: Stripe | null = null;

export const getStripe = (): Stripe => {
    if (!stripeInstance) {
        const key = process.env.STRIPE_SECRET_KEY;
        if (!key) {
            throw new Error('STRIPE_SECRET_KEY is not defined');
        }
        stripeInstance = new Stripe(key, {
            apiVersion: '2025-12-15.clover',
            typescript: true,
        });
    }
    return stripeInstance;
};

// Keep backwards compatibility but use lazy initialization
export const stripe = new Proxy({} as Stripe, {
    get: (_, prop: keyof Stripe) => {
        return getStripe()[prop];
    }
});

export const getStripeConfig = () => {
    return {
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    };
};
