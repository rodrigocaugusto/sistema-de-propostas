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
import { clearSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

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
    const result = await updateCompany(data);
    revalidatePath('/');
    revalidatePath('/settings');
    return result;
}

export async function fetchProposals() {
    return await getProposals();
}

export async function createNewProposal(data: Omit<Proposal, 'id' | 'createdAt' | 'status'>) {
    const result = await createProposal(data);

    // Get full proposal with all data
    const fullProposal = await getProposal(result.id);

    if (fullProposal) {
        // Trigger Webhook
        await sendProposalWebhook('created', fullProposal);

        // Send email notification to client
        try {
            const company = await getCompany();
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.digitalleads.com.br';
            const proposalUrl = `${baseUrl}/p/${fullProposal.id}`;

            const { sendProposalNotification } = await import('@/lib/email');
            await sendProposalNotification(fullProposal.clientEmail, {
                clientName: fullProposal.clientName,
                companyName: company?.name || 'Empresa',
                companyLogo: company?.logoUrl || null,
                proposalUrl,
            });
            console.log(`Email sent to client for proposal ${fullProposal.id}`);
        } catch (error) {
            console.error('Failed to send proposal email:', error);
            // Don't fail the action if email sending fails
        }
    }

    revalidatePath('/');
    revalidatePath('/clients');
    return result;
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
    const result = await createProduct(data);
    revalidatePath('/products');
    revalidatePath('/proposals/new');
    return result;
}

export async function editProduct(id: string, data: Omit<Product, 'id'>) {
    const result = await updateProduct(id, data);
    revalidatePath('/products');
    revalidatePath('/proposals/new');
    return result;
}

export async function removeProduct(id: string) {
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

export async function saveClient(data: { name: string; email: string; phone?: string | null; company?: string | null }) {
    const result = await createClient(data);
    revalidatePath('/clients');
    return result;
}

export async function editClient(id: string, data: { name?: string; email?: string; phone?: string | null; company?: string | null }) {
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
    const result = await createPaymentMethod(data);
    revalidatePath('/settings');
    revalidatePath('/proposals/new');
    return result;
}

export async function editPaymentMethod(id: string, data: Omit<PaymentMethod, 'id'>) {
    const result = await updatePaymentMethod(id, data);
    revalidatePath('/settings');
    revalidatePath('/proposals/new');
    return result;
}

export async function removePaymentMethod(id: string) {
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
    const result = await createProposalNote(data);
    revalidatePath('/settings');
    revalidatePath('/proposals/new');
    return result;
}

export async function editProposalNote(id: string, data: Omit<ProposalNoteTemplate, 'id'>) {
    const result = await updateProposalNote(id, data);
    revalidatePath('/settings');
    revalidatePath('/proposals/new');
    return result;
}

export async function removeProposalNote(id: string) {
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
    const result = await createPaymentTermsTemplate(data);
    revalidatePath('/settings');
    revalidatePath('/proposals/new');
    return result;
}

export async function editPaymentTermsTemplate(id: string, data: Omit<PaymentTermsTemplateData, 'id'>) {
    const result = await updatePaymentTermsTemplate(id, data);
    revalidatePath('/settings');
    revalidatePath('/proposals/new');
    return result;
}

export async function removePaymentTermsTemplate(id: string) {
    const result = await deletePaymentTermsTemplate(id);
    revalidatePath('/settings');
    revalidatePath('/proposals/new');
    return result;
}
