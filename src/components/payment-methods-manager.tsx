'use client';

import { useState } from 'react';
import { savePaymentMethod, editPaymentMethod, removePaymentMethod } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Plus, Trash2, Pencil, X, Check, CreditCard, Loader2, Sparkles } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface PaymentMethod {
    id: string;
    name: string;
    description?: string | null;
    isActive: boolean;
}

interface PaymentMethodsManagerProps {
    initialData: PaymentMethod[];
}

export function PaymentMethodsManager({ initialData }: PaymentMethodsManagerProps) {
    const [methods, setMethods] = useState<PaymentMethod[]>(initialData);
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // New method form
    const [newName, setNewName] = useState('');
    const [newDescription, setNewDescription] = useState('');
    const [showNewForm, setShowNewForm] = useState(false);

    // Edit form
    const [editName, setEditName] = useState('');
    const [editDescription, setEditDescription] = useState('');

    const handleAdd = async () => {
        if (!newName.trim()) {
            toast.error('Digite um nome para a forma de pagamento');
            return;
        }

        setLoading(true);
        try {
            const result = await savePaymentMethod({
                name: newName.trim(),
                description: newDescription.trim() || undefined,
                isActive: true
            });

            setMethods([result, ...methods]);
            setNewName('');
            setNewDescription('');
            setShowNewForm(false);
            toast.success('Forma de pagamento adicionada!');
        } catch {
            toast.error('Erro ao adicionar');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = async (id: string) => {
        if (!editName.trim()) {
            toast.error('Digite um nome');
            return;
        }

        setLoading(true);
        try {
            const method = methods.find(m => m.id === id);
            const result = await editPaymentMethod(id, {
                name: editName.trim(),
                description: editDescription.trim() || undefined,
                isActive: method?.isActive ?? true
            });

            setMethods(methods.map(m => m.id === id ? result : m));
            setEditingId(null);
            toast.success('Atualizado!');
        } catch {
            toast.error('Erro ao atualizar');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Deseja remover esta forma de pagamento?')) return;

        setLoading(true);
        try {
            await removePaymentMethod(id);
            setMethods(methods.filter(m => m.id !== id));
            toast.success('Removido!');
        } catch {
            toast.error('Erro ao remover');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleActive = async (id: string, isActive: boolean) => {
        const method = methods.find(m => m.id === id);
        if (!method) return;

        try {
            const result = await editPaymentMethod(id, {
                name: method.name,
                description: method.description || undefined,
                isActive
            });
            setMethods(methods.map(m => m.id === id ? result : m));
            toast.success(isActive ? 'Ativado!' : 'Desativado!');
        } catch {
            toast.error('Erro ao atualizar status');
        }
    };

    const startEdit = (method: PaymentMethod) => {
        setEditingId(method.id);
        setEditName(method.name);
        setEditDescription(method.description || '');
    };

    const quickAddOptions = ['PIX', 'Boleto', 'Cartão de Crédito', 'Cartão de Débito', 'Transferência'];

    return (
        <div className="space-y-6">
            {/* Add Button */}
            <div className="flex flex-wrap gap-2">
                {!showNewForm && (
                    <Button
                        onClick={() => setShowNewForm(true)}
                        className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-500/25 text-white border-0"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Nova Forma de Pagamento
                    </Button>
                )}
            </div>

            {/* Quick Add Suggestions - Always visible, showing only options not yet added */}
            {!showNewForm && (() => {
                const availableOptions = quickAddOptions.filter(
                    opt => !methods.some(m => m.name.toLowerCase() === opt.toLowerCase())
                );
                return availableOptions.length > 0 ? (
                    <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl border border-emerald-200/50 dark:border-emerald-700/30">
                        <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-medium mb-3">
                            <Sparkles className="h-4 w-4" />
                            Adicionar rapidamente:
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {availableOptions.map((opt) => (
                                <Button
                                    key={opt}
                                    variant="outline"
                                    size="sm"
                                    className="border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 hover:border-emerald-500 text-emerald-700 dark:text-emerald-400"
                                    onClick={async () => {
                                        setLoading(true);
                                        try {
                                            const result = await savePaymentMethod({ name: opt, isActive: true });
                                            setMethods([result, ...methods]);
                                            toast.success(`"${opt}" adicionado!`);
                                        } catch {
                                            toast.error('Erro ao adicionar');
                                        } finally {
                                            setLoading(false);
                                        }
                                    }}
                                >
                                    <Plus className="h-3 w-3 mr-1" />
                                    {opt}
                                </Button>
                            ))}
                        </div>
                    </div>
                ) : null;
            })()}

            {/* New Form */}
            {showNewForm && (
                <Card className="bg-white dark:bg-slate-900 border-2 border-emerald-400 dark:border-emerald-600 shadow-lg shadow-emerald-500/10">
                    <CardContent className="p-5 space-y-4">
                        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold">
                            <CreditCard className="h-5 w-5" />
                            Nova Forma de Pagamento
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label className="text-slate-600 dark:text-slate-400">Nome *</Label>
                                <Input
                                    placeholder="Ex: PIX, Boleto, Cartão..."
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    className="border-slate-200 dark:border-slate-700"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-600 dark:text-slate-400">Descrição (opcional)</Label>
                                <Input
                                    placeholder="Ex: Até 12x sem juros"
                                    value={newDescription}
                                    onChange={(e) => setNewDescription(e.target.value)}
                                    className="border-slate-200 dark:border-slate-700"
                                />
                            </div>
                        </div>
                        <div className="flex gap-2 pt-2">
                            <Button
                                onClick={handleAdd}
                                disabled={loading}
                                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white border-0"
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                                Salvar
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => { setShowNewForm(false); setNewName(''); setNewDescription(''); }}
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
            {methods.length === 0 && !showNewForm ? (
                <Card className="bg-slate-50/50 dark:bg-slate-800/20 border-2 border-dashed border-slate-200 dark:border-slate-700">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
                            <CreditCard className="h-10 w-10 text-slate-400" />
                        </div>
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Nenhuma forma de pagamento</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-center text-sm max-w-sm">
                            Cadastre as opções de pagamento que você oferece aos seus clientes
                        </p>
                    </CardContent>
                </Card>
            ) : methods.length > 0 && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {methods.map((method, index) => (
                        <Card
                            key={method.id}
                            className={`group bg-white dark:bg-slate-900 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${!method.isActive ? 'opacity-60' : ''}`}
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <CardContent className="p-0">
                                {editingId === method.id ? (
                                    <div className="p-4 space-y-3">
                                        <Input
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            placeholder="Nome"
                                            className="text-sm"
                                        />
                                        <Input
                                            value={editDescription}
                                            onChange={(e) => setEditDescription(e.target.value)}
                                            placeholder="Descrição"
                                            className="text-sm"
                                        />
                                        <div className="flex gap-2">
                                            <Button
                                                onClick={() => handleEdit(method.id)}
                                                disabled={loading}
                                                size="sm"
                                                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white flex-1"
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
                                        <div className="flex items-start justify-between mb-3">
                                            <div className={`p-2.5 rounded-xl transition-colors ${method.isActive ? 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20' : 'bg-slate-100 dark:bg-slate-800'}`}>
                                                <CreditCard className={`h-5 w-5 ${method.isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
                                            </div>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button variant="ghost" size="sm" onClick={() => startEdit(method)} className="h-7 w-7 p-0 hover:bg-slate-100 dark:hover:bg-slate-800">
                                                    <Pencil className="h-3.5 w-3.5 text-slate-500" />
                                                </Button>
                                                <Button variant="ghost" size="sm" onClick={() => handleDelete(method.id)} className="h-7 w-7 p-0 hover:bg-red-50 dark:hover:bg-red-900/20">
                                                    <Trash2 className="h-3.5 w-3.5 text-red-500" />
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="mb-3">
                                            <p className="font-semibold text-slate-900 dark:text-white">{method.name}</p>
                                            {method.description && (
                                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{method.description}</p>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${method.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                                                {method.isActive ? '● Ativo' : '○ Inativo'}
                                            </span>
                                            <Switch
                                                checked={method.isActive}
                                                onCheckedChange={(checked) => handleToggleActive(method.id, checked)}
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
