'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CheckCircle, Mail, ArrowRight, Loader2 } from 'lucide-react';
import { trackPurchase, PLAN_VALUES, PLAN_NAMES, PlanIdType } from '@/lib/meta-pixel';

function SuccessContent() {
    const searchParams = useSearchParams();
    const sessionId = searchParams.get('session_id');
    const planId = searchParams.get('plan') || 'pro'; // Default to pro if not specified
    const interval = (searchParams.get('interval') || 'monthly') as 'monthly' | 'annual';
    const [loading, setLoading] = useState(true);
    const [purchaseTracked, setPurchaseTracked] = useState(false);

    useEffect(() => {
        // Track Purchase event for Meta Pixel (only once)
        if (!purchaseTracked && sessionId) {
            const planValue = PLAN_VALUES[planId as PlanIdType]?.[interval] || 0;
            const planName = PLAN_NAMES[planId as PlanIdType] || planId;
            trackPurchase(planId, planName, planValue, interval, sessionId);
            setPurchaseTracked(true);
        }

        // Give webhook time to process
        const timer = setTimeout(() => {
            setLoading(false);
        }, 3000);
        return () => clearTimeout(timer);
    }, [sessionId, planId, interval, purchaseTracked]);

    return (
        <div className="max-w-lg w-full text-center">
            {loading ? (
                <div className="space-y-6">
                    <Loader2 className="h-16 w-16 text-violet-600 animate-spin mx-auto" />
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                        Processando seu pagamento...
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400">
                        Aguarde enquanto configuramos sua conta.
                    </p>
                </div>
            ) : (
                <div className="space-y-8">
                    {/* Success Icon */}
                    <div className="relative">
                        <div className="h-24 w-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle className="h-12 w-12 text-green-600" />
                        </div>
                        <div className="absolute -top-2 -right-2 left-0 right-0 flex justify-center">
                            <span className="text-4xl animate-bounce">🎉</span>
                        </div>
                    </div>

                    {/* Title */}
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
                            Pagamento Confirmado!
                        </h1>
                        <p className="text-lg text-slate-600 dark:text-slate-400">
                            Sua assinatura foi ativada com sucesso.
                        </p>
                    </div>

                    {/* Email Notice */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-center gap-3 mb-4">
                            <div className="h-12 w-12 bg-violet-100 dark:bg-violet-900/30 rounded-full flex items-center justify-center">
                                <Mail className="h-6 w-6 text-violet-600" />
                            </div>
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                            Verifique seu Email
                        </h2>
                        <p className="text-slate-600 dark:text-slate-400 text-sm">
                            Enviamos suas <strong>credenciais de acesso</strong> para o email cadastrado no checkout.
                            Procure por um email de <strong>DL Pro</strong>.
                        </p>
                        <p className="text-amber-600 dark:text-amber-400 text-xs mt-4">
                            💡 Não encontrou? Verifique a pasta de spam.
                        </p>
                    </div>

                    {/* CTA */}
                    <div className="space-y-4">
                        <Link href="/login">
                            <Button size="lg" className="w-full h-14 text-lg rounded-full bg-violet-600 hover:bg-violet-700">
                                Acessar Minha Conta <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </Link>
                        <Link href="/">
                            <Button variant="ghost" className="text-slate-500">
                                Voltar para a página inicial
                            </Button>
                        </Link>
                    </div>

                    {/* Session ID for debugging */}
                    {sessionId && (
                        <p className="text-xs text-slate-400 mt-8">
                            ID da sessão: {sessionId.slice(0, 20)}...
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}

export default function CheckoutSuccessPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-green-50 to-white dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-6">
            <Suspense fallback={
                <div className="text-center">
                    <Loader2 className="h-16 w-16 text-violet-600 animate-spin mx-auto" />
                    <p className="mt-4 text-slate-600">Carregando...</p>
                </div>
            }>
                <SuccessContent />
            </Suspense>
        </div>
    );
}
