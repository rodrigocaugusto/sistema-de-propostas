import { fetchCompanyById, fetchProposal } from "@/app/actions";
import { getProducts, prisma } from "@/lib/db";
import { ProposalView } from "@/components/proposal-view";
import { ProposalViewModern } from "@/components/proposal-view-modern";
import { ProposalViewMinimal } from "@/components/proposal-view-minimal";
import { notFound } from "next/navigation";
import { Metadata } from 'next';
import { ProposalTemplateId } from "@/lib/proposal-templates";

type Props = {
    params: Promise<{ id: string }>
}

export async function generateMetadata(
    { params }: Props
): Promise<Metadata> {
    const id = (await params).id;
    const proposal = await fetchProposal(id);

    if (!proposal) {
        return {
            title: 'Proposta não encontrada',
        };
    }

    // Get company from proposal's companyId
    const company = await fetchCompanyById((proposal as any).companyId);

    return {
        title: `Proposta para ${proposal.clientName} | ${company?.name || 'DL Pro'}`,
        description: `Confira a proposta comercial preparada para ${proposal.clientName}.`,
    }
}

// Component to render the correct template based on proposal.template
function ProposalTemplate({
    template,
    proposal,
    company,
    products
}: {
    template: ProposalTemplateId;
    proposal: any;
    company: any;
    products: any[];
}) {
    switch (template) {
        case 'modern':
            return <ProposalViewModern proposal={proposal} company={company} products={products} />;
        case 'minimal':
            return <ProposalViewMinimal proposal={proposal} company={company} products={products} />;
        case 'classic':
        default:
            return <ProposalView proposal={proposal} company={company} products={products} />;
    }
}

export default async function ProposalPage({ params }: Props) {
    const { id } = await params;
    const proposal = await fetchProposal(id);

    if (!proposal) {
        notFound();
    }

    // Get company from proposal's companyId (this is the fix for multi-tenant logo bug)
    const company = await fetchCompanyById((proposal as any).companyId);

    // Get products for the company (for potential upsell display)
    const products = await prisma.product.findMany({
        where: { companyId: (proposal as any).companyId }
    });

    // Get template from proposal, default to 'classic'
    const template = ((proposal as any).template || 'classic') as ProposalTemplateId;

    return (
        <ProposalTemplate
            template={template}
            proposal={proposal}
            company={company}
            products={products as any}
        />
    );
}

