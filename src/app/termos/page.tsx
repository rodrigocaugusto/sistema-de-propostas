import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
    title: "Termos de Uso e Política de Retenção de Dados | DL Pro",
    description: "Termos de Uso e Política de Retenção de Dados do DL Pro - Sistema de Propostas Comerciais",
};

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            {/* Header */}
            <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800">
                <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/">
                        <Button variant="ghost" size="sm" className="gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            Voltar
                        </Button>
                    </Link>
                    <img
                        src="/system-logo.png"
                        alt="DL Pro"
                        className="h-8 w-auto object-contain dark:invert"
                    />
                </div>
            </header>

            {/* Content */}
            <main className="container max-w-4xl mx-auto px-6 py-16">
                <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-8">
                    Termos de Uso e Política de Retenção de Dados
                </h1>

                <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
                    <p className="text-lg text-slate-600 dark:text-slate-400">
                        Última atualização: Janeiro de 2026
                    </p>

                    {/* TERMOS DE USO */}
                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">PARTE 1: TERMOS DE USO</h2>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">1. Aceitação dos Termos</h2>
                        <p className="text-slate-600 dark:text-slate-400">
                            Ao acessar ou usar o DL Pro (&quot;plataforma&quot;), você concorda em estar vinculado a estes
                            Termos de Uso. Se você não concordar com qualquer parte destes termos, não poderá
                            acessar ou usar o serviço.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">2. Descrição do Serviço</h2>
                        <p className="text-slate-600 dark:text-slate-400 mb-4">
                            O DL Pro é uma plataforma SaaS (Software as a Service) que permite:
                        </p>
                        <ul className="list-disc pl-6 text-slate-600 dark:text-slate-400 space-y-2">
                            <li>Criar e enviar propostas comerciais profissionais</li>
                            <li>Gerenciar clientes e pipeline de vendas</li>
                            <li>Receber aceite digital de propostas</li>
                            <li>Integrar com ferramentas de automação via webhooks</li>
                            <li>Gerar relatórios de desempenho comercial</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">3. Cadastro e Conta</h2>
                        <ul className="list-disc pl-6 text-slate-600 dark:text-slate-400 space-y-2">
                            <li>Você deve fornecer informações precisas e completas ao se cadastrar</li>
                            <li>É responsável por manter a confidencialidade de sua senha</li>
                            <li>Deve notificar imediatamente sobre uso não autorizado de sua conta</li>
                            <li>Não pode usar a conta de outra pessoa sem autorização</li>
                            <li>Deve ter pelo menos 18 anos para usar o serviço</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">4. Uso Aceitável</h2>
                        <p className="text-slate-600 dark:text-slate-400 mb-4">Você concorda em NÃO usar a plataforma para:</p>
                        <ul className="list-disc pl-6 text-slate-600 dark:text-slate-400 space-y-2">
                            <li>Atividades ilegais ou fraudulentas</li>
                            <li>Enviar spam ou conteúdo não solicitado</li>
                            <li>Violar direitos de propriedade intelectual</li>
                            <li>Interferir no funcionamento da plataforma</li>
                            <li>Tentar acessar contas de outros usuários</li>
                            <li>Distribuir vírus ou código malicioso</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">5. Planos e Pagamentos</h2>
                        <ul className="list-disc pl-6 text-slate-600 dark:text-slate-400 space-y-2">
                            <li>Os preços estão sujeitos a alterações com aviso prévio de 30 dias</li>
                            <li>A cobrança é realizada antecipadamente (mensal ou anual)</li>
                            <li>Não há reembolso por períodos parciais de uso</li>
                            <li>O não pagamento pode resultar em suspensão da conta</li>
                            <li>Oferecemos período de teste gratuito de 7 dias</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">6. Cancelamento</h2>
                        <p className="text-slate-600 dark:text-slate-400 mb-4">
                            Você pode cancelar sua assinatura a qualquer momento através do painel de controle.
                        </p>
                        <ul className="list-disc pl-6 text-slate-600 dark:text-slate-400 space-y-2">
                            <li>O acesso continua até o final do período já pago</li>
                            <li>Não há taxas de cancelamento</li>
                            <li>Seus dados serão retidos conforme a Política de Retenção abaixo</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">7. Propriedade Intelectual</h2>
                        <ul className="list-disc pl-6 text-slate-600 dark:text-slate-400 space-y-2">
                            <li>A plataforma e seu conteúdo são propriedade da Digital Leads</li>
                            <li>Você mantém a propriedade dos dados e conteúdos que criar</li>
                            <li>Nos concede licença para hospedar e exibir seu conteúdo para fornecer o serviço</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">8. Limitação de Responsabilidade</h2>
                        <p className="text-slate-600 dark:text-slate-400">
                            O serviço é fornecido &quot;como está&quot;. Não garantimos que estará disponível
                            100% do tempo ou livre de erros. Nossa responsabilidade é limitada ao
                            valor pago pelo serviço nos últimos 12 meses.
                        </p>
                    </section>

                    {/* POLÍTICA DE RETENÇÃO */}
                    <section className="mt-16 pt-8 border-t border-slate-200 dark:border-slate-800">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">PARTE 2: POLÍTICA DE RETENÇÃO DE DADOS</h2>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">9. Período de Retenção</h2>
                        <p className="text-slate-600 dark:text-slate-400 mb-4">
                            Mantemos seus dados pelos seguintes períodos:
                        </p>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-slate-600 dark:text-slate-400 border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-200 dark:border-slate-700">
                                        <th className="text-left py-3 px-4 font-semibold text-slate-900 dark:text-white">Tipo de Dado</th>
                                        <th className="text-left py-3 px-4 font-semibold text-slate-900 dark:text-white">Período de Retenção</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                    <tr>
                                        <td className="py-3 px-4">Dados de conta (nome, email)</td>
                                        <td className="py-3 px-4">Durante a vigência + 5 anos após cancelamento</td>
                                    </tr>
                                    <tr>
                                        <td className="py-3 px-4">Propostas comerciais</td>
                                        <td className="py-3 px-4">Durante a vigência + 5 anos</td>
                                    </tr>
                                    <tr>
                                        <td className="py-3 px-4">Dados de clientes</td>
                                        <td className="py-3 px-4">Durante a vigência + 5 anos</td>
                                    </tr>
                                    <tr>
                                        <td className="py-3 px-4">Registros de pagamento</td>
                                        <td className="py-3 px-4">10 anos (exigência fiscal)</td>
                                    </tr>
                                    <tr>
                                        <td className="py-3 px-4">Logs de acesso</td>
                                        <td className="py-3 px-4">6 meses</td>
                                    </tr>
                                    <tr>
                                        <td className="py-3 px-4">Cookies de rastreamento</td>
                                        <td className="py-3 px-4">12 meses</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">10. Exclusão de Dados</h2>
                        <p className="text-slate-600 dark:text-slate-400 mb-4">
                            Você pode solicitar a exclusão de seus dados a qualquer momento:
                        </p>
                        <ul className="list-disc pl-6 text-slate-600 dark:text-slate-400 space-y-2">
                            <li>Envie um email para contato@digitalleads.com.br</li>
                            <li>Processaremos sua solicitação em até 15 dias úteis</li>
                            <li>Alguns dados podem ser retidos por obrigação legal</li>
                            <li>Dados anonimizados podem ser mantidos para análise estatística</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">11. Backup e Recuperação</h2>
                        <ul className="list-disc pl-6 text-slate-600 dark:text-slate-400 space-y-2">
                            <li>Realizamos backups diários automáticos</li>
                            <li>Os backups são criptografados e armazenados em local seguro</li>
                            <li>Backups são retidos por 30 dias</li>
                            <li>Você pode exportar seus dados a qualquer momento</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">12. Transferência de Dados</h2>
                        <p className="text-slate-600 dark:text-slate-400">
                            Seus dados são processados em servidores localizados no Brasil e nos Estados Unidos.
                            Garantimos que todas as transferências internacionais seguem os requisitos da LGPD
                            e contamos com cláusulas contratuais padrão com nossos fornecedores.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">13. Contato</h2>
                        <p className="text-slate-600 dark:text-slate-400 mb-4">
                            Para dúvidas sobre estes termos ou solicitar exclusão de dados:
                        </p>
                        <div className="bg-slate-100 dark:bg-slate-800 rounded-xl p-6">
                            <p className="text-slate-700 dark:text-slate-300"><strong>Digital Leads</strong></p>
                            <p className="text-slate-600 dark:text-slate-400">Rua José Álvaro de Melo, 355 - Piedade</p>
                            <p className="text-slate-600 dark:text-slate-400">Jaboatão dos Guararapes / PE</p>
                            <p className="text-slate-600 dark:text-slate-400">Telefone: (81) 2011-3526</p>
                            <p className="text-slate-600 dark:text-slate-400">Email: contato@digitalleads.com.br</p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">14. Alterações</h2>
                        <p className="text-slate-600 dark:text-slate-400">
                            Reservamos o direito de modificar estes termos a qualquer momento. Alterações
                            significativas serão comunicadas por email com 30 dias de antecedência. O uso
                            continuado após as alterações constitui aceitação dos novos termos.
                        </p>
                    </section>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-slate-900 text-white py-8">
                <div className="container max-w-4xl mx-auto px-6 text-center">
                    <p className="text-slate-500 text-sm">
                        © {new Date().getFullYear()} Digital Leads. Todos os direitos reservados.
                    </p>
                </div>
            </footer>
        </div>
    );
}
