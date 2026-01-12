'use server';

import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export interface KnowledgeArticle {
    id: string;
    title: string;
    content: string;
    videoUrl: string | null;
    category: string | null;
    isVisible: boolean;
    createdAt: Date;
    updatedAt: Date;
}

// List all articles (for admin and sidebar)
export async function getArticles(onlyVisible = true) {
    try {
        const where = onlyVisible ? { isVisible: true } : {};
        return await prisma.knowledgeArticle.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });
    } catch (error) {
        console.error('Error fetching articles:', error);
        return [];
    }
}

export async function getArticle(id: string) {
    try {
        return await prisma.knowledgeArticle.findUnique({
            where: { id },
        });
    } catch (error) {
        console.error('Error fetching article:', error);
        return null;
    }
}

// Admin only actions
async function checkSuperAdmin() {
    const session = await getSession();
    if (!session || !session.isSuperAdmin) {
        throw new Error('Acesso negado. Apenas Super Admin.');
    }
    return session;
}

export async function createArticle(data: {
    title: string;
    content: string;
    videoUrl?: string;
    category?: string;
}) {
    try {
        await checkSuperAdmin();

        await prisma.knowledgeArticle.create({
            data: {
                title: data.title,
                content: data.content,
                videoUrl: data.videoUrl || null,
                category: data.category || 'Geral',
                isVisible: true,
            },
        });

        revalidatePath('/admin/knowledge');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function updateArticle(id: string, data: {
    title?: string;
    content?: string;
    videoUrl?: string;
    category?: string;
    isVisible?: boolean;
}) {
    try {
        await checkSuperAdmin();

        await prisma.knowledgeArticle.update({
            where: { id },
            data: {
                ...data,
                // Ensure null if empty string
                videoUrl: data.videoUrl === '' ? null : data.videoUrl,
            },
        });

        revalidatePath('/admin/knowledge');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function deleteArticle(id: string) {
    try {
        await checkSuperAdmin();

        await prisma.knowledgeArticle.delete({
            where: { id },
        });

        revalidatePath('/admin/knowledge');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
