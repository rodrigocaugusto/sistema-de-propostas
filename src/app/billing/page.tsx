
'use client';

import { useState, useEffect, Suspense } from 'react';
import { PLANS, PlanId } from '@/lib/plans';
import { createCheckoutSession, createCustomerPortalSession } from './actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Loader2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSearchParams } from 'next/navigation';


function BillingContent() {
    const searchParams = useSearchParams();
    const [isAnnual, setIsAnnual] = useState(false);
    const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
    const [company, setCompany] = useState<any>(null);

    useEffect(() => {
        import('@/app/actions').then(mod => {
            mod.fetchCompany().then(setCompany);
        });
    }, []);

    // Filter out trial
    const plansToShow = Object.values(PLANS).filter(p => p.id !== 'trial');

    const handleSubscribe = async (planId: string) => {
        setLoadingPlan(planId);
        try {
            const result = await createCheckoutSession(planId, isAnnual ? 'annual' : 'monthly');
            if (result.url) {
                window.location.href = result.url;
            }
        } catch (error) {
            toast.error("Erro ao iniciar checkout. Tente novamente.");
            setLoadingPlan(null);
        }
    };

    const handlePortal = async () => {
        setLoadingPlan('portal');
        try {
            const result = await createCustomerPortalSession();
            if (result.url) {
                window.location.href = result.url;
            }
        } catch (error) {
            toast.error("Erro ao acessar portal. Tente novamente.");
            setLoadingPlan(null);
        }
    };

    if (searchParams.get('success')) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <div className="h-16 w-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                    <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <h1 className="text-2xl font-bold">Assinatura Realizada!</h1>
                <p className="text-muted-foreground text-center max-w-md">
                    Obrigado por assinar. Seu plano está sendo ativado. Pode levar alguns instantes para o sistema atualizar.
                </p>
                <div className="flex gap-4">
                    <Button onClick={() => window.location.href = '/dashboard'}>Ir para Dashboard</Button>
                    <Button variant="outline" onClick={handlePortal}>Gerenciar Assinatura</Button>
                </div>
            </div>
        );
    }

    const currentPlan = company?.plan ? PLANS[company.plan as PlanId] : null;

    return (
        <div className="container max-w-5xl py-10 space-y-10">
            <div className="text-center space-y-4">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
                    Planos e Assinaturas
                </h1>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                    Escolha o plano ideal para escalar suas vendas e gerar propostas profissionais.
                </p>

                {company?.stripeSubscriptionId && (
                    <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg inline-block">
                        <p className="text-sm mb-2">Você está no plano <strong>{currentPlan?.name || company.plan}</strong></p>
                        <Button variant="outline" size="sm" onClick={handlePortal} disabled={loadingPlan === 'portal'}>
                            {loadingPlan === 'portal' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Gerenciar Assinatura / Cancelar
                        </Button>
                    </div>
                )}

                {!company?.stripeSubscriptionId && (
                    <div className="flex items-center justify-center gap-4 pt-4">
                        <span className={cn("text-sm font-medium", !isAnnual ? "text-slate-900 dark:text-white" : "text-muted-foreground")}>
                            Mensal
                        </span>
                        <Switch
                            checked={isAnnual}
                            onCheckedChange={setIsAnnual}
                        />
                        <span className={cn("text-sm font-medium", isAnnual ? "text-slate-900 dark:text-white" : "text-muted-foreground")}>
                            Anual <span className="text-xs text-green-600 font-bold bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full ml-1">Economize até 20%</span>
                        </span>
                    </div>
                )}
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                {plansToShow.map((plan) => {
                    const price = isAnnual ? plan.prices.annual : plan.prices.monthly;
                    const isCurrentPlan = company?.plan === plan.id;

                    return (
                        <Card key={plan.id} className={cn(
                            "relative flex flex-col border-slate-200 dark:border-slate-800 transition-all hover:scale-105 duration-300",
                            plan.id === 'pro' && "border-violet-500 shadow-xl shadow-violet-500/10 scale-105 z-10",
                            isCurrentPlan && "border-green-500 ring-2 ring-green-500/20"
                        )}>
                            {plan.id === 'pro' && !isCurrentPlan && (
                                <div className="absolute -top-4 left-0 right-0 flex justify-center">
                                    <span className="bg-violet-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                                        Mais Popular
                                    </span>
                                </div>
                            )}

                            {isCurrentPlan && (
                                <div className="absolute -top-4 left-0 right-0 flex justify-center">
                                    <span className="bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                                        Plano Atual
                                    </span>
                                </div>
                            )}

                            <CardHeader>
                                <CardTitle className="text-xl">{plan.name}</CardTitle>
                                <CardDescription>{plan.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1 space-y-6">
                                <div className="space-y-1">
                                    <span className="text-4xl font-bold">R$ {price.toFixed(2).replace('.', ',')}</span>
                                    <span className="text-muted-foreground">/mês</span>
                                    {isAnnual && (
                                        <div className="text-xs text-muted-foreground">
                                            cobrado anualmente (R$ {(price * 12).toFixed(2)})
                                        </div>
                                    )}
                                </div>

                                <ul className="space-y-3 text-sm">
                                    <li className="flex items-center gap-2">
                                        <Check className="h-4 w-4 text-green-500" />
                                        <span>Até <strong>{plan.limits.proposals}</strong> propostas/mês</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Check className="h-4 w-4 text-green-500" />
                                        <span>Usuários Ilimitados*</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Check className="h-4 w-4 text-green-500" />
                                        <span>Suporte Prioritário</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Check className="h-4 w-4 text-green-500" />
                                        <span>Editor Avançado</span>
                                    </li>
                                </ul>

                                <p className="text-xs text-muted-foreground italic">
                                    * R$ {plan.prices.extraUser?.toFixed(2)} por usuário adicional.
                                </p>
                            </CardContent>
                            <CardFooter>
                                {isCurrentPlan ? (
                                    <Button className="w-full" variant="secondary" onClick={handlePortal} disabled={loadingPlan === 'portal'}>
                                        Gerenciar Assinatura
                                    </Button>
                                ) : (
                                    <Button
                                        className={cn(
                                            "w-full",
                                            plan.id === 'pro' ? "bg-violet-600 hover:bg-violet-700" : ""
                                        )}
                                        onClick={() => handleSubscribe(plan.id)}
                                        disabled={!!loadingPlan}
                                    >
                                        {loadingPlan === plan.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        {loadingPlan === plan.id ? 'Processando...' : (company?.stripeSubscriptionId ? 'Mudar Plano' : 'Assinar Agora')}
                                    </Button>
                                )}
                            </CardFooter>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}

export default function BillingPage() {
    return (
        <Suspense fallback={
            <div className="flex h-[50vh] w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        }>
            <BillingContent />
        </Suspense>
    );
}
