
'use client';

import { useState, useEffect, Suspense } from 'react';
import { PLANS, PlanId } from '@/lib/plans';
import { trackInitiateCheckout, trackViewContent, PLAN_VALUES, PLAN_NAMES, PlanIdType } from '@/lib/meta-pixel';
import {
    createCheckoutSession,
    createCustomerPortalSession,
    getSubscriptionDetails,
    getInvoices,
    cancelSubscription,
    reactivateSubscription,
    manageExtraSeatsAction
} from './actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Loader2, Check, CreditCard, FileText, Download, ExternalLink, AlertTriangle, RefreshCw, XCircle, Calendar, ChevronLeft, Users } from 'lucide-react';
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
    const [purchaseTracked, setPurchaseTracked] = useState(false);

    // Track Purchase event when returning from successful checkout
    useEffect(() => {
        if (searchParams.get('success') && !purchaseTracked) {
            const planId = searchParams.get('plan') || 'pro';
            const interval = (searchParams.get('interval') || 'monthly') as 'monthly' | 'annual';
            const planValue = PLAN_VALUES[planId as PlanIdType]?.[interval] || 0;
            const planName = PLAN_NAMES[planId as PlanIdType] || planId;

            // Import trackPurchase dynamically to track the conversion
            import('@/lib/meta-pixel').then(({ trackPurchase }) => {
                trackPurchase(planId, planName, planValue, interval);
                setPurchaseTracked(true);
            });
        }
    }, [searchParams, purchaseTracked]);

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

        // Track InitiateCheckout event for Meta Pixel
        const interval = isAnnual ? 'annual' : 'monthly';
        const planValue = PLAN_VALUES[planId as PlanIdType]?.[interval] || 0;
        const planName = PLAN_NAMES[planId as PlanIdType] || planId;
        trackInitiateCheckout(planId, planName, planValue, interval);

        try {
            const result = await createCheckoutSession(planId, interval) as { url?: string; error?: string };

            if (result.error) {
                toast.error(result.error);
                setLoadingPlan(null);
                return;
            }

            if (result.url) {
                window.location.href = result.url;
            }
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Erro ao iniciar checkout. Tente novamente.");
            setLoadingPlan(null);
        }
    };

    const handleUpdateSeats = async (newQuantity: number) => {
        if (newQuantity < 0) return;
        try {
            const result = await manageExtraSeatsAction(newQuantity);
            if (result.success) {
                toast.success('Licenças atualizadas com sucesso!');
                loadData();
            } else {
                toast.error(result.error || 'Erro ao atualizar');
            }
        } catch {
            toast.error('Erro ao atualizar licenças');
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
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50">
            <div className="container max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-12">

                {/* Header Section */}
                <div className="relative">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.location.href = '/dashboard'}
                        className="absolute left-0 top-0 md:-ml-12 md:top-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                    >
                        <ChevronLeft className="mr-1 h-4 w-4" /> Voltar
                    </Button>

                    <div className="text-center space-y-4 pt-8 md:pt-0">
                        <div className="inline-flex items-center justify-center p-3 bg-violet-100 dark:bg-violet-900/30 rounded-2xl mb-2">
                            <CreditCard className="h-8 w-8 text-violet-600 dark:text-violet-400" />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                            Minha Assinatura
                        </h1>
                        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                            Gerencie seu plano, controle licenças e acesse seu histórico financeiro em um só lugar.
                        </p>
                    </div>
                </div>

                <Tabs defaultValue="subscription" className="w-full space-y-8">
                    <div className="flex justify-center">
                        <TabsList className="grid w-full max-w-md grid-cols-3 p-1 bg-slate-100 dark:bg-slate-800 rounded-full">
                            <TabsTrigger value="subscription" className="rounded-full data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm transition-all">
                                Assinatura
                            </TabsTrigger>
                            <TabsTrigger value="invoices" className="rounded-full data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm transition-all">
                                Faturas
                            </TabsTrigger>
                            <TabsTrigger value="plans" className="rounded-full data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm transition-all">
                                Trocar Plano
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    {/* SUBSCRIPTION TAB */}
                    <TabsContent value="subscription" className="space-y-6 animate-in fade-in-50 duration-500 slide-in-from-bottom-2">
                        {subscription?.hasSubscription ? (
                            <div className="grid md:grid-cols-3 gap-6">
                                {/* Main Plan Card */}
                                <Card className="md:col-span-2 shadow-lg border-slate-200 dark:border-slate-800 overflow-hidden">
                                    <div className="h-2 bg-gradient-to-r from-violet-500 to-indigo-500" />
                                    <CardHeader className="pb-4">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <CardTitle className="text-2xl font-bold flex items-center gap-2">
                                                    {currentPlan?.name || subscription.plan}
                                                    <Badge className={
                                                        subscription.status === 'active'
                                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 border-green-200'
                                                            : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30'
                                                    }>
                                                        {subscription.status === 'active' ? 'Ativo' : subscription.status}
                                                    </Badge>
                                                </CardTitle>
                                                <CardDescription className="mt-1">
                                                    Renova em {subscription.currentPeriodEnd ? formatDate(subscription.currentPeriodEnd) : 'N/A'}
                                                </CardDescription>
                                            </div>
                                            <div className="text-right hidden sm:block">
                                                <p className="text-sm font-medium text-slate-500">Valor Atual</p>
                                                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                                    {/* Estimativa visual, o valor real vem do stripe */}
                                                    --
                                                </p>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="grid sm:grid-cols-2 gap-4">
                                            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg text-blue-600">
                                                        <FileText className="h-5 w-5" />
                                                    </div>
                                                    <span className="font-semibold text-slate-700 dark:text-slate-300">Propostas</span>
                                                </div>
                                                <p className="text-2xl font-bold ml-11">{currentPlan?.limits.proposals} <span className="text-sm font-normal text-muted-foreground">/mês</span></p>
                                            </div>

                                            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg text-indigo-600">
                                                        <Users className="h-5 w-5" />
                                                    </div>
                                                    <span className="font-semibold text-slate-700 dark:text-slate-300">Usuários</span>
                                                </div>
                                                <p className="text-2xl font-bold ml-11">{(currentPlan?.limits.users || 1) + (company?.extraUsers || 0)} <span className="text-sm font-normal text-muted-foreground">ativos</span></p>
                                            </div>
                                        </div>

                                        {subscription.cancelAtPeriodEnd && (
                                            <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl flex items-start gap-4">
                                                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
                                                <div>
                                                    <h4 className="font-semibold text-red-900 dark:text-red-200">Cancelamento Agendado</h4>
                                                    <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                                                        Sua assinatura encerra em {subscription.currentPeriodEnd && formatDate(subscription.currentPeriodEnd)}.
                                                        Até lá, seu acesso continua normal.
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                    <CardFooter className="bg-slate-50 dark:bg-slate-900/50 py-4 flex flex-wrap gap-3 justify-end border-t border-slate-100 dark:border-slate-800">
                                        {subscription.cancelAtPeriodEnd ? (
                                            <Button
                                                onClick={handleReactivateSubscription}
                                                disabled={reactivating}
                                                className="bg-green-600 hover:bg-green-700 text-white shadow-sm shadow-green-500/20"
                                            >
                                                {reactivating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                <RefreshCw className="h-4 w-4 mr-2" /> Reativar Assinatura
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="outline"
                                                onClick={handleCancelSubscription}
                                                disabled={canceling}
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 border-red-200 dark:border-red-900/30"
                                            >
                                                {canceling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                Cancelar Plano
                                            </Button>
                                        )}
                                        <Button onClick={handlePortal} disabled={loadingPlan === 'portal'}>
                                            {loadingPlan === 'portal' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4 mr-2" />}
                                            Gerenciar no Stripe
                                        </Button>
                                    </CardFooter>
                                </Card>

                                {/* Extra Seats Card */}
                                <Card className="shadow-lg border-slate-200 dark:border-slate-800">
                                    <CardHeader>
                                        <CardTitle className="text-lg font-bold">Gerenciar Assentos</CardTitle>
                                        <CardDescription>Adicione usuários à sua equipe</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="flex flex-col items-center justify-center py-6 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                                            <div className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
                                                {company?.extraUsers || 0}
                                            </div>
                                            <span className="text-sm font-medium text-slate-500 uppercase tracking-wider">Extras Contratados</span>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between bg-white dark:bg-slate-950 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-10 w-10 hover:bg-slate-100 dark:hover:bg-slate-800"
                                                    onClick={() => handleUpdateSeats((company?.extraUsers || 0) - 1)}
                                                    disabled={!company?.extraUsers || company.extraUsers <= 0}
                                                >
                                                    <span className="text-2xl leading-none mb-1">-</span>
                                                </Button>
                                                <span className="font-mono text-lg font-medium">
                                                    {(currentPlan?.limits.users || 1) + (company?.extraUsers || 0)} total
                                                </span>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-10 w-10 hover:bg-slate-100 dark:hover:bg-slate-800"
                                                    onClick={() => handleUpdateSeats((company?.extraUsers || 0) + 1)}
                                                >
                                                    <span className="text-2xl leading-none mb-1">+</span>
                                                </Button>
                                            </div>
                                            <p className="text-center text-xs text-muted-foreground">
                                                Custo: R$ {(currentPlan?.prices as any).extraUser?.toFixed(2).replace('.', ',') || '0,00'} / usuário extra
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        ) : (
                            <Card className="max-w-2xl mx-auto text-center py-12 shadow-xl border-slate-200 dark:border-slate-700">
                                <CardContent>
                                    <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <AlertTriangle className="h-10 w-10 text-slate-400" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Nenhuma assinatura ativa</h3>
                                    <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-md mx-auto">
                                        Você está usando o plano <strong>{currentPlan?.name || company?.plan || 'Gratuito'}</strong>.
                                        Faça um upgrade para desbloquear mais recursos.
                                    </p>
                                    <Button size="lg" onClick={() => document.querySelector('[value="plans"]')?.dispatchEvent(new Event('click', { bubbles: true }))} className="bg-violet-600 hover:bg-violet-700">
                                        Ver Planos Disponíveis
                                    </Button>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    {/* INVOICES TAB */}
                    <TabsContent value="invoices" className="animate-in fade-in-50 duration-500 slide-in-from-bottom-2">
                        <Card className="shadow-lg border-slate-200 dark:border-slate-800">
                            <CardHeader>
                                <CardTitle>Histórico Financeiro</CardTitle>
                                <CardDescription>Baixe recibos e acompanhe seus pagamentos</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {loadingInvoices ? (
                                    <div className="flex flex-col items-center justify-center py-16 space-y-4">
                                        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
                                        <p className="text-sm text-muted-foreground">Carregando faturas...</p>
                                    </div>
                                ) : invoices.length === 0 ? (
                                    <div className="text-center py-16">
                                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <FileText className="h-8 w-8 text-slate-400" />
                                        </div>
                                        <h3 className="text-lg font-medium text-slate-900 dark:text-white">Sem faturas ainda</h3>
                                        <p className="text-slate-500">Quando você fizer o primeiro pagamento, ele aparecerá aqui.</p>
                                    </div>
                                ) : (
                                    <div className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
                                        <Table>
                                            <TableHeader className="bg-slate-50 dark:bg-slate-900">
                                                <TableRow>
                                                    <TableHead className="w-[100px]">Data</TableHead>
                                                    <TableHead>Valor</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead className="hidden md:table-cell">Período</TableHead>
                                                    <TableHead className="text-right">Recibo</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {invoices.map((invoice) => (
                                                    <TableRow key={invoice.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                                                        <TableCell className="font-medium">
                                                            {formatDate(invoice.created)}
                                                        </TableCell>
                                                        <TableCell>
                                                            {formatCurrency(invoice.amount, invoice.currency)}
                                                        </TableCell>
                                                        <TableCell>
                                                            {getStatusBadge(invoice.status)}
                                                        </TableCell>
                                                        <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                                                            {invoice.periodStart && invoice.periodEnd
                                                                ? `${formatDate(invoice.periodStart)} - ${formatDate(invoice.periodEnd)}`
                                                                : '-'
                                                            }
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            {invoice.invoicePdf && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                                                                    onClick={() => window.open(invoice.invoicePdf!, '_blank')}
                                                                    title="Baixar PDF"
                                                                >
                                                                    <Download className="h-4 w-4" />
                                                                </Button>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* PLANS TAB */}
                    <TabsContent value="plans" className="space-y-8 animate-in fade-in-50 duration-500 slide-in-from-bottom-2">
                        {!company?.stripeSubscriptionId && (
                            <div className="flex justify-center">
                                <div className="inline-flex items-center p-1 bg-white dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm">
                                    <button
                                        onClick={() => setIsAnnual(false)}
                                        className={cn(
                                            "px-4 py-2 rounded-full text-sm font-medium transition-all",
                                            !isAnnual ? "bg-slate-900 text-white shadow-md" : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                                        )}
                                    >
                                        Mensal
                                    </button>
                                    <button
                                        onClick={() => setIsAnnual(true)}
                                        className={cn(
                                            "px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2",
                                            isAnnual ? "bg-slate-900 text-white shadow-md" : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                                        )}
                                    >
                                        Anual <span className="text-[10px] font-bold bg-green-500 text-white px-1.5 py-0.5 rounded-full">-20%</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="grid md:grid-cols-3 gap-8">
                            {plansToShow.map((plan) => {
                                const price = isAnnual ? plan.prices.annual : plan.prices.monthly;
                                const isCurrentPlan = company?.plan === plan.id;
                                const isPro = plan.id === 'pro';

                                return (
                                    <div key={plan.id} className="relative group">
                                        {isPro && (
                                            <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl blur opacity-30 group-hover:opacity-100 transition duration-500" />
                                        )}
                                        <Card className={cn(
                                            "relative h-full flex flex-col border-slate-200 dark:border-slate-800 transition-all duration-300 rounded-2xl overflow-hidden",
                                            isPro ? "bg-white dark:bg-slate-900" : "bg-white dark:bg-slate-900",
                                            isCurrentPlan && "ring-2 ring-green-500 border-green-500"
                                        )}>
                                            {isPro && !isCurrentPlan && (
                                                <div className="bg-violet-600 text-white text-xs font-bold text-center py-1">
                                                    MAIS POPULAR
                                                </div>
                                            )}
                                            {isCurrentPlan && (
                                                <div className="bg-green-600 text-white text-xs font-bold text-center py-1">
                                                    SEU PLANO ATUAL
                                                </div>
                                            )}

                                            <CardHeader className="text-center pb-2">
                                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{plan.name}</h3>
                                                <p className="text-sm text-slate-500 leading-relaxed min-h-[40px]">{plan.description}</p>
                                            </CardHeader>

                                            <CardContent className="flex-1 flex flex-col items-center">
                                                <div className="my-6 text-center">
                                                    <div className="flex items-baseline gap-1 justify-center">
                                                        <span className="text-sm text-slate-500">R$</span>
                                                        <span className="text-5xl font-extrabold text-slate-900 dark:text-white">{price.toFixed(0)}</span>
                                                        <span className="text-slate-500">,90</span>
                                                    </div>
                                                    <span className="text-sm text-slate-500 mt-1 block">
                                                        por mês {isAnnual && <span className="block text-xs">(faturado anualmente)</span>}
                                                    </span>
                                                </div>

                                                <ul className="space-y-4 text-sm w-full border-t border-slate-100 dark:border-slate-800 pt-6">
                                                    <li className="flex items-center gap-3">
                                                        <div className="flex-shrink-0 h-5 w-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                                            <Check className="h-3 w-3 text-green-600" />
                                                        </div>
                                                        <span className="text-slate-600 dark:text-slate-300"><strong>{plan.limits.proposals}</strong> propostas/mês</span>
                                                    </li>
                                                    <li className="flex items-center gap-3">
                                                        <div className="flex-shrink-0 h-5 w-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                                            <Check className="h-3 w-3 text-green-600" />
                                                        </div>
                                                        <span className="text-slate-600 dark:text-slate-300">Usuários Ilimitados*</span>
                                                    </li>
                                                    <li className="flex items-center gap-3">
                                                        <div className="flex-shrink-0 h-5 w-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                                            <Check className="h-3 w-3 text-green-600" />
                                                        </div>
                                                        <span className="text-slate-600 dark:text-slate-300">{isPro ? 'Suporte Prioritário' : 'Suporte por Email'}</span>
                                                    </li>
                                                </ul>


                                                <p className="text-xs text-slate-400 mt-4 italic">
                                                    * R$ {(plan.prices as any).extraUser?.toFixed(2)} por usuário adicional.
                                                </p>
                                            </CardContent>

                                            <CardFooter className="pt-2 pb-6 px-6">
                                                {isCurrentPlan ? (
                                                    <Button className="w-full" variant="outline" onClick={handlePortal} disabled={loadingPlan === 'portal'}>
                                                        Gerenciar
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        className={cn(
                                                            "w-full h-12 rounded-xl font-semibold shadow-md transition-all hover:-translate-y-1",
                                                            isPro
                                                                ? "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-violet-500/25"
                                                                : "bg-slate-900 hover:bg-slate-800 text-white"
                                                        )}
                                                        onClick={() => handleSubscribe(plan.id)}
                                                        disabled={!!loadingPlan}
                                                    >
                                                        {loadingPlan === plan.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                        {loadingPlan === plan.id ? 'Processando...' : (company?.stripeSubscriptionId ? `Mudar para ${plan.name}` : 'Começar Agora')}
                                                    </Button>
                                                )}
                                            </CardFooter>
                                        </Card>
                                    </div>
                                );
                            })}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div >
    );
}

export default function BillingPage() {
    return (
        <Suspense fallback={
            <div className="flex h-screen w-full items-center justify-center bg-slate-50 dark:bg-slate-950">
                <div className="text-center space-y-4">
                    <Loader2 className="h-10 w-10 animate-spin text-violet-600 mx-auto" />
                    <p className="text-muted-foreground font-medium">Carregando informações da assinatura...</p>
                </div>
            </div>
        }>
            <BillingContent />
        </Suspense>
    );
}
