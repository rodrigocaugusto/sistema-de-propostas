'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { initMetaPixel, trackPageView, META_PIXEL_ID } from '@/lib/meta-pixel';

/**
 * Meta Pixel Provider Component
 * Initializes the pixel and tracks page views on navigation
 */
export function MetaPixelProvider({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Initialize pixel on mount
    useEffect(() => {
        initMetaPixel();
    }, []);

    // Track page views on route change
    useEffect(() => {
        trackPageView();
    }, [pathname, searchParams]);

    return <>{children}</>;
}

/**
 * Noscript fallback for Meta Pixel
 * Add this to the body for users with JS disabled
 */
export function MetaPixelNoscript() {
    return (
        <noscript>
            <img
                height="1"
                width="1"
                style={{ display: 'none' }}
                src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
                alt=""
            />
        </noscript>
    );
}
