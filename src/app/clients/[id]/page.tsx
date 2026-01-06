import { fetchClientById } from "@/app/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
    ChevronLeft,
    Users,
    Building2,
    Mail,
    Phone,
    FileText,
    CheckCircle,
    XCircle,
    Clock,
    Calendar,
    DollarSign,
    ExternalLink,
    MessageCircle
} from "lucide-react";

type Props = {
    params: Promise<{ id: string }>
}

export default async function ClientDetailsPage({ params }: Props) {
    const { id } = await params;
    const client = await fetchClientById(id);

    if (!client) {
        notFound();
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'accepted':
                return <Badge className="bg-emerald-500 hover:bg-emerald-600"><CheckCircle className="w-3 h-3 mr-1" /> Aceita</Badge>;
            case 'rejected':
                return <Badge className="bg-red-500 hover:bg-red-600"><XCircle className="w-3 h-3 mr-1" /> Recusada</Badge>;
            case 'negotiating':
                return <Badge className="bg-orange-500 hover:bg-orange-600"><MessageCircle className="w-3 h-3 mr-1" /> Negociando</Badge>;
            case 'viewed':
                return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" /> Visualizada</Badge>;
            default:
                return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> Pendente</Badge>;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
            {/* Header */}
            <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <Link href="/clients">
                                <Button variant="ghost" size="sm" className="text-slate-600 dark:text-slate-400">
                                    <ChevronLeft className="mr-2 h-4 w-4" />
                                    Clientes
                                </Button>
                            </Link>
                            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />
                            <div className="flex items-center gap-3">
                                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#029DAF] to-[#027A8C] flex items-center justify-center text-white font-bold text-xl shadow-lg">
                                    {client.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">{client.name}</h1>
                                    {client.company && (
                                        <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                            <Building2 className="h-3 w-3" /> {client.company}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                        <ThemeToggle />
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
                {/* Contact Info */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="border-l-4 border-l-[#029DAF] bg-white dark:bg-slate-900 shadow-lg">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-[#029DAF]/10">
                                    <Mail className="h-5 w-5 text-[#029DAF]" />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Email</p>
                                    <a href={`mailto:${client.email}`} className="text-sm font-medium text-slate-900 dark:text-white hover:text-[#029DAF]">
                                        {client.email}
                                    </a>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {client.phone && (
                        <Card className="border-l-4 border-l-[#FFC219] bg-white dark:bg-slate-900 shadow-lg">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-[#FFC219]/10">
                                        <Phone className="h-5 w-5 text-[#FFC219]" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Telefone</p>
                                        <a href={`tel:${client.phone}`} className="text-sm font-medium text-slate-900 dark:text-white hover:text-[#FFC219]">
                                            {client.phone}
                                        </a>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <Card className="border-l-4 border-l-[#F07C19] bg-white dark:bg-slate-900 shadow-lg">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-[#F07C19]/10">
                                    <FileText className="h-5 w-5 text-[#F07C19]" />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Propostas</p>
                                    <p className="text-lg font-bold text-slate-900 dark:text-white">{client.proposalCount || 0}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-[#E5D599] bg-white dark:bg-slate-900 shadow-lg">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-[#E5D599]/20">
                                    <DollarSign className="h-5 w-5 text-[#B8A850]" />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Valor Total</p>
                                    <p className="text-lg font-bold text-slate-900 dark:text-white">
                                        R$ {(client.totalValue || 0).toLocaleString('pt-BR')}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Proposals List */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Propostas</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Histórico de propostas enviadas</p>
                        </div>
                        <Link href="/proposals/new">
                            <Button className="bg-[#029DAF] hover:bg-[#027A8C]">
                                <FileText className="mr-2 h-4 w-4" />
                                Nova Proposta
                            </Button>
                        </Link>
                    </div>

                    {client.proposals && client.proposals.length > 0 ? (
                        <div className="grid gap-4">
                            {client.proposals.map((proposal: { id: string; status: string; createdAt: string | Date; totalOneTime: number; totalRecurring: number }) => (
                                <Card key={proposal.id} className="bg-white dark:bg-slate-900 hover:shadow-lg transition-shadow">
                                    <CardContent className="p-5">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-lg bg-[#029DAF]/10 flex items-center justify-center">
                                                    <FileText className="h-5 w-5 text-[#029DAF]" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-medium text-slate-900 dark:text-white">
                                                            Proposta #{proposal.id.slice(0, 8)}
                                                        </p>
                                                        {getStatusBadge(proposal.status)}
                                                    </div>
                                                    <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                                        <Calendar className="h-3 w-3" />
                                                        {new Date(proposal.createdAt).toLocaleDateString('pt-BR')}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-6">
                                                <div className="text-right">
                                                    {proposal.totalOneTime > 0 && (
                                                        <p className="text-sm">
                                                            <span className="text-slate-500">Único:</span>{' '}
                                                            <span className="font-semibold text-slate-900 dark:text-white">
                                                                R$ {proposal.totalOneTime.toLocaleString('pt-BR')}
                                                            </span>
                                                        </p>
                                                    )}
                                                    {proposal.totalRecurring > 0 && (
                                                        <p className="text-sm">
                                                            <span className="text-slate-500">Mensal:</span>{' '}
                                                            <span className="font-semibold text-[#029DAF]">
                                                                R$ {proposal.totalRecurring.toLocaleString('pt-BR')}
                                                            </span>
                                                        </p>
                                                    )}
                                                </div>
                                                <Link href={`/p/${proposal.id}`}>
                                                    <Button variant="ghost" size="sm">
                                                        <ExternalLink className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <Card className="border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <FileText className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Nenhuma proposta</h3>
                                <p className="text-slate-500 dark:text-slate-400 mb-4">Este cliente ainda não recebeu propostas</p>
                                <Link href="/proposals/new">
                                    <Button className="bg-[#029DAF] hover:bg-[#027A8C]">
                                        Criar Proposta
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </main>
        </div>
    );
}
