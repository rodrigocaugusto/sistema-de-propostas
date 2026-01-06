'use client';

import { useState } from "react";
import Link from "next/link";
import { Proposal } from "@/lib/db";
import { deleteProposalAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, Pencil, ArrowUpRight, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface ProposalListViewProps {
    initialProposals: Proposal[];
}

export function ProposalListView({ initialProposals }: ProposalListViewProps) {
    const router = useRouter();
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isDeleting, setIsDeleting] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 5;

    // Filter out deleted proposals optimistically or just rely on router.refresh() 
    // But since we receive initialProposals from server, we rely on parent re-rendering or router.refresh causing new props.
    // However, for immediate feedback, we might want to track local state of proposals?
    // Actually, router.refresh() is the standard Next.js way.

    const totalPages = Math.ceil(initialProposals.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const currentProposals = initialProposals.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    const toggleSelect = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id)
                ? prev.filter(pId => pId !== id)
                : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === initialProposals.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(initialProposals.map(p => p.id));
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
        e.preventDefault(); // Prevent link click
        e.stopPropagation();
        if (!confirm("Tem certeza que deseja excluir esta proposta?")) return;

        // We don't have a single delete action exposed, so use the bulk one
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
        // Optional: Scroll to top of list
        // window.scrollTo({ top: 0, behavior: 'smooth' });
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
        <div className="space-y-4">
            {/* Toolbar if selection active */}
            <div className="flex items-center justify-between min-h-[40px]">
                <div className="flex items-center gap-2">
                    <Checkbox
                        id="select-all"
                        checked={initialProposals.length > 0 && selectedIds.length === initialProposals.length}
                        onCheckedChange={toggleSelectAll}
                    />
                    <label htmlFor="select-all" className="text-sm text-slate-500 cursor-pointer select-none">
                        Selecionar tudo
                    </label>
                </div>

                {selectedIds.length > 0 && (
                    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-5 duration-300">
                        <span className="text-sm text-slate-500">{selectedIds.length} selecionados</span>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="gap-2"
                        >
                            <Trash2 className="h-4 w-4" />
                            Excluir Selecionados
                        </Button>
                    </div>
                )}
            </div>

            <div className="grid gap-4">
                {currentProposals.map((proposal) => (
                    <Card
                        key={proposal.id}
                        className={`group hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-slate-900/50 transition-all duration-300 hover:-translate-y-0.5 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 ${selectedIds.includes(proposal.id) ? 'ring-2 ring-violet-500 border-transparent' : ''
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
                                    <p className="font-semibold text-slate-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                                        {proposal.clientName}
                                    </p>
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
                                    <Link href={`/proposals/${proposal.id}/edit`}>
                                        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Pencil className="h-4 w-4 text-slate-500 hover:text-slate-700" />
                                        </Button>
                                    </Link>

                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 hover:bg-red-50"
                                        onClick={(e) => handleDeleteSingle(proposal.id, e)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>

                                    <Link href={`/p/${proposal.id}`} target="_blank">
                                        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                            <ArrowUpRight className="h-4 w-4 text-slate-400" />
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Mostrando {startIndex + 1} a {Math.min(startIndex + ITEMS_PER_PAGE, initialProposals.length)} de {initialProposals.length} propostas
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
                        <div className="flex gap-1">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <Button
                                    key={page}
                                    variant={currentPage === page ? "default" : "ghost"}
                                    size="sm"
                                    onClick={() => handlePageChange(page)}
                                    className="w-8 h-8 p-0"
                                >
                                    {page}
                                </Button>
                            ))}
                        </div>
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
    );
}

function StatusBadge({ status }: { status: string }) {
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
        negotiating: "Negociando",
    };

    const style = styles[status as keyof typeof styles] || styles.draft;
    const icon = icons[status as keyof typeof icons] || "📝";
    const label = labels[status as keyof typeof labels] || status;

    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${style}`}>
            <span>{icon}</span>
            {label}
        </span>
    );
}
