import { fetchCompany, fetchProposal } from "@/app/actions";
import { getProducts } from "@/lib/db";
import { ProposalView } from "@/components/proposal-view";
import { notFound } from "next/navigation";
import { Metadata } from 'next';

type Props = {
    params: Promise<{ id: string }>
}

export async function generateMetadata(
    { params }: Props
): Promise<Metadata> {
    const id = (await params).id;
    const proposal = await fetchProposal(id);
    const company = await fetchCompany();

    if (!proposal) {
        return {
            title: 'Proposta não encontrada',
        };
    }

    return {
        title: `Proposta para ${proposal.clientName} | ${company?.name || 'Sistema de Propostas'}`,
        description: `Confira a proposta comercial preparada para ${proposal.clientName}.`,
    }
}

export default async function ProposalPage({ params }: Props) {
    const { id } = await params;
    const proposal = await fetchProposal(id);
    const company = await fetchCompany();
    const products = await getProducts();

    if (!proposal) {
        notFound();
    }

    return <ProposalView proposal={proposal} company={company} products={products as any} />;
}
