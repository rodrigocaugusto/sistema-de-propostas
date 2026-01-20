'use client';

import { useState } from "react";
import Link from "next/link";
import { Proposal } from "@/lib/db";
import { deleteProposalAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { FileText, Pencil, ArrowUpRight, Trash2, LayoutGrid, List, Search, Filter, MoreHorizontal, Copy, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ProposalListViewProps {
    initialProposals: Proposal[];
}

export function ProposalListView({ initialProposals }: ProposalListViewProps) {
    const router = useRouter();
    const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isDeleting, setIsDeleting] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const ITEMS_PER_PAGE = 10;

    // Filter Logic
    const filteredProposals = initialProposals.filter(p => {
        const matchesSearch =
            p.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.clientEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            String(p.proposalNumber || '').includes(searchTerm);

        const matchesStatus = statusFilter === 'all' || p.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    // Pagination (only for list view)
    const totalPages = Math.ceil(filteredProposals.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const currentProposals = viewMode === 'list'
        ? filteredProposals.slice(startIndex, startIndex + ITEMS_PER_PAGE)
        : filteredProposals;

    const toggleSelect = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id)
                ? prev.filter(pId => pId !== id)
                : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === filteredProposals.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredProposals.map(p => p.id));
        }
    };

    const handleDelete = async () => {
        if (!confirm(`Tem certeza que deseja excluir ${selectedIds.length} propostas?`)) return;

        setIsDeleting(true);
        try {
            await deleteProposalAction(selectedIds);
            toast.success("Propostas excluídas com sucesso!");
            setSelectedIds([]);
            router.refresh();
        } catch (error) {
            toast.error("Erro ao excluir propostas.");
            console.error(error);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleDeleteSingle = async (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!confirm("Tem certeza que deseja excluir esta proposta?")) return;

        try {
            await deleteProposalAction([id]);
            toast.success("Proposta excluída com sucesso!");
            router.refresh();
        } catch (error) {
            toast.error("Erro ao excluir proposta.");
        }
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const getKanbanColumns = () => {
        const columns = {
            draft: { title: 'Rascunhos', status: ['draft'], color: 'bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800' },
            negotiating: { title: 'Em Negociação', status: ['negotiating', 'sent', 'viewed'], color: 'bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30' },
            accepted: { title: 'Aceitas', status: ['accepted'], color: 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/30' },
            rejected: { title: 'Perdidas', status: ['rejected'], color: 'bg-rose-50 dark:bg-rose-900/10 border-rose-100 dark:border-rose-900/30' },
        };
        return columns;
    };

    if (initialProposals.length === 0) {
        return (
            <Card className="border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <CardContent className="flex flex-col items-center justify-center py-16">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-900/30 dark:to-indigo-900/30 flex items-center justify-center mb-4">
                        <FileText className="h-8 w-8 text-violet-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Nenhuma proposta ainda</h3>
                    <p className="text-slate-500 dark:text-slate-400 mb-4 text-center max-w-sm">
                        Crie sua primeira proposta comercial e comece a fechar negócios!
                    </p>
                    <Link href="/proposals/new">
                        <Button className="bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 shadow-lg shadow-violet-500/25">
                            Criar Primeira Proposta
                        </Button>
                    </Link>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Toolbar */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex flex-1 items-center gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                        <Input
                            placeholder="Buscar por cliente..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[180px]">
                            <Filter className="w-4 h-4 mr-2" />
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos os Status</SelectItem>
                            <SelectItem value="draft">Rascunho</SelectItem>
                            <SelectItem value="sent">Enviado</SelectItem>
                            <SelectItem value="viewed">Visualizado</SelectItem>
                            <SelectItem value="negotiating">Em Negociação</SelectItem>
                            <SelectItem value="accepted">Aceito</SelectItem>
                            <SelectItem value="rejected">Recusado</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
                    <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                        <Button
                            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('list')}
                            className={viewMode === 'list' ? 'shadow-sm' : ''}
                        >
                            <List className="h-4 w-4" />
                        </Button>
                        <Button
                            variant={viewMode === 'kanban' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('kanban')}
                            className={viewMode === 'kanban' ? 'shadow-sm' : ''}
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </Button>
                    </div>

                    {selectedIds.length > 0 && (
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="gap-2"
                        >
                            <Trash2 className="h-4 w-4" />
                            <span className="hidden sm:inline">Excluir ({selectedIds.length})</span>
                        </Button>
                    )}
                </div>
            </div>

            {/* List View */}
            {viewMode === 'list' && (
                <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2 px-2">
                        <Checkbox
                            id="select-all"
                            checked={filteredProposals.length > 0 && selectedIds.length === filteredProposals.length}
                            onCheckedChange={toggleSelectAll}
                        />
                        <label htmlFor="select-all" className="text-sm text-slate-500 cursor-pointer select-none">
                            Selecionar tudo
                        </label>
                    </div>

                    <div className="grid gap-4">
                        {currentProposals.map((proposal) => (
                            <Card
                                key={proposal.id}
                                className={`group hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 ${selectedIds.includes(proposal.id) ? 'ring-2 ring-violet-500 border-transparent' : ''
                                    }`}
                            >
                                <CardContent className="flex items-center p-5 gap-4">
                                    <div className="flex items-center justify-center">
                                        <Checkbox
                                            checked={selectedIds.includes(proposal.id)}
                                            onCheckedChange={() => toggleSelect(proposal.id)}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </div>

                                    <Link href={`/p/${proposal.id}`} target="_blank" className="flex items-center gap-4 flex-1">
                                        <div className={`p-3 rounded-xl transition-colors ${proposal.status === 'accepted'
                                            ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                                            : proposal.status === 'rejected'
                                                ? 'bg-gradient-to-br from-rose-500 to-pink-600'
                                                : proposal.status === 'negotiating'
                                                    ? 'bg-gradient-to-br from-orange-500 to-amber-600'
                                                    : 'bg-gradient-to-br from-violet-500 to-indigo-600'
                                            }`}>
                                            <FileText className="h-5 w-5 text-white" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-semibold text-slate-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                                                    {proposal.clientName}
                                                </p>
                                                {proposal.proposalNumber && (
                                                    <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                                                        #{proposal.proposalNumber}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">{proposal.clientEmail}</p>
                                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                                                Criada em {new Date(proposal.createdAt).toLocaleDateString('pt-BR')}
                                            </p>
                                        </div>
                                    </Link>

                                    <div className="flex items-center gap-4">
                                        <div className="text-right hidden sm:block">
                                            {proposal.totalOneTime > 0 && (
                                                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                                    R$ {proposal.totalOneTime.toLocaleString('pt-BR')}
                                                </p>
                                            )}
                                            {proposal.totalRecurring > 0 && (
                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                    + R$ {proposal.totalRecurring.toLocaleString('pt-BR')}/mês
                                                </p>
                                            )}
                                        </div>

                                        <StatusBadge status={proposal.status} />

                                        <div className="flex items-center">
                                            <ActionMenu proposalId={proposal.id} shortCode={(proposal as any).shortCode} onDelete={(e) => handleDeleteSingle(proposal.id, e)} />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between pt-4">
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Página {currentPage} de {totalPages}
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                >
                                    Anterior
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                >
                                    Próxima
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Kanban View */}
            {viewMode === 'kanban' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto pb-4">
                    {Object.entries(getKanbanColumns()).map(([key, col]) => {
                        const columnProposals = currentProposals.filter(p => col.status.includes(p.status));

                        return (
                            <div key={key} className={`flex flex-col rounded-xl border ${col.color} p-4 min-w-[280px]`}>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                        {col.title}
                                        <Badge variant="secondary" className="bg-white/50 dark:bg-black/20">
                                            {columnProposals.length}
                                        </Badge>
                                    </h3>
                                </div>

                                <div className="flex-1 space-y-3">
                                    {columnProposals.map(proposal => (
                                        <Card key={proposal.id} className={`bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all ${selectedIds.includes(proposal.id) ? 'ring-2 ring-violet-500' : ''}`}>
                                            <CardContent className="p-3">
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="text-xs font-mono text-slate-400">#{proposal.proposalNumber}</span>
                                                    <ActionMenu proposalId={proposal.id} shortCode={(proposal as any).shortCode} onDelete={(e) => handleDeleteSingle(proposal.id, e)} />
                                                </div>
                                                <Link href={`/p/${proposal.id}`} target="_blank" className="block hover:opacity-80">
                                                    <h4 className="font-semibold text-sm mb-1 line-clamp-1" title={proposal.clientName}>{proposal.clientName}</h4>
                                                    <p className="text-xs text-slate-500 mb-2 truncate">{proposal.clientEmail}</p>
                                                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                                                        <div className="text-xs font-medium">
                                                            {proposal.totalOneTime > 0 && <div>R$ {proposal.totalOneTime.toLocaleString('pt-BR')}</div>}
                                                            {proposal.totalRecurring > 0 && <div className="text-slate-500">+ R$ {proposal.totalRecurring.toLocaleString('pt-BR')}/mês</div>}
                                                        </div>
                                                        <StatusBadge status={proposal.status} compact />
                                                    </div>
                                                </Link>
                                                <div className="mt-2 flex justify-between items-center">
                                                    <Checkbox
                                                        checked={selectedIds.includes(proposal.id)}
                                                        onCheckedChange={() => toggleSelect(proposal.id)}
                                                    />
                                                    <span className="text-[10px] text-slate-400 text-right">
                                                        {new Date(proposal.createdAt).toLocaleDateString('pt-BR')}
                                                    </span>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                    {columnProposals.length === 0 && (
                                        <div className="text-center py-8 text-slate-400 text-xs border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
                                            Vazio
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function ActionMenu({ proposalId, shortCode, onDelete }: { proposalId: string, shortCode?: string | null, onDelete: (e: any) => void }) {
    const handleCopyUrl = async (e: React.MouseEvent) => {
        e.preventDefault();
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.digitalleads.com.br';
        const url = shortCode
            ? `${baseUrl}/s/${shortCode}`
            : `${baseUrl}/p/${proposalId}`;

        try {
            await navigator.clipboard.writeText(url);
            toast.success('Link copiado!', {
                description: shortCode ? 'URL curta copiada para a área de transferência' : 'Link da proposta copiado'
            });
        } catch {
            toast.error('Erro ao copiar link');
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <Link href={`/p/${proposalId}`} target="_blank">
                    <DropdownMenuItem>
                        <ArrowUpRight className="mr-2 h-4 w-4" /> Ver Proposta
                    </DropdownMenuItem>
                </Link>
                <DropdownMenuItem onClick={handleCopyUrl}>
                    <LinkIcon className="mr-2 h-4 w-4" /> Copiar Link
                    {shortCode && <span className="ml-1 text-xs text-emerald-600">(curto)</span>}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <Link href={`/proposals/${proposalId}/edit`}>
                    <DropdownMenuItem>
                        <Pencil className="mr-2 h-4 w-4" /> Editar
                    </DropdownMenuItem>
                </Link>
                <DropdownMenuItem onClick={onDelete} className="text-red-600 focus:text-red-600">
                    <Trash2 className="mr-2 h-4 w-4" /> Excluir
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function StatusBadge({ status, compact = false }: { status: string, compact?: boolean }) {
    const styles = {
        draft: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400",
        sent: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
        viewed: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
        accepted: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
        rejected: "bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400",
        negotiating: "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400",
    };

    const icons = {
        draft: "📝",
        sent: "📤",
        viewed: "👀",
        accepted: "✅",
        rejected: "❌",
        negotiating: "🤝",
    };

    const labels = {
        draft: "Rascunho",
        sent: "Enviado",
        viewed: "Visualizado",
        accepted: "Aceito",
        rejected: "Recusado",
        negotiating: "Negociação",
    };

    const style = styles[status as keyof typeof styles] || styles.draft;
    const icon = icons[status as keyof typeof icons] || "📝";
    const label = labels[status as keyof typeof labels] || status;

    if (compact) {
        return (
            <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold ${style}`} title={label}>
                {icon}
            </span>
        );
    }

    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${style}`}>
            <span>{icon}</span>
            {label}
        </span>
    );
}

