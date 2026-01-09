'use client';

import { useState } from 'react';
import { savePortfolioItem, removePortfolioItem } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Plus, Trash2, X, Check, Loader2, Video, ImageIcon, ExternalLink, Play, Upload } from 'lucide-react';
import { Label } from '@/components/ui/label';

interface PortfolioItem {
    id: string;
    type: string;
    title?: string | null;
    url: string;
    thumbnailUrl?: string | null;
    isActive: boolean;
}

interface PortfolioManagerProps {
    initialData: PortfolioItem[];
}

export function PortfolioManager({ initialData }: PortfolioManagerProps) {
    const [items, setItems] = useState<PortfolioItem[]>(initialData);
    const [loading, setLoading] = useState(false);

    // New item form
    const [type, setType] = useState<'video' | 'image'>('video');
    const [url, setUrl] = useState(''); // Can be multiline for videos
    const [title, setTitle] = useState('');
    const [showNewForm, setShowNewForm] = useState(false);

    const handleAdd = async () => {
        // For video, support multiple URLs
        const urls = type === 'video'
            ? url.split(/\r?\n/).map(u => u.trim()).filter(u => u)
            : [url.trim()].filter(u => u);

        if (urls.length === 0) {
            toast.error(type === 'video' ? 'Digite ao menos uma URL de vídeo' : 'Digite a URL da imagem ou faça upload');
            return;
        }

        setLoading(true);
        try {
            // Create a Gallery Item containing all URLs
            const galleryItems = urls.map((u, i) => ({
                url: u,
                title: type === 'video' ? `Vídeo ${i + 1}` : `Imagem ${i + 1}`,
                type: type // metadata for the sub-item
            }));

            const result = await savePortfolioItem({
                type,
                title: title.trim() || (type === 'video' ? `Galeria de Vídeos (${urls.length})` : 'Galeria de Mídia'),
                url: urls[0], // Use first as cover/fallback
                items: galleryItems
            });

            setItems([result as any, ...items]);
            setUrl('');
            setTitle('');
            setShowNewForm(false);
            toast.success(`Galeria criada com ${urls.length} item(ns)!`);
        } catch (err) {
            console.error(err);
            toast.error('Erro ao adicionar galeria');
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        setLoading(true);

        try {
            // 1. Upload all files first
            const uploadPromises = files.map(async (file) => {
                const formData = new FormData();
                formData.append('file', file);

                const response = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData,
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || `Falha no upload de ${file.name}`);
                }

                return {
                    url: data.url,
                    name: file.name
                };
            });

            const results = await Promise.all(uploadPromises);

            // 2. Create Gallery Item
            const galleryItems = results.map((res) => ({
                url: res.url,
                title: res.name.split('.')[0],
                type: 'image'
            }));

            const savedItem = await savePortfolioItem({
                type: 'image',
                title: title.trim() || `Galeria de Imagens (${files.length})`,
                url: galleryItems[0].url,
                items: galleryItems
            });

            setItems([savedItem as any, ...items]);

            // Clear input
            e.target.value = '';
            setShowNewForm(false);
            toast.success(`Galeria de Imagens criada com ${files.length} fotos!`);
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || 'Erro ao processar uploads');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Deseja remover este item?')) return;

        setLoading(true);
        try {
            await removePortfolioItem(id);
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
                        className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 shadow-lg shadow-red-500/25 text-white border-0"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Item
                    </Button>
                )}
            </div>

            {/* New Form */}
            {showNewForm && (
                <Card className="bg-white dark:bg-slate-900 border-2 border-red-400 dark:border-red-600 shadow-lg shadow-red-500/10">
                    <CardContent className="p-5 space-y-4">
                        <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-semibold mb-2">
                            {type === 'video' ? <Video className="h-5 w-5" /> : <ImageIcon className="h-5 w-5" />}
                            {type === 'video' ? 'Adicionar Vídeos (Em Massa)' : 'Adicionar Imagens (Em Massa)'}
                        </div>

                        {/* Type Toggle */}
                        <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg w-fit">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setType('video')}
                                className={type === 'video' ? 'bg-white dark:bg-slate-700 shadow-sm text-red-600' : 'text-slate-500'}
                            >
                                <Video className="h-4 w-4 mr-2" />
                                Vídeo
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setType('image')}
                                className={type === 'image' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-slate-500'}
                            >
                                <ImageIcon className="h-4 w-4 mr-2" />
                                Imagem
                            </Button>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label className="text-slate-600 dark:text-slate-400">
                                    {type === 'video' ? 'URLs dos Vídeos (um por linha) *' : 'URLs da Imagem ou Upload *'}
                                </Label>
                                <div className="flex gap-2 items-start">
                                    {type === 'video' ? (
                                        <textarea
                                            placeholder={"https://youtube.com/video1\nhttps://youtube.com/video2"}
                                            value={url}
                                            onChange={(e) => setUrl(e.target.value)}
                                            className="flex min-h-[80px] w-full rounded-md border border-slate-200 dark:border-slate-700 bg-transparent px-3 py-2 text-sm placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            disabled={loading}
                                        />
                                    ) : (
                                        <Input
                                            placeholder="https://exemplo.com/imagem.jpg"
                                            value={url}
                                            onChange={(e) => setUrl(e.target.value)}
                                            className="border-slate-200 dark:border-slate-700"
                                            disabled={loading}
                                        />
                                    )}

                                    {type === 'image' && (
                                        <div className="relative">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                disabled={loading}
                                                className="shrink-0 border-slate-300 dark:border-slate-600"
                                                title="Upload de Imagens (Múltiplas)"
                                            >
                                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                                            </Button>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                multiple
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-50 disabled:cursor-not-allowed"
                                                onChange={handleFileUpload}
                                                disabled={loading}
                                            />
                                        </div>
                                    )}
                                </div>
                                {type === 'image' && <p className="text-xs text-slate-500">Upload (múltiplo) converte e salva automaticamente.</p>}
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-600 dark:text-slate-400">Título (opcional / fixo)</Label>
                                <Input
                                    placeholder={type === 'video' ? "Ex: Vídeo Institucional" : "Ex: Fachada"}
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="border-slate-200 dark:border-slate-700"
                                    disabled={loading}
                                />
                                <p className="text-[10px] text-slate-400">
                                    Para upload em massa, o título digitado será ignorado (usará nome do arquivo).
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2 pt-2">
                            <Button
                                onClick={handleAdd}
                                disabled={loading}
                                className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white border-0"
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                                Salvar
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => { setShowNewForm(false); setUrl(''); setTitle(''); }}
                                className="border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                                <X className="h-4 w-4 mr-2" />
                                Cancelar
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* List */}
            {items.length === 0 && !showNewForm ? (
                <Card className="bg-slate-50/50 dark:bg-slate-800/20 border-2 border-dashed border-slate-200 dark:border-slate-700">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
                            <Video className="h-10 w-10 text-slate-400" />
                        </div>
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Portfólio vazio</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-center text-sm max-w-sm">
                            Adicione vídeos ou imagens para mostrar seu trabalho nas propostas.
                        </p>
                    </CardContent>
                </Card>
            ) : items.length > 0 && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {items.map((item, index) => (
                        <Card key={item.id} className="group bg-white dark:bg-slate-900 overflow-hidden hover:shadow-lg transition-all">
                            <div className="aspect-video bg-slate-100 dark:bg-slate-800 relative flex items-center justify-center overflow-hidden">
                                {/* Enhance with actual thumbnail if available, else generic */}
                                {item.thumbnailUrl || (item.type === 'image' ? item.url : null) ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={item.thumbnailUrl || (item.type === 'image' ? item.url : '')}
                                        alt={item.title || 'Portfolio Item'}
                                        className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500"
                                    />
                                ) : (
                                    <div className="flex flex-col items-center gap-2 text-slate-400">
                                        {item.type === 'video' ? <Video className="h-12 w-12 opacity-50" /> : <ImageIcon className="h-12 w-12 opacity-50" />}
                                    </div>
                                )}
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                    <Button variant="destructive" size="icon" className="h-8 w-8 rounded-full shadow-sm" onClick={() => handleDelete(item.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                                {/* Type indicator badge */}
                                <div className="absolute bottom-2 left-2 z-10">
                                    <span className="bg-black/60 text-white text-[10px] px-2 py-1 rounded-full flex items-center gap-1 backdrop-blur-sm">
                                        {item.type === 'video' ? <Video className="h-3 w-3" /> : <ImageIcon className="h-3 w-3" />}
                                        {item.type === 'video' ? 'Vídeo' : 'Imagem'}
                                    </span>
                                </div>
                            </div>
                            <CardContent className="p-3">
                                <h4 className="font-medium text-slate-900 dark:text-white truncate" title={item.title || item.url}>
                                    {item.title || 'Sem título'}
                                </h4>
                                <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline flex items-center gap-1 mt-1 truncate">
                                    <ExternalLink className="h-3 w-3" />
                                    {item.url}
                                </a>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
