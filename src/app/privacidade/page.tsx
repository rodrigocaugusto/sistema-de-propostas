import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
    title: "Política de Privacidade e Cookies | DL Pro",
    description: "Política de Privacidade e Cookies do DL Pro - Sistema de Propostas Comerciais",
};

export default function PrivacyPolicyPage() {
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
                    Política de Privacidade e Cookies
                </h1>

                <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
                    <p className="text-lg text-slate-600 dark:text-slate-400">
                        Última atualização: Janeiro de 2026
                    </p>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">1. Introdução</h2>
                        <p className="text-slate-600 dark:text-slate-400 mb-4">
                            A Digital Leads (&quot;nós&quot;, &quot;nosso&quot; ou &quot;empresa&quot;) está comprometida em proteger a privacidade
                            dos usuários do DL Pro (&quot;plataforma&quot; ou &quot;serviço&quot;). Esta Política de Privacidade descreve
                            como coletamos, usamos, armazenamos e protegemos suas informações pessoais.
                        </p>
                        <p className="text-slate-600 dark:text-slate-400">
                            Ao utilizar nosso serviço, você concorda com a coleta e uso de informações de acordo
                            com esta política.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">2. Informações que Coletamos</h2>
                        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3">2.1 Informações fornecidas por você:</h3>
                        <ul className="list-disc pl-6 text-slate-600 dark:text-slate-400 space-y-2 mb-4">
                            <li>Nome completo e informações de contato (email, telefone)</li>
                            <li>Informações da empresa (nome, CNPJ, endereço)</li>
                            <li>Dados de acesso (email e senha criptografada)</li>
                            <li>Informações de pagamento (processadas pelo Stripe)</li>
                            <li>Conteúdo de propostas comerciais criadas na plataforma</li>
                            <li>Dados de clientes cadastrados em sua conta</li>
                        </ul>

                        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3">2.2 Informações coletadas automaticamente:</h3>
                        <ul className="list-disc pl-6 text-slate-600 dark:text-slate-400 space-y-2">
                            <li>Endereço IP e informações do navegador</li>
                            <li>Dados de uso da plataforma (páginas visitadas, ações realizadas)</li>
                            <li>Cookies e tecnologias similares</li>
                            <li>Informações do dispositivo</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">3. Como Usamos Suas Informações</h2>
                        <ul className="list-disc pl-6 text-slate-600 dark:text-slate-400 space-y-2">
                            <li>Fornecer, manter e melhorar nossos serviços</li>
                            <li>Processar transações e enviar notificações relacionadas</li>
                            <li>Enviar comunicações de marketing (com seu consentimento)</li>
                            <li>Responder a solicitações de suporte</li>
                            <li>Detectar e prevenir fraudes ou abusos</li>
                            <li>Cumprir obrigações legais</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">4. Cookies e Tecnologias de Rastreamento</h2>
                        <p className="text-slate-600 dark:text-slate-400 mb-4">
                            Utilizamos cookies e tecnologias similares para melhorar sua experiência em nossa plataforma.
                        </p>

                        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3">4.1 Tipos de Cookies:</h3>
                        <ul className="list-disc pl-6 text-slate-600 dark:text-slate-400 space-y-2 mb-4">
                            <li><strong>Cookies Essenciais:</strong> Necessários para o funcionamento básico da plataforma (autenticação, segurança)</li>
                            <li><strong>Cookies de Desempenho:</strong> Coletam informações sobre como você usa a plataforma para melhorias</li>
                            <li><strong>Cookies de Funcionalidade:</strong> Lembram suas preferências e personalizam sua experiência</li>
                            <li><strong>Cookies de Marketing:</strong> Usados para exibir anúncios relevantes e medir a eficácia de campanhas</li>
                        </ul>

                        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3">4.2 Gerenciamento de Cookies:</h3>
                        <p className="text-slate-600 dark:text-slate-400">
                            Você pode configurar seu navegador para recusar cookies ou alertá-lo quando cookies estão sendo enviados.
                            Note que algumas funcionalidades da plataforma podem não funcionar corretamente sem cookies.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">5. Compartilhamento de Dados</h2>
                        <p className="text-slate-600 dark:text-slate-400 mb-4">
                            Não vendemos suas informações pessoais. Podemos compartilhar dados com:
                        </p>
                        <ul className="list-disc pl-6 text-slate-600 dark:text-slate-400 space-y-2">
                            <li><strong>Prestadores de serviço:</strong> Empresas que nos auxiliam na operação (hospedagem, email, pagamentos)</li>
                            <li><strong>Parceiros de pagamento:</strong> Stripe para processamento de transações</li>
                            <li><strong>Autoridades legais:</strong> Quando exigido por lei ou ordem judicial</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">6. Segurança dos Dados</h2>
                        <p className="text-slate-600 dark:text-slate-400">
                            Implementamos medidas técnicas e organizacionais para proteger suas informações, incluindo:
                            criptografia SSL/TLS, armazenamento seguro de senhas com hash, backups regulares
                            e controle de acesso restrito aos dados.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">7. Seus Direitos (LGPD)</h2>
                        <p className="text-slate-600 dark:text-slate-400 mb-4">
                            De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem direito a:
                        </p>
                        <ul className="list-disc pl-6 text-slate-600 dark:text-slate-400 space-y-2">
                            <li>Confirmar a existência de tratamento de dados</li>
                            <li>Acessar seus dados pessoais</li>
                            <li>Corrigir dados incompletos ou desatualizados</li>
                            <li>Solicitar a anonimização ou eliminação de dados desnecessários</li>
                            <li>Solicitar a portabilidade dos dados</li>
                            <li>Revogar o consentimento a qualquer momento</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">8. Contato</h2>
                        <p className="text-slate-600 dark:text-slate-400 mb-4">
                            Para exercer seus direitos ou esclarecer dúvidas sobre esta política, entre em contato:
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
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">9. Alterações nesta Política</h2>
                        <p className="text-slate-600 dark:text-slate-400">
                            Podemos atualizar esta política periodicamente. Notificaremos sobre alterações significativas
                            por email ou através de aviso na plataforma. Recomendamos revisar esta página regularmente.
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
