
'use client';

import { useState } from 'react';
import { PLANS, PlanId } from '@/lib/plans';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Check, LogIn, ArrowRight, Zap, Layout, BarChart3, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function HomePage() {
    const [isAnnual, setIsAnnual] = useState(false);

    const plansToShow = Object.values(PLANS).filter(p => p.id !== 'trial');

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans">
            {/* Header / Nav */}
            <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800">
                <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white">
                            <Zap className="h-5 w-5" />
                        </div>
                        <span className="font-bold text-xl bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                            Propostas.ai
                        </span>
                    </div>
                    <Link href="/login">
                        <Button variant="ghost" className="gap-2 font-medium hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20">
                            <LogIn className="h-4 w-4" /> Entrar
                        </Button>
                    </Link>
                </div>
            </header>

            <main className="flex-1">
                {/* Hero Section */}
                <section className="relative overflow-hidden pt-32 pb-20 lg:pt-40 lg:pb-32">
                    <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-200/20 via-slate-50/50 to-slate-50 dark:from-violet-900/20 dark:via-slate-950/50 dark:to-slate-950"></div>
                    <div className="container max-w-6xl mx-auto px-6 text-center">
                        <div className="inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-sm font-medium text-violet-800 dark:border-violet-800 dark:bg-violet-950/50 dark:text-violet-300 mb-8 backdrop-blur-sm">
                            <span className="flex h-2 w-2 rounded-full bg-violet-600 mr-2 animate-pulse"></span>
                            Novidade: Integração com Stripe
                        </div>
                        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-8 leading-tight">
                            Crie Propostas Pro <br />
                            <span className="bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                Feche Mais Negócios
                            </span>
                        </h1>
                        <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
                            A plataforma completa para agências, freelancers e consultores criarem, enviarem e rastrearem propostas comerciais incríveis em segundos.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link href="/login">
                                <Button size="lg" className="h-14 px-8 text-lg rounded-full bg-violet-600 hover:bg-violet-700 text-white shadow-xl shadow-violet-500/25 hover:shadow-violet-500/40 transition-all hover:-translate-y-1">
                                    Começar Grátis Agora <ArrowRight className="ml-2 h-5 w-5" />
                                </Button>
                            </Link>
                            <Link href="#pricing">
                                <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-full border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800">
                                    Ver Planos
                                </Button>
                            </Link>
                        </div>

                        {/* Social Proof */}
                        <div className="mt-20 pt-10 border-t border-slate-200 dark:border-slate-800/50">
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-6">CONFIADO POR TIMES INOVADORES</p>
                            <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                                {/* Placeholders for logos - using text for now but styled properly */}
                                <span className="text-xl font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2"><Zap className="h-5 w-5" /> Acme Corp</span>
                                <span className="text-xl font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2"><Layout className="h-5 w-5" /> Designify</span>
                                <span className="text-xl font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2"><BarChart3 className="h-5 w-5" /> MetricsInc</span>
                                <span className="text-xl font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2"><Users className="h-5 w-5" /> TeamFlow</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section className="py-24 bg-white dark:bg-slate-900">
                    <div className="container max-w-6xl mx-auto px-6">
                        <div className="text-center max-w-3xl mx-auto mb-16">
                            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">Tudo que você precisa para vender melhor</h2>
                            <p className="text-lg text-slate-600 dark:text-slate-400">
                                Deixe de lado planilhas e PDFs estáticos. Use uma ferramenta viva que ajuda você a converter leads em clientes.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            {[
                                {
                                    icon: <Layout className="h-6 w-6 text-violet-600" />,
                                    title: "Editor Intuitivo",
                                    desc: "Crie propostas visuais com nosso editor drag-and-drop. Adicione seções, tabelas e imagens facilmente."
                                },
                                {
                                    icon: <Zap className="h-6 w-6 text-violet-600" />,
                                    title: "Geração Rápida",
                                    desc: "Use templates e variáveis para gerar propostas personalizadas em segundos, não horas."
                                },
                                {
                                    icon: <BarChart3 className="h-6 w-6 text-violet-600" />,
                                    title: "Analytics em Tempo Real",
                                    desc: "Saiba quando seu cliente abriu a proposta, quanto tempo leu e clique para fechar na hora certa."
                                }
                            ].map((feature, i) => (
                                <div key={i} className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:border-violet-200 dark:hover:border-violet-900 transition-colors group">
                                    <div className="h-12 w-12 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                        {feature.icon}
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{feature.title}</h3>
                                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                                        {feature.desc}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Pricing Section */}
                <section id="pricing" className="py-24 bg-slate-50 dark:bg-slate-950 relative overflow-hidden">
                    {/* Background decoration */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
                        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-screen animate-blob"></div>
                        <div className="absolute bottom-40 left-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-screen animate-blob animation-delay-2000"></div>
                    </div>

                    <div className="container max-w-6xl mx-auto px-6 relative">
                        <div className="text-center space-y-4 mb-16">
                            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">Planos Flexíveis</h2>
                            <p className="text-lg text-slate-600 dark:text-slate-400">Escolha o plano ideal para escalar sua operação.</p>

                            <div className="flex items-center justify-center gap-4 pt-6">
                                <span className={cn("text-sm font-medium transition-colors", !isAnnual ? "text-slate-900 dark:text-white" : "text-muted-foreground")}>
                                    Mensal
                                </span>
                                <Switch
                                    checked={isAnnual}
                                    onCheckedChange={setIsAnnual}
                                    className="data-[state=checked]:bg-violet-600"
                                />
                                <span className={cn("text-sm font-medium transition-colors", isAnnual ? "text-slate-900 dark:text-white" : "text-muted-foreground")}>
                                    Anual <span className="inline-block ml-2 text-[10px] font-bold uppercase tracking-wider text-green-600 bg-green-100 dark:bg-green-900/40 px-2 py-0.5 rounded-full ring-1 ring-green-600/20">-20% OFF</span>
                                </span>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                            {plansToShow.map((plan) => {
                                const price = isAnnual ? plan.prices.annual : plan.prices.monthly;
                                return (
                                    <div key={plan.id} className="relative group">
                                        {plan.id === 'pro' && (
                                            <div className="absolute -inset-[1px] rounded-[24px] bg-gradient-to-br from-violet-600 to-indigo-600 opacity-100 blur-sm group-hover:blur transition-all duration-300"></div>
                                        )}
                                        <Card className={cn(
                                            "relative flex flex-col h-full border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 backdrop-blur-sm rounded-[22px] overflow-hidden transition-all duration-300",
                                            plan.id === 'pro' ? "shadow-2xl shadow-violet-500/20" : "hover:shadow-xl hover:-translate-y-1"
                                        )}>
                                            {plan.id === 'pro' && (
                                                <div className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-bold text-center py-1.5 uppercase tracking-wider">
                                                    Mais Popular
                                                </div>
                                            )}

                                            <CardHeader className="pt-8 pb-4 space-y-1 text-center">
                                                <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                                                <CardDescription className="text-base">{plan.description}</CardDescription>
                                            </CardHeader>

                                            <CardContent className="flex-1 flex flex-col items-center pb-8 border-b border-slate-100 dark:border-slate-800/50">
                                                <div className="flex items-baseline gap-1 mb-1">
                                                    <span className="text-sm text-slate-500 align-top mt-2">R$</span>
                                                    <span className="text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                                                        {price.toFixed(0)}
                                                    </span>
                                                    <span className="text-slate-500 font-medium">,90</span>
                                                </div>
                                                <span className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                                                    por mês
                                                    {isAnnual && <span className="block text-xs opacity-80">(faturado anualmente)</span>}
                                                </span>

                                                <Link href="/login" className="w-full max-w-xs">
                                                    <Button
                                                        size="lg"
                                                        className={cn(
                                                            "w-full rounded-full transition-all duration-300",
                                                            plan.id === 'pro'
                                                                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 shadow-lg"
                                                                : "bg-violet-50 text-violet-700 hover:bg-violet-100 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                                                        )}
                                                    >
                                                        Assinar Agora
                                                    </Button>
                                                </Link>
                                            </CardContent>

                                            <CardContent className="pt-8 pb-8 px-8">
                                                <ul className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
                                                    <li className="flex items-start gap-3">
                                                        <div className="h-5 w-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0 mt-0.5">
                                                            <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                                                        </div>
                                                        <span>Até <strong>{plan.limits.proposals}</strong> propostas/mês</span>
                                                    </li>
                                                    <li className="flex items-start gap-3">
                                                        <div className="h-5 w-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0 mt-0.5">
                                                            <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                                                        </div>
                                                        <span>Usuários Ilimitados*</span>
                                                    </li>
                                                    <li className="flex items-start gap-3">
                                                        <div className="h-5 w-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0 mt-0.5">
                                                            <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                                                        </div>
                                                        <span>Suporte via Email</span>
                                                    </li>
                                                </ul>
                                            </CardContent>
                                        </Card>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* FAQ Section */}
                <section className="py-20 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                    <div className="container max-w-4xl mx-auto px-6 text-center">
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-12">Perguntas Frequentes</h2>
                        <div className="grid md:grid-cols-2 gap-10 text-left">
                            <div>
                                <h3 className="font-bold text-lg mb-2">Posso cancelar a qualquer momento?</h3>
                                <p className="text-slate-600 dark:text-slate-400">Sim, não há fidelidade. Você pode cancelar sua assinatura a qualquer momento através do painel.</p>
                            </div>
                            <div>
                                <h3 className="font-bold text-lg mb-2">Como funcionam os usuários extras?</h3>
                                <p className="text-slate-600 dark:text-slate-400">Cada plano base inclui 1 usuário admin. Você pode adicionar membros ilimitados por R$ 15,00/mês cada.</p>
                            </div>
                            <div>
                                <h3 className="font-bold text-lg mb-2">Aceitam PIX?</h3>
                                <p className="text-slate-600 dark:text-slate-400">Atualmente aceitamos cartões de crédito via Stripe. PIX estará disponível em breve.</p>
                            </div>
                            <div>
                                <h3 className="font-bold text-lg mb-2">Tenho suporte?</h3>
                                <p className="text-slate-600 dark:text-slate-400">Sim, todos os planos contam com suporte especializado para ajudar você a configurar suas propostas.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="bg-slate-50 dark:bg-slate-950 py-12 border-t border-slate-200 dark:border-slate-800">
                    <div className="container max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="text-center md:text-left">
                            <div className="font-bold text-xl bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                                Propostas.ai
                            </div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                © 2024 Digital Leads. Todos os direitos reservados.
                            </p>
                        </div>
                        <div className="flex gap-6 text-sm font-medium text-slate-600 dark:text-slate-400">
                            <Link href="#" className="hover:text-violet-600 transition-colors">Termos</Link>
                            <Link href="#" className="hover:text-violet-600 transition-colors">Privacidade</Link>
                            <Link href="#" className="hover:text-violet-600 transition-colors">Contato</Link>
                        </div>
                    </div>
                </footer>
            </main>
        </div>
    );
}
