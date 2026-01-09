'use client';

import { useState, useRef } from 'react';
import { saveClientLogo, removeClientLogo } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Plus, Trash2, X, Check, Loader2, ImageIcon, UploadCloud } from 'lucide-react';
import { Label } from '@/components/ui/label';

interface ClientLogo {
    id: string;
    name?: string | null;
    url: string;
    isActive: boolean;
}

interface ClientLogosManagerProps {
    initialData: ClientLogo[];
}

export function ClientLogosManager({ initialData }: ClientLogosManagerProps) {
    const [items, setItems] = useState<ClientLogo[]>(initialData);
    const [loading, setLoading] = useState(false);

    // New item form
    const [name, setName] = useState('');
    const [showNewForm, setShowNewForm] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Erro no upload');
            }

            const data = await response.json();

            // Allow user to confirm and name it before saving to DB? or just save immediately?
            // "Save immediately" flow is easier but "Review" is better UX.
            // Let's implement immediate save after upload for simplicity, or populate a "preview" in form.
            // Beacuse we opened the form, let's keep it in the form.

            // ACTUALLY, I'll store the URL in state and let the user click "Salvar".
            // But for simplicity in this turn, I will assume the form has a File Input and when "Salvar" is clicked, we upload then save.

            // But file input onChange triggers this...
            // Let's modify: user selects file, we upload immediately to get URL, show preview, then user clicks Save to commit to DB.

            setTempUrl(data.url);
            toast.success('Upload concluído');

        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const [tempUrl, setTempUrl] = useState<string | null>(null);

    const handleSave = async () => {
        if (!tempUrl) {
            toast.error('Faça o upload da imagem primeiro');
            return;
        }

        setLoading(true);
        try {
            const result = await saveClientLogo({
                name: name.trim() || undefined,
                url: tempUrl
            });

            setItems([result as any, ...items]);
            setName('');
            setTempUrl(null);
            setShowNewForm(false);
            toast.success('Logo adicionada!');
        } catch {
            toast.error('Erro ao salvar logo');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Deseja remover esta logo?')) return;

        setLoading(true);
        try {
            await removeClientLogo(id);
            setItems(items.filter(i => i.id !== id));
            toast.success('Removido!');
        } catch {
            toast.error('Erro ao remover');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap gap-2">
                {!showNewForm && (
                    <Button
                        onClick={() => setShowNewForm(true)}
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg shadow-blue-500/25 text-white border-0"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Cliente
                    </Button>
                )}
            </div>

            {/* New Form */}
            {showNewForm && (
                <Card className="bg-white dark:bg-slate-900 border-2 border-blue-400 dark:border-blue-600 shadow-lg shadow-blue-500/10">
                    <CardContent className="p-5 space-y-4">
                        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold">
                            <ImageIcon className="h-5 w-5" />
                            Novo Cliente
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 items-start">
                            <div className="space-y-2">
                                <Label className="text-slate-600 dark:text-slate-400">Logo da Empresa *</Label>
                                <div className="flex flex-col gap-2">
                                    {tempUrl ? (
                                        <div className="relative w-full h-32 bg-slate-100 dark:bg-slate-800 rounded-md flex items-center justify-center border border-slate-200 dark:border-slate-700 p-2">
                                            <img src={tempUrl} alt="Preview" className="max-h-full max-w-full object-contain" />
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="absolute top-1 right-1 h-6 w-6 p-0 bg-white/80 hover:bg-white text-slate-500 rounded-full"
                                                onClick={() => setTempUrl(null)}
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <div
                                            className="w-full h-32 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-md flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            {loading ? (
                                                <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
                                            ) : (
                                                <>
                                                    <UploadCloud className="h-8 w-8 text-slate-400 mb-2" />
                                                    <span className="text-xs text-slate-500">Clique para enviar</span>
                                                </>
                                            )}
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleFileUpload}
                                    />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-slate-600 dark:text-slate-400">Nome da Empresa (opcional)</Label>
                                    <Input
                                        placeholder="Ex: Acme Corp"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="border-slate-200 dark:border-slate-700"
                                    />
                                </div>
                                <div className="flex gap-2 pt-2 justify-end">
                                    <Button
                                        variant="outline"
                                        onClick={() => { setShowNewForm(false); setName(''); setTempUrl(null); }}
                                        className="border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                                    >
                                        <X className="h-4 w-4 mr-2" />
                                        Cancelar
                                    </Button>
                                    <Button
                                        onClick={handleSave}
                                        disabled={loading || !tempUrl}
                                        className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white border-0"
                                    >
                                        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                                        Salvar
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* List */}
            {items.length === 0 && !showNewForm ? (
                <Card className="bg-slate-50/50 dark:bg-slate-800/20 border-2 border-dashed border-slate-200 dark:border-slate-700">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
                            <ImageIcon className="h-10 w-10 text-slate-400" />
                        </div>
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Nenhum cliente adicionado</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-center text-sm max-w-sm">
                            Adicione logos de seus clientes para exibir na proposta
                        </p>
                    </CardContent>
                </Card>
            ) : items.length > 0 && (
                <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
                    {items.map((item, index) => (
                        <Card key={item.id} className="group bg-white dark:bg-slate-900 border overflow-hidden hover:shadow-lg transition-all">
                            <div className="h-24 p-4 flex items-center justify-center relative bg-white">
                                {/* Always white background for logos usually looks best, or transparent. User requested white background. */}
                                <img src={item.url} alt={item.name || 'Logo'} className="max-h-full max-w-full object-contain" />

                                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="destructive" size="icon" className="h-6 w-6 rounded-full shadow-sm" onClick={() => handleDelete(item.id)}>
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                            {item.name && (
                                <div className="px-2 py-1 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 text-center">
                                    <span className="text-xs text-slate-500 dark:text-slate-400 truncate block" title={item.name}>
                                        {item.name}
                                    </span>
                                </div>
                            )}
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
