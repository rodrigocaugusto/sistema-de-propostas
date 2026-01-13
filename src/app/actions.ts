'use server'

import {
    getCompany,
    updateCompany,
    createProposal,
    getProposals,
    getProposal,
    updateProposalStatus,
    updateProposal,
    Company,
    Proposal,
    ProposalUpdateData,
    getProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    Product,
    getClients,
    getClient,
    createClient,
    updateClient,
    getPaymentMethods,
    getAllPaymentMethods,
    createPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
    PaymentMethod,
    getProposalNotes,
    getAllProposalNotes,
    createProposalNote,
    updateProposalNote,
    deleteProposalNote,
    ProposalNoteTemplate,
    getPaymentTermsTemplates,
    getAllPaymentTermsTemplates,
    createPaymentTermsTemplate,
    updatePaymentTermsTemplate,
    deletePaymentTermsTemplate,
    deleteProposals,
    PaymentTermsTemplateData
} from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { sendProposalWebhook } from '@/lib/webhook';
import { clearSession, getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getUserByEmail, updateUserPassword, prisma } from '@/lib/db';
import { sendPasswordResetEmail } from '@/lib/email';
import { hash } from 'bcryptjs';

function generateStrongPassword() {
    const length = 12;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let retVal = "";
    for (let i = 0, n = charset.length; i < length; ++i) {
        retVal += charset.charAt(Math.floor(Math.random() * n));
    }
    return retVal;
}

export async function requestPasswordReset(email: string) {
    try {
        const user = await getUserByEmail(email);

        // Security: Always return success to prevent email enumeration
        if (!user) {
            return { success: true, message: "Se o email estiver cadastrado, uma nova senha será enviada." };
        }

        const newPassword = generateStrongPassword();
        const hashedPassword = await hash(newPassword, 10);

        await updateUserPassword(user.id, hashedPassword);

        let company = null;
        if (user.companyId) {
            company = await prisma.company.findUnique({ where: { id: user.companyId } });
        }

        await sendPasswordResetEmail(user.email, {
            userName: user.name || 'Usuário',
            newPassword: newPassword,
            companyName: company?.name || 'DL Pro'
        });

        return { success: true, message: "Nova senha enviada para seu email." };
    } catch (error) {
        console.error("Reset password error:", error);
        return { success: false, error: "Erro ao processar solicitação." };
    }
}

export async function logoutAction() {
    await clearSession();
    redirect('/login');
}

export async function deleteProposalAction(ids: string[]) {
    const result = await deleteProposals(ids);
    revalidatePath('/');
    return result;
}

export async function fetchCompany() {
    return await getCompany();
}

export async function saveCompany(data: Company) {
    const session = await getSession();
    if (session?.role !== 'admin') throw new Error("Acesso negado");
    const result = await updateCompany(data);
    revalidatePath('/');
    revalidatePath('/settings');
    return result;
}

export async function updateCompanyAsaasKey(apiKey: string) {
    const session = await getSession();
    if (session?.role !== 'admin' || !session.companyId) throw new Error("Acesso negado");

    await prisma.company.update({
        where: { id: session.companyId },
        data: { asaasApiKey: apiKey }
    });

    revalidatePath('/settings');
    return { success: true };
}

export async function fetchProposals() {
    return await getProposals();
}

export async function createNewProposal(data: Omit<Proposal, 'id' | 'createdAt' | 'status' | 'portfolioItems'> & { portfolioItemIds?: string[] }) {
    try {
        const result = await createProposal(data);

        // Get full proposal with all data
        const fullProposal = await getProposal(result.id);

        if (fullProposal) {
            // Trigger Webhook
            try {
                await sendProposalWebhook('created', fullProposal);
            } catch (webhookError) {
                console.error("Erro ao enviar webhook:", webhookError);
            }

            // Send email notification to client
            try {
                const company = await getCompany();
                const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.digitalleads.com.br';
                const proposalUrl = `${baseUrl}/p/${fullProposal.id}`;

                const { sendProposalNotification } = await import('@/lib/email');
                if (company) {
                    await sendProposalNotification(fullProposal.clientEmail, {
                        clientName: fullProposal.clientName,
                        companyName: company.name || 'Empresa',
                        proposalUrl,
                    });
                }
            } catch (emailError) {
                console.error("Erro ao enviar email:", emailError);
            }
        }

        revalidatePath('/');
        revalidatePath('/clients');
        return { success: true, data: result };
    } catch (error: any) {
        console.error("CRITICAL ERROR creating proposal:", error);
        return { success: false, error: error.message || 'Unknown server error', details: JSON.stringify(error, Object.getOwnPropertyNames(error)) };
    }
}

export async function fetchProposal(id: string) {
    return await getProposal(id);
}

export async function markProposalAsViewed(id: string) {
    const result = await updateProposalStatus(id, 'viewed');
    revalidatePath(`/p/${id}`);
    return result;
}

export async function acceptProposal(id: string) {
    const result = await updateProposalStatus(id, 'accepted');

    // Asaas Integration: Helper Function to handle async without blocking if needed, but here we await to save invoice URL
    try {
        const fullProposal = await getProposal(id);
        const { prisma } = await import('@/lib/db');

        if (fullProposal) {
            const company = await prisma.company.findUnique({
                where: { id: (fullProposal as any).companyId }
            });

            if (company?.asaasApiKey) {
                console.log("Iniciando integração Asaas para proposta", id);
                const { createOrUpdateAsaasCustomer, createAsaasPayment } = await import('@/lib/asaas');

                // 1. Create/Update Customer
                const customerId = await createOrUpdateAsaasCustomer(company.asaasApiKey, {
                    name: fullProposal.clientName,
                    email: fullProposal.clientEmail,
                    phone: fullProposal.clientPhone || undefined,
                    cpfCnpj: (fullProposal as any).clientCpfCnpj || undefined, // Type cast provisório se necessário
                    mobilePhone: fullProposal.clientPhone || undefined,
                    externalReference: fullProposal.clientId || undefined
                });

                // Update Client record if exists
                if (fullProposal.clientId) {
                    await prisma.client.update({
                        where: { id: fullProposal.clientId },
                        data: { asaasCustomerId: customerId }
                    }).catch(console.error);
                }

                // Preparar descrição detalhada dos itens
                const items = (fullProposal as any).items || [];
                const oneTimeItems = items.filter((i: any) => i.type === 'one-time');
                const recurringItems = items.filter((i: any) => i.type === 'recurring');

                // Função para gerar descrição dos itens (nome + descrição)
                const buildItemsDescription = (itemsList: any[], maxChars: number = 400) => {
                    if (itemsList.length === 0) return '';

                    let desc = itemsList.map((item: any) => {
                        const qty = item.quantity > 1 ? `${item.quantity}x ` : '';
                        const itemDesc = item.description ? ` - ${item.description}` : '';
                        return `${qty}${item.name}${itemDesc}`;
                    }).join('; ');

                    if (desc.length > maxChars) {
                        desc = desc.substring(0, maxChars - 3) + '...';
                    }
                    return desc;
                };

                // Descrição base com dados do cliente
                const clientInfo = fullProposal.clientCompany
                    ? `${fullProposal.clientName} (${fullProposal.clientCompany})`
                    : fullProposal.clientName;

                // 2. Create Payment (One Time Value)
                if (fullProposal.totalOneTime > 0) {
                    const dueDate = new Date();
                    dueDate.setDate(dueDate.getDate() + 2); // Vencimento em 2 dias

                    const itemsDesc = buildItemsDescription(oneTimeItems);
                    const description = `Proposta #${fullProposal.proposalNumber || id.slice(0, 6)} | Cliente: ${clientInfo}${itemsDesc ? ` | Itens: ${itemsDesc}` : ''}`;

                    const payment = await createAsaasPayment(company.asaasApiKey, {
                        customer: customerId,
                        billingType: "UNDEFINED", // Cliente escolhe no checkout do Asaas
                        value: fullProposal.totalOneTime,
                        dueDate: dueDate.toISOString().split('T')[0],
                        description: description.slice(0, 500), // Asaas limita a 500 chars
                        externalReference: fullProposal.id
                    });

                    await prisma.proposal.update({
                        where: { id: fullProposal.id },
                        data: {
                            asaasPaymentId: payment.id,
                            asaasInvoiceUrl: payment.invoiceUrl,
                            asaasPaymentStatus: payment.status
                        }
                    });
                    console.log("Cobrança única Asaas gerada:", payment.id);
                }

                // 3. Create Subscription (Recurring Value)
                if (fullProposal.totalRecurring > 0) {
                    const { createAsaasSubscription } = await import('@/lib/asaas');
                    const nextDueDate = new Date();
                    nextDueDate.setDate(nextDueDate.getDate() + 2); // Primeiro vencimento em 2 dias

                    // Determinar ciclo baseado no período da proposta
                    let cycle: "MONTHLY" | "YEARLY" = "MONTHLY";
                    const periodType = (fullProposal as any).recurringPeriodType;
                    if (periodType === 'year' || periodType === 'years') {
                        cycle = "YEARLY";
                    }

                    // Calcular maxPayments se período for definido
                    let maxPayments: number | undefined;
                    const period = (fullProposal as any).recurringPeriod;
                    if (period && period > 0 && periodType !== 'indeterminate') {
                        if (cycle === "MONTHLY") {
                            maxPayments = periodType === 'year' || periodType === 'years'
                                ? period * 12
                                : period;
                        } else {
                            maxPayments = period;
                        }
                    }

                    const itemsDesc = buildItemsDescription(recurringItems);
                    const cycleLabel = cycle === "MONTHLY" ? "Mensal" : "Anual";
                    const description = `Proposta #${fullProposal.proposalNumber || id.slice(0, 6)} | ${cycleLabel} | Cliente: ${clientInfo}${itemsDesc ? ` | Serviços: ${itemsDesc}` : ''}`;

                    try {
                        const subscription = await createAsaasSubscription(company.asaasApiKey, {
                            customer: customerId,
                            billingType: "UNDEFINED",
                            value: fullProposal.totalRecurring,
                            nextDueDate: nextDueDate.toISOString().split('T')[0],
                            cycle,
                            description: description.slice(0, 500), // Asaas limita a 500 chars
                            externalReference: fullProposal.id,
                            maxPayments
                        });

                        await prisma.proposal.update({
                            where: { id: fullProposal.id },
                            data: {
                                asaasSubscriptionId: subscription.id
                            }
                        });
                        console.log("Assinatura Asaas gerada:", subscription.id);
                    } catch (subError) {
                        console.error("Erro ao criar assinatura Asaas:", subError);
                    }
                }
            }
        }
    } catch (error) {
        console.error("Erro na integração Asaas:", error);
        // Silently fail integration issues to not check rollback acceptance
    }

    // Send acceptance confirmation email to the company
    try {
        const proposal = await getProposal(id);

        if (proposal) {
            // Get company from proposal's companyId (works without session)
            const { prisma } = await import('@/lib/db');
            const company = await prisma.company.findUnique({
                where: { id: (proposal as any).companyId }
            });

            if (company && company.email) {
                const { sendAcceptanceConfirmation } = await import('@/lib/email');

                // Build proposal URL
                const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.digitalleads.com.br';
                const proposalUrl = `${baseUrl}/p/${proposal.id}`;

                await sendAcceptanceConfirmation(company.email, {
                    companyEmail: company.email,
                    companyName: company.name,
                    clientName: proposal.clientName,
                    clientEmail: proposal.clientEmail,
                    clientPhone: proposal.clientPhone,
                    clientCompany: proposal.clientCompany,
                    proposalNumber: proposal.proposalNumber,
                    proposalUrl,
                    totalOneTime: proposal.totalOneTime,
                    totalRecurring: proposal.totalRecurring
                });
                console.log(`Acceptance email sent for proposal ${proposal.id}`);
            }

            // Trigger Webhook
            await sendProposalWebhook('accepted', proposal);
        }

    } catch (error) {
        console.error('Failed to send acceptance email:', error);
        // Don't fail the action if email sending fails, just log it
    }

    revalidatePath(`/p/${id}`);
    revalidatePath('/');
    return result;
}

export async function rejectProposal(id: string) {
    const result = await updateProposalStatus(id, 'rejected');

    // Trigger Webhook
    const proposal = await getProposal(id);
    if (proposal) await sendProposalWebhook('rejected', proposal);

    revalidatePath(`/p/${id}`);
    revalidatePath('/');
    return result;
}

export async function negotiateProposal(id: string) {
    const result = await updateProposalStatus(id, 'negotiating');

    // Trigger Webhook
    const proposal = await getProposal(id);
    if (proposal) await sendProposalWebhook('negotiating', proposal);

    revalidatePath(`/p/${id}`);
    revalidatePath('/');
    return result;
}

export async function editProposal(id: string, data: ProposalUpdateData) {
    const result = await updateProposal(id, data);
    revalidatePath(`/p/${id}`);
    revalidatePath(`/proposals/${id}/edit`);
    revalidatePath('/');
    revalidatePath('/clients');
    return result;
}

// --- Products / Services Actions ---

export async function fetchProducts() {
    return await getProducts();
}

export async function saveProduct(data: Omit<Product, 'id'>) {
    const session = await getSession();
    if (session?.role !== 'admin') throw new Error("Acesso negado");
    const result = await createProduct(data);
    revalidatePath('/products');
    revalidatePath('/proposals/new');
    return result;
}

export async function editProduct(id: string, data: Omit<Product, 'id'>) {
    const session = await getSession();
    if (session?.role !== 'admin') throw new Error("Acesso negado");
    const result = await updateProduct(id, data);
    revalidatePath('/products');
    revalidatePath('/proposals/new');
    return result;
}

export async function removeProduct(id: string) {
    const session = await getSession();
    if (session?.role !== 'admin') throw new Error("Acesso negado");
    const result = await deleteProduct(id);
    revalidatePath('/products');
    revalidatePath('/proposals/new');
    return result;
}

// --- Clients Actions ---

export async function fetchClients() {
    return await getClients();
}

export async function fetchClientById(id: string) {
    return await getClient(id);
}

export async function saveClient(data: { name: string; email: string; phone?: string | null; company?: string | null; cpfCnpj?: string | null }) {
    const result = await createClient(data);
    revalidatePath('/clients');
    return result;
}

export async function editClient(id: string, data: { name?: string; email?: string; phone?: string | null; company?: string | null; cpfCnpj?: string | null }) {
    const result = await updateClient(id, data);
    revalidatePath('/clients');
    revalidatePath(`/clients/${id}`);
    return result;
}

// --- Payment Methods Actions ---

export async function fetchPaymentMethods() {
    return await getPaymentMethods();
}

export async function fetchAllPaymentMethods() {
    return await getAllPaymentMethods();
}

export async function savePaymentMethod(data: Omit<PaymentMethod, 'id'>) {
    const session = await getSession();
    if (session?.role !== 'admin') throw new Error("Acesso negado");
    const result = await createPaymentMethod(data);
    revalidatePath('/settings');
    revalidatePath('/proposals/new');
    return result;
}

export async function editPaymentMethod(id: string, data: Omit<PaymentMethod, 'id'>) {
    const session = await getSession();
    if (session?.role !== 'admin') throw new Error("Acesso negado");
    const result = await updatePaymentMethod(id, data);
    revalidatePath('/settings');
    revalidatePath('/proposals/new');
    return result;
}

export async function removePaymentMethod(id: string) {
    const session = await getSession();
    if (session?.role !== 'admin') throw new Error("Acesso negado");
    const result = await deletePaymentMethod(id);
    revalidatePath('/settings');
    revalidatePath('/proposals/new');
    return result;
}

// --- Proposal Notes Actions ---

export async function fetchProposalNotes() {
    return await getProposalNotes();
}

export async function fetchAllProposalNotes() {
    return await getAllProposalNotes();
}

export async function saveProposalNote(data: Omit<ProposalNoteTemplate, 'id'>) {
    const session = await getSession();
    if (session?.role !== 'admin') throw new Error("Acesso negado");
    const result = await createProposalNote(data);
    revalidatePath('/settings');
    revalidatePath('/proposals/new');
    return result;
}

export async function editProposalNote(id: string, data: Omit<ProposalNoteTemplate, 'id'>) {
    const session = await getSession();
    if (session?.role !== 'admin') throw new Error("Acesso negado");
    const result = await updateProposalNote(id, data);
    revalidatePath('/settings');
    revalidatePath('/proposals/new');
    return result;
}

export async function removeProposalNote(id: string) {
    const session = await getSession();
    if (session?.role !== 'admin') throw new Error("Acesso negado");
    const result = await deleteProposalNote(id);
    revalidatePath('/settings');
    revalidatePath('/proposals/new');
    return result;
}

// --- Payment Terms Templates Actions ---

export async function fetchPaymentTermsTemplates() {
    return await getPaymentTermsTemplates();
}

export async function fetchAllPaymentTermsTemplates() {
    return await getAllPaymentTermsTemplates();
}

export async function savePaymentTermsTemplate(data: Omit<PaymentTermsTemplateData, 'id'>) {
    const session = await getSession();
    if (session?.role !== 'admin') throw new Error("Acesso negado");
    const result = await createPaymentTermsTemplate(data);
    revalidatePath('/settings');
    revalidatePath('/proposals/new');
    return result;
}

export async function editPaymentTermsTemplate(id: string, data: Omit<PaymentTermsTemplateData, 'id'>) {
    const session = await getSession();
    if (session?.role !== 'admin') throw new Error("Acesso negado");
    const result = await updatePaymentTermsTemplate(id, data);
    revalidatePath('/settings');
    revalidatePath('/proposals/new');
    return result;
}

export async function removePaymentTermsTemplate(id: string) {
    const session = await getSession();
    if (session?.role !== 'admin') throw new Error("Acesso negado");
    const result = await deletePaymentTermsTemplate(id);
    revalidatePath('/settings');
    revalidatePath('/proposals/new');
    return result;
}

// --- Portfolio Actions ---

export async function fetchPortfolioItems() {
    const session = await getSession();
    if (!session?.companyId) return [];

    return await prisma.portfolioItem.findMany({
        where: { companyId: session.companyId },
        orderBy: { createdAt: 'desc' }
    });
}

export async function savePortfolioItem(data: { type: 'video' | 'image'; title?: string; url: string; thumbnailUrl?: string; items?: any[] }) {
    const session = await getSession();
    if (session?.role !== 'admin') throw new Error("Acesso negado");

    let finalUrl = data.url;
    let finalThumbnail = data.thumbnailUrl;

    // Serialize items to URL field to support galleries without DB schema changes
    if (data.items && data.items.length > 0) {
        finalUrl = `JSON::${JSON.stringify(data.items)}`;
        // Ensure thumbnail from first item
        if (!finalThumbnail) {
            const first = data.items[0];
            finalThumbnail = first.thumbnail || first.thumbnailUrl || (first.type === 'image' ? first.url : undefined);
        }
    }

    // Remove 'items' from the payload passed to Prisma
    const { items, ...cleanData } = data;

    const result = await prisma.portfolioItem.create({
        data: {
            ...cleanData,
            url: finalUrl,
            thumbnailUrl: finalThumbnail,
            companyId: session.companyId!
        }
    });
    revalidatePath('/settings');
    return result;
}

export async function removePortfolioItem(id: string) {
    const session = await getSession();
    if (session?.role !== 'admin') throw new Error("Acesso negado");

    // Ensure ownership
    const existing = await prisma.portfolioItem.findFirst({ where: { id, companyId: session.companyId } });
    if (!existing) throw new Error("Access denied");

    const result = await prisma.portfolioItem.delete({ where: { id } });
    revalidatePath('/settings');
    return result;
}

// --- Client Logos Actions ---

export async function fetchClientLogos() {
    const session = await getSession();
    if (!session?.companyId) return [];

    return await prisma.clientLogo.findMany({
        where: { companyId: session.companyId },
        orderBy: { createdAt: 'desc' }
    });
}

export async function saveClientLogo(data: { name?: string; url: string }) {
    const session = await getSession();
    if (session?.role !== 'admin') throw new Error("Acesso negado");

    const result = await prisma.clientLogo.create({
        data: {
            ...data,
            companyId: session.companyId!
        }
    });
    revalidatePath('/settings');
    return result;
}

export async function removeClientLogo(id: string) {
    const session = await getSession();
    if (session?.role !== 'admin') throw new Error("Acesso negado");

    const existing = await prisma.clientLogo.findFirst({ where: { id, companyId: session.companyId } });
    if (!existing) throw new Error("Access denied");

    const result = await prisma.clientLogo.delete({ where: { id } });
    revalidatePath('/settings');
    return result;
}
