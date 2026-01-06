
import { prisma } from './db';

const WEBHOOK_TIMEOUT = 5000; // 5 seconds timeout

export async function sendProposalWebhook(
    event: 'created' | 'accepted' | 'rejected' | 'negotiating',
    proposal: any // Accepts the proposal object (Prisma result or Proposal interface)
) {
    try {
        let company;

        // If proposal has companyId (it should now), fetch directly
        if (proposal.companyId) {
            company = await prisma.company.findUnique({
                where: { id: proposal.companyId }
            });
        }

        if (!company || !company.webhookUrl) {
            return;
        }

        // Helper to safe parse/format
        const safeDate = (d: any) => d ? new Date(d).toISOString() : null;

        const payload = {
            event,
            timestamp: new Date().toISOString(),
            proposal: {
                id: proposal.id,
                number: proposal.proposalNumber,
                status: event === 'created' ? (proposal.status || 'draft') : event,
                introduction: proposal.introduction,

                client: {
                    name: proposal.clientName,
                    company: proposal.clientCompany,
                    email: proposal.clientEmail,
                    phone: proposal.clientPhone,
                    id: proposal.clientId
                },

                financials: {
                    totalOneTime: proposal.totalOneTime,
                    totalRecurring: proposal.totalRecurring,
                    currency: 'BRL',
                    validityDays: proposal.validityDays
                },

                recurrence: {
                    period: proposal.recurringPeriod,
                    periodType: proposal.recurringPeriodType
                },

                payment: {
                    methods: proposal.paymentMethods,
                    terms: proposal.paymentTerms,
                    link: proposal.paymentLink
                },

                items: proposal.items, // Includes products
                recurringItems: proposal.recurringItems,

                notes: proposal.notes,

                metadata: {
                    createdAt: safeDate(proposal.createdAt),
                    updatedAt: safeDate(proposal.updatedAt)
                }
            }
        };

        // Fire request
        await fetch(company.webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Proposals-System-Webhook/1.0'
            },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(WEBHOOK_TIMEOUT)
        });

        console.log(`Webhook sent successfully for proposal ${proposal.id} [${event}]`);

    } catch (error) {
        console.error('Failed to send webhook:', error);
        // Swallow error to prevent blocking UI
    }
}
