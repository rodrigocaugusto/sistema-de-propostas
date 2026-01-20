import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/lib/db';

interface PageProps {
    params: Promise<{ code: string }>;
}

export default async function ShortUrlRedirect({ params }: PageProps) {
    const { code } = await params;

    // Find proposal by short code
    const proposal = await prisma.proposal.findFirst({
        where: { shortCode: code },
        select: { id: true }
    });

    if (!proposal) {
        notFound();
    }

    // Redirect to full proposal URL
    redirect(`/p/${proposal.id}`);
}
