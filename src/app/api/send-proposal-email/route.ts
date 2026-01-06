import { NextRequest, NextResponse } from 'next/server';
import { getProposal, getCompany } from '@/lib/db';
import { sendProposalNotification } from '@/lib/email';

export async function POST(request: NextRequest) {
    try {
        const { proposalId } = await request.json();

        if (!proposalId) {
            return NextResponse.json(
                { error: 'Proposal ID is required' },
                { status: 400 }
            );
        }

        // Get proposal details
        const proposal = await getProposal(proposalId);
        if (!proposal) {
            return NextResponse.json(
                { error: 'Proposal not found' },
                { status: 404 }
            );
        }

        // Get company details
        const company = await getCompany();

        // Build proposal URL
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.digitalleads.com.br';
        const proposalUrl = `${baseUrl}/p/${proposal.id}`;

        // Send notification email to client (without values)
        const result = await sendProposalNotification(proposal.clientEmail, {
            clientName: proposal.clientName,
            companyName: company?.name || 'Empresa',
            companyLogo: company?.logoUrl || null,
            proposalUrl,
        });

        if (result.success) {
            return NextResponse.json({
                success: true,
                messageId: result.messageId,
                message: 'Email enviado com sucesso!'
            });
        } else {
            return NextResponse.json(
                { error: 'Failed to send email', details: result.error },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error('Error sending proposal email:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
