/**
 * Google Tag Manager Integration
 * Container ID: GTM-KXRB853
 * 
 * GTM allows you to manage all your marketing tags (Google Analytics, conversion tracking, etc.)
 * from a single interface without modifying code.
 */

export const GTM_ID = 'GTM-KXRB853';

// Type definitions for dataLayer
declare global {
    interface Window {
        dataLayer: any[];
    }
}

/**
 * Initialize Google Tag Manager (called once in layout)
 */
export function initGTM(): void {
    if (typeof window === 'undefined') return;

    // Prevent double initialization
    if (window.dataLayer && window.dataLayer.length > 0) return;

    // Initialize dataLayer
    window.dataLayer = window.dataLayer || [];

    // GTM script
    window.dataLayer.push({
        'gtm.start': new Date().getTime(),
        event: 'gtm.js'
    });

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`;

    const firstScript = document.getElementsByTagName('script')[0];
    firstScript?.parentNode?.insertBefore(script, firstScript);
}

/**
 * Push event to dataLayer for GTM
 * Use this to track custom events that can be configured in GTM
 */
export function pushToDataLayer(event: string, data?: Record<string, any>): void {
    if (typeof window === 'undefined' || !window.dataLayer) return;

    window.dataLayer.push({
        event,
        ...data
    });
}

/**
 * Track page view in GTM
 * Useful for SPA navigation
 */
export function trackGTMPageView(url: string, title?: string): void {
    pushToDataLayer('page_view', {
        page_location: url,
        page_title: title || document.title
    });
}

/**
 * Track e-commerce events (for GTM Enhanced Ecommerce)
 */
export function trackEcommerceEvent(
    eventName: 'view_item' | 'begin_checkout' | 'purchase',
    itemData: {
        item_id: string;
        item_name: string;
        price: number;
        currency?: string;
        quantity?: number;
    },
    transactionData?: {
        transaction_id?: string;
        value: number;
    }
): void {
    const items = [{
        item_id: itemData.item_id,
        item_name: itemData.item_name,
        price: itemData.price,
        currency: itemData.currency || 'BRL',
        quantity: itemData.quantity || 1
    }];

    const eventData: Record<string, any> = {
        ecommerce: {
            items
        }
    };

    if (transactionData) {
        eventData.ecommerce.transaction_id = transactionData.transaction_id;
        eventData.ecommerce.value = transactionData.value;
        eventData.ecommerce.currency = itemData.currency || 'BRL';
    }

    pushToDataLayer(eventName, eventData);
}
