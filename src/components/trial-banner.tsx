'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { X, AlertTriangle, Clock, Zap, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface TrialBannerProps {
    plan: string;
    trialEndsAt: string | null;
}

export function TrialBanner({ plan, trialEndsAt }: TrialBannerProps) {
    const pathname = usePathname();
    const [isDismissed, setIsDismissed] = useState(false);
    const [timeLeft, setTimeLeft] = useState<{
        days: number;
        hours: number;
        minutes: number;
        seconds: number;
        expired: boolean;
    } | null>(null);

    // Only show on authenticated pages (not landing, login, register, etc.)
    const publicPaths = ['/', '/login', '/register', '/privacidade', '/termos', '/checkout'];
    const isPublicPage = publicPaths.some(p => pathname === p || pathname.startsWith('/p/') || pathname.startsWith('/verify-email'));

    // Reset dismissal on page navigation (but keep dismissed within session)
    // The banner reappears on new login because we don't persist to localStorage

    useEffect(() => {
        if (plan !== 'trial' || !trialEndsAt || isPublicPage) return;

        const calculateTimeLeft = () => {
            const endDate = new Date(trialEndsAt);
            const now = new Date();
            const diff = endDate.getTime() - now.getTime();

            if (diff <= 0) {
                return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            return { days, hours, minutes, seconds, expired: false };
        };

        setTimeLeft(calculateTimeLeft());

        const interval = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearInterval(interval);
    }, [plan, trialEndsAt, isPublicPage]);

    // Don't render if not trial, no end date, public page, or dismissed
    if (plan !== 'trial' || !trialEndsAt || isPublicPage || isDismissed || !timeLeft) {
        return null;
    }

    const isUrgent = timeLeft.days <= 2 && !timeLeft.expired;
    const isExpired = timeLeft.expired;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="fixed bottom-0 left-0 right-0 z-[9997]"
            >
                <div className={`
                    relative overflow-hidden
                    ${isExpired
                        ? 'bg-gradient-to-r from-red-600 via-red-500 to-rose-600'
                        : isUrgent
                            ? 'bg-gradient-to-r from-orange-600 via-red-500 to-rose-600'
                            : 'bg-gradient-to-r from-amber-500 via-orange-500 to-red-500'
                    }
                `}>
                    {/* Animated background pattern */}
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMiI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMiIvPjwvZz48L3N2Zz4=')] animate-pulse" />
                    </div>

                    {/* Glow effect */}
                    {isUrgent && !isExpired && (
                        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    )}

                    <div className="relative max-w-7xl mx-auto px-4 py-3">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            {/* Left section - Icon & Message */}
                            <div className="flex items-center gap-4">
                                <div className={`
                                    shrink-0 h-10 w-10 rounded-full flex items-center justify-center
                                    ${isExpired ? 'bg-white/20 animate-pulse' : 'bg-white/20'}
                                `}>
                                    <AlertTriangle className="h-5 w-5 text-white" />
                                </div>

                                <div className="text-white text-center sm:text-left">
                                    {isExpired ? (
                                        <>
                                            <p className="font-bold text-lg">⚠️ Seu período de teste expirou!</p>
                                            <p className="text-white/90 text-sm">Atualize seu plano para continuar usando o DL Pro.</p>
                                        </>
                                    ) : (
                                        <>
                                            <p className="font-bold text-lg flex items-center gap-2">
                                                <Clock className="h-4 w-4" />
                                                Período de Teste
                                            </p>
                                            <p className="text-white/90 text-sm">
                                                {isUrgent ? '⚡ Seu trial está acabando!' : 'Aproveite todos os recursos por tempo limitado'}
                                            </p>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Center section - Countdown */}
                            {!isExpired && (
                                <div className="flex items-center gap-2 sm:gap-3">
                                    <CountdownUnit value={timeLeft.days} label="dias" urgent={isUrgent} />
                                    <span className="text-white/60 text-2xl font-light">:</span>
                                    <CountdownUnit value={timeLeft.hours} label="hrs" urgent={isUrgent} />
                                    <span className="text-white/60 text-2xl font-light">:</span>
                                    <CountdownUnit value={timeLeft.minutes} label="min" urgent={isUrgent} />
                                    <span className="text-white/60 text-2xl font-light hidden sm:block">:</span>
                                    <div className="hidden sm:block">
                                        <CountdownUnit value={timeLeft.seconds} label="seg" urgent={isUrgent} />
                                    </div>
                                </div>
                            )}

                            {/* Right section - CTA & Close */}
                            <div className="flex items-center gap-3">
                                <Link href="/billing">
                                    <Button
                                        size="sm"
                                        className={`
                                            gap-2 font-bold shadow-lg
                                            ${isExpired
                                                ? 'bg-white text-red-600 hover:bg-red-50'
                                                : 'bg-white text-orange-600 hover:bg-orange-50'
                                            }
                                        `}
                                    >
                                        <Zap className="h-4 w-4" />
                                        {isExpired ? 'Assinar Agora' : 'Ver Planos'}
                                        <ArrowRight className="h-3 w-3" />
                                    </Button>
                                </Link>

                                {!isExpired && (
                                    <button
                                        onClick={() => setIsDismissed(true)}
                                        className="shrink-0 p-2 rounded-full hover:bg-white/20 transition-colors text-white/80 hover:text-white"
                                        title="Fechar"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

// Countdown unit component
function CountdownUnit({ value, label, urgent }: { value: number; label: string; urgent: boolean }) {
    return (
        <div className={`
            flex flex-col items-center justify-center 
            min-w-[50px] py-1.5 px-2 rounded-lg
            ${urgent ? 'bg-white/25' : 'bg-white/15'}
        `}>
            <span className={`
                font-mono font-bold text-xl sm:text-2xl leading-none text-white
                ${urgent && value <= 0 ? 'animate-pulse' : ''}
            `}>
                {String(value).padStart(2, '0')}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-white/70 mt-0.5">
                {label}
            </span>
        </div>
    );
}
