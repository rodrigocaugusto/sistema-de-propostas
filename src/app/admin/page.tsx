
'use client';

import { useState, useEffect } from 'react';
import { getCompanies, toggleCompanyStatus, createCompany, cancelCompanySubscription, reactivateCompanySubscription, updateCompany, getCompanyInvoices, getAdminStats, adminGeneratePasswordForUser, adminResetUserPassword } from './actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Loader2, Plus, Building2, Users, FileText, Ban, CheckCircle, Search, LogOut, CreditCard, XCircle, RefreshCw, Edit, DollarSign, TrendingUp, Receipt, Download, ExternalLink, Eye, Key, AlertTriangle } from 'lucide-react';
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
    phone: string | null;
    plan: string;
    status: string;
    userCount: number;
    proposalCount: number;
    createdAt: string;
    stripeSubscriptionId?: string | null;
    stripeCustomerId?: string | null;
}

interface AdminStats {
    totalRevenue: number;
    monthlyRevenue: number;
    activeSubscriptions: number;
    totalCompanies: number;
    totalProposals: number;
    acceptedProposals: number;
    proposalValueOneTime: number;
    proposalValueRecurring: number;
}

interface Invoice {
    id: string;
    number: string | null;
    status: string | null;
    amount: number;
    currency: string;
    created: string;
    invoicePdf: string | null;
}

export default function AdminDashboard() {
    const router = useRouter();
    const [companies, setCompanies] = useState<Company[]>([]);
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isInvoicesOpen, setIsInvoicesOpen] = useState(false);

    // Reset Password State
    const [isResetOpen, setIsResetOpen] = useState(false);
    const [resetGeneratedPassword, setResetGeneratedPassword] = useState('');
    const [isGeneratingPassword, setIsGeneratingPassword] = useState(false);
    const [isConfirmingReset, setIsConfirmingReset] = useState(false);

    const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loadingInvoices, setLoadingInvoices] = useState(false);

    // New Company Form State
    const [newCompany, setNewCompany] = useState({
        name: '',
        email: '',
        responsible: '',
        plan: 'pro'
    });
    const [isCreating, setIsCreating] = useState(false);

    // Edit Company Form State
    const [editForm, setEditForm] = useState({
        name: '',
        email: '',
        responsible: '',
        phone: '',
        plan: ''
    });
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const session = await getCurrentUser();
            const [companiesData, statsData] = await Promise.all([
                getCompanies(),
                getAdminStats()
            ]);
            setCompanies(companiesData as unknown as Company[]);
            setStats(statsData);
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

    const openEditDialog = (company: Company) => {
        setSelectedCompany(company);
        setEditForm({
            name: company.name,
            email: company.email || '',
            responsible: company.responsible || '',
            phone: company.phone || '',
            plan: company.plan
        });
        setIsEditOpen(true);
    };

    const handleUpdateCompany = async () => {
        if (!selectedCompany) return;

        setIsUpdating(true);
        try {
            const result = await updateCompany(selectedCompany.id, editForm);
            if (result.success) {
                toast.success("Empresa atualizada com sucesso!");
                setIsEditOpen(false);
                loadData();
            } else {
                toast.error(result.error);
            }
        } catch {
            toast.error("Erro ao atualizar empresa");
        } finally {
            setIsUpdating(false);
        }
    };

    const openInvoicesDialog = async (company: Company) => {
        setSelectedCompany(company);
        setIsInvoicesOpen(true);
        setLoadingInvoices(true);
        try {
            const invoiceList = await getCompanyInvoices(company.id);
            setInvoices(invoiceList as Invoice[]);
        } catch {
            toast.error("Erro ao carregar faturas");
        } finally {
            setLoadingInvoices(false);
        }
    };

    // Password Reset Functions
    const openResetDialog = async (company: Company) => {
        setSelectedCompany(company);
        setIsResetOpen(true);
        setResetGeneratedPassword('');
        setIsGeneratingPassword(true);

        try {
            const res = await adminGeneratePasswordForUser();
            setResetGeneratedPassword(res.password);
        } catch (e) {
            toast.error("Erro ao gerar senha");
        } finally {
            setIsGeneratingPassword(false);
        }
    };

    const handleConfirmReset = async () => {
        if (!selectedCompany || !resetGeneratedPassword) return;

        setIsConfirmingReset(true);
        try {
            const res = await adminResetUserPassword(selectedCompany.id, resetGeneratedPassword);
            if (res.success) {
                toast.success(res.message);
                setIsResetOpen(false);
            } else {
                toast.error(res.error);
            }
        } catch {
            toast.error("Erro ao resetar senha");
        } finally {
            setIsConfirmingReset(false);
        }
    };


    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('pt-BR');
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
                {/* Revenue Stats */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Card className="border-0 shadow-lg shadow-green-500/10 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-green-700 dark:text-green-400 flex items-center gap-2">
                                    <DollarSign className="h-4 w-4" /> Receita Total
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-green-800 dark:text-green-300">
                                    {formatCurrency(stats.totalRevenue)}
                                </div>
                                <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                                    Todos os pagamentos recebidos
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-lg shadow-blue-500/10 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-400 flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4" /> Receita Mensal
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-blue-800 dark:text-blue-300">
                                    {formatCurrency(stats.monthlyRevenue)}
                                </div>
                                <p className="text-xs text-blue-600 dark:text-blue-500 mt-1">
                                    Este mês
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-lg shadow-purple-500/10 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-400 flex items-center gap-2">
                                    <CreditCard className="h-4 w-4" /> Assinaturas Ativas
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-purple-800 dark:text-purple-300">
                                    {stats.activeSubscriptions}
                                </div>
                                <p className="text-xs text-purple-600 dark:text-purple-500 mt-1">
                                    de {stats.totalCompanies} empresas
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-lg shadow-amber-500/10 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-400 flex items-center gap-2">
                                    <FileText className="h-4 w-4" /> Propostas
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-amber-800 dark:text-amber-300">
                                    {stats.acceptedProposals}/{stats.totalProposals}
                                </div>
                                <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">
                                    Aceitas/Total • {formatCurrency(stats.proposalValueOneTime + (stats.proposalValueRecurring * 12))}
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Original Stats */}
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

                {/* Edit Company Dialog */}
                <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Editar Empresa</DialogTitle>
                            <DialogDescription>
                                Atualize os dados da empresa e do plano.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="edit-name">Nome</Label>
                                    <Input id="edit-name" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-responsible">Responsável</Label>
                                    <Input id="edit-responsible" value={editForm.responsible} onChange={e => setEditForm({ ...editForm, responsible: e.target.value })} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="edit-email">Email</Label>
                                    <Input id="edit-email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-phone">Telefone</Label>
                                    <Input id="edit-phone" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-plan">Plano</Label>
                                <select
                                    id="edit-plan"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    value={editForm.plan}
                                    onChange={e => setEditForm({ ...editForm, plan: e.target.value })}
                                >
                                    {Object.values(PLANS).map((plan) => (
                                        <option key={plan.id} value={plan.id}>
                                            {plan.name} - {plan.limits.proposals} propostas/mês
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancelar</Button>
                            <Button onClick={handleUpdateCompany} disabled={isUpdating}>
                                {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Salvar Alterações
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Password Reset Dialog */}
                <Dialog open={isResetOpen} onOpenChange={setIsResetOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Key className="h-5 w-5 text-amber-500" /> Resetar Senha Admin
                            </DialogTitle>
                            <DialogDescription>
                                Uma nova senha forte será gerada para o admin desta empresa.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="py-4 space-y-4">
                            <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg text-center border-2 border-dashed border-slate-300 dark:border-slate-700">
                                {isGeneratingPassword ? (
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-slate-500" />
                                ) : (
                                    <>
                                        <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Nova Senha Gerada</p>
                                        <p className="text-3xl font-mono font-bold tracking-wider text-slate-900 dark:text-white select-all">
                                            {resetGeneratedPassword}
                                        </p>
                                    </>
                                )}
                            </div>

                            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-lg p-3 flex items-start gap-3">
                                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm text-amber-800 dark:text-amber-400 font-medium">Confirmação Necessária</p>
                                    <p className="text-xs text-amber-700 dark:text-amber-500 mt-1">
                                        Ao confirmar, a senha atual será substituída e a nova senha será enviada por e-mail para o administrador.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsResetOpen(false)}>Cancelar</Button>
                            <Button onClick={handleConfirmReset} disabled={isConfirmingReset || isGeneratingPassword} className="bg-amber-600 hover:bg-amber-700 text-white">
                                {isConfirmingReset && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Confirmar e Enviar
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Invoices Dialog */}
                <Dialog open={isInvoicesOpen} onOpenChange={setIsInvoicesOpen}>
                    <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Receipt className="h-5 w-5" /> Faturas - {selectedCompany?.name}
                            </DialogTitle>
                            <DialogDescription>
                                Histórico de pagamentos da empresa no Stripe.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="max-h-[400px] overflow-y-auto">
                            {loadingInvoices ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                </div>
                            ) : invoices.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <Receipt className="h-10 w-10 mx-auto mb-3 opacity-30" />
                                    <p>Nenhuma fatura encontrada</p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Fatura</TableHead>
                                            <TableHead>Data</TableHead>
                                            <TableHead>Valor</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {invoices.map((inv) => (
                                            <TableRow key={inv.id}>
                                                <TableCell className="font-mono text-xs">{inv.number || inv.id.slice(-8)}</TableCell>
                                                <TableCell>{formatDate(inv.created)}</TableCell>
                                                <TableCell className="font-medium">{formatCurrency(inv.amount)}</TableCell>
                                                <TableCell>
                                                    <Badge className={inv.status === 'paid' ? 'bg-green-100 text-green-700 border-0' : 'bg-yellow-100 text-yellow-700 border-0'}>
                                                        {inv.status === 'paid' ? 'Pago' : inv.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {inv.invoicePdf && (
                                                        <Button variant="ghost" size="sm" onClick={() => window.open(inv.invoicePdf!, '_blank')}>
                                                            <Download className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>

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
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => openEditDialog(company)}
                                                    className="text-slate-500 hover:text-slate-700"
                                                    title="Editar"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => openResetDialog(company)}
                                                    className="text-amber-500 hover:text-amber-600 hover:bg-amber-50"
                                                    title="Resetar Senha"
                                                >
                                                    <Key className="h-4 w-4" />
                                                </Button>
                                                {company.stripeCustomerId && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => openInvoicesDialog(company)}
                                                        className="text-violet-500 hover:text-violet-600 hover:bg-violet-50"
                                                        title="Ver Faturas"
                                                    >
                                                        <Receipt className="h-4 w-4" />
                                                    </Button>
                                                )}
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
