'use client';

import { useState, useEffect, useRef } from 'react';
import { PLANS, PlanId } from '@/lib/plans';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Check, LogIn, ArrowRight, Zap, Clock, Target, CreditCard, Bell, Link2, ChevronDown, Mail, MessageSquare, BarChart3, FileText, Users, Shield, Palette, Code, Briefcase, Play, Loader2, MapPin, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { toast } from 'sonner';
import { trackInitiateCheckout, trackViewContent, PLAN_VALUES, PLAN_NAMES, PlanIdType } from '@/lib/meta-pixel';

export default function HomePage() {
    const [isAnnual, setIsAnnual] = useState(false);
    const [openFaq, setOpenFaq] = useState<number | null>(null);
    const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
    const [pricingViewed, setPricingViewed] = useState(false);
    const pricingRef = useRef<HTMLElement>(null);

    const plansToShow = Object.values(PLANS).filter(p => p.id !== 'trial');

    // Track ViewContent when pricing section is visible
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !pricingViewed) {
                    trackViewContent('Pricing Section', 'plans');
                    setPricingViewed(true);
                }
            },
            { threshold: 0.3 }
        );

        if (pricingRef.current) {
            observer.observe(pricingRef.current);
        }

        return () => observer.disconnect();
    }, [pricingViewed]);

    const handleCheckout = async (planId: PlanId) => {
        setLoadingPlan(planId);

        // Track InitiateCheckout event for Meta Pixel
        const interval = isAnnual ? 'annual' : 'monthly';
        const planValue = PLAN_VALUES[planId as PlanIdType]?.[interval] || 0;
        const planName = PLAN_NAMES[planId as PlanIdType] || planId;
        trackInitiateCheckout(planId, planName, planValue, interval);

        try {
            const response = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    planId,
                    billingPeriod: interval,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao criar checkout');
            }

            if (data.url) {
                window.location.href = data.url;
            }
        } catch (error: any) {
            toast.error(error.message || 'Erro ao processar pagamento');
            setLoadingPlan(null);
        }
    };

    const faqs = [
        { q: "Como funciona o teste grátis?", a: "Você tem 7 dias para testar todas as funcionalidades sem pagar nada. Não pedimos cartão de crédito no cadastro. Depois do teste, escolhe se quer continuar e qual plano faz mais sentido." },
        { q: "E se eu ultrapassar o limite de propostas do meu plano?", a: "Sem estresse. O sistema avisa quando você está perto do limite. Se ultrapassar, você pode fazer upgrade para o próximo plano ou esperar o mês seguinte. Não bloqueamos seu acesso." },
        { q: "Posso cancelar quando quiser?", a: "Sim. Não tem contrato nem fidelidade. Cancela direto no painel com 2 cliques. Você continua usando até o final do período que já pagou." },
        { q: "Como funciona o aceite da proposta?", a: "Você envia a proposta com um link único. O cliente abre, revisa e clica em \"Aceitar Proposta\". Nesse momento você recebe uma notificação e pode partir para o contrato formal. O aceite fica registrado com data e hora no sistema." },
        { q: "Preciso assinar contrato depois que o cliente aceita?", a: "Sim. O aceite da proposta é o \"sim\" do cliente confirmando interesse e valores. Depois você envia o contrato formal para assinatura digital (usando a ferramenta que preferir: Clicksign, Docusign, etc.)." },
        { q: "As integrações via webhook são difíceis de configurar?", a: "Depende do seu conhecimento técnico. Se você já usa n8n, Make ou Zapier, é tranquilo. Se nunca mexeu, oferecemos tutoriais e suporte para ajudar na primeira configuração." },
        { q: "Vocês aceitam PIX?", a: "No momento só cartão de crédito (via Stripe). PIX está no roadmap para breve." },
        { q: "Meus dados ficam seguros?", a: "Sim. Usamos criptografia SSL, backups diários automáticos e servidores seguros. Seus dados são seus e você pode exportar tudo quando quiser." },
        { q: "Posso personalizar os templates com minha marca?", a: "Sim. Você adiciona seu logo, escolhe suas cores, ajusta textos e salva como template personalizado." },
    ];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans">
            {/* Header */}
            <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800">
                <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img
                            src="/system-logo.png"
                            alt="DL Pro"
                            className="h-10 w-auto object-contain dark:invert"
                        />
                    </div>
                    <div className="flex items-center gap-4">
                        <Link href="#pricing" className="hidden sm:block text-sm font-medium text-slate-600 hover:text-violet-600">Preços</Link>
                        <Link href="#faq" className="hidden sm:block text-sm font-medium text-slate-600 hover:text-violet-600">FAQ</Link>
                        <Link href="/login">
                            <Button variant="ghost" className="gap-2 font-medium hover:text-violet-600">
                                <LogIn className="h-4 w-4" /> Entrar
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>

            <main className="flex-1">
                {/* HERO SECTION */}
                <section className="relative overflow-hidden pt-20 pb-24 lg:pt-32 lg:pb-40">
                    <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-200/30 via-slate-50/50 to-slate-50 dark:from-violet-900/20 dark:via-slate-950/50 dark:to-slate-950"></div>
                    <div className="container max-w-5xl mx-auto px-6 text-center">
                        <div className="inline-flex items-center rounded-full border border-green-200 bg-green-50 px-4 py-1.5 text-sm font-medium text-green-700 dark:border-green-800 dark:bg-green-950/50 dark:text-green-300 mb-8">
                            <span className="flex h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
                            7 dias grátis • Sem cartão de crédito
                        </div>

                        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-6 leading-[1.1]">
                            Da Cotação ao <span className="bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">&quot;SIM&quot;</span> do Cliente<br />em Menos de <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">60 Segundos</span>
                        </h1>

                        <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto mb-10 leading-relaxed">
                            O único sistema de propostas que você realmente precisa: crie propostas profissionais em menos de 1 minuto, acompanhe cada negociação em tempo real e automatize todo seu pipeline comercial com integrações poderosas.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
                            <Link href="/register">
                                <Button size="lg" className="h-14 px-8 text-lg rounded-full bg-violet-600 hover:bg-violet-700 text-white shadow-xl shadow-violet-500/25 hover:shadow-violet-500/40 transition-all hover:-translate-y-1">
                                    Começar Grátis Agora <ArrowRight className="ml-2 h-5 w-5" />
                                </Button>
                            </Link>

                            <Link href="#demo-video">
                                <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-full border-slate-300 gap-2">
                                    <Play className="h-5 w-5" /> Ver Demo (45 seg)
                                </Button>
                            </Link>
                        </div>

                        {/* Social Proof */}
                        <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-600 dark:text-slate-400">
                            <div className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Propostas em média de 47 segundos</div>
                            <div className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Pipeline 100% organizado</div>
                            <div className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> 5.000+ integrações via webhook</div>
                        </div>

                        {/* Video Presentation */}
                        <div id="demo-video" className="mt-20 relative mx-auto max-w-5xl rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border-4 border-white/50 dark:border-slate-800 bg-slate-900">
                            <div className="aspect-video relative">
                                <iframe
                                    className="absolute inset-0 w-full h-full"
                                    src="https://www.youtube.com/embed/Bwj3MPRo5q4?rel=0"
                                    title="Apresentação do Sistema"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                ></iframe>
                            </div>
                        </div>
                    </div>
                </section>

                {/* DOR/PROBLEMA SECTION */}
                <section className="py-24 bg-slate-900 dark:bg-slate-950 text-white relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-red-900/20 to-transparent"></div>
                    <div className="container max-w-4xl mx-auto px-6 relative">
                        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
                            Você está <span className="text-red-400">perdendo vendas</span> por causa das suas propostas lentas
                        </h2>
                        <p className="text-lg text-slate-400 text-center mb-16">Seja sincero: quantas vezes você...</p>

                        <div className="space-y-8">
                            {[
                                { emoji: "😰", title: "Levou horas para montar uma proposta que deveria levar minutos?", desc: "Enquanto você formata tabelas no Word e ajusta preços na calculadora, seu concorrente já enviou 3 propostas e recebeu 2 aceites." },
                                { emoji: "🤯", title: "Perdeu o controle de quais propostas estão abertas?", desc: "Planilhas desorganizadas, e-mails perdidos, follow-ups esquecidos. Você não sabe quanto tem no pipeline nem quem está prestes a fechar." },
                                { emoji: "📉", title: "Criou uma proposta nova do zero para cada tipo de precificação?", desc: "Cliente A quer pagamento único, Cliente B quer mensalidade, Cliente C quer planos. Você refaz tudo manualmente toda vez." },
                                { emoji: "😵", title: "Enviou a proposta e ficou no vácuo?", desc: "Aquela angústia clássica: \"Será que ele viu? Será que gostou? Já posso ligar ou vou parecer desesperado?\"" },
                                { emoji: "🔗", title: "Teve que copiar dados manualmente entre suas ferramentas?", desc: "Proposta aceita aqui, tem que atualizar no CRM ali, avisar no Slack acolá, criar tarefa no Trello..." },
                            ].map((item, i) => (
                                <div key={i} className="flex gap-4 p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-red-500/30 transition-colors">
                                    <span className="text-3xl">{item.emoji}</span>
                                    <div>
                                        <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                                        <p className="text-slate-400">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-16 p-8 rounded-2xl bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20 text-center">
                            <p className="text-xl font-medium">
                                <strong>A cada proposta mal feita e demorada, você não está apenas perdendo um cliente.</strong><br />
                                <span className="text-slate-400">Está perdendo momentum, deixando dinheiro na mesa e dando vantagem para concorrentes mais ágeis.</span>
                            </p>
                        </div>
                    </div>
                </section>

                {/* SOLUÇÃO/TRANSFORMAÇÃO SECTION */}
                <section className="py-24 bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
                    <div className="container max-w-5xl mx-auto px-6">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-6">
                                E se você pudesse criar propostas profissionais em <span className="text-violet-600">47 segundos</span> e saber na hora quando o cliente aceita?
                            </h2>
                            <div className="max-w-2xl mx-auto p-6 rounded-2xl bg-violet-50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-800">
                                <p className="text-left text-slate-700 dark:text-slate-300 space-y-2">
                                    <span className="block"><strong>14h00</strong> → Lead quente pede proposta</span>
                                    <span className="block"><strong>14h01</strong> → Você cria e envia (com template pronto)</span>
                                    <span className="block"><strong>14h15</strong> → Notificação: &quot;Cliente aceitou sua proposta&quot;</span>
                                    <span className="block"><strong>14h20</strong> → Webhook dispara e atualiza seu CRM</span>
                                    <span className="block"><strong>14h30</strong> → Você liga para fechar os detalhes</span>
                                </p>
                                <p className="mt-4 font-bold text-violet-700 dark:text-violet-300">Não é ficção. É o DL Pro trabalhando para você.</p>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[
                                { icon: <Clock className="h-6 w-6" />, title: "Velocidade Brutal", desc: "60 segundos da ideia ao envio. Com templates inteligentes, você cria propostas em menos de 1 minuto.", color: "violet" },
                                { icon: <Target className="h-6 w-6" />, title: "Controle Total do Pipeline", desc: "Veja em tempo real: quantas propostas enviadas, em negociação, fechadas e quanto dinheiro em jogo.", color: "blue" },
                                { icon: <CreditCard className="h-6 w-6" />, title: "Precificação Flexível", desc: "Pagamento único, recorrência mensal/anual ou múltiplos planos. Tudo na mesma proposta, sem retrabalho.", color: "green" },
                                { icon: <Bell className="h-6 w-6" />, title: "Aceite Instantâneo", desc: "Cliente aceita com um clique e você é notificado na hora. Acabou a ansiedade de esperar resposta.", color: "amber" },
                                { icon: <Link2 className="h-6 w-6" />, title: "Automação com Webhooks", desc: "Conecte com n8n, Make, Zapier. Quando proposta é aceita, tudo acontece automaticamente.", color: "pink" },
                                { icon: <BarChart3 className="h-6 w-6" />, title: "Dashboard Completo", desc: "Todas as métricas que você precisa para tomar decisões baseadas em dados reais.", color: "cyan" },
                            ].map((item, i) => (
                                <div key={i} className={`p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all hover:-translate-y-1`}>
                                    <div className={`h-12 w-12 rounded-xl bg-${item.color}-100 dark:bg-${item.color}-900/30 flex items-center justify-center mb-4 text-${item.color}-600`}>
                                        {item.icon}
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{item.title}</h3>
                                    <p className="text-slate-600 dark:text-slate-400 text-sm">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* RECURSOS DETALHADOS */}
                <section className="py-24 bg-white dark:bg-slate-900">
                    <div className="container max-w-5xl mx-auto px-6">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">Cada recurso foi pensado para uma coisa:</h2>
                            <p className="text-xl text-violet-600 font-semibold">fazer você vender mais rápido</p>
                        </div>

                        {/* Recurso 1 */}
                        <div className="mb-20 grid lg:grid-cols-2 gap-12 items-center">
                            <div>
                                <div className="inline-flex items-center gap-2 text-violet-600 font-semibold mb-4">
                                    <Zap className="h-5 w-5" /> RECURSO 1
                                </div>
                                <h3 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-4">Do zero ao envio enquanto seu café esfria</h3>
                                <p className="text-slate-600 dark:text-slate-400 mb-6">Templates pré-prontos + Editor intuitivo = Proposta profissional em menos de 60 segundos.</p>
                                <ol className="space-y-3 text-slate-700 dark:text-slate-300">
                                    <li className="flex gap-3"><span className="h-6 w-6 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-600 flex items-center justify-center text-sm font-bold">1</span> Escolha um template do seu nicho</li>
                                    <li className="flex gap-3"><span className="h-6 w-6 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-600 flex items-center justify-center text-sm font-bold">2</span> Preencha os campos principais</li>
                                    <li className="flex gap-3"><span className="h-6 w-6 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-600 flex items-center justify-center text-sm font-bold">3</span> Ajuste com o editor visual</li>
                                    <li className="flex gap-3"><span className="h-6 w-6 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-600 flex items-center justify-center text-sm font-bold">4</span> Clique em &quot;Enviar&quot;</li>
                                </ol>
                                <p className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl text-green-700 dark:text-green-300 text-sm">
                                    <strong>Resultado:</strong> Se você envia 20 propostas/mês e cada uma levava 2 horas, você economiza 39 horas por mês. São quase 5 dias úteis de volta!
                                </p>
                            </div>
                            <div className="bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-900/30 dark:to-indigo-900/30 rounded-3xl p-8 aspect-video flex items-center justify-center">
                                <div className="text-center">
                                    <Clock className="h-16 w-16 text-violet-500 mx-auto mb-4" />
                                    <p className="text-6xl font-bold text-violet-600">47s</p>
                                    <p className="text-slate-600 dark:text-slate-400">tempo médio de criação</p>
                                </div>
                            </div>
                        </div>

                        {/* Recurso 2 - Aceite */}
                        <div className="mb-20 grid lg:grid-cols-2 gap-12 items-center">
                            <div className="order-2 lg:order-1 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-3xl p-8 aspect-video flex items-center justify-center">
                                <div className="text-center">
                                    <Bell className="h-16 w-16 text-green-500 mx-auto mb-4" />
                                    <p className="text-2xl font-bold text-green-600">&quot;Cliente aceitou sua proposta!&quot;</p>
                                    <p className="text-slate-600 dark:text-slate-400 mt-2">Notificação em tempo real</p>
                                </div>
                            </div>
                            <div className="order-1 lg:order-2">
                                <div className="inline-flex items-center gap-2 text-green-600 font-semibold mb-4">
                                    <Check className="h-5 w-5" /> RECURSO 2
                                </div>
                                <h3 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-4">Do &quot;eu quero&quot; para o contrato em segundos</h3>
                                <p className="text-slate-600 dark:text-slate-400 mb-6">Botão de aceite direto na proposta. Cliente clica, você é notificado, negócio avança.</p>
                                <ul className="space-y-4">
                                    <li className="flex gap-3 items-start"><Check className="h-5 w-5 text-green-500 mt-0.5" /> <span><strong>Menos fricção:</strong> cliente não precisa responder e-mail</span></li>
                                    <li className="flex gap-3 items-start"><Check className="h-5 w-5 text-green-500 mt-0.5" /> <span><strong>Clareza total:</strong> você sabe exatamente quando tem um &quot;sim&quot;</span></li>
                                    <li className="flex gap-3 items-start"><Check className="h-5 w-5 text-green-500 mt-0.5" /> <span><strong>Agilidade:</strong> do aceite ao contrato em minutos, não dias</span></li>
                                </ul>
                            </div>
                        </div>

                        {/* Recurso 3 - Integrações */}
                        <div className="grid lg:grid-cols-2 gap-12 items-center">
                            <div>
                                <div className="inline-flex items-center gap-2 text-blue-600 font-semibold mb-4">
                                    <Link2 className="h-5 w-5" /> RECURSO 3
                                </div>
                                <h3 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-4">Conecte com tudo. Automatize tudo.</h3>
                                <p className="text-slate-600 dark:text-slate-400 mb-8">
                                    Não seja apenas mais um formatador de propostas. Transforme seu processo comercial em uma máquina autônoma.
                                </p>

                                {/* Asaas Highlight */}
                                <div className="mb-8 p-6 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-800">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="h-8 flex items-center">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src="/asaas-logo.png" className="h-5 w-auto object-contain" alt="Asaas" />
                                        </div>
                                        <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">Integração Nativa</span>
                                    </div>
                                    <p className="text-sm text-slate-700 dark:text-slate-300">
                                        <strong>Faturamento no &quot;Aceite&quot;:</strong> Quando seu cliente clica em aceitar, nosso sistema cria automaticamente o cadastro dele e gera a cobrança (Boleto/Pix) direto no seu Asaas. Zero trabalho manual.
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                        Conecte também via Webhook:
                                    </p>
                                    <div className="flex flex-wrap gap-6 items-center opacity-70 hover:opacity-100 transition-opacity">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src="/n8n-logo.png" className="h-6 w-auto" alt="n8n" />
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src="https://cdn.worldvectorlogo.com/logos/zapier.svg" className="h-6 w-auto" alt="Zapier" />
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src="/make-logo.png" className="h-6 w-auto" alt="Make" />
                                    </div>
                                    <p className="text-sm text-slate-500">
                                        Atualize seu CRM, notifique no Slack, dispare e-mails... o céu é o limite.
                                    </p>
                                </div>
                            </div>

                            {/* Visual Logic */}
                            <div className="bg-slate-50 dark:bg-slate-800 rounded-3xl p-8 aspect-video flex flex-col items-center justify-center border border-slate-200 dark:border-slate-700 relative overflow-hidden">
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500/10 to-transparent"></div>

                                <div className="relative z-10 flex flex-col gap-4 w-full max-w-sm">
                                    {/* Flow */}
                                    <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700">
                                        <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                                            <Check className="h-6 w-6 text-green-600" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Gatilho</p>
                                            <p className="font-bold text-slate-900 dark:text-white">Proposta Aceita</p>
                                        </div>
                                    </div>

                                    <div className="h-6 w-0.5 bg-slate-300 dark:bg-slate-600 mx-auto -my-2 relative z-0"></div>

                                    <div className="grid grid-cols-1 gap-3 relative z-10">
                                        <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800">
                                            <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center shrink-0">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src="/asaas-logo.png" className="h-3 w-auto" alt="Asaas" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-blue-700 dark:text-blue-300">Automação Nativa</p>
                                                <p className="text-xs text-slate-600 dark:text-slate-400 truncate">Gerar cliente e boleto no Asaas</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 bg-pink-50 dark:bg-pink-900/20 p-3 rounded-lg border border-pink-100 dark:border-pink-800">
                                            <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center shrink-0">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src="/n8n-logo.png" className="h-4 w-auto" alt="n8n" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-pink-700 dark:text-pink-300">Webhook</p>
                                                <p className="text-xs text-slate-600 dark:text-slate-400 truncate">Enviar dados para n8n/CRM</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* TEMPLATES SECTION */}
                <section className="py-24 bg-slate-50 dark:bg-slate-950">
                    <div className="container max-w-5xl mx-auto px-6">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">Comece do 80% pronto. Sempre.</h2>
                            <p className="text-lg text-slate-600 dark:text-slate-400">Templates baseados nas melhores práticas. Você só personaliza e envia.</p>
                        </div>

                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                            {[
                                { icon: <MessageSquare className="h-6 w-6" />, title: "Marketing Digital", items: ["Gestão de Redes", "Tráfego Pago", "SEO", "Inbound"] },
                                { icon: <Code className="h-6 w-6" />, title: "Tecnologia", items: ["Website", "App Mobile", "Sistema Web", "Suporte"] },
                                { icon: <Palette className="h-6 w-6" />, title: "Design", items: ["Identidade Visual", "UI/UX", "Motion", "Gráficos"] },
                                { icon: <Briefcase className="h-6 w-6" />, title: "Consultoria", items: ["Empresarial", "Treinamentos", "Jurídica", "Contábil"] },
                            ].map((cat, i) => (
                                <div key={i} className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                                    <div className="h-12 w-12 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 mb-4">{cat.icon}</div>
                                    <h3 className="font-bold text-slate-900 dark:text-white mb-3">{cat.title}</h3>
                                    <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                                        {cat.items.map((item, j) => <li key={j}>• {item}</li>)}
                                    </ul>
                                </div>
                            ))}
                        </div>

                        <div className="flex flex-wrap justify-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                            <span className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Estrutura otimizada para conversão</span>
                            <span className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Layout visual moderno</span>
                            <span className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Campos dinâmicos</span>
                            <span className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Aceite configurado</span>
                        </div>
                    </div>
                </section>

                {/* PRICING SECTION */}
                <section ref={pricingRef} id="pricing" className="py-24 bg-white dark:bg-slate-900 relative overflow-hidden">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
                        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl"></div>
                        <div className="absolute bottom-40 left-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl"></div>
                    </div>

                    <div className="container max-w-6xl mx-auto px-6 relative">
                        <div className="text-center space-y-4 mb-16">
                            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">Escolha o plano ideal para o seu volume</h2>
                            <p className="text-lg text-slate-600 dark:text-slate-400">Sem pegadinhas. Sem taxas escondidas. Cancele quando quiser.</p>

                            <div className="flex items-center justify-center gap-4 pt-6">
                                <span className={cn("text-sm font-medium", !isAnnual ? "text-slate-900 dark:text-white" : "text-slate-400")}>Mensal</span>
                                <Switch checked={isAnnual} onCheckedChange={setIsAnnual} className="data-[state=checked]:bg-violet-600" />
                                <span className={cn("text-sm font-medium", isAnnual ? "text-slate-900 dark:text-white" : "text-slate-400")}>
                                    Anual <span className="ml-2 text-xs font-bold text-green-600 bg-green-100 dark:bg-green-900/40 px-2 py-0.5 rounded-full">-20%</span>
                                </span>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                            {plansToShow.map((plan) => {
                                const price = isAnnual ? plan.prices.annual : plan.prices.monthly;
                                return (
                                    <div key={plan.id} className="relative group">
                                        {plan.id === 'pro' && (
                                            <div className="absolute -inset-[2px] rounded-[24px] bg-gradient-to-br from-violet-600 to-indigo-600 opacity-100 blur-sm"></div>
                                        )}
                                        <Card className={cn(
                                            "relative flex flex-col h-full bg-white dark:bg-slate-900 rounded-[22px] overflow-hidden",
                                            plan.id === 'pro' ? "shadow-2xl shadow-violet-500/20" : ""
                                        )}>
                                            {plan.id === 'pro' && (
                                                <div className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-bold text-center py-1.5 uppercase tracking-wider">
                                                    ⭐ Mais Escolhido
                                                </div>
                                            )}
                                            <CardHeader className="pt-8 pb-4 text-center">
                                                <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                                                <CardDescription>{plan.description}</CardDescription>
                                            </CardHeader>
                                            <CardContent className="flex-1 flex flex-col items-center pb-8 border-b border-slate-100 dark:border-slate-800">
                                                <div className="flex items-baseline gap-1 mb-1">
                                                    <span className="text-sm text-slate-500">R$</span>
                                                    <span className="text-5xl font-extrabold text-slate-900 dark:text-white">{price.toFixed(0)}</span>
                                                    <span className="text-slate-500">,90</span>
                                                </div>
                                                <span className="text-sm text-slate-500 mb-6">por mês {isAnnual && <span className="block text-xs">(faturado anualmente)</span>}</span>
                                                <Button
                                                    size="lg"
                                                    className={cn("w-full max-w-xs rounded-full", plan.id === 'pro' ? "bg-violet-600 hover:bg-violet-700 text-white" : "")}
                                                    onClick={() => handleCheckout(plan.id as PlanId)}
                                                    disabled={loadingPlan !== null}
                                                >
                                                    {loadingPlan === plan.id ? (
                                                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processando...</>
                                                    ) : (
                                                        'Começar Agora'
                                                    )}
                                                </Button>
                                            </CardContent>
                                            <CardContent className="pt-8 pb-8 px-8">
                                                <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                                                    <li className="flex items-center gap-3"><Check className="h-4 w-4 text-green-500" /> Até <strong>{plan.limits.proposals}</strong> propostas/mês</li>
                                                    <li className="flex items-center gap-3"><Check className="h-4 w-4 text-green-500" /> Todos os templates</li>
                                                    <li className="flex items-center gap-3"><Check className="h-4 w-4 text-green-500" /> Dashboard de controle</li>
                                                    <li className="flex items-center gap-3"><Check className="h-4 w-4 text-green-500" /> Aceite do cliente</li>
                                                    <li className="flex items-center gap-3"><Check className="h-4 w-4 text-green-500" /> Webhook para integrações</li>
                                                    {plan.id !== 'basic' && <li className="flex items-center gap-3"><Check className="h-4 w-4 text-green-500" /> Templates personalizados</li>}
                                                    {plan.id === 'enterprise' && <li className="flex items-center gap-3"><Check className="h-4 w-4 text-green-500" /> Suporte via WhatsApp</li>}
                                                </ul>
                                            </CardContent>
                                        </Card>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mt-12 flex flex-wrap justify-center gap-6 text-sm text-slate-600 dark:text-slate-400">
                            <span className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> 7 dias grátis sem cartão</span>
                            <span className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Cancele quando quiser</span>
                            <span className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Atualizações gratuitas</span>
                        </div>
                    </div>
                </section>

                {/* FAQ SECTION */}
                <section id="faq" className="py-24 bg-slate-50 dark:bg-slate-950">
                    <div className="container max-w-3xl mx-auto px-6">
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white text-center mb-4">Perguntas Frequentes</h2>
                        <p className="text-center text-slate-600 dark:text-slate-400 mb-12">E nossas respostas honestas</p>

                        <div className="space-y-4">
                            {faqs.map((faq, i) => (
                                <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                                    <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between p-6 text-left">
                                        <span className="font-semibold text-slate-900 dark:text-white">{faq.q}</span>
                                        <ChevronDown className={cn("h-5 w-5 text-slate-400 transition-transform", openFaq === i && "rotate-180")} />
                                    </button>
                                    {openFaq === i && (
                                        <div className="px-6 pb-6 text-slate-600 dark:text-slate-400">{faq.a}</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA FINAL */}
                <section className="py-24 bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 text-white relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white/10 to-transparent"></div>
                    <div className="container max-w-4xl mx-auto px-6 text-center relative">
                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
                            Pare de perder vendas por causa de propostas lentas
                        </h2>
                        <p className="text-xl text-white/80 mb-4">Cada dia que passa usando planilhas e PDFs é dinheiro deixado na mesa.</p>
                        <p className="text-lg text-white/60 mb-10">A pergunta não é &quot;será que funciona?&quot;. A pergunta é: <strong className="text-white">quanto você vai perder até começar?</strong></p>

                        <Link href="/register">
                            <Button size="lg" className="h-16 px-10 text-xl rounded-full bg-white text-violet-700 hover:bg-slate-100 shadow-2xl hover:-translate-y-1 transition-all">
                                Começar Teste Grátis de 7 Dias <ArrowRight className="ml-3 h-6 w-6" />
                            </Button>
                        </Link>
                        <p className="mt-6 text-white/60">Sem cartão. Sem compromisso. Só resultados.</p>

                        <div className="mt-12 p-6 bg-white/10 backdrop-blur rounded-2xl inline-flex items-center gap-4">
                            <Shield className="h-8 w-8" />
                            <div className="text-left">
                                <p className="font-bold">Teste sem Risco por 7 Dias</p>
                                <p className="text-sm text-white/70">Use todas as funcionalidades. Se não gostar, não paga nada.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* FOOTER */}
                <footer className="bg-slate-900 text-white py-16">
                    <div className="container max-w-6xl mx-auto px-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
                            {/* Logo & Description */}
                            <div className="text-center md:text-left">
                                <div className="flex items-center gap-2 justify-center md:justify-start mb-4">
                                    <img
                                        src="/footer-logo.png"
                                        alt="Digital Leads"
                                        className="h-10 w-auto object-contain"
                                    />
                                </div>
                                <p className="text-slate-400 text-sm">Sistema de Propostas Comerciais para quem vende sério</p>
                            </div>

                            {/* Contact Info */}
                            <div className="text-center md:text-left">
                                <h4 className="font-semibold text-white mb-4">Contato</h4>
                                <div className="space-y-3 text-slate-400 text-sm">
                                    <p className="flex items-start gap-2 justify-center md:justify-start">
                                        <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                                        <span>Rua José Álvaro de Melo, 355 - Piedade<br />Jabotaão dos Guararapes / PE</span>
                                    </p>
                                    <p className="flex items-center gap-2 justify-center md:justify-start">
                                        <Phone className="h-4 w-4" />
                                        <span>(81) 2011-3526</span>
                                    </p>
                                    <p className="flex items-center gap-2 justify-center md:justify-start">
                                        <Mail className="h-4 w-4" />
                                        <span>contato@digitalleads.com.br</span>
                                    </p>
                                </div>
                            </div>

                            {/* Links */}
                            <div className="text-center md:text-left">
                                <h4 className="font-semibold text-white mb-4">Legal</h4>
                                <div className="flex flex-col gap-2 text-sm text-slate-400">
                                    <Link href="/termos" className="hover:text-white transition-colors">Termos de Uso</Link>
                                    <Link href="/privacidade" className="hover:text-white transition-colors">Privacidade e Cookies</Link>
                                    <Link href="#faq" className="hover:text-white transition-colors">FAQ</Link>
                                </div>
                            </div>
                        </div>

                        <div className="mt-12 pt-8 border-t border-slate-800 text-center text-sm text-slate-500">
                            © {new Date().getFullYear()} Digital Leads. Todos os direitos reservados.
                        </div>
                    </div>
                </footer>
            </main>
        </div>
    );
}
