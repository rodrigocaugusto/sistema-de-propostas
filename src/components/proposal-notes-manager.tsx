'use client';

import { useState } from 'react';
import { saveProposalNote, editProposalNote, removeProposalNote } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Plus, Trash2, Pencil, X, Check, FileText, Loader2, ChevronDown, ChevronUp, Sparkles, Copy } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface ProposalNote {
    id: string;
    title: string;
    content: string;
    isActive: boolean;
}

interface ProposalNotesManagerProps {
    initialData: ProposalNote[];
}

export function ProposalNotesManager({ initialData }: ProposalNotesManagerProps) {
    const [notes, setNotes] = useState<ProposalNote[]>(initialData);
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    // New note form
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
            const result = await saveProposalNote({
                title: newTitle.trim(),
                content: newContent.trim(),
                isActive: true
            });

            setNotes([result, ...notes]);
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
            const note = notes.find(n => n.id === id);
            const result = await editProposalNote(id, {
                title: editTitle.trim(),
                content: editContent.trim(),
                isActive: note?.isActive ?? true
            });

            setNotes(notes.map(n => n.id === id ? result : n));
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
            await removeProposalNote(id);
            setNotes(notes.filter(n => n.id !== id));
            toast.success('Removido!');
        } catch {
            toast.error('Erro ao remover');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleActive = async (id: string, isActive: boolean) => {
        const note = notes.find(n => n.id === id);
        if (!note) return;

        try {
            const result = await editProposalNote(id, {
                title: note.title,
                content: note.content,
                isActive
            });
            setNotes(notes.map(n => n.id === id ? result : n));
            toast.success(isActive ? 'Ativado!' : 'Desativado!');
        } catch {
            toast.error('Erro ao atualizar status');
        }
    };

    const startEdit = (note: ProposalNote) => {
        setEditingId(note.id);
        setEditTitle(note.title);
        setEditContent(note.content);
        setExpandedId(null);
    };

    const copyContent = (content: string) => {
        navigator.clipboard.writeText(content);
        toast.success('Copiado para a área de transferência!');
    };

    const suggestionTemplates = [
        { title: 'Garantia', content: 'Garantia de 12 meses a partir da data de entrega, cobrindo defeitos de fabricação.' },
        { title: 'Prazo de Entrega', content: 'O prazo de entrega é de 15 dias úteis após a aprovação da proposta e confirmação do pagamento inicial.' },
        { title: 'Suporte', content: 'Suporte técnico incluído por 30 dias após a entrega, via e-mail e telefone em horário comercial.' }
    ];

    return (
        <div className="space-y-6">
            {/* Add Button */}
            {!showNewForm && (
                <Button
                    onClick={() => setShowNewForm(true)}
                    className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-lg shadow-violet-500/25 text-white border-0"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Template
                </Button>
            )}

            {/* Quick Add Suggestions - Always visible, showing only options not yet added */}
            {!showNewForm && (() => {
                const availableSuggestions = suggestionTemplates.filter(
                    suggestion => !notes.some(n => n.title.toLowerCase() === suggestion.title.toLowerCase())
                );
                return availableSuggestions.length > 0 ? (
                    <div className="p-4 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 rounded-xl border border-violet-200/50 dark:border-violet-700/30">
                        <div className="flex items-center gap-2 text-violet-700 dark:text-violet-400 font-medium mb-3">
                            <Sparkles className="h-4 w-4" />
                            Sugestões de templates:
                        </div>
                        <div className="grid gap-2 md:grid-cols-3">
                            {availableSuggestions.map((template) => (
                                <Button
                                    key={template.title}
                                    variant="outline"
                                    size="sm"
                                    className="border-violet-300 dark:border-violet-700 hover:bg-violet-100 dark:hover:bg-violet-900/30 hover:border-violet-500 text-violet-700 dark:text-violet-400 flex-col h-auto py-3 px-4"
                                    onClick={async () => {
                                        setLoading(true);
                                        try {
                                            const result = await saveProposalNote({
                                                title: template.title,
                                                content: template.content,
                                                isActive: true
                                            });
                                            setNotes([result, ...notes]);
                                            toast.success(`"${template.title}" adicionado!`);
                                        } catch {
                                            toast.error('Erro ao adicionar');
                                        } finally {
                                            setLoading(false);
                                        }
                                    }}
                                >
                                    <span className="font-medium">{template.title}</span>
                                    <span className="text-xs text-slate-500 mt-1 line-clamp-1">{template.content.substring(0, 40)}...</span>
                                </Button>
                            ))}
                        </div>
                    </div>
                ) : null;
            })()}

            {/* New Form */}
            {showNewForm && (
                <Card className="bg-white dark:bg-slate-900 border-2 border-violet-400 dark:border-violet-600 shadow-lg shadow-violet-500/10">
                    <CardContent className="p-5 space-y-4">
                        <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400 font-semibold">
                            <FileText className="h-5 w-5" />
                            Novo Template de Nota
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-600 dark:text-slate-400">Título *</Label>
                            <Input
                                placeholder="Ex: Termos de Garantia, Prazo de Entrega..."
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                                className="border-slate-200 dark:border-slate-700"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-600 dark:text-slate-400">Conteúdo *</Label>
                            <Textarea
                                placeholder="Digite o texto completo do template..."
                                value={newContent}
                                onChange={(e) => setNewContent(e.target.value)}
                                rows={5}
                                className="border-slate-200 dark:border-slate-700 resize-none"
                            />
                        </div>
                        <div className="flex gap-2 pt-2">
                            <Button
                                onClick={handleAdd}
                                disabled={loading}
                                className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white border-0"
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
            {notes.length === 0 && !showNewForm ? (
                <Card className="bg-slate-50/50 dark:bg-slate-800/20 border-2 border-dashed border-slate-200 dark:border-slate-700">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
                            <FileText className="h-10 w-10 text-slate-400" />
                        </div>
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Nenhum template cadastrado</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-center text-sm max-w-sm">
                            Crie textos reutilizáveis para adicionar rapidamente às suas propostas
                        </p>
                    </CardContent>
                </Card>
            ) : notes.length > 0 && (
                <div className="grid gap-4 md:grid-cols-2">
                    {notes.map((note, index) => (
                        <Card
                            key={note.id}
                            className={`group bg-white dark:bg-slate-900 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 overflow-hidden ${!note.isActive ? 'opacity-60' : ''}`}
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <CardContent className="p-0">
                                {editingId === note.id ? (
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
                                            rows={4}
                                            className="resize-none text-sm"
                                        />
                                        <div className="flex gap-2">
                                            <Button
                                                onClick={() => handleEdit(note.id)}
                                                disabled={loading}
                                                size="sm"
                                                className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white flex-1"
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
                                            <div className={`p-2.5 rounded-xl transition-colors ${note.isActive ? 'bg-gradient-to-br from-violet-500/20 to-purple-500/20' : 'bg-slate-100 dark:bg-slate-800'}`}>
                                                <FileText className={`h-5 w-5 ${note.isActive ? 'text-violet-600 dark:text-violet-400' : 'text-slate-400'}`} />
                                            </div>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button variant="ghost" size="sm" onClick={() => copyContent(note.content)} className="h-7 w-7 p-0 hover:bg-slate-100 dark:hover:bg-slate-800">
                                                    <Copy className="h-3.5 w-3.5 text-slate-500" />
                                                </Button>
                                                <Button variant="ghost" size="sm" onClick={() => startEdit(note)} className="h-7 w-7 p-0 hover:bg-slate-100 dark:hover:bg-slate-800">
                                                    <Pencil className="h-3.5 w-3.5 text-slate-500" />
                                                </Button>
                                                <Button variant="ghost" size="sm" onClick={() => handleDelete(note.id)} className="h-7 w-7 p-0 hover:bg-red-50 dark:hover:bg-red-900/20">
                                                    <Trash2 className="h-3.5 w-3.5 text-red-500" />
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Title */}
                                        <p className="font-semibold text-slate-900 dark:text-white mb-1">{note.title}</p>

                                        {/* Preview */}
                                        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
                                            {note.content}
                                        </p>

                                        {/* Expand Button */}
                                        <button
                                            onClick={() => setExpandedId(expandedId === note.id ? null : note.id)}
                                            className="text-xs text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1 mb-3"
                                        >
                                            {expandedId === note.id ? (
                                                <>
                                                    <ChevronUp className="h-3 w-3" />
                                                    Ocultar conteúdo
                                                </>
                                            ) : (
                                                <>
                                                    <ChevronDown className="h-3 w-3" />
                                                    Ver conteúdo completo
                                                </>
                                            )}
                                        </button>

                                        {/* Expanded Content */}
                                        {expandedId === note.id && (
                                            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 mb-3">
                                                <pre className="whitespace-pre-wrap text-xs text-slate-700 dark:text-slate-300 font-sans leading-relaxed">
                                                    {note.content}
                                                </pre>
                                            </div>
                                        )}

                                        {/* Footer */}
                                        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${note.isActive ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                                                {note.isActive ? '● Ativo' : '○ Inativo'}
                                            </span>
                                            <Switch
                                                checked={note.isActive}
                                                onCheckedChange={(checked) => handleToggleActive(note.id, checked)}
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
