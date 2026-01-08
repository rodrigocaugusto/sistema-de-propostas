import { fetchClients, logoutAction } from "@/app/actions";
import { getSession } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NewClientDialog } from "@/components/new-client-dialog";
import { PageHeader } from "@/components/page-header";
import Link from "next/link";
import { Users, Building2, Mail, Phone, FileText, CheckCircle, DollarSign, ArrowUpRight } from "lucide-react";

interface ClientData {
    id: string;
    name: string;
    company?: string | null;
    email: string;
    phone?: string | null;
    createdAt: string;
    proposalCount?: number;
    totalValue?: number;
    acceptedCount?: number;
}

export default async function ClientsPage() {
    const session = await getSession();
    const clients: ClientData[] = await fetchClients();

    const totalClients = clients.length;
    const totalValue = clients.reduce((sum: number, c: ClientData) => sum + (c.totalValue || 0), 0);
    const totalProposals = clients.reduce((sum: number, c: ClientData) => sum + (c.proposalCount || 0), 0);
    const totalAccepted = clients.reduce((sum: number, c: ClientData) => sum + (c.acceptedCount || 0), 0);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
            <PageHeader
                title="Clientes"
                subtitle="Gerencie sua base de clientes"
                iconName="users"
                iconGradient="from-cyan-500 to-blue-600"
                session={session}
                logoutAction={logoutAction}
                actions={<NewClientDialog />}
            />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
                {/* Stats */}
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {/* Total Clientes - #029DAF Teal */}
                    <Card className="border-l-4 border-l-[#029DAF] bg-white dark:bg-slate-900 shadow-lg">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Total de Clientes</CardTitle>
                                <div className="p-2 rounded-lg bg-[#029DAF]/10 dark:bg-[#029DAF]/20">
                                    <Users className="h-4 w-4 text-[#029DAF]" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-slate-900 dark:text-white">{totalClients}</div>
                        </CardContent>
                    </Card>

                    {/* Propostas Enviadas - #FFC219 Golden */}
                    <Card className="border-l-4 border-l-[#FFC219] bg-white dark:bg-slate-900 shadow-lg">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Propostas Enviadas</CardTitle>
                                <div className="p-2 rounded-lg bg-[#FFC219]/10 dark:bg-[#FFC219]/20">
                                    <FileText className="h-4 w-4 text-[#FFC219]" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-slate-900 dark:text-white">{totalProposals}</div>
                        </CardContent>
                    </Card>

                    {/* Aceitas - #F07C19 Orange */}
                    <Card className="border-l-4 border-l-[#F07C19] bg-white dark:bg-slate-900 shadow-lg">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Propostas Aceitas</CardTitle>
                                <div className="p-2 rounded-lg bg-[#F07C19]/10 dark:bg-[#F07C19]/20">
                                    <CheckCircle className="h-4 w-4 text-[#F07C19]" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-slate-900 dark:text-white">{totalAccepted}</div>
                        </CardContent>
                    </Card>

                    {/* Valor Total - #E5D599 Gold */}
                    <Card className="border-l-4 border-l-[#E5D599] bg-white dark:bg-slate-900 shadow-lg">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Valor Total</CardTitle>
                                <div className="p-2 rounded-lg bg-[#E5D599]/20 dark:bg-[#E5D599]/20">
                                    <DollarSign className="h-4 w-4 text-[#B8A850]" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-slate-900 dark:text-white">R$ {totalValue.toLocaleString('pt-BR')}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Clients List */}
                <div className="space-y-4">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Todos os Clientes</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Clientes que receberam propostas comerciais</p>
                    </div>

                    {clients.length === 0 ? (
                        <Card className="border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                            <CardContent className="flex flex-col items-center justify-center py-16">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-100 to-blue-100 dark:from-cyan-900/30 dark:to-blue-900/30 flex items-center justify-center mb-4">
                                    <Users className="h-8 w-8 text-cyan-500" />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Nenhum cliente ainda</h3>
                                <p className="text-slate-500 dark:text-slate-400 mb-4 text-center max-w-sm">
                                    Quando você criar propostas, os clientes aparecerão aqui automaticamente.
                                </p>
                                <Link href="/proposals/new">
                                    <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 shadow-lg shadow-cyan-500/25">
                                        Criar Nova Proposta
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {clients.map((client: ClientData) => (
                                <Link key={client.id} href={`/clients/${client.id}`}>
                                    <Card
                                        className="group cursor-pointer hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-slate-900/50 transition-all duration-300 hover:-translate-y-0.5 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-full"
                                    >
                                        <CardContent className="p-5">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#029DAF] to-[#027A8C] flex items-center justify-center text-white font-bold text-lg shadow-lg">
                                                        {client.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-[#029DAF] transition-colors">
                                                            {client.name}
                                                        </h3>
                                                        {client.company && (
                                                            <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                                                <Building2 className="h-3 w-3" />
                                                                {client.company}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                <ArrowUpRight className="h-4 w-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>

                                            <div className="space-y-2 text-sm">
                                                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                                    <Mail className="h-4 w-4 text-slate-400" />
                                                    <span className="truncate">{client.email}</span>
                                                </div>
                                                {client.phone && (
                                                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                                        <Phone className="h-4 w-4 text-slate-400" />
                                                        <span>{client.phone}</span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="text-center">
                                                        <p className="text-lg font-bold text-slate-900 dark:text-white">{client.proposalCount}</p>
                                                        <p className="text-xs text-slate-500">propostas</p>
                                                    </div>
                                                    <div className="h-8 w-px bg-slate-100 dark:bg-slate-800" />
                                                    <div className="text-center">
                                                        <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{client.acceptedCount}</p>
                                                        <p className="text-xs text-slate-500">aceitas</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                                        R$ {(client.totalValue || 0).toLocaleString('pt-BR')}
                                                    </p>
                                                    <p className="text-xs text-slate-500">valor total</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
