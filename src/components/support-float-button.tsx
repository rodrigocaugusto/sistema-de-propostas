'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { MessageCircle, X, Send, MessageSquare, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function SupportFloatButton() {
    const pathname = usePathname();
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [showReports, setShowReports] = useState(false);

    // Mount check to avoid hydration mismatch
    useEffect(() => {
        setIsMounted(true);

        // Fetch session to check if user can see reports
        fetch('/api/company')
            .then(res => res.json())
            .then(data => {
                // If company data loads, user is logged in
                // Check role from cookie or assume admin if data exists
                setShowReports(true); // Show for all logged-in users for now
            })
            .catch(() => {
                setShowReports(false);
            });
    }, []);

    if (!isMounted) return null;

    // Do not show on public proposal pages, login, or checkout public pages
    if (
        pathname.startsWith('/p/') ||
        pathname === '/login' ||
        pathname === '/register' ||
        pathname.startsWith('/checkout') && !pathname.includes('success')
    ) {
        return null;
    }

    const whatsappLink = `https://wa.me/558120113526?text=${encodeURIComponent('Olá! Preciso de suporte no sistema de propostas.')}`;

    return (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-3 pointer-events-none">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-[320px] overflow-hidden pointer-events-auto"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-4 text-white flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <div className="bg-white/20 p-1.5 rounded-full">
                                    <MessageSquare className="h-4 w-4" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm">Suporte Propostas</h3>
                                    <p className="text-[10px] opacity-90">Normalmente responde em 1h</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-white/80 hover:text-white transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-4 bg-slate-50 dark:bg-slate-950/50 min-h-[150px] flex flex-col gap-3">
                            <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl rounded-tl-none shadow-sm text-sm text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-800">
                                Olá! 👋
                                <br />
                                Como podemos te ajudar hoje? Escolha um canal abaixo:
                            </div>

                            <div className="grid gap-2 mt-2">
                                <a
                                    href={whatsappLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 w-full bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border border-slate-200 dark:border-slate-700 hover:border-emerald-200 dark:hover:border-emerald-800 p-3 rounded-xl transition-all group"
                                >
                                    <div className="bg-emerald-100 dark:bg-emerald-900/50 p-2 rounded-full text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                                        <MessageCircle className="h-5 w-5 fill-current" />
                                    </div>
                                    <div className="flex-1 text-left">
                                        <div className="font-semibold text-slate-900 dark:text-white text-sm">WhatsApp</div>
                                        <div className="text-xs text-slate-500">Atendimento rápido</div>
                                    </div>
                                </a>

                                <a
                                    href="https://my.digitalleads.com.br"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 w-full bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/30 border border-slate-200 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-800 p-3 rounded-xl transition-all group"
                                >
                                    <div className="bg-blue-100 dark:bg-blue-900/50 p-2 rounded-full text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                                        <Send className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1 text-left">
                                        <div className="font-semibold text-slate-900 dark:text-white text-sm">Central de Suporte</div>
                                        <div className="text-xs text-slate-500">Abrir chamado / Ticket</div>
                                    </div>
                                </a>
                            </div>
                        </div>

                        {/* Footer - Optional branding */}
                        <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 text-center">
                            <p className="text-[10px] text-slate-400">Digital Leads Support Team</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Reports Button - Above Support Button */}
            {showReports && (
                <motion.button
                    onClick={() => router.push('/reports')}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="pointer-events-auto h-12 w-12 rounded-full shadow-lg flex items-center justify-center bg-gradient-to-br from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white transition-all"
                    title="Relatórios"
                >
                    <BarChart3 className="h-5 w-5" />
                </motion.button>
            )}

            {/* Toggle Button */}
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                    "pointer-events-auto",
                    "h-14 w-14 rounded-full shadow-lg flex items-center justify-center transition-colors",
                    isOpen
                        ? "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                        : "bg-[#25D366] hover:bg-[#128C7E] text-white"
                )}
            >
                {isOpen ? (
                    <X className="h-6 w-6" />
                ) : (
                    <MessageCircle className="h-7 w-7 fill-current" />
                )}

                {/* Notification Badge if closed */}
                {!isOpen && (
                    <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-white dark:border-slate-900"></span>
                    </span>
                )}
            </motion.button>
        </div>
    );
}

