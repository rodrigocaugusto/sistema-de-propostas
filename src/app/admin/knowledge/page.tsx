import { Metadata } from 'next';
import { getArticles } from './actions';
import { ArticleManager } from './article-manager';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
    title: 'Base de Conhecimento - Admin',
};

export default async function KnowledgeAdminPage() {
    const session = await getSession();
    if (!session || !session.isSuperAdmin) {
        redirect('/dashboard');
    }

    // Fetch articles (including hidden ones, hence false arg if I implemented logic for it, but getArticles fetches all by default unless modified)
    // Checking actions logic: "const where = onlyVisible ? { isVisible: true } : {};"
    // So for admin, I want all. getArticles default is true. Pass false.
    const articles = await getArticles(false);

    // Conversão de datas para string se necessário para evitar aviso de serialização do Next.js Client Component
    // Mas Prisma Date objects passam bem para Client Components em versões recentes. Se der erro, serializamos.
    // Vamos passar direto.

    return (
        <div className="container mx-auto py-6">
            <ArticleManager initialArticles={articles} />
        </div>
    );
}
