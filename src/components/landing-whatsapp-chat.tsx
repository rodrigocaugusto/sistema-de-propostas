'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { MessageCircle, X, Send, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export function LandingWhatsAppChat() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) return null;

    // Only show on landing page
    if (pathname !== '/') {
        return null;
    }

    const whatsappNumber = '558120113526';
    const whatsappLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent('Olá! Gostaria de saber mais sobre o sistema de propostas.')}`;

    return (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-3 pointer-events-none">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-[340px] overflow-hidden pointer-events-auto"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-5 text-white">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className="bg-white/20 p-2 rounded-full">
                                        <Users className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-base">Time Comercial</h3>
                                        <p className="text-xs opacity-90">Estamos online agora</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="text-white/80 hover:text-white transition-colors"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        {/* Body - Chat Style */}
                        <div className="p-5 bg-slate-50 dark:bg-slate-950/50 min-h-[180px]">
                            {/* Messages */}
                            <div className="space-y-3">
                                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl rounded-tl-sm shadow-sm text-sm text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-700">
                                    <p className="font-medium mb-1">Olá! 👋</p>
                                    <p>Sou do time comercial do DL Pro.</p>
                                    <p className="mt-2">Como posso te ajudar hoje?</p>
                                </div>

                                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl rounded-tl-sm shadow-sm text-sm text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-700">
                                    <p>💡 Posso te mostrar como:</p>
                                    <ul className="mt-2 space-y-1 text-slate-600 dark:text-slate-400">
                                        <li>• Criar propostas em segundos</li>
                                        <li>• Automatizar seu pipeline comercial</li>
                                        <li>• Aumentar sua taxa de conversão</li>
                                    </ul>
                                </div>
                            </div>

                            {/* CTA Button */}
                            <div className="mt-5">
                                <a
                                    href={whatsappLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-3 w-full bg-gradient-to-r from-[#25D366] to-[#128C7E] hover:from-[#128C7E] hover:to-[#075E54] text-white p-4 rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 font-semibold"
                                >
                                    <MessageCircle className="h-5 w-5 fill-current" />
                                    Falar com o Time Comercial
                                </a>
                                <p className="text-center text-xs text-slate-500 mt-3">
                                    Resposta média: menos de 5 minutos
                                </p>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                            <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
                                <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                                <span>Online agora • WhatsApp</span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toggle Button */}
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                    "pointer-events-auto relative",
                    "h-14 w-14 rounded-full shadow-lg flex items-center justify-center transition-all",
                    isOpen
                        ? "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                        : "bg-gradient-to-br from-[#25D366] to-[#128C7E] hover:from-[#128C7E] hover:to-[#075E54] text-white shadow-xl shadow-green-500/30"
                )}
            >
                {isOpen ? (
                    <X className="h-6 w-6" />
                ) : (
                    <MessageCircle className="h-7 w-7 fill-current" />
                )}

                {/* Notification Badge (pulsing) */}
                {!isOpen && (
                    <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-5 w-5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex items-center justify-center rounded-full h-5 w-5 bg-red-500 border-2 border-white dark:border-slate-900 text-[10px] font-bold text-white">
                            1
                        </span>
                    </span>
                )}
            </motion.button>
        </div>
    );
}
