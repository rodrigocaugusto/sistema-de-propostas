import { getSession } from "@/lib/auth";
import { logoutAction } from "@/app/actions";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { Users, FileText, CheckCircle, TrendingUp, Award, TrendingDown } from "lucide-react";
import { redirect } from "next/navigation";
import { SalesChart } from "./sales-chart";

interface UserPerformance {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
    proposalsSent: number;
    proposalsAccepted: number;
    proposalsPending: number;
    proposalsRejected: number;
    totalValue: number;
    acceptedValue: number;
    rejectedValue: number;
    pendingValue: number;
    conversionRate: number;
}

async function getUserPerformanceData(companyId: string): Promise<UserPerformance[]> {
    // Buscar todos os usuários da empresa
    const users = await prisma.user.findMany({
        where: { companyId, isActive: true },
        select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            proposals: {
                select: {
                    status: true,
                    totalOneTime: true,
                    totalRecurring: true,
                }
            }
        }
    });

    return users.map(user => {
        const proposals = user.proposals;
        const proposalsSent = proposals.filter(p => p.status !== 'draft').length;
        const proposalsAccepted = proposals.filter(p => p.status === 'accepted').length;
        const proposalsPending = proposals.filter(p => ['sent', 'viewed', 'negotiating'].includes(p.status)).length;
        const proposalsRejected = proposals.filter(p => p.status === 'rejected').length;

        const totalValue = proposals
            .filter(p => p.status !== 'draft')
            .reduce((sum, p) => sum + p.totalOneTime + p.totalRecurring, 0);

        const acceptedValue = proposals
            .filter(p => p.status === 'accepted')
            .reduce((sum, p) => sum + p.totalOneTime + p.totalRecurring, 0);

        const rejectedValue = proposals
            .filter(p => p.status === 'rejected')
            .reduce((sum, p) => sum + p.totalOneTime + p.totalRecurring, 0);

        const pendingValue = proposals
            .filter(p => ['sent', 'viewed', 'negotiating'].includes(p.status))
            .reduce((sum, p) => sum + p.totalOneTime + p.totalRecurring, 0);

        const conversionRate = proposalsSent > 0
            ? (proposalsAccepted / proposalsSent) * 100
            : 0;

        return {
            id: user.id,
            name: user.name,
            email: user.email,
            avatarUrl: user.avatarUrl,
            proposalsSent,
            proposalsAccepted,
            proposalsPending,
            proposalsRejected,
            totalValue,
            acceptedValue,
            rejectedValue,
            pendingValue,
            conversionRate
        };
    }).sort((a, b) => b.acceptedValue - a.acceptedValue); // Ordenar por valor aceito
}

export default async function ReportsPage() {
    const session = await getSession();
    if (!session || !session.companyId) {
        redirect('/login');
    }

    const performanceData = await getUserPerformanceData(session.companyId);

    // Totais gerais
    const totalProposalsSent = performanceData.reduce((sum, u) => sum + u.proposalsSent, 0);
    const totalAccepted = performanceData.reduce((sum, u) => sum + u.proposalsAccepted, 0);
    const totalValue = performanceData.reduce((sum, u) => sum + u.totalValue, 0);
    const totalAcceptedValue = performanceData.reduce((sum, u) => sum + u.acceptedValue, 0);
    const totalRejectedValue = performanceData.reduce((sum, u) => sum + u.rejectedValue, 0);
    const totalPendingValue = performanceData.reduce((sum, u) => sum + u.pendingValue, 0);
    const overallConversion = totalProposalsSent > 0 ? (totalAccepted / totalProposalsSent) * 100 : 0;

    // Top performer
    const topPerformer = performanceData[0];

    // Dados para os gráficos
    const chartData = performanceData.map(user => ({
        name: user.name.split(' ')[0], // Primeiro nome
        vendido: user.acceptedValue,
        perdido: user.rejectedValue,
        pendente: user.pendingValue,
    }));

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
            <PageHeader
                title="Relatórios"
                subtitle="Desempenho da equipe comercial"
                iconName="bar-chart"
                iconGradient="from-purple-500 to-indigo-600"
                session={session}
                logoutAction={logoutAction}
            />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
                {/* Resumo Geral */}
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <Card className="border-l-4 border-l-purple-500 bg-white dark:bg-slate-900 shadow-lg">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Propostas Enviadas</CardTitle>
                                <div className="p-2 rounded-lg bg-purple-500/10">
                                    <FileText className="h-4 w-4 text-purple-500" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-slate-900 dark:text-white">{totalProposalsSent}</div>
                            <p className="text-xs text-slate-500 mt-1">Total da equipe</p>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-emerald-500 bg-white dark:bg-slate-900 shadow-lg">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Valor Fechado</CardTitle>
                                <div className="p-2 rounded-lg bg-emerald-500/10">
                                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                R$ {totalAcceptedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                            <p className="text-xs text-slate-500 mt-1">{totalAccepted} propostas aceitas</p>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-red-500 bg-white dark:bg-slate-900 shadow-lg">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Valor Perdido</CardTitle>
                                <div className="p-2 rounded-lg bg-red-500/10">
                                    <TrendingDown className="h-4 w-4 text-red-500" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                                R$ {totalRejectedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                            <p className="text-xs text-slate-500 mt-1">Propostas rejeitadas</p>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-blue-500 bg-white dark:bg-slate-900 shadow-lg">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Taxa de Conversão</CardTitle>
                                <div className="p-2 rounded-lg bg-blue-500/10">
                                    <CheckCircle className="h-4 w-4 text-blue-500" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-slate-900 dark:text-white">{overallConversion.toFixed(1)}%</div>
                            <p className="text-xs text-slate-500 mt-1">Média geral</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Top Performer Destaque */}
                {topPerformer && topPerformer.proposalsSent > 0 && (
                    <Card className="bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-orange-500/10 border-amber-200 dark:border-amber-800">
                        <CardContent className="py-4">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white">
                                    <Award className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-amber-600 dark:text-amber-400">🏆 Top Performer</p>
                                    <p className="text-lg font-bold text-slate-900 dark:text-white">{topPerformer.name}</p>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                        {topPerformer.proposalsAccepted} propostas aceitas • R$ {topPerformer.acceptedValue.toLocaleString('pt-BR')} fechados
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Gráficos */}
                {chartData.length > 0 && (
                    <div className="grid gap-6 lg:grid-cols-2">
                        {/* Gráfico de Barras - Vendido vs Perdido */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Vendido vs Perdido por Vendedor</CardTitle>
                                <CardDescription>Comparativo de valores fechados e perdidos</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <SalesChart data={chartData} type="bar" />
                            </CardContent>
                        </Card>

                        {/* Gráfico de Pizza - Distribuição Total */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Distribuição de Valores</CardTitle>
                                <CardDescription>Proporção entre vendido, perdido e pendente</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <SalesChart
                                    data={[
                                        { name: 'Vendido', value: totalAcceptedValue, fill: '#10b981' },
                                        { name: 'Perdido', value: totalRejectedValue, fill: '#ef4444' },
                                        { name: 'Pendente', value: totalPendingValue, fill: '#f59e0b' },
                                    ]}
                                    type="pie"
                                />
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Tabela de Desempenho por Vendedor */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600">
                                <Users className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">Desempenho por Vendedor</CardTitle>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Métricas individuais de cada membro da equipe
                                </p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {performanceData.length === 0 ? (
                            <div className="text-center py-12 text-slate-500">
                                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>Nenhum usuário encontrado</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-slate-200 dark:border-slate-700">
                                            <th className="text-left py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">Vendedor</th>
                                            <th className="text-center py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">Enviadas</th>
                                            <th className="text-center py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">Aceitas</th>
                                            <th className="text-center py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">Conversão</th>
                                            <th className="text-right py-3 px-4 text-sm font-medium text-emerald-600 dark:text-emerald-400">💰 Vendido</th>
                                            <th className="text-right py-3 px-4 text-sm font-medium text-red-600 dark:text-red-400">📉 Perdido</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {performanceData.map((user, index) => (
                                            <tr
                                                key={user.id}
                                                className={`border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${index === 0 && user.proposalsSent > 0 ? 'bg-amber-50/50 dark:bg-amber-900/10' : ''}`}
                                            >
                                                <td className="py-4 px-4">
                                                    <div className="flex items-center gap-3">
                                                        {user.avatarUrl ? (
                                                            // eslint-disable-next-line @next/next/no-img-element
                                                            <img
                                                                src={user.avatarUrl}
                                                                alt={user.name}
                                                                className="h-10 w-10 rounded-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                                                                {user.name.charAt(0).toUpperCase()}
                                                            </div>
                                                        )}
                                                        <div>
                                                            <p className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                                                                {user.name}
                                                                {index === 0 && user.proposalsSent > 0 && (
                                                                    <span className="text-amber-500">🏆</span>
                                                                )}
                                                            </p>
                                                            <p className="text-xs text-slate-500">{user.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4 text-center">
                                                    <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-sm">
                                                        {user.proposalsSent}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-4 text-center">
                                                    <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-medium text-sm">
                                                        {user.proposalsAccepted}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-4 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <div className="w-16 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full ${user.conversionRate >= 50 ? 'bg-emerald-500' : user.conversionRate >= 25 ? 'bg-amber-500' : 'bg-red-500'}`}
                                                                style={{ width: `${Math.min(user.conversionRate, 100)}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                            {user.conversionRate.toFixed(0)}%
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4 text-right">
                                                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                                        R$ {user.acceptedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-4 text-right">
                                                    <span className="font-semibold text-red-600 dark:text-red-400">
                                                        R$ {user.rejectedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
