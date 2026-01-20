'use server'

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function getAuditProposals() {
    const session = await getSession();
    if (!session || !session.companyId) {
        throw new Error("Não autorizado");
    }

    // Verificação de Admin necessária para auditoria
    if (session.role !== 'admin') {
        throw new Error("Acesso negado. Apenas administradores.");
    }

    const proposals = await prisma.proposal.findMany({
        where: { companyId: session.companyId },
        include: {
            items: true,
            createdBy: {
                select: { id: true, name: true, email: true }
            }
        },
        orderBy: { createdAt: 'desc' },
    });

    return proposals.map((p: any) => ({
        id: p.id,
        proposalNumber: p.proposalNumber,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
        clientName: p.clientName,
        status: p.status,
        totalOneTime: p.totalOneTime,
        totalRecurring: p.totalRecurring,
        creatorName: p.createdBy?.name || 'Sistema / Desconhecido',
        creatorEmail: p.createdBy?.email || '',
        creatorId: p.createdBy?.id || null,
        items: p.items.map((i: any) => ({
            id: i.id,
            name: i.name,
            price: i.price,
            originalPrice: i.originalPrice,
            quantity: i.quantity,
            type: i.type,
            // Calculate discount
            discountValue: i.originalPrice ? (i.originalPrice - i.price) * i.quantity : 0,
            hasDiscount: !!(i.originalPrice && i.originalPrice > i.price)
        }))
    }));
}

export type AuditProposal = Awaited<ReturnType<typeof getAuditProposals>>[number];

export async function getCompanyUsers() {
    const session = await getSession();
    if (!session || !session.companyId) return [];

    return await prisma.user.findMany({
        where: { companyId: session.companyId },
        select: { id: true, name: true, email: true },
        orderBy: { name: 'asc' }
    });
}
