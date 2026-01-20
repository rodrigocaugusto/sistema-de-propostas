/**
 * Meta Pixel (Facebook Pixel) Integration
 * Pixel ID: 128271411184356
 * 
 * Events tracked:
 * - PageView: Every page load
 * - Lead: Trial registration
 * - InitiateCheckout: When user clicks to subscribe to a plan
 * - Purchase: When subscription is completed successfully
 * - ViewContent: When viewing pricing/plans
 */

export const META_PIXEL_ID = '128271411184356';

// Type definitions for fbq
declare global {
    interface Window {
        fbq: (...args: any[]) => void;
        _fbq: any;
    }
}

/**
 * Initialize Meta Pixel (called once in layout)
 */
export function initMetaPixel(): void {
    if (typeof window === 'undefined') return;

    // Check if fbq already exists (prevent double init)
    const win = window as Window & { fbq?: any; _fbq?: any };
    if (typeof win.fbq === 'function') return;

    // Meta Pixel base code
    const f = win;
    const b = document;
    const e = 'script';
    const v = 'https://connect.facebook.net/en_US/fbevents.js';

    let n: any;
    n = f.fbq = function () {
        // eslint-disable-next-line prefer-rest-params
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = '2.0';
    n.queue = [];

    const t = b.createElement(e) as HTMLScriptElement;
    t.async = true;
    t.src = v;
    const s = b.getElementsByTagName(e)[0];
    s?.parentNode?.insertBefore(t, s);

    // Initialize with our pixel ID
    if (typeof win.fbq === 'function') {
        win.fbq('init', META_PIXEL_ID);
        win.fbq('track', 'PageView');
    }
}

/**
 * Track PageView - called on route change
 */
export function trackPageView(): void {
    if (typeof window === 'undefined' || !window.fbq) return;
    window.fbq('track', 'PageView');
}

/**
 * Track ViewContent - when user views pricing/plans
 */
export function trackViewContent(contentName: string, contentCategory: string = 'plans'): void {
    if (typeof window === 'undefined' || !window.fbq) return;
    window.fbq('track', 'ViewContent', {
        content_name: contentName,
        content_category: contentCategory,
    });
}

/**
 * Track Lead - when user registers for trial
 */
export function trackLead(email?: string): void {
    if (typeof window === 'undefined' || !window.fbq) return;
    window.fbq('track', 'Lead', {
        content_name: 'Trial Registration',
        content_category: 'trial',
        ...(email && { customer_email: email }),
    });
}

/**
 * Track InitiateCheckout - when user starts subscription checkout
 */
export function trackInitiateCheckout(
    planId: string,
    planName: string,
    value: number,
    interval: 'monthly' | 'annual'
): void {
    if (typeof window === 'undefined' || !window.fbq) return;
    window.fbq('track', 'InitiateCheckout', {
        content_name: planName,
        content_category: 'subscription',
        content_ids: [planId],
        content_type: 'product',
        value: value,
        currency: 'BRL',
        num_items: 1,
        // Custom data
        plan_id: planId,
        billing_interval: interval,
    });
}

/**
 * Track Purchase - when subscription is completed
 * This is the main conversion event for tracking ROI
 */
export function trackPurchase(
    planId: string,
    planName: string,
    value: number,
    interval: 'monthly' | 'annual',
    transactionId?: string
): void {
    if (typeof window === 'undefined' || !window.fbq) return;

    // Calculate value based on interval
    // For annual plans, we track the annual value for better ROI calculation
    const purchaseValue = interval === 'annual' ? value * 12 : value;

    window.fbq('track', 'Purchase', {
        content_name: planName,
        content_category: 'subscription',
        content_ids: [planId],
        content_type: 'product',
        value: purchaseValue,
        currency: 'BRL',
        num_items: 1,
        // Custom data
        plan_id: planId,
        billing_interval: interval,
        ...(transactionId && { order_id: transactionId }),
    });
}

/**
 * Track Complete Registration - when trial registration is complete
 */
export function trackCompleteRegistration(email?: string): void {
    if (typeof window === 'undefined' || !window.fbq) return;
    window.fbq('track', 'CompleteRegistration', {
        content_name: 'Trial Account Created',
        status: 'complete',
        ...(email && { customer_email: email }),
    });
}

/**
 * PLAN PRICE REFERENCE (for tracking)
 * 
 * Trial: R$ 0,00 (7 days)
 * 
 * Básico (basic):
 *   - Monthly: R$ 39,90
 *   - Annual: R$ 29,90/mês = R$ 358,80/ano
 * 
 * Profissional (pro):
 *   - Monthly: R$ 89,90
 *   - Annual: R$ 69,90/mês = R$ 838,80/ano
 * 
 * Enterprise:
 *   - Monthly: R$ 169,00
 *   - Annual: R$ 149,90/mês = R$ 1.798,80/ano
 */

export const PLAN_VALUES = {
    trial: { monthly: 0, annual: 0 },
    basic: { monthly: 39.90, annual: 29.90 },
    pro: { monthly: 89.90, annual: 69.90 },
    enterprise: { monthly: 169.00, annual: 149.90 },
} as const;

export const PLAN_NAMES = {
    trial: 'Trial (7 dias)',
    basic: 'Básico',
    pro: 'Profissional',
    enterprise: 'Enterprise',
} as const;

export type PlanIdType = keyof typeof PLAN_VALUES;
