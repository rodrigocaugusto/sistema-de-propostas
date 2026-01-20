
import {
    fetchCompany,
    fetchAllPaymentMethods,
    fetchAllProposalNotes,
    fetchAllPaymentTermsTemplates,
    fetchPortfolioItems,
    fetchClientLogos,
    logoutAction
} from "@/app/actions";
import { getSession } from "@/lib/auth";
import { CompanyForm } from "@/components/company-form";
import { PaymentMethodsManager } from "@/components/payment-methods-manager";
import { ProposalNotesManager } from "@/components/proposal-notes-manager";
import { PaymentTermsManager } from "@/components/payment-terms-manager";
import { PortfolioManager } from "@/components/portfolio-manager";
import { ClientLogosManager } from "@/components/client-logos-manager";
import { IntegrationsManager } from "@/components/integrations-manager";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, CreditCard, FileText, CheckCircle, AlertCircle, Receipt, Video, ImageIcon, Link as LinkIcon } from "lucide-react";

export default async function SettingsPage() {
    const session = await getSession();
    const company = await fetchCompany();
    const paymentMethods = await fetchAllPaymentMethods() as any;
    const proposalNotes = await fetchAllProposalNotes() as any;
    const paymentTermsTemplates = await fetchAllPaymentTermsTemplates() as any;
    const portfolioItems = await fetchPortfolioItems() as any;
    const clientLogos = await fetchClientLogos() as any;

    const activePayments = paymentMethods.filter((p: any) => p.isActive).length;
    const activeNotes = proposalNotes.filter((n: any) => n.isActive).length;
    const activeTerms = paymentTermsTemplates.filter((t: any) => t.isActive).length;

    // Check integrations status
    const hasAsaas = (company as any)?.asaasApiKey;
    const activeIntegrations = hasAsaas ? 1 : 0;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
            <PageHeader
                title="Configurações"
                subtitle="Personalize seu sistema"
                iconName="settings"
                iconGradient="from-[#029DAF] to-[#027A8C]"
                session={session}
                logoutAction={logoutAction}
            />

            <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
                {/* Stats Overview - Compact Gradient Cards */}
                <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
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

                    {/* Integrations */}
                    <div className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-lg">
                        <div className="absolute top-0 right-0 p-8 bg-white/10 rounded-full -mr-4 -mt-4 blur-xl" />
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-2">
                                <LinkIcon className="h-4 w-4 opacity-80" />
                                <span className="text-xs font-medium opacity-80">Integrações</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-lg font-bold">{activeIntegrations} ativa</span>
                                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">1</span>
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
                        <div className="px-6 py-4">
                            <TabsList className="bg-transparent p-0 h-auto gap-2 flex-wrap justify-start">
                                <TabsTrigger
                                    value="company"
                                    className="relative px-3 py-1.5 bg-transparent rounded-full border border-transparent data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-700 data-[state=active]:border-emerald-200 dark:data-[state=active]:bg-emerald-900/30 dark:data-[state=active]:text-emerald-400 dark:data-[state=active]:border-emerald-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all whitespace-nowrap text-sm"
                                >
                                    <div className="flex items-center gap-2">
                                        <Building2 className="h-4 w-4" />
                                        <span className="font-medium">Empresa</span>
                                    </div>
                                </TabsTrigger>

                                <TabsTrigger
                                    value="integrations"
                                    className="relative px-3 py-1.5 bg-transparent rounded-full border border-transparent data-[state=active]:bg-indigo-100 data-[state=active]:text-indigo-700 data-[state=active]:border-indigo-200 dark:data-[state=active]:bg-indigo-900/30 dark:data-[state=active]:text-indigo-400 dark:data-[state=active]:border-indigo-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all whitespace-nowrap text-sm"
                                >
                                    <div className="flex items-center gap-2">
                                        <LinkIcon className="h-4 w-4" />
                                        <span className="font-medium">Integrações</span>
                                        {hasAsaas && (
                                            <span className="ml-1.5 text-xs bg-indigo-200/50 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300 px-2 py-0.5 rounded-full">
                                                1
                                            </span>
                                        )}
                                    </div>
                                </TabsTrigger>

                                <TabsTrigger
                                    value="payments"
                                    className="relative px-3 py-1.5 bg-transparent rounded-full border border-transparent data-[state=active]:bg-cyan-100 data-[state=active]:text-cyan-700 data-[state=active]:border-cyan-200 dark:data-[state=active]:bg-cyan-900/30 dark:data-[state=active]:text-cyan-400 dark:data-[state=active]:border-cyan-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all whitespace-nowrap text-sm"
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
                                    className="relative px-3 py-1.5 bg-transparent rounded-full border border-transparent data-[state=active]:bg-amber-100 data-[state=active]:text-amber-700 data-[state=active]:border-amber-200 dark:data-[state=active]:bg-amber-900/30 dark:data-[state=active]:text-amber-400 dark:data-[state=active]:border-amber-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all whitespace-nowrap text-sm"
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
                                    className="relative px-3 py-1.5 bg-transparent rounded-full border border-transparent data-[state=active]:bg-violet-100 data-[state=active]:text-violet-700 data-[state=active]:border-violet-200 dark:data-[state=active]:bg-violet-900/30 dark:data-[state=active]:text-violet-400 dark:data-[state=active]:border-violet-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all whitespace-nowrap text-sm"
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

                                <TabsTrigger
                                    value="portfolio"
                                    className="relative px-3 py-1.5 bg-transparent rounded-full border border-transparent data-[state=active]:bg-red-100 data-[state=active]:text-red-700 data-[state=active]:border-red-200 dark:data-[state=active]:bg-red-900/30 dark:data-[state=active]:text-red-400 dark:data-[state=active]:border-red-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all whitespace-nowrap text-sm"
                                >
                                    <div className="flex items-center gap-2">
                                        <Video className="h-4 w-4" />
                                        <span className="font-medium">Portfólio</span>
                                        {portfolioItems.length > 0 && (
                                            <span className="ml-1.5 text-xs bg-red-200/50 text-red-800 dark:bg-red-900 dark:text-red-300 px-2 py-0.5 rounded-full">
                                                {portfolioItems.length}
                                            </span>
                                        )}
                                    </div>
                                </TabsTrigger>

                                <TabsTrigger
                                    value="clients"
                                    className="relative px-3 py-1.5 bg-transparent rounded-full border border-transparent data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700 data-[state=active]:border-blue-200 dark:data-[state=active]:bg-blue-900/30 dark:data-[state=active]:text-blue-400 dark:data-[state=active]:border-blue-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all whitespace-nowrap text-sm"
                                >
                                    <div className="flex items-center gap-2">
                                        <ImageIcon className="h-4 w-4" />
                                        <span className="font-medium">Clientes</span>
                                        {clientLogos.length > 0 && (
                                            <span className="ml-1.5 text-xs bg-blue-200/50 text-blue-800 dark:bg-blue-900 dark:text-blue-300 px-2 py-0.5 rounded-full">
                                                {clientLogos.length}
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

                            <TabsContent value="integrations" className="mt-0 space-y-6">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                            <div className="h-8 w-1 bg-indigo-500 rounded-full" />
                                            Integrações
                                        </h2>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 ml-3">
                                            Conecte seu sistema a outras plataformas
                                        </p>
                                    </div>
                                </div>
                                <div className="ml-3">
                                    <IntegrationsManager apiKey={(company as any)?.asaasApiKey} />
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

                            <TabsContent value="portfolio" className="mt-0 space-y-6">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                            <div className="h-8 w-1 bg-red-500 rounded-full" />
                                            Portfólio & Cases
                                        </h2>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 ml-3">
                                            Adicione vídeos ou imagens para enriquecer suas propostas
                                        </p>
                                    </div>
                                </div>
                                <div className="ml-3">
                                    <PortfolioManager initialData={portfolioItems} />
                                </div>
                            </TabsContent>

                            <TabsContent value="clients" className="mt-0 space-y-6">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                            <div className="h-8 w-1 bg-blue-500 rounded-full" />
                                            Logos de Clientes
                                        </h2>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 ml-3">
                                            Exiba as empresas que confiam no seu trabalho
                                        </p>
                                    </div>
                                </div>
                                <div className="ml-3">
                                    <ClientLogosManager initialData={clientLogos} />
                                </div>
                            </TabsContent>
                        </div>
                    </Tabs>
                </Card>
            </main>
        </div>
    );
}
