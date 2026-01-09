
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/auth';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

/* 
  Legacy Interface Types 
  (Kept here to avoid breaking imports)
*/

export interface Company {
    id?: string;
    name: string;
    responsible: string | null;
    email: string | null;
    phone: string | null;
    logoUrl?: string | null;
    webhookUrl?: string | null;
    updatedAt?: Date;
    portfolioItems?: PortfolioItem[];
    clientLogos?: ClientLogo[];
}

export interface PortfolioItem {
    id: string;
    type: 'video' | 'image';
    title?: string | null;
    url: string;
    thumbnailUrl?: string | null;
    isActive: boolean;
}

export interface ClientLogo {
    id: string;
    name?: string | null;
    url: string;
    isActive: boolean;
}

export interface ProductItem {
    id?: string;
    name: string;
    description: string;
    price: number;
    originalPrice?: number | null;
    quantity: number;
    showDiscount?: boolean;
}

export interface Proposal {
    id: string;
    proposalNumber?: string | null;
    clientName: string;
    clientCompany?: string | null;
    introduction?: string | null;
    clientEmail: string;
    clientPhone?: string | null;
    clientId?: string | null;
    status: string;
    template?: string | null;
    createdAt: string | Date;
    items: ProductItem[];
    recurringItems: ProductItem[];
    totalOneTime: number;
    totalRecurring: number;
    paymentMethods?: string[];
    paymentLink?: string | null;
    paymentTerms?: string[];
    notes?: string[];
    validityDays?: number | null;
    recurringPeriodType?: string | null;
    recurringPeriod?: number | null;
    includePortfolio?: boolean;
    includeClientLogos?: boolean;
    clientLogosGrayscale?: boolean;
    portfolioItems?: PortfolioItem[];
    customColors?: {
        headerBg?: string;
        introductionBg?: string;
        oneTimeBg?: string;
        recurringBg?: string;
        totalBg?: string;
        notesBg?: string;
    } | null;
    createdBy?: {
        name: string;
        email: string;
        phone: string | null;
    } | null;
}

export interface Client {
    id: string;
    name: string;
    company?: string;
    email: string;
    phone?: string;
    createdAt: string | Date;
    proposalCount?: number;
    totalValue?: number;
}

// Helper to safely cast JSON array to string array
const castToStringArray = (value: any): string[] => {
    if (Array.isArray(value)) return value as string[];
    return [];
};

// --- Database Access Functions ---

async function getSessionOrThrow() {
    const session = await getSession();
    if (!session || !session.companyId) {
        throw new Error("Unauthorized: No session or company ID found");
    }
    return session;
}

// 1. Company
export async function getCompany() {
    const session = await getSession();
    if (!session || !session.companyId) return null;

    const company = await prisma.company.findUnique({
        where: { id: session.companyId },
        include: {
            portfolioItems: { where: { isActive: true }, orderBy: { createdAt: 'desc' } },
            clientLogos: { where: { isActive: true } }
        }
    });

    if (!company) return null;

    return {
        ...company,
        updatedAt: undefined,
        createdAt: undefined,
        portfolioItems: (company as any).portfolioItems?.map(({ createdAt, updatedAt, ...i }: any) => i) || [],
        clientLogos: company.clientLogos.map(({ createdAt, updatedAt, ...i }) => i),
    };
}

export async function updateCompany(data: Company) {
    const session = await getSession();
    if (!session || !session.companyId) throw new Error("Unauthorized");

    return await prisma.company.update({
        where: { id: session.companyId },
        data: {
            name: data.name,
            responsible: data.responsible,
            email: data.email,
            phone: data.phone,
            logoUrl: data.logoUrl || null,
            webhookUrl: data.webhookUrl || null,
        },
    });
}

// Helper to get start of current month
const getStartOfMonth = () => {
    const date = new Date();
    date.setDate(1);
    date.setHours(0, 0, 0, 0);
    return date;
};

// 2. Proposals
import { PLANS, PlanId } from './plans';

export async function getProposals() {
    const session = await getSession();
    if (!session || !session.companyId) return [];

    const proposals = await prisma.proposal.findMany({
        where: { companyId: session.companyId },
        include: { items: true }, // portfolioItems: true
        orderBy: { createdAt: 'desc' },
    });

    return proposals.map(p => ({
        ...p,
        createdAt: p.createdAt.toISOString(),
        status: p.status as any,
        items: p.items.filter(i => i.type === 'one-time').map(i => ({ ...i, id: i.id })),
        recurringItems: p.items.filter(i => i.type === 'recurring').map(i => ({ ...i, id: i.id })),
        portfolioItems: [], // p.portfolioItems?.map(({ createdAt, updatedAt, ...i }) => i) || [],
        paymentMethods: castToStringArray(p.paymentMethods),
        paymentTerms: castToStringArray(p.paymentTerms),
        notes: castToStringArray(p.notes),
        customColors: p.customColors as any || {},
    }));
}

export async function createProposal(data: Omit<Proposal, 'id' | 'createdAt' | 'status' | 'portfolioItems'> & { portfolioItemIds?: string[] }) {
    const session = await getSession();
    if (!session || !session.companyId) throw new Error("Unauthorized");
    const companyId = session.companyId;

    // --- CHECK PLAN LIMITS ---
    const company = await prisma.company.findUnique({
        where: { id: companyId },
        select: { plan: true, createdAt: true }
    });

    if (!company) throw new Error("Company not found");

    const planId = (company.plan || 'trial') as PlanId;
    const planConfig = PLANS[planId] || PLANS.trial;

    // Logic for Trial (Total Limit + Time Limit)
    if (planId === 'trial') {
        const daysSinceCreation = Math.floor((new Date().getTime() - new Date(company.createdAt).getTime()) / (1000 * 60 * 60 * 24));
        if (daysSinceCreation > (planConfig as any).durationDays!) {
            throw new Error("Seu período de teste expirou. Atualize seu plano para continuar criando propostas.");
        }
    }

    // Logic for Counting Proposals (Monthly for others, Total for Trial)
    let countWhere = { companyId };

    // If NOT trial, filter by current month
    if (planId !== 'trial') {
        Object.assign(countWhere, {
            createdAt: {
                gte: getStartOfMonth()
            }
        });
    }

    const currentUsage = await prisma.proposal.count({ where: countWhere });

    if (currentUsage >= planConfig.limits.proposals) {
        throw new Error(`Limite de propostas atingido para o plano ${planConfig.name}. (${currentUsage}/${planConfig.limits.proposals})`);
    }
    // -------------------------

    let client;
    if (data.clientId) {
        // Ensure client belongs to company
        const existingClient = await prisma.client.findFirst({
            where: { id: data.clientId, companyId }
        });

        if (existingClient) {
            client = await prisma.client.update({
                where: { id: data.clientId },
                data: {
                    name: data.clientName,
                    clientCompany: data.clientCompany || null,
                    phone: data.clientPhone || null,
                    email: data.clientEmail,
                }
            });
        } else {
            // Fallback if client ID sent doesn't match company (security edge case)
            // We'll proceed to finding by email within company
        }
    }

    if (!client) {
        // Try to find by email within this company
        const existingClient = await prisma.client.findFirst({
            where: {
                email: data.clientEmail,
                companyId
            }
        });

        if (existingClient) {
            client = await prisma.client.update({
                where: { id: existingClient.id },
                data: {
                    name: data.clientName,
                    clientCompany: data.clientCompany || null,
                    phone: data.clientPhone || null,
                }
            });
        } else {
            client = await prisma.client.create({
                data: {
                    companyId,
                    name: data.clientName,
                    clientCompany: data.clientCompany || null,
                    email: data.clientEmail,
                    phone: data.clientPhone || null,
                }
            });
        }
    }

    const created = await prisma.proposal.create({
        data: {
            companyId,
            userId: session.id,
            proposalNumber: data.proposalNumber || null,
            clientName: data.clientName,
            clientCompany: data.clientCompany || null,
            introduction: data.introduction || null,
            clientEmail: data.clientEmail,
            clientPhone: data.clientPhone || null,
            status: 'draft',
            template: data.template || 'classic',
            totalOneTime: data.totalOneTime,
            totalRecurring: data.totalRecurring,
            clientId: client.id,
            paymentMethods: (data.paymentMethods || []) as any,
            paymentLink: data.paymentLink || null,
            paymentTerms: (data.paymentTerms || []) as any,
            notes: (data.notes || []) as any,
            validityDays: data.validityDays || 15,
            recurringPeriodType: data.recurringPeriodType || null,
            recurringPeriod: data.recurringPeriod || null,
            customColors: (data.customColors || null) as any,
            includePortfolio: data.includePortfolio ?? false,
            includeClientLogos: data.includeClientLogos ?? false,
            clientLogosGrayscale: data.clientLogosGrayscale ?? false,
            ...(data.portfolioItemIds && data.portfolioItemIds.length > 0 && {
                portfolioItems: {
                    connect: data.portfolioItemIds.map(id => ({ id }))
                }
            }),
            items: {
                create: [
                    ...data.items.map(i => ({
                        name: i.name,
                        description: i.description,
                        price: i.price,
                        originalPrice: i.originalPrice ?? null,
                        quantity: i.quantity,
                        showDiscount: i.showDiscount ?? true,
                        type: 'one-time'
                    })),
                    ...data.recurringItems.map(i => ({
                        name: i.name,
                        description: i.description,
                        price: i.price,
                        originalPrice: i.originalPrice ?? null,
                        quantity: i.quantity,
                        showDiscount: i.showDiscount ?? true,
                        type: 'recurring'
                    }))
                ]
            }
        },
        include: { items: true }
    });

    return transformProposal(created);
}

// Helper to transform proposal for frontend
function transformProposal(p: any) {
    return {
        ...p,
        createdAt: p.createdAt.toISOString(),
        status: p.status as any,
        items: (p.items || []).filter((i: any) => i.type === 'one-time'),
        recurringItems: (p.items || []).filter((i: any) => i.type === 'recurring'),
        paymentMethods: castToStringArray(p.paymentMethods),
        paymentTerms: castToStringArray(p.paymentTerms),
        notes: castToStringArray(p.notes),
        customColors: p.customColors as any || {},
        portfolioItems: p.portfolioItems || [], // Include relations
    };
}

export async function getProposal(id: string) {
    // Public access allowed? Yes, usually proposals are shared via link.
    // However, if we wanted to restrict to authenticated user only, we'd check session here.
    // Since this is likely used for both Edit (Auth) and View (Public), we keep it open BUT
    // editing endpoints must verify ownership.
    const p = await prisma.proposal.findUnique({
        where: { id },
        include: {
            items: true,
            portfolioItems: true,
            createdBy: {
                select: { name: true, email: true, phone: true } // Fetch creator details
            }
        },
    });

    if (!p) return null;
    return transformProposal(p);
}

export async function updateProposalStatus(id: string, status: string) {
    // This might be called by public (Accept/Reject) or Admin (Negotiate)
    // If public, no session. If admin, check session?
    // "Accept" / "Reject" are usually done by the client (public).
    // So we don't enforce companyId check here strictly, or we'd break client acceptance.
    const updated = await prisma.proposal.update({
        where: { id },
        data: { status },
        include: { items: true }
    });
    return transformProposal(updated);
}

export async function deleteProposals(ids: string[]) {
    const session = await getSession();
    if (!session || !session.companyId) throw new Error("Unauthorized");

    return await prisma.proposal.deleteMany({
        where: {
            id: { in: ids },
            companyId: session.companyId // Strict ownership check
        }
    });
}

// 3. Products
export interface ProductPlan {
    id: string;
    name: string;
    description: string;
    price: number;
    originalPrice?: number | null;
}

export interface Product {
    id?: string;
    name: string;
    description: string;
    price: number;
    type: 'one-time' | 'recurring';
    plans?: ProductPlan[];
}

export async function getProducts() {
    const session = await getSession();
    if (!session || !session.companyId) return [];

    const products = await prisma.product.findMany({
        where: { companyId: session.companyId },
        orderBy: { createdAt: 'desc' },
    });
    return products.map(p => ({
        ...p,
        type: p.type as 'one-time' | 'recurring',
        plans: p.plans as unknown as ProductPlan[] || []
    }));
}

export async function createProduct(data: Omit<Product, 'id'>) {
    const session = await getSession();
    if (!session || !session.companyId) throw new Error("Unauthorized");

    return await prisma.product.create({
        data: {
            companyId: session.companyId,
            name: data.name,
            description: data.description,
            price: data.price,
            type: data.type,
            plans: data.plans as any,
        },
    });
}

export async function updateProduct(id: string, data: Omit<Product, 'id'>) {
    const session = await getSession();
    if (!session || !session.companyId) throw new Error("Unauthorized");

    // Strictly check ownership via where clause
    const existing = await prisma.product.findFirst({
        where: { id, companyId: session.companyId }
    });
    if (!existing) throw new Error("Product not found or access denied");

    return await prisma.product.update({
        where: { id },
        data: {
            name: data.name,
            description: data.description,
            price: data.price,
            type: data.type,
            plans: data.plans as any,
        },
    });
}

export async function deleteProduct(id: string) {
    const session = await getSession();
    if (!session || !session.companyId) throw new Error("Unauthorized");

    // Ensure ownership
    const existing = await prisma.product.findFirst({
        where: { id, companyId: session.companyId }
    });
    if (!existing) throw new Error("Access denied");

    return await prisma.product.delete({
        where: { id },
    });
}

// 4. Clients
export async function getClients() {
    const session = await getSession();
    if (!session || !session.companyId) return [];

    const clients = await prisma.client.findMany({
        where: { companyId: session.companyId },
        include: {
            proposals: {
                select: {
                    id: true,
                    totalOneTime: true,
                    totalRecurring: true,
                    status: true,
                }
            }
        },
        orderBy: { createdAt: 'desc' },
    });

    return clients.map(c => ({
        id: c.id,
        name: c.name,
        company: c.clientCompany, // Mapped correctly now
        email: c.email,
        phone: c.phone,
        createdAt: c.createdAt.toISOString(),
        proposalCount: c.proposals.length,
        totalValue: c.proposals.reduce((sum, p) => sum + p.totalOneTime + (p.totalRecurring * 12), 0),
        acceptedCount: c.proposals.filter(p => p.status === 'accepted').length,
    }));
}

export async function createClient(data: { name: string; email: string; phone?: string | null; company?: string | null }) {
    const session = await getSession();
    if (!session || !session.companyId) throw new Error("Unauthorized");

    // Check if client email already exists in this company
    const existing = await prisma.client.findFirst({
        where: {
            email: data.email,
            companyId: session.companyId
        }
    });
    if (existing) throw new Error("Client email already exists");

    return await prisma.client.create({
        data: {
            companyId: session.companyId,
            name: data.name,
            email: data.email,
            phone: data.phone ?? null,
            clientCompany: data.company ?? null // Mapping to new schema field
        }
    });
}

export async function updateClient(id: string, data: { name?: string; email?: string; phone?: string | null; company?: string | null }) {
    const session = await getSession();
    if (!session || !session.companyId) throw new Error("Unauthorized");

    const existing = await prisma.client.findFirst({
        where: { id, companyId: session.companyId }
    });
    if (!existing) throw new Error("Access denied");

    return await prisma.client.update({
        where: { id },
        data: {
            ...(data.name && { name: data.name }),
            ...(data.email && { email: data.email }),
            ...(data.phone !== undefined && { phone: data.phone }),
            ...(data.company !== undefined && { clientCompany: data.company }),
        }
    });
}

export async function getClient(id: string) {
    const session = await getSession();
    if (!session || !session.companyId) return null; // Clients details are private to company

    const client = await prisma.client.findFirst({
        where: { id, companyId: session.companyId },
        include: {
            proposals: {
                include: { items: true },
                orderBy: { createdAt: 'desc' }
            }
        }
    });

    if (!client) return null;

    return {
        ...client,
        company: client.clientCompany,
        createdAt: client.createdAt.toISOString(),
        proposalCount: client.proposals.length,
        totalValue: client.proposals.reduce((sum: number, p: { totalOneTime: number; totalRecurring: number }) => sum + p.totalOneTime + (p.totalRecurring * 12), 0),
        proposals: client.proposals.map(transformProposal)
    };
}

// 5. Update Proposal
export interface ProposalUpdateData {
    clientName?: string;
    clientCompany?: string;
    introduction?: string | null;
    clientEmail?: string;
    clientPhone?: string;
    paymentMethods?: string[];
    paymentLink?: string | null;
    paymentTerms?: string[];
    validityDays?: number;
    notes?: string[];
    items?: ProductItem[];
    recurringItems?: ProductItem[];
    totalOneTime?: number;
    totalRecurring?: number;
    recurringPeriod?: number;
    recurringPeriodType?: string;
    customColors?: any;
    status?: string;
    includePortfolio?: boolean;
    includeClientLogos?: boolean;
    clientLogosGrayscale?: boolean;
    portfolioItemIds?: string[];
}

export async function updateProposal(id: string, data: ProposalUpdateData) {
    const session = await getSession();
    if (!session || !session.companyId) throw new Error("Unauthorized");

    // Very Important: Verify ownership first!
    const existing = await prisma.proposal.findFirst({
        where: { id, companyId: session.companyId }
    });
    if (!existing) throw new Error("Proposal not found or access denied");

    // Delete existing items if new items are provided
    if (data.items || data.recurringItems) {
        await prisma.productItem.deleteMany({
            where: { proposalId: id }
        });
    }

    const updated = await prisma.proposal.update({
        where: { id },
        data: {
            ...(data.clientName && { clientName: data.clientName }),
            ...(data.clientCompany && { clientCompany: data.clientCompany }),
            ...(data.introduction !== undefined && { introduction: data.introduction }),
            ...(data.clientEmail && { clientEmail: data.clientEmail }),
            ...(data.clientPhone && { clientPhone: data.clientPhone }),
            ...(data.paymentMethods && { paymentMethods: data.paymentMethods }),
            ...(data.paymentLink !== undefined && { paymentLink: data.paymentLink }),
            ...(data.paymentTerms && { paymentTerms: data.paymentTerms }),
            ...(data.validityDays && { validityDays: data.validityDays }),
            ...(data.notes && { notes: data.notes }),
            ...(data.totalOneTime !== undefined && { totalOneTime: data.totalOneTime }),
            ...(data.totalRecurring !== undefined && { totalRecurring: data.totalRecurring }),
            ...(data.recurringPeriod !== undefined && { recurringPeriod: data.recurringPeriod }),
            ...(data.recurringPeriodType && { recurringPeriodType: data.recurringPeriodType }),
            ...(data.customColors && { customColors: data.customColors }),
            ...(data.status && { status: data.status }),
            ...(data.includePortfolio !== undefined && { includePortfolio: data.includePortfolio }),
            ...(data.includeClientLogos !== undefined && { includeClientLogos: data.includeClientLogos }),
            ...(data.clientLogosGrayscale !== undefined && { clientLogosGrayscale: data.clientLogosGrayscale }),
            ...(data.portfolioItemIds && {
                portfolioItems: { set: data.portfolioItemIds.map(id => ({ id })) }
            }),
            items: {
                create: [
                    ...(data.items || []).map(i => ({
                        name: i.name,
                        description: i.description,
                        price: i.price,
                        originalPrice: i.originalPrice ?? null,
                        quantity: i.quantity,
                        showDiscount: i.showDiscount ?? true,
                        type: 'one-time'
                    })),
                    ...(data.recurringItems || []).map(i => ({
                        name: i.name,
                        description: i.description,
                        price: i.price,
                        originalPrice: i.originalPrice ?? null,
                        quantity: i.quantity,
                        showDiscount: i.showDiscount ?? true,
                        type: 'recurring'
                    }))
                ]
            }
        },
        include: { items: true }
    });

    return transformProposal(updated);
}

// 6. Payment Methods & Notes (Settings)

// Payment Methods
export interface PaymentMethod {
    id?: string;
    name: string;
    description?: string;
    isActive?: boolean;
}

export async function getPaymentMethods() {
    const session = await getSession();
    if (!session || !session.companyId) return [];

    return await prisma.paymentMethod.findMany({
        where: { isActive: true, companyId: session.companyId },
        orderBy: { createdAt: 'desc' }
    });
}

export async function getAllPaymentMethods() {
    const session = await getSession();
    if (!session || !session.companyId) return [];

    return await prisma.paymentMethod.findMany({
        where: { companyId: session.companyId },
        orderBy: { createdAt: 'desc' }
    });
}

export async function createPaymentMethod(data: Omit<PaymentMethod, 'id'>) {
    const session = await getSession();
    if (!session || !session.companyId) throw new Error("Unauthorized");

    return await prisma.paymentMethod.create({
        data: {
            companyId: session.companyId,
            name: data.name,
            description: data.description || null,
            isActive: data.isActive ?? true,
        }
    });
}

export async function updatePaymentMethod(id: string, data: Omit<PaymentMethod, 'id'>) {
    const session = await getSession();
    if (!session || !session.companyId) throw new Error("Unauthorized");

    const existing = await prisma.paymentMethod.findFirst({
        where: { id, companyId: session.companyId }
    });
    if (!existing) throw new Error("Access denied");

    return await prisma.paymentMethod.update({
        where: { id },
        data: {
            name: data.name,
            description: data.description || null,
            isActive: data.isActive ?? true,
        }
    });
}

export async function deletePaymentMethod(id: string) {
    const session = await getSession();
    if (!session || !session.companyId) throw new Error("Unauthorized");

    const existing = await prisma.paymentMethod.findFirst({ where: { id, companyId: session.companyId } });
    if (!existing) throw new Error("Access denied");

    return await prisma.paymentMethod.delete({ where: { id } });
}

// Proposal Notes
export interface ProposalNoteTemplate {
    id?: string;
    title: string;
    content: string;
    isActive?: boolean;
}

export async function getProposalNotes() {
    const session = await getSession();
    if (!session || !session.companyId) return [];

    return await prisma.proposalNote.findMany({
        where: { isActive: true, companyId: session.companyId },
        orderBy: { createdAt: 'desc' }
    });
}

export async function getAllProposalNotes() {
    const session = await getSession();
    if (!session || !session.companyId) return [];

    return await prisma.proposalNote.findMany({
        where: { companyId: session.companyId },
        orderBy: { createdAt: 'desc' }
    });
}

export async function createProposalNote(data: Omit<ProposalNoteTemplate, 'id'>) {
    const session = await getSession();
    if (!session || !session.companyId) throw new Error("Unauthorized");

    return await prisma.proposalNote.create({
        data: {
            companyId: session.companyId,
            title: data.title,
            content: data.content,
            isActive: data.isActive ?? true,
        }
    });
}

export async function updateProposalNote(id: string, data: Omit<ProposalNoteTemplate, 'id'>) {
    const session = await getSession();
    if (!session || !session.companyId) throw new Error("Unauthorized");

    const existing = await prisma.proposalNote.findFirst({ where: { id, companyId: session.companyId } });
    if (!existing) throw new Error("Access denied");

    return await prisma.proposalNote.update({
        where: { id },
        data: {
            title: data.title,
            content: data.content,
            isActive: data.isActive ?? true,
        }
    });
}

export async function deleteProposalNote(id: string) {
    const session = await getSession();
    if (!session || !session.companyId) throw new Error("Unauthorized");

    const existing = await prisma.proposalNote.findFirst({ where: { id, companyId: session.companyId } });
    if (!existing) throw new Error("Access denied");

    return await prisma.proposalNote.delete({ where: { id } });
}

// Payment Terms Templates
export interface PaymentTermsTemplateData {
    id?: string;
    title: string;
    content: string;
    isActive?: boolean;
}

export async function getPaymentTermsTemplates() {
    const session = await getSession();
    if (!session || !session.companyId) return [];

    return await prisma.paymentTermsTemplate.findMany({
        where: { isActive: true, companyId: session.companyId },
        orderBy: { createdAt: 'desc' }
    });
}

export async function getAllPaymentTermsTemplates() {
    const session = await getSession();
    if (!session || !session.companyId) return [];

    return await prisma.paymentTermsTemplate.findMany({
        where: { companyId: session.companyId },
        orderBy: { createdAt: 'desc' }
    });
}

export async function createPaymentTermsTemplate(data: Omit<PaymentTermsTemplateData, 'id'>) {
    const session = await getSession();
    if (!session || !session.companyId) throw new Error("Unauthorized");

    return await prisma.paymentTermsTemplate.create({
        data: {
            companyId: session.companyId,
            title: data.title,
            content: data.content,
            isActive: data.isActive ?? true,
        }
    });
}

export async function updatePaymentTermsTemplate(id: string, data: Omit<PaymentTermsTemplateData, 'id'>) {
    const session = await getSession();
    if (!session || !session.companyId) throw new Error("Unauthorized");

    const existing = await prisma.paymentTermsTemplate.findFirst({ where: { id, companyId: session.companyId } });
    if (!existing) throw new Error("Access denied");

    return await prisma.paymentTermsTemplate.update({
        where: { id },
        data: {
            title: data.title,
            content: data.content,
            isActive: data.isActive ?? true,
        }
    });
}

export async function deletePaymentTermsTemplate(id: string) {
    const session = await getSession();
    if (!session || !session.companyId) throw new Error("Unauthorized");

    const existing = await prisma.paymentTermsTemplate.findFirst({ where: { id, companyId: session.companyId } });
    if (!existing) throw new Error("Access denied");

    return await prisma.paymentTermsTemplate.delete({ where: { id } });
}

export async function getUserByEmail(email: string) {
    return await prisma.user.findUnique({
        where: { email }
    });
}

export async function updateUserPassword(userId: string, passwordHash: string) {
    return await prisma.user.update({
        where: { id: userId },
        data: { password: passwordHash }
    });
}

// --- Portfolio Functions ---

export async function getPortfolioItems() {
    const session = await getSession();
    if (!session || !session.companyId) return [];
    return await prisma.portfolioItem.findMany({
        where: { companyId: session.companyId },
        orderBy: { createdAt: 'desc' }
    });
}

export async function createPortfolioItem(data: { type: string; title?: string; url: string; thumbnailUrl?: string }) {
    const session = await getSessionOrThrow();
    if (!session.companyId) throw new Error('Company ID is required');
    return await prisma.portfolioItem.create({
        data: {
            ...data,
            companyId: session.companyId,
            type: data.type, // Explicitly map
        }
    });
}

export async function deletePortfolioItem(id: string) {
    const session = await getSessionOrThrow();
    return await prisma.portfolioItem.delete({
        where: { id, companyId: session.companyId }
    });
}

// --- Client Logo Functions ---

export async function getClientLogos() {
    const session = await getSession();
    if (!session || !session.companyId) return [];
    return await prisma.clientLogo.findMany({
        where: { companyId: session.companyId },
        orderBy: { createdAt: 'desc' }
    });
}

export async function createClientLogo(data: { name?: string; url: string }) {
    const session = await getSessionOrThrow();
    if (!session.companyId) throw new Error('Company ID is required');
    return await prisma.clientLogo.create({
        data: {
            ...data,
            companyId: session.companyId
        }
    });
}

export async function deleteClientLogo(id: string) {
    const session = await getSessionOrThrow();
    return await prisma.clientLogo.delete({
        where: { id, companyId: session.companyId }
    });
}
