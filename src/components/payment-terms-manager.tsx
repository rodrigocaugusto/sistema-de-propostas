'use client';

import { useState } from 'react';
import { savePaymentTermsTemplate, editPaymentTermsTemplate, removePaymentTermsTemplate } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Plus, Trash2, Pencil, X, Check, Receipt, Loader2, Sparkles, Copy } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface PaymentTermsTemplate {
    id: string;
    title: string;
    content: string;
    isActive: boolean;
}

interface PaymentTermsManagerProps {
    initialData: PaymentTermsTemplate[];
}

export function PaymentTermsManager({ initialData }: PaymentTermsManagerProps) {
    const [templates, setTemplates] = useState<PaymentTermsTemplate[]>(initialData);
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // New template form
    const [newTitle, setNewTitle] = useState('');
    const [newContent, setNewContent] = useState('');
    const [showNewForm, setShowNewForm] = useState(false);

    // Edit form
    const [editTitle, setEditTitle] = useState('');
    const [editContent, setEditContent] = useState('');

    const handleAdd = async () => {
        if (!newTitle.trim() || !newContent.trim()) {
            toast.error('Preencha título e conteúdo');
            return;
        }

        setLoading(true);
        try {
            const result = await savePaymentTermsTemplate({
                title: newTitle.trim(),
                content: newContent.trim(),
                isActive: true
            });

            setTemplates([result, ...templates]);
            setNewTitle('');
            setNewContent('');
            setShowNewForm(false);
            toast.success('Template adicionado!');
        } catch {
            toast.error('Erro ao adicionar');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = async (id: string) => {
        if (!editTitle.trim() || !editContent.trim()) {
            toast.error('Preencha título e conteúdo');
            return;
        }

        setLoading(true);
        try {
            const template = templates.find(t => t.id === id);
            const result = await editPaymentTermsTemplate(id, {
                title: editTitle.trim(),
                content: editContent.trim(),
                isActive: template?.isActive ?? true
            });

            setTemplates(templates.map(t => t.id === id ? result : t));
            setEditingId(null);
            toast.success('Atualizado!');
        } catch {
            toast.error('Erro ao atualizar');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Deseja remover este template?')) return;

        setLoading(true);
        try {
            await removePaymentTermsTemplate(id);
            setTemplates(templates.filter(t => t.id !== id));
            toast.success('Removido!');
        } catch {
            toast.error('Erro ao remover');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleActive = async (id: string, isActive: boolean) => {
        const template = templates.find(t => t.id === id);
        if (!template) return;

        try {
            const result = await editPaymentTermsTemplate(id, {
                title: template.title,
                content: template.content,
                isActive
            });
            setTemplates(templates.map(t => t.id === id ? result : t));
            toast.success(isActive ? 'Ativado!' : 'Desativado!');
        } catch {
            toast.error('Erro ao atualizar status');
        }
    };

    const startEdit = (template: PaymentTermsTemplate) => {
        setEditingId(template.id);
        setEditTitle(template.title);
        setEditContent(template.content);
    };

    const copyContent = (content: string) => {
        navigator.clipboard.writeText(content);
        toast.success('Copiado para a área de transferência!');
    };

    const suggestionTemplates = [
        { title: 'À Vista', content: 'Pagamento à vista com 5% de desconto.' },
        { title: 'Parcelamento 3x', content: 'Parcelamento em 3x iguais no cartão de crédito, sem juros.' },
        { title: '50% Entrada', content: '50% de entrada na aprovação da proposta e 50% na entrega do projeto.' },
        { title: 'Mensal', content: 'Pagamento mensal via boleto, vencimento todo dia 10.' }
    ];

    return (
        <div className="space-y-6">
            {/* Add Button */}
            {!showNewForm && (
                <Button
                    onClick={() => setShowNewForm(true)}
                    className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-lg shadow-amber-500/25 text-white border-0"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Template
                </Button>
            )}

            {/* Quick Add Suggestions - Always visible, showing only options not yet added */}
            {!showNewForm && (() => {
                const availableSuggestions = suggestionTemplates.filter(
                    suggestion => !templates.some(t => t.title.toLowerCase() === suggestion.title.toLowerCase())
                );
                return availableSuggestions.length > 0 ? (
                    <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl border border-amber-200/50 dark:border-amber-700/30">
                        <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-medium mb-3">
                            <Sparkles className="h-4 w-4" />
                            Sugestões de templates:
                        </div>
                        <div className="grid gap-2 md:grid-cols-2">
                            {availableSuggestions.map((template) => (
                                <Button
                                    key={template.title}
                                    variant="outline"
                                    size="sm"
                                    className="border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/30 hover:border-amber-500 text-amber-700 dark:text-amber-400 flex-col h-auto py-3 px-4 items-start"
                                    onClick={async () => {
                                        setLoading(true);
                                        try {
                                            const result = await savePaymentTermsTemplate({
                                                title: template.title,
                                                content: template.content,
                                                isActive: true
                                            });
                                            setTemplates([result, ...templates]);
                                            toast.success(`"${template.title}" adicionado!`);
                                        } catch {
                                            toast.error('Erro ao adicionar');
                                        } finally {
                                            setLoading(false);
                                        }
                                    }}
                                >
                                    <span className="font-medium">{template.title}</span>
                                    <span className="text-xs text-slate-500 mt-1 text-left">{template.content}</span>
                                </Button>
                            ))}
                        </div>
                    </div>
                ) : null;
            })()}

            {/* New Form */}
            {showNewForm && (
                <Card className="bg-white dark:bg-slate-900 border-2 border-amber-400 dark:border-amber-600 shadow-lg shadow-amber-500/10">
                    <CardContent className="p-5 space-y-4">
                        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-semibold">
                            <Receipt className="h-5 w-5" />
                            Novo Template de Condições de Pagamento
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-600 dark:text-slate-400">Título *</Label>
                            <Input
                                placeholder="Ex: À Vista, Parcelamento 12x, 50% Entrada..."
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                                className="border-slate-200 dark:border-slate-700"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-600 dark:text-slate-400">Conteúdo *</Label>
                            <Textarea
                                placeholder="Descreva as condições de pagamento..."
                                value={newContent}
                                onChange={(e) => setNewContent(e.target.value)}
                                rows={3}
                                className="border-slate-200 dark:border-slate-700 resize-none"
                            />
                        </div>
                        <div className="flex gap-2 pt-2">
                            <Button
                                onClick={handleAdd}
                                disabled={loading}
                                className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white border-0"
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                                Salvar Template
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => { setShowNewForm(false); setNewTitle(''); setNewContent(''); }}
                                className="border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                                <X className="h-4 w-4 mr-2" />
                                Cancelar
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* List - Horizontal Grid */}
            {templates.length === 0 && !showNewForm ? (
                <Card className="bg-slate-50/50 dark:bg-slate-800/20 border-2 border-dashed border-slate-200 dark:border-slate-700">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
                            <Receipt className="h-10 w-10 text-slate-400" />
                        </div>
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Nenhum template cadastrado</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-center text-sm max-w-sm">
                            Crie templates de condições de pagamento para agilizar suas propostas
                        </p>
                    </CardContent>
                </Card>
            ) : templates.length > 0 && (
                <div className="grid gap-4 md:grid-cols-2">
                    {templates.map((template, index) => (
                        <Card
                            key={template.id}
                            className={`group bg-white dark:bg-slate-900 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 overflow-hidden ${!template.isActive ? 'opacity-60' : ''}`}
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <CardContent className="p-0">
                                {editingId === template.id ? (
                                    <div className="p-4 space-y-3">
                                        <Input
                                            value={editTitle}
                                            onChange={(e) => setEditTitle(e.target.value)}
                                            placeholder="Título"
                                            className="text-sm"
                                        />
                                        <Textarea
                                            value={editContent}
                                            onChange={(e) => setEditContent(e.target.value)}
                                            placeholder="Conteúdo"
                                            rows={3}
                                            className="resize-none text-sm"
                                        />
                                        <div className="flex gap-2">
                                            <Button
                                                onClick={() => handleEdit(template.id)}
                                                disabled={loading}
                                                size="sm"
                                                className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white flex-1"
                                            >
                                                {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                                            </Button>
                                            <Button variant="outline" size="sm" onClick={() => setEditingId(null)} className="flex-1">
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-4">
                                        {/* Header */}
                                        <div className="flex items-start justify-between mb-3">
                                            <div className={`p-2.5 rounded-xl transition-colors ${template.isActive ? 'bg-gradient-to-br from-amber-500/20 to-orange-500/20' : 'bg-slate-100 dark:bg-slate-800'}`}>
                                                <Receipt className={`h-5 w-5 ${template.isActive ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`} />
                                            </div>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button variant="ghost" size="sm" onClick={() => copyContent(template.content)} className="h-7 w-7 p-0 hover:bg-slate-100 dark:hover:bg-slate-800">
                                                    <Copy className="h-3.5 w-3.5 text-slate-500" />
                                                </Button>
                                                <Button variant="ghost" size="sm" onClick={() => startEdit(template)} className="h-7 w-7 p-0 hover:bg-slate-100 dark:hover:bg-slate-800">
                                                    <Pencil className="h-3.5 w-3.5 text-slate-500" />
                                                </Button>
                                                <Button variant="ghost" size="sm" onClick={() => handleDelete(template.id)} className="h-7 w-7 p-0 hover:bg-red-50 dark:hover:bg-red-900/20">
                                                    <Trash2 className="h-3.5 w-3.5 text-red-500" />
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <p className="font-semibold text-slate-900 dark:text-white mb-1">{template.title}</p>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
                                            {template.content}
                                        </p>

                                        {/* Footer */}
                                        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${template.isActive ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                                                {template.isActive ? '● Ativo' : '○ Inativo'}
                                            </span>
                                            <Switch
                                                checked={template.isActive}
                                                onCheckedChange={(checked) => handleToggleActive(template.id, checked)}
                                                className="scale-90"
                                            />
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
