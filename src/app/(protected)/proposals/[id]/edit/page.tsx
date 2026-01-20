import { fetchProposal, fetchProducts, fetchPaymentMethods, fetchProposalNotes, fetchPaymentTermsTemplates } from "@/app/actions";
import { ProposalEditForm } from "@/components/proposal-edit-form";
import { notFound } from "next/navigation";

type Props = {
    params: Promise<{ id: string }>
}

export default async function EditProposalPage({ params }: Props) {
    const { id } = await params;
    const proposal = await fetchProposal(id);
    const products = await fetchProducts();
    const paymentMethods = await fetchPaymentMethods();
    const proposalNotes = await fetchProposalNotes();
    const paymentTermsTemplates = await fetchPaymentTermsTemplates();

    if (!proposal) {
        notFound();
    }

    const transformedProposal = {
        ...proposal,
        items: proposal.items.map((item: any) => ({
            ...item,
            originalPrice: item.originalPrice ?? undefined,
        })),
        recurringItems: proposal.recurringItems.map((item: any) => ({
            ...item,
            originalPrice: item.originalPrice ?? undefined,
        })),
        paymentMethod: proposal.paymentMethods,
        paymentTerms: proposal.paymentTerms,
        notes: proposal.notes,
    };

    return (
        <ProposalEditForm
            proposal={transformedProposal}
            products={products}
            paymentMethods={paymentMethods}
            proposalNotes={proposalNotes}
            paymentTermsTemplates={paymentTermsTemplates}
        />
    );
}
