
'use client';

import { useState, useEffect } from 'react';
import { getCompanies, toggleCompanyStatus, createCompany, cancelCompanySubscription, reactivateCompanySubscription } from './actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Loader2, Plus, Building2, Users, FileText, Ban, CheckCircle, Search, LogOut, CreditCard, XCircle, RefreshCw } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { getCurrentUser } from '@/app/auth/actions';
import { useRouter } from 'next/navigation';
import { logoutAction } from '@/app/actions';
import { PLANS } from '@/lib/plans';

interface Company {
    id: string;
    name: string;
    slug: string | null;
    email: string | null;
    responsible: string | null;
    plan: string;
    status: string;
    userCount: number;
    proposalCount: number;
    createdAt: string;
    stripeSubscriptionId?: string | null;
    stripeCustomerId?: string | null;
}

export default function AdminDashboard() {
    const router = useRouter();
    const [companies, setCompanies] = useState<Company[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    // New Company Form State
    const [newCompany, setNewCompany] = useState({
        name: '',
        email: '',
        responsible: '',
        plan: 'pro'
    });
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            // Verifica permissão (client-side check for UX, server action does real check)
            const session = await getCurrentUser();
            // Note: getSession on client might not have isSuperAdmin typed perfectly without casting if it wasn't updated in library type
            // But let's assume it works or the server action will bounce us.

            const data = await getCompanies();
            setCompanies(data as unknown as Company[]);
        } catch (error) {
            toast.error("Acesso negado");
            router.push('/dashboard');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateCompany = async () => {
        if (!newCompany.name || !newCompany.email || !newCompany.responsible) {
            toast.error("Preencha todos os campos obrigatórios");
            return;
        }

        setIsCreating(true);
        try {
            const result = await createCompany({
                name: newCompany.name,
                email: newCompany.email,
                responsible: newCompany.responsible,
                plan: newCompany.plan
            });

            if (result.success) {
                toast.success("Empresa criada com sucesso!");
                setNewCompany({ name: '', email: '', responsible: '', plan: 'pro' });
                setIsCreateOpen(false);
                loadData();
            } else {
                toast.error(result.error);
            }
        } catch {
            toast.error("Erro ao criar empresa");
        } finally {
            setIsCreating(false);
        }
    };

    const handleToggleStatus = async (id: string, currentStatus: string) => {
        try {
            await toggleCompanyStatus(id, currentStatus);
            toast.success(`Empresa ${currentStatus === 'active' ? 'suspensa' : 'ativada'}`);
            loadData();
        } catch {
            toast.error("Erro ao alterar status");
        }
    };

    const handleCancelSubscription = async (id: string, companyName: string) => {
        if (!confirm(`Deseja cancelar a assinatura de "${companyName}"? A empresa terá acesso até o final do período pago.`)) {
            return;
        }
        try {
            const result = await cancelCompanySubscription(id);
            if (result.success) {
                toast.success(result.message);
                loadData();
            } else {
                toast.error(result.error);
            }
        } catch {
            toast.error("Erro ao cancelar assinatura");
        }
    };

    const handleReactivateSubscription = async (id: string) => {
        try {
            const result = await reactivateCompanySubscription(id);
            if (result.success) {
                toast.success(result.message);
                loadData();
            } else {
                toast.error(result.error);
            }
        } catch {
            toast.error("Erro ao reativar assinatura");
        }
    };

    const filteredCompanies = companies.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
            {/* Header */}
            <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 ring-2 ring-indigo-500/20">
                                <Building2 className="h-6 w-6" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 dark:from-white dark:via-purple-200 dark:to-indigo-300 bg-clip-text text-transparent">
                                    Painel Super Admin
                                </h1>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                    Gerenciamento de Multi-Tenancy
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3 items-center">
                            <ThemeToggle />
                            <form action={logoutAction}>
                                <Button variant="ghost" size="icon" className="text-slate-600 dark:text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20">
                                    <LogOut className="h-4 w-4" />
                                </Button>
                            </form>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="border-0 shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-blue-500" /> Total de Empresas
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-slate-900 dark:text-white">{companies.length}</div>
                        </CardContent>
                    </Card>
                    <Card className="border-0 shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                <Users className="h-4 w-4 text-purple-500" /> Total de Usuários
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-slate-900 dark:text-white">
                                {companies.reduce((acc, c) => acc + c.userCount, 0)}
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-0 shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
                        <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                <FileText className="h-4 w-4 text-green-500" /> Propostas Geradas
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-slate-900 dark:text-white">
                                {companies.reduce((acc, c) => acc + c.proposalCount, 0)}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Actions & Filters */}
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full md:w-96 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-violet-500 transition-colors" />
                        <Input
                            placeholder="Buscar empresa..."
                            className="pl-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:ring-violet-500 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/25 border-0 transition-all hover:scale-105">
                                <Plus className="h-4 w-4 mr-2" /> Nova Empresa
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Cadastrar Nova Empresa</DialogTitle>
                                <DialogDescription>
                                    Crie um novo ambiente tenant no sistema.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nome da Empresa</Label>
                                    <Input id="name" value={newCompany.name} onChange={e => setNewCompany({ ...newCompany, name: e.target.value })} placeholder="Ex: Acme Corp" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Administrativo</Label>
                                    <Input id="email" value={newCompany.email} onChange={e => setNewCompany({ ...newCompany, email: e.target.value })} placeholder="admin@acme.com" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="resp">Responsável</Label>
                                    <Input id="resp" value={newCompany.responsible} onChange={e => setNewCompany({ ...newCompany, responsible: e.target.value })} placeholder="Nome do Dono" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="plan">Plano Inicial</Label>
                                    <select
                                        id="plan"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={newCompany.plan}
                                        onChange={e => setNewCompany({ ...newCompany, plan: e.target.value })}
                                    >
                                        {Object.values(PLANS).map((plan) => (
                                            <option key={plan.id} value={plan.id}>
                                                {plan.name} - {plan.limits.proposals} props/mês
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
                                <Button onClick={handleCreateCompany} disabled={isCreating}>
                                    {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Criar Empresa
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Companies Table */}
                <Card className="border-0 shadow-xl shadow-slate-200/40 dark:shadow-slate-900/40 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl overflow-hidden">
                    <Table>
                        <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50">
                            <TableRow>
                                <TableHead>Empresa</TableHead>
                                <TableHead>Responsável</TableHead>
                                <TableHead>Plano</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Assinatura</TableHead>
                                <TableHead className="text-right">Métricas</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredCompanies.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                                        Nenhuma empresa encontrada
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredCompanies.map((company) => (
                                    <TableRow key={company.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                        <TableCell>
                                            <div className="font-medium text-slate-900 dark:text-white">{company.name}</div>
                                            <div className="text-xs text-slate-500">{company.email}</div>
                                        </TableCell>
                                        <TableCell>{company.responsible || '-'}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="capitalize bg-slate-100 dark:bg-slate-800">
                                                {company.plan}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={company.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-0'}>
                                                {company.status === 'active' ? 'Ativo' : 'Suspenso'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {company.stripeSubscriptionId ? (
                                                <div className="flex items-center gap-2">
                                                    <Badge className="bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 border-0">
                                                        <CreditCard className="h-3 w-3 mr-1" /> Stripe
                                                    </Badge>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-slate-400">Sem assinatura</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="text-xs text-slate-500">
                                                <span className="font-medium text-slate-900 dark:text-slate-300">{company.userCount}</span> usuários
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                <span className="font-medium text-slate-900 dark:text-slate-300">{company.proposalCount}</span> propostas
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                {company.stripeSubscriptionId && (
                                                    <>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleCancelSubscription(company.id, company.name)}
                                                            className="text-orange-500 hover:text-orange-600 hover:bg-orange-50"
                                                            title="Cancelar Assinatura"
                                                        >
                                                            <XCircle className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleReactivateSubscription(company.id)}
                                                            className="text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                                                            title="Reativar Assinatura"
                                                        >
                                                            <RefreshCw className="h-4 w-4" />
                                                        </Button>
                                                    </>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleToggleStatus(company.id, company.status)}
                                                    className={company.status === 'active' ? 'text-red-500 hover:text-red-600 hover:bg-red-50' : 'text-green-500 hover:text-green-600 hover:bg-green-50'}
                                                    title={company.status === 'active' ? 'Suspender Empresa' : 'Ativar Empresa'}
                                                >
                                                    {company.status === 'active' ? <Ban className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </Card>
            </main>
        </div>
    );
}
