'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { initGTM, trackGTMPageView, GTM_ID } from '@/lib/gtm';

/**
 * Google Tag Manager Provider Component
 * Initializes GTM and tracks page views on navigation
 */
export function GTMProvider({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    // Initialize GTM on mount
    useEffect(() => {
        initGTM();
    }, []);

    // Track page views on route change
    useEffect(() => {
        if (pathname) {
            trackGTMPageView(window.location.href);
        }
    }, [pathname]);

    return <>{children}</>;
}

/**
 * GTM Noscript fallback
 * Add this immediately after the opening <body> tag
 */
export function GTMNoscript() {
    return (
        <noscript>
            <iframe
                src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
                height="0"
                width="0"
                style={{ display: 'none', visibility: 'hidden' }}
                title="Google Tag Manager"
            />
        </noscript>
    );
}
