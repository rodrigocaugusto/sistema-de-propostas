
import { fetchCompany, fetchProducts, fetchPaymentMethods, fetchProposalNotes, fetchClients, fetchPaymentTermsTemplates, logoutAction } from '@/app/actions';
import { ProposalForm } from '@/components/proposal-form';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import Link from 'next/link';
import { ChevronLeft, FileText, LogOut } from 'lucide-react';

export default async function NewProposalPage() {
    const company = await fetchCompany();
    const products = await fetchProducts();
    const paymentMethods = await fetchPaymentMethods();
    const proposalNotes = await fetchProposalNotes();
    const paymentTermsTemplates = await fetchPaymentTermsTemplates();
    const clients = await fetchClients();

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
            {/* Header */}
            <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <Link href="/dashboard">
                                <Button variant="ghost" size="sm" className="text-slate-600 dark:text-slate-400">
                                    <ChevronLeft className="mr-2 h-4 w-4" />
                                    Dashboard
                                </Button>
                            </Link>
                            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
                                    <FileText className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">Nova Proposta</h1>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Crie uma proposta comercial</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <ThemeToggle />
                            <form action={logoutAction}>
                                <Button variant="ghost" size="icon" className="text-slate-600 dark:text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20">
                                    <LogOut className="h-4 w-4" />
                                </Button>
                            </form>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8">
                <ProposalForm
                    company={company}
                    products={products}
                    paymentMethods={paymentMethods}
                    proposalNotes={proposalNotes}
                    paymentTermsTemplates={paymentTermsTemplates}
                    clients={clients}
                />
            </main>
        </div>
    );
}
