'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function FloatingReportsButton() {
    const pathname = usePathname();
    const router = useRouter();
    const [isMounted, setIsMounted] = useState(false);
    const [showReports, setShowReports] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    // Mount check to avoid hydration mismatch
    useEffect(() => {
        setIsMounted(true);

        // Fetch session to check if user can see reports
        fetch('/api/company')
            .then(res => res.json())
            .then(data => {
                // If company data loads, user is logged in
                setShowReports(true);
            })
            .catch(() => {
                setShowReports(false);
            });
    }, []);

    if (!isMounted) return null;

    // Do not show on public pages, login, landing page, or checkout
    if (
        pathname === '/' ||
        pathname.startsWith('/p/') ||
        pathname === '/login' ||
        pathname === '/register' ||
        pathname.startsWith('/checkout') && !pathname.includes('success')
    ) {
        return null;
    }

    if (!showReports) return null;

    return (
        <div className="fixed bottom-6 left-6 z-[9999] flex items-center gap-2 pointer-events-none">
            {/* Floating Reports Button on the LEFT */}
            <motion.button
                onClick={() => router.push('/reports')}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="pointer-events-auto h-12 w-12 rounded-full shadow-lg flex items-center justify-center bg-gradient-to-br from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white transition-all"
                title="Relatórios"
            >
                <BarChart3 className="h-5 w-5" />
            </motion.button>

            {/* Tooltip Badge on hover */}
            <AnimatePresence>
                {isHovered && (
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.15 }}
                        className="pointer-events-none bg-slate-900 dark:bg-slate-700 text-white text-sm font-medium px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap"
                    >
                        Relatórios
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
