'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { X, AlertTriangle, Clock, Zap, ArrowRight, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface TrialBannerProps {
    plan: string;
    trialEndsAt: string | null;
    proposalCount: number;
    proposalLimit: number;
}

export function TrialBanner({ plan, trialEndsAt, proposalCount, proposalLimit }: TrialBannerProps) {
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

    // Check proposal limits
    const proposalsRemaining = proposalLimit - proposalCount;
    const hasReachedLimit = proposalCount >= proposalLimit;

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
    const isCritical = hasReachedLimit || isExpired;

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
                    ${isCritical
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

                    {/* Glow effect for urgent/critical */}
                    {(isUrgent || isCritical) && (
                        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    )}

                    <div className="relative max-w-7xl mx-auto px-4 py-2.5">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">

                            {/* Left - Message */}
                            <div className="flex items-center gap-3">
                                <div className={`shrink-0 h-8 w-8 rounded-full flex items-center justify-center bg-white/20 ${isCritical ? 'animate-pulse' : ''}`}>
                                    <AlertTriangle className="h-4 w-4 text-white" />
                                </div>
                                <div className="text-white text-center sm:text-left">
                                    {hasReachedLimit && !isExpired ? (
                                        <p className="font-semibold text-sm">🚫 Limite de propostas atingido! Assine para continuar criando.</p>
                                    ) : isExpired ? (
                                        <p className="font-semibold text-sm">⚠️ Trial expirado! Atualize seu plano.</p>
                                    ) : isUrgent ? (
                                        <p className="font-semibold text-sm">⚡ Seu trial está acabando!</p>
                                    ) : (
                                        <p className="font-semibold text-sm flex items-center gap-2">
                                            <Clock className="h-3.5 w-3.5" />
                                            Período de Teste
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Center - Timer + Proposals Counter */}
                            <div className="flex items-center gap-4">
                                {/* Timer - Always visible */}
                                {!isExpired && (
                                    <div className="flex items-center gap-1.5">
                                        <CountdownUnit value={timeLeft.days} label="d" urgent={isUrgent} />
                                        <span className="text-white/50 font-light">:</span>
                                        <CountdownUnit value={timeLeft.hours} label="h" urgent={isUrgent} />
                                        <span className="text-white/50 font-light">:</span>
                                        <CountdownUnit value={timeLeft.minutes} label="m" urgent={isUrgent} />
                                        <span className="text-white/50 font-light hidden sm:inline">:</span>
                                        <div className="hidden sm:block">
                                            <CountdownUnit value={timeLeft.seconds} label="s" urgent={isUrgent} />
                                        </div>
                                    </div>
                                )}

                                {/* Separator */}
                                <div className="hidden sm:block h-6 w-px bg-white/20" />

                                {/* Proposals Counter */}
                                <div className={`
                                    flex items-center gap-2 px-3 py-1.5 rounded-lg
                                    ${hasReachedLimit ? 'bg-white/25 ring-2 ring-white/40' : 'bg-white/15'}
                                `}>
                                    <FileText className="h-4 w-4 text-white" />
                                    <div className="flex items-baseline gap-1">
                                        <span className={`font-mono font-bold text-lg text-white ${hasReachedLimit ? 'text-red-200' : ''}`}>
                                            {proposalCount}
                                        </span>
                                        <span className="text-white/60 text-sm">/</span>
                                        <span className="font-mono font-bold text-lg text-white">
                                            {proposalLimit}
                                        </span>
                                    </div>
                                    <span className="text-[10px] uppercase tracking-wider text-white/70 hidden sm:inline">
                                        {hasReachedLimit ? 'ESGOTADO' : proposalsRemaining === 1 ? 'ÚLTIMA!' : 'propostas'}
                                    </span>
                                </div>
                            </div>

                            {/* Right - CTA & Close */}
                            <div className="flex items-center gap-2">
                                <Link href="/billing">
                                    <Button
                                        size="sm"
                                        className={`
                                            gap-1.5 font-bold shadow-lg text-sm h-8 px-3
                                            ${isCritical
                                                ? 'bg-white text-red-600 hover:bg-red-50'
                                                : 'bg-white text-orange-600 hover:bg-orange-50'
                                            }
                                        `}
                                    >
                                        <Zap className="h-3.5 w-3.5" />
                                        {isCritical ? 'Assinar' : 'Planos'}
                                        <ArrowRight className="h-3 w-3" />
                                    </Button>
                                </Link>

                                {!isCritical && (
                                    <button
                                        onClick={() => setIsDismissed(true)}
                                        className="shrink-0 p-1.5 rounded-full hover:bg-white/20 transition-colors text-white/70 hover:text-white"
                                        title="Fechar"
                                    >
                                        <X className="h-4 w-4" />
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

// Compact countdown unit
function CountdownUnit({ value, label, urgent }: { value: number; label: string; urgent: boolean }) {
    return (
        <div className={`
            flex items-center gap-0.5 px-2 py-1 rounded-md
            ${urgent ? 'bg-white/25' : 'bg-white/15'}
        `}>
            <span className={`font-mono font-bold text-base text-white ${urgent && value <= 0 ? 'animate-pulse' : ''}`}>
                {String(value).padStart(2, '0')}
            </span>
            <span className="text-[9px] uppercase text-white/60">{label}</span>
        </div>
    );
}
