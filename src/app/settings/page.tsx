
import { fetchCompany, fetchAllPaymentMethods, fetchAllProposalNotes, fetchAllPaymentTermsTemplates, logoutAction } from "@/app/actions";
import { CompanyForm } from "@/components/company-form";
import { PaymentMethodsManager } from "@/components/payment-methods-manager";
import { ProposalNotesManager } from "@/components/proposal-notes-manager";
import { PaymentTermsManager } from "@/components/payment-terms-manager";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { ChevronLeft, Settings, Building2, CreditCard, FileText, CheckCircle, AlertCircle, Receipt, LogOut } from "lucide-react";

export default async function SettingsPage() {
    const company = await fetchCompany();
    const paymentMethods = await fetchAllPaymentMethods() as any;
    const proposalNotes = await fetchAllProposalNotes() as any;
    const paymentTermsTemplates = await fetchAllPaymentTermsTemplates() as any;

    const activePayments = paymentMethods.filter((p: any) => p.isActive).length;
    const activeNotes = proposalNotes.filter((n: any) => n.isActive).length;
    const activeTerms = paymentTermsTemplates.filter((t: any) => t.isActive).length;

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
                                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#029DAF] to-[#027A8C] flex items-center justify-center shadow-lg">
                                    <Settings className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">Configurações</h1>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Personalize seu sistema</p>
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

            <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
                {/* Stats Overview - Compact Gradient Cards */}
                <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
                    {/* Company Status */}
                    <div className={`relative overflow-hidden rounded-2xl p-4 ${company ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' : 'bg-gradient-to-br from-amber-500 to-orange-500'} text-white shadow-lg`}>
                        <div className="absolute top-0 right-0 p-8 bg-white/10 rounded-full -mr-4 -mt-4 blur-xl" />
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-2">
                                <Building2 className="h-4 w-4 opacity-80" />
                                <span className="text-xs font-medium opacity-80">Empresa</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-lg font-bold">{company ? 'Configurada' : 'Pendente'}</span>
                                {company ? (
                                    <CheckCircle className="h-5 w-5 opacity-90" />
                                ) : (
                                    <AlertCircle className="h-5 w-5 opacity-90" />
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Payment Methods */}
                    <div className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-cyan-500 to-teal-600 text-white shadow-lg">
                        <div className="absolute top-0 right-0 p-8 bg-white/10 rounded-full -mr-4 -mt-4 blur-xl" />
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-2">
                                <CreditCard className="h-4 w-4 opacity-80" />
                                <span className="text-xs font-medium opacity-80">Pagamentos</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-lg font-bold">{activePayments} ativos</span>
                                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{paymentMethods.length}</span>
                            </div>
                        </div>
                    </div>

                    {/* Payment Terms */}
                    <div className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg">
                        <div className="absolute top-0 right-0 p-8 bg-white/10 rounded-full -mr-4 -mt-4 blur-xl" />
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-2">
                                <Receipt className="h-4 w-4 opacity-80" />
                                <span className="text-xs font-medium opacity-80">Condições</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-lg font-bold">{activeTerms} ativos</span>
                                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{paymentTermsTemplates.length}</span>
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg">
                        <div className="absolute top-0 right-0 p-8 bg-white/10 rounded-full -mr-4 -mt-4 blur-xl" />
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-2">
                                <FileText className="h-4 w-4 opacity-80" />
                                <span className="text-xs font-medium opacity-80">Notas</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-lg font-bold">{activeNotes} ativos</span>
                                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{proposalNotes.length}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs Content */}
                <Card className="bg-white dark:bg-slate-900 shadow-xl border-0">
                    <Tabs defaultValue="company" className="w-full">
                        <div className="px-6 py-4 overflow-x-auto">
                            <TabsList className="bg-transparent p-0 h-auto gap-4 flex-nowrap">
                                <TabsTrigger
                                    value="company"
                                    className="relative px-4 py-2 bg-transparent rounded-full border border-transparent data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-700 data-[state=active]:border-emerald-200 dark:data-[state=active]:bg-emerald-900/30 dark:data-[state=active]:text-emerald-400 dark:data-[state=active]:border-emerald-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all whitespace-nowrap"
                                >
                                    <div className="flex items-center gap-2">
                                        <Building2 className="h-4 w-4" />
                                        <span className="font-medium">Empresa</span>
                                    </div>
                                </TabsTrigger>
                                <TabsTrigger
                                    value="payments"
                                    className="relative px-4 py-2 bg-transparent rounded-full border border-transparent data-[state=active]:bg-cyan-100 data-[state=active]:text-cyan-700 data-[state=active]:border-cyan-200 dark:data-[state=active]:bg-cyan-900/30 dark:data-[state=active]:text-cyan-400 dark:data-[state=active]:border-cyan-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all whitespace-nowrap"
                                >
                                    <div className="flex items-center gap-2">
                                        <CreditCard className="h-4 w-4" />
                                        <span className="font-medium">Pagamentos</span>
                                        {paymentMethods.length > 0 && (
                                            <span className="ml-1.5 text-xs bg-cyan-200/50 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300 px-2 py-0.5 rounded-full">
                                                {paymentMethods.length}
                                            </span>
                                        )}
                                    </div>
                                </TabsTrigger>
                                <TabsTrigger
                                    value="terms"
                                    className="relative px-4 py-2 bg-transparent rounded-full border border-transparent data-[state=active]:bg-amber-100 data-[state=active]:text-amber-700 data-[state=active]:border-amber-200 dark:data-[state=active]:bg-amber-900/30 dark:data-[state=active]:text-amber-400 dark:data-[state=active]:border-amber-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all whitespace-nowrap"
                                >
                                    <div className="flex items-center gap-2">
                                        <Receipt className="h-4 w-4" />
                                        <span className="font-medium">Condições</span>
                                        {paymentTermsTemplates.length > 0 && (
                                            <span className="ml-1.5 text-xs bg-amber-200/50 text-amber-800 dark:bg-amber-900 dark:text-amber-300 px-2 py-0.5 rounded-full">
                                                {paymentTermsTemplates.length}
                                            </span>
                                        )}
                                    </div>
                                </TabsTrigger>
                                <TabsTrigger
                                    value="notes"
                                    className="relative px-4 py-2 bg-transparent rounded-full border border-transparent data-[state=active]:bg-violet-100 data-[state=active]:text-violet-700 data-[state=active]:border-violet-200 dark:data-[state=active]:bg-violet-900/30 dark:data-[state=active]:text-violet-400 dark:data-[state=active]:border-violet-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all whitespace-nowrap"
                                >
                                    <div className="flex items-center gap-2">
                                        <FileText className="h-4 w-4" />
                                        <span className="font-medium">Notas</span>
                                        {proposalNotes.length > 0 && (
                                            <span className="ml-1.5 text-xs bg-violet-200/50 text-violet-800 dark:bg-violet-900 dark:text-violet-300 px-2 py-0.5 rounded-full">
                                                {proposalNotes.length}
                                            </span>
                                        )}
                                    </div>
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <div className="p-6">
                            <TabsContent value="company" className="mt-0 space-y-6">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                            <div className="h-8 w-1 bg-emerald-500 rounded-full" />
                                            Informações da Empresa
                                        </h2>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 ml-3">
                                            Estas informações serão exibidas no cabeçalho das propostas comerciais
                                        </p>
                                    </div>
                                </div>
                                <div className="ml-3">
                                    <CompanyForm initialData={company} />
                                </div>
                            </TabsContent>

                            <TabsContent value="payments" className="mt-0 space-y-6">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                            <div className="h-8 w-1 bg-cyan-500 rounded-full" />
                                            Formas de Pagamento
                                        </h2>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 ml-3">
                                            Cadastre as opções de pagamento que oferece aos seus clientes
                                        </p>
                                    </div>
                                </div>
                                <div className="ml-3">
                                    <PaymentMethodsManager initialData={paymentMethods} />
                                </div>
                            </TabsContent>

                            <TabsContent value="terms" className="mt-0 space-y-6">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                            <div className="h-8 w-1 bg-amber-500 rounded-full" />
                                            Condições de Pagamento
                                        </h2>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 ml-3">
                                            Templates de condições como parcelamento, entrada, prazos de pagamento
                                        </p>
                                    </div>
                                </div>
                                <div className="ml-3">
                                    <PaymentTermsManager initialData={paymentTermsTemplates} />
                                </div>
                            </TabsContent>

                            <TabsContent value="notes" className="mt-0 space-y-6">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                            <div className="h-8 w-1 bg-violet-500 rounded-full" />
                                            Templates de Notas
                                        </h2>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 ml-3">
                                            Crie textos reutilizáveis para inserir nas propostas (garantias, prazos, etc.)
                                        </p>
                                    </div>
                                </div>
                                <div className="ml-3">
                                    <ProposalNotesManager initialData={proposalNotes} />
                                </div>
                            </TabsContent>
                        </div>
                    </Tabs>
                </Card>
            </main>
        </div>
    );
}
