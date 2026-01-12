'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Save, X, Video, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { KnowledgeArticle, createArticle, updateArticle, deleteArticle } from './actions';

interface ArticleManagerProps {
    initialArticles: KnowledgeArticle[];
}

export function ArticleManager({ initialArticles }: ArticleManagerProps) {
    const router = useRouter();
    const [articles, setArticles] = useState(initialArticles);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Form state
    const [currentId, setCurrentId] = useState<string | null>(null);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [category, setCategory] = useState('');
    const [videoUrl, setVideoUrl] = useState('');
    const [isVisible, setIsVisible] = useState(true);

    const resetForm = () => {
        setCurrentId(null);
        setTitle('');
        setContent('');
        setCategory('');
        setVideoUrl('');
        setIsVisible(true);
        setIsEditing(false);
    };

    const handleOpenCreate = () => {
        resetForm();
        setIsDialogOpen(true);
    };

    const handleOpenEdit = (article: KnowledgeArticle) => {
        setCurrentId(article.id);
        setTitle(article.title);
        setContent(article.content);
        setCategory(article.category || '');
        setVideoUrl(article.videoUrl || '');
        setIsVisible(article.isVisible);
        setIsEditing(true);
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            if (isEditing && currentId) {
                const result = await updateArticle(currentId, {
                    title,
                    content,
                    category,
                    videoUrl,
                    isVisible,
                });
                if (result.success) {
                    toast.success('Artigo atualizado com sucesso!');
                    setIsDialogOpen(false);
                    router.refresh();
                } else {
                    toast.error(result.error);
                }
            } else {
                const result = await createArticle({
                    title,
                    content,
                    category,
                    videoUrl,
                });
                if (result.success) {
                    toast.success('Artigo criado com sucesso!');
                    setIsDialogOpen(false);
                    router.refresh();
                } else {
                    toast.error(result.error);
                }
            }
        } catch {
            toast.error('Erro ao salvar artigo');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este artigo?')) return;

        const result = await deleteArticle(id);
        if (result.success) {
            toast.success('Artigo excluído');
            router.refresh();
        } else {
            toast.error(result.error);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold tracking-tight">Base de Conhecimento</h2>
                <Button onClick={handleOpenCreate}>
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Artigo
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Artigos Publicados</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Título</TableHead>
                                <TableHead>Categoria</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {articles.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                                        Nenhum artigo encontrado. Crie o primeiro!
                                    </TableCell>
                                </TableRow>
                            ) : (
                                articles.map((article) => (
                                    <TableRow key={article.id}>
                                        <TableCell className="font-medium">{article.title}</TableCell>
                                        <TableCell>{article.category || 'Geral'}</TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${article.isVisible ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                {article.isVisible ? 'Visível' : 'Oculto'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(article)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700" onClick={() => handleDelete(article.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{isEditing ? 'Editar Artigo' : 'Novo Artigo'}</DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="title">Título</Label>
                            <Input
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Ex: Como criar uma proposta"
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="category">Categoria</Label>
                            <Input
                                id="category"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                placeholder="Ex: Tutorial, Financeiro, Dicas"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="content">Conteúdo (HTML suportado)</Label>
                            <Textarea
                                id="content"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="Descreva o tutorial aqui..."
                                className="min-h-[200px] font-mono text-sm"
                                required
                            />
                            <p className="text-xs text-muted-foreground">Dica: Use tags HTML como &lt;strong&gt;, &lt;ul&gt;, &lt;p&gt; para formatar.</p>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="videoUrl">URL do Vídeo (YouTube)</Label>
                            <div className="flex items-center gap-2">
                                <Video className="h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="videoUrl"
                                    value={videoUrl}
                                    onChange={(e) => setVideoUrl(e.target.value)}
                                    placeholder="https://www.youtube.com/watch?v=..."
                                />
                            </div>
                        </div>

                        {isEditing && (
                            <div className="flex items-center gap-2">
                                <Switch
                                    checked={isVisible}
                                    onCheckedChange={setIsVisible}
                                    id="isVisible"
                                />
                                <Label htmlFor="isVisible">Visível para usuários</Label>
                            </div>
                        )}

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? 'Salvando...' : 'Salvar Artigo'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
