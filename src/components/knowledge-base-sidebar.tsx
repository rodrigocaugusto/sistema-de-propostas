'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Book, ChevronLeft, Search, PlayCircle, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { getArticles, KnowledgeArticle } from '@/app/admin/knowledge/actions'; // Import server action
import { Separator } from '@/components/ui/separator';

export function KnowledgeBaseSidebar() {
    const pathname = usePathname();
    const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
    const [view, setView] = useState<'list' | 'article'>('list');
    const [selectedArticle, setSelectedArticle] = useState<KnowledgeArticle | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    // Fetch articles on mount
    useEffect(() => {
        const load = async () => {
            try {
                const data = await getArticles(true);
                // Convert dates back from serialization if needed (Server Actions usually handle JSON serialization automatically now)
                setArticles(data);
            } catch (e) {
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, []);

    // Helper to extract Youtube ID
    const getYoutubeId = (url: string) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    // Filter articles
    const filteredArticles = articles.filter(a =>
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.category?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Hide on login/public pages
    if (pathname.includes('/login') || pathname.includes('/p/')) return null;

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="fixed left-0 top-1/2 -translate-y-1/2 z-[40] bg-white dark:bg-slate-800 shadow-md rounded-l-none rounded-r-xl border border-l-0 border-slate-200 dark:border-slate-700 h-10 w-8 hover:w-10 transition-all group"
                    title="Ajuda e Tutoriais"
                >
                    <Book className="h-4 w-4 text-slate-600 dark:text-slate-400 group-hover:text-emerald-500 transition-colors" />
                </Button>
            </SheetTrigger>

            <SheetContent side="left" className="w-[400px] sm:w-[540px] p-0 z-[100]">
                {view === 'list' ? (
                    <div className="flex flex-col h-full">
                        <SheetHeader className="p-6 border-b">
                            <SheetTitle className="flex items-center gap-2">
                                <Book className="h-5 w-5 text-emerald-500" />
                                Central de Ajuda
                            </SheetTitle>
                            <div className="mt-4">
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                                    <Input
                                        placeholder="Buscar tutoriais..."
                                        className="pl-9"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>
                        </SheetHeader>

                        <ScrollArea className="flex-1">
                            <div className="p-4 space-y-2">
                                {isLoading ? (
                                    <p className="text-center text-sm text-slate-500 py-8">Carregando...</p>
                                ) : filteredArticles.length > 0 ? (
                                    filteredArticles.map((article) => (
                                        <div
                                            key={article.id}
                                            onClick={() => {
                                                setSelectedArticle(article);
                                                setView('article');
                                            }}
                                            className="group flex flex-col gap-1 p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <h3 className="font-medium text-sm text-slate-900 dark:text-slate-100 line-clamp-2">
                                                    {article.title}
                                                </h3>
                                                {article.videoUrl && (
                                                    <PlayCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-full font-medium border border-slate-200 dark:border-slate-700">
                                                    {article.category || 'Geral'}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-center text-sm text-slate-500 py-8">Nenhum artigo encontrado.</p>
                                )}
                            </div>
                        </ScrollArea>
                    </div>
                ) : (
                    <div className="flex flex-col h-full bg-white dark:bg-slate-950">
                        {/* Article Header */}
                        <div className="p-4 border-b flex items-center gap-2 sticky top-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md z-10">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="-ml-2"
                                onClick={() => setView('list')}
                            >
                                <ChevronLeft className="h-4 w-4 mr-1" />
                                Voltar
                            </Button>
                            <span className="text-sm text-slate-500 truncate flex-1 text-right">
                                {selectedArticle?.category}
                            </span>
                        </div>

                        <ScrollArea className="flex-1">
                            <div className="p-6 space-y-6">
                                <h1 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">
                                    {selectedArticle?.title}
                                </h1>

                                {/* Video Embed */}
                                {selectedArticle?.videoUrl && getYoutubeId(selectedArticle.videoUrl) && (
                                    <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-lg bg-black">
                                        <iframe
                                            src={`https://www.youtube.com/embed/${getYoutubeId(selectedArticle.videoUrl)}`}
                                            title={selectedArticle.title}
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                            className="absolute top-0 left-0 w-full h-full"
                                        />
                                    </div>
                                )}

                                {/* Content */}
                                <div
                                    className="prose-custom text-sm max-w-none"
                                    dangerouslySetInnerHTML={{ __html: selectedArticle?.content || '' }}
                                />
                            </div>
                        </ScrollArea>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}
