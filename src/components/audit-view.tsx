'use client'

import { useState } from "react";
import { AuditProposal } from "@/app/audit/actions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronRight, Search, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

// Utility for currency
const currency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

interface AuditViewProps {
    data: AuditProposal[];
    users: { id: string; name: string; email: string }[];
}

export function AuditView({ data, users }: AuditViewProps) {
    const [filterUser, setFilterUser] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

    const toggleRow = (id: string) => {
        const newSet = new Set(expandedRows);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setExpandedRows(newSet);
    };

    const statusMap: Record<string, string> = {
        'draft': 'Rascunho',
        'sent': 'Enviada',
        'viewed': 'Visualizada',
        'negotiating': 'Negociação',
        'accepted': 'Aceita',
        'rejected': 'Recusada'
    };

    const filtered = data.filter(p => {
        const matchUser = filterUser === 'all' || p.creatorId === filterUser;
        const matchStatus = filterStatus === 'all' || p.status === filterStatus;
        const matchSearch = p.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.proposalNumber?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchUser && matchStatus && matchSearch;
    });

    return (
        <div className="space-y-6">
            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle>Filtros de Auditoria</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <label className="text-sm font-medium mb-1 block">Buscar Cliente/Nº</label>
                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Nome do cliente ou número..."
                                className="pl-8"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="w-full md:w-[200px]">
                        <label className="text-sm font-medium mb-1 block">Vendedor</label>
                        <Select value={filterUser} onValueChange={setFilterUser}>
                            <SelectTrigger>
                                <SelectValue placeholder="Todos" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                {users.map(u => (
                                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="w-full md:w-[200px]">
                        <label className="text-sm font-medium mb-1 block">Status</label>
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                            <SelectTrigger>
                                <SelectValue placeholder="Todos" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                <SelectItem value="draft">Rascunho</SelectItem>
                                <SelectItem value="sent">Enviada</SelectItem>
                                <SelectItem value="viewed">Visualizada</SelectItem>
                                <SelectItem value="negotiating">Em Negociação</SelectItem>
                                <SelectItem value="accepted">Aceita</SelectItem>
                                <SelectItem value="rejected">Recusada</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]"></TableHead>
                            <TableHead>Proposta</TableHead>
                            <TableHead>Vendedor</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Criação</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead className="text-right">Desc. Aplicado</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                    Nenhuma proposta encontrada com os filtros selecionados.
                                </TableCell>
                            </TableRow>
                        )}
                        {filtered.map(proposal => {
                            const isExpanded = expandedRows.has(proposal.id);
                            const totalDiscount = proposal.items.reduce((acc: number, item: any) => acc + item.discountValue, 0);
                            const hasDiscount = totalDiscount > 0;

                            return (
                                <>
                                    <TableRow key={proposal.id} className="cursor-pointer hover:bg-muted/50" onClick={() => toggleRow(proposal.id)}>
                                        <TableCell>
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                            </Button>
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {proposal.proposalNumber ? `#${proposal.proposalNumber}` : 'S/N'}
                                        </TableCell>
                                        <TableCell>{proposal.creatorName}</TableCell>
                                        <TableCell>{proposal.clientName}</TableCell>
                                        <TableCell>{new Date(proposal.createdAt).toLocaleDateString('pt-BR')}</TableCell>
                                        <TableCell className="text-right font-medium">
                                            {currency(proposal.totalOneTime + proposal.totalRecurring)}
                                            {proposal.totalRecurring > 0 && <span className="text-xs text-muted-foreground block text-right">+Recorrente</span>}
                                        </TableCell>
                                        <TableCell className={`text-right ${hasDiscount ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}>
                                            {hasDiscount ? `-${currency(totalDiscount)}` : '-'}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={
                                                proposal.status === 'accepted' ? 'bg-green-100 text-green-700 border-green-200' :
                                                    proposal.status === 'rejected' ? 'bg-red-100 text-red-700 border-red-200' :
                                                        'bg-slate-100 text-slate-700'
                                            }>
                                                {statusMap[proposal.status] || proposal.status}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                    {isExpanded && (
                                        <TableRow className="bg-muted/30">
                                            <TableCell colSpan={8} className="p-4">
                                                <div className="rounded-md border bg-background p-4 animate-in fade-in zoom-in-95 duration-200">
                                                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                                                        <FileText className="h-4 w-4" /> Detalhamento de Itens
                                                    </h4>
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead>Item</TableHead>
                                                                <TableHead className="text-right">Qtd</TableHead>
                                                                <TableHead className="text-right">Preço Tabela</TableHead>
                                                                <TableHead className="text-right">Preço Praticado</TableHead>
                                                                <TableHead className="text-right">Desconto Unit.</TableHead>
                                                                <TableHead className="text-right">Total Item</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {proposal.items.map((item: any) => {
                                                                const discountUnit = item.originalPrice ? item.originalPrice - item.price : 0;
                                                                const hasItemDisc = discountUnit > 0.01;
                                                                return (
                                                                    <TableRow key={item.id}>
                                                                        <TableCell>{item.name} <span className="text-xs text-muted-foreground">({item.type === 'recurring' ? 'Recorrente' : 'Único'})</span></TableCell>
                                                                        <TableCell className="text-right">{item.quantity}</TableCell>
                                                                        <TableCell className="text-right text-muted-foreground">
                                                                            {item.originalPrice ? currency(item.originalPrice) : '-'}
                                                                        </TableCell>
                                                                        <TableCell className="text-right font-medium">
                                                                            {currency(item.price)}
                                                                        </TableCell>
                                                                        <TableCell className={`text-right ${hasItemDisc ? 'text-green-600' : ''}`}>
                                                                            {hasItemDisc ? `-${currency(discountUnit)}` : '-'}
                                                                        </TableCell>
                                                                        <TableCell className="text-right">
                                                                            {currency(item.price * item.quantity)}
                                                                        </TableCell>
                                                                    </TableRow>
                                                                )
                                                            })}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
