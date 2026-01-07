
'use client';

import { useState, useEffect, Suspense } from 'react';
import { PLANS, PlanId } from '@/lib/plans';
import {
    createCheckoutSession,
    createCustomerPortalSession,
    getSubscriptionDetails,
    getInvoices,
    cancelSubscription,
    reactivateSubscription
} from './actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Loader2, Check, CreditCard, FileText, Download, ExternalLink, AlertTriangle, RefreshCw, XCircle, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSearchParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Invoice {
    id: string;
    number: string | null;
    status: string | null;
    amount: number;
    currency: string;
    created: string;
    periodStart: string | null;
    periodEnd: string | null;
    invoicePdf: string | null;
    hostedUrl: string | null;
}

interface SubscriptionDetails {
    hasSubscription: boolean;
    id?: string;
    status?: string;
    cancelAtPeriodEnd?: boolean;
    currentPeriodEnd?: string;
    currentPeriodStart?: string;
    plan: string;
    companyStatus?: string;
}

function BillingContent() {
    const searchParams = useSearchParams();
    const [isAnnual, setIsAnnual] = useState(false);
    const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
    const [company, setCompany] = useState<any>(null);
    const [subscription, setSubscription] = useState<SubscriptionDetails | null>(null);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loadingInvoices, setLoadingInvoices] = useState(true);
    const [canceling, setCanceling] = useState(false);
    const [reactivating, setReactivating] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [companyData, subDetails, invoiceList] = await Promise.all([
                import('@/app/actions').then(mod => mod.fetchCompany()),
                getSubscriptionDetails(),
                getInvoices()
            ]);
            setCompany(companyData);
            setSubscription(subDetails as SubscriptionDetails);
            setInvoices(invoiceList as Invoice[]);
        } catch (error) {
            console.error('Load data error:', error);
        } finally {
            setLoadingInvoices(false);
        }
    };

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

    const handleCancelSubscription = async () => {
        if (!confirm('Deseja cancelar sua assinatura? Você terá acesso até o final do período pago.')) {
            return;
        }
        setCanceling(true);
        try {
            const result = await cancelSubscription();
            if (result.success) {
                toast.success(result.message);
                loadData();
            } else {
                toast.error(result.error);
            }
        } catch {
            toast.error('Erro ao cancelar assinatura');
        } finally {
            setCanceling(false);
        }
    };

    const handleReactivateSubscription = async () => {
        setReactivating(true);
        try {
            const result = await reactivateSubscription();
            if (result.success) {
                toast.success(result.message);
                loadData();
            } else {
                toast.error(result.error);
            }
        } catch {
            toast.error('Erro ao reativar assinatura');
        } finally {
            setReactivating(false);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: currency.toUpperCase()
        }).format(amount);
    };

    const getStatusBadge = (status: string | null) => {
        switch (status) {
            case 'paid':
                return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0">Pago</Badge>;
            case 'open':
                return <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-0">Pendente</Badge>;
            case 'void':
            case 'uncollectible':
                return <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-0">Cancelado</Badge>;
            default:
                return <Badge variant="outline">{status || 'N/A'}</Badge>;
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
        <div className="container max-w-6xl py-10 space-y-10">
            <div className="text-center space-y-4">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
                    Planos e Assinaturas
                </h1>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                    Gerencie sua assinatura, visualize faturas e escolha o melhor plano para seu negócio.
                </p>
            </div>

            <Tabs defaultValue="subscription" className="space-y-8">
                <TabsList className="grid w-full max-w-md mx-auto grid-cols-3">
                    <TabsTrigger value="subscription" className="gap-2">
                        <CreditCard className="h-4 w-4" /> Assinatura
                    </TabsTrigger>
                    <TabsTrigger value="invoices" className="gap-2">
                        <FileText className="h-4 w-4" /> Faturas
                    </TabsTrigger>
                    <TabsTrigger value="plans" className="gap-2">
                        <Calendar className="h-4 w-4" /> Planos
                    </TabsTrigger>
                </TabsList>

                {/* SUBSCRIPTION TAB */}
                <TabsContent value="subscription" className="space-y-6">
                    {subscription?.hasSubscription ? (
                        <Card className="max-w-2xl mx-auto">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-xl">Sua Assinatura</CardTitle>
                                        <CardDescription>Detalhes do seu plano atual</CardDescription>
                                    </div>
                                    <Badge className={
                                        subscription.status === 'active'
                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30'
                                            : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30'
                                    }>
                                        {subscription.status === 'active' ? 'Ativo' : subscription.status}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                                        <p className="text-sm text-muted-foreground">Plano</p>
                                        <p className="text-lg font-bold">{currentPlan?.name || subscription.plan}</p>
                                    </div>
                                    <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                                        <p className="text-sm text-muted-foreground">Propostas/mês</p>
                                        <p className="text-lg font-bold">{currentPlan?.limits.proposals || 'N/A'}</p>
                                    </div>
                                    {subscription.currentPeriodEnd && (
                                        <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg col-span-2">
                                            <p className="text-sm text-muted-foreground">Próxima cobrança</p>
                                            <p className="text-lg font-bold">{formatDate(subscription.currentPeriodEnd)}</p>
                                        </div>
                                    )}
                                </div>

                                {subscription.cancelAtPeriodEnd && (
                                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg flex items-start gap-3">
                                        <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                                        <div>
                                            <p className="font-medium text-amber-800 dark:text-amber-200">Assinatura será cancelada</p>
                                            <p className="text-sm text-amber-700 dark:text-amber-300">
                                                Sua assinatura será encerrada em {subscription.currentPeriodEnd && formatDate(subscription.currentPeriodEnd)}.
                                                Você pode reativar a qualquer momento antes dessa data.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                            <CardFooter className="flex flex-wrap gap-3">
                                <Button variant="outline" onClick={handlePortal} disabled={loadingPlan === 'portal'}>
                                    {loadingPlan === 'portal' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    <ExternalLink className="h-4 w-4 mr-2" /> Portal Stripe
                                </Button>
                                {subscription.cancelAtPeriodEnd ? (
                                    <Button
                                        onClick={handleReactivateSubscription}
                                        disabled={reactivating}
                                        className="bg-green-600 hover:bg-green-700"
                                    >
                                        {reactivating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        <RefreshCw className="h-4 w-4 mr-2" /> Reativar Assinatura
                                    </Button>
                                ) : (
                                    <Button
                                        variant="destructive"
                                        onClick={handleCancelSubscription}
                                        disabled={canceling}
                                    >
                                        {canceling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        <XCircle className="h-4 w-4 mr-2" /> Cancelar Assinatura
                                    </Button>
                                )}
                            </CardFooter>
                        </Card>
                    ) : (
                        <Card className="max-w-2xl mx-auto">
                            <CardHeader className="text-center">
                                <CardTitle>Você não tem uma assinatura ativa</CardTitle>
                                <CardDescription>
                                    Escolha um plano na aba "Planos" para começar a usar o sistema.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="text-center">
                                <p className="text-sm text-muted-foreground mb-4">
                                    Plano atual: <strong>{currentPlan?.name || company?.plan || 'Trial'}</strong>
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                {/* INVOICES TAB */}
                <TabsContent value="invoices" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" /> Histórico de Faturas
                            </CardTitle>
                            <CardDescription>
                                Suas últimas faturas e pagamentos
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loadingInvoices ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                </div>
                            ) : invoices.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
                                    <p>Nenhuma fatura encontrada</p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Fatura</TableHead>
                                            <TableHead>Data</TableHead>
                                            <TableHead>Período</TableHead>
                                            <TableHead>Valor</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Ações</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {invoices.map((invoice) => (
                                            <TableRow key={invoice.id}>
                                                <TableCell className="font-medium">
                                                    {invoice.number || invoice.id.slice(-8)}
                                                </TableCell>
                                                <TableCell>
                                                    {formatDate(invoice.created)}
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {invoice.periodStart && invoice.periodEnd
                                                        ? `${formatDate(invoice.periodStart)} - ${formatDate(invoice.periodEnd)}`
                                                        : '-'
                                                    }
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    {formatCurrency(invoice.amount, invoice.currency)}
                                                </TableCell>
                                                <TableCell>
                                                    {getStatusBadge(invoice.status)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {invoice.invoicePdf && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => window.open(invoice.invoicePdf!, '_blank')}
                                                                title="Baixar PDF"
                                                            >
                                                                <Download className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                        {invoice.hostedUrl && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => window.open(invoice.hostedUrl!, '_blank')}
                                                                title="Ver detalhes"
                                                            >
                                                                <ExternalLink className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* PLANS TAB */}
                <TabsContent value="plans" className="space-y-6">
                    {!company?.stripeSubscriptionId && (
                        <div className="flex items-center justify-center gap-4 pb-4">
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
                </TabsContent>
            </Tabs>
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
