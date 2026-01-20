'use client';

import { useEffect, useState } from 'react';
import { Proposal, Company, Product } from '@/lib/db';
import { getContrastTextStyle, getContrastMutedStyle, isDarkColor } from '@/lib/colors';
import { markProposalAsViewed, acceptProposal, rejectProposal, negotiateProposal } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Share2, Check, Mail, Phone, Calendar, ArrowRight, ArrowDown, ChevronDown, MousePointerClick, ShieldCheck, X, MessageCircle, Printer, CreditCard, FileText, Sparkles, Tag } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';
import { PortfolioSection, ClientLogosSection } from '@/components/proposal-preview-templates';
import { useRouter } from 'next/navigation';

interface ProposalViewProps {
    proposal: Proposal;
    company: Company | null;
    products?: Product[]; // Optional to prevent breaking changes if called without products
}

export function ProposalView({ proposal, company, products = [] }: ProposalViewProps) {
    const [status, setStatus] = useState(proposal.status);
    const router = useRouter();

    const getOriginalPrice = (itemName: string, type: 'one-time' | 'recurring') => {
        if (!products) return null;
        const product = products.find(p => p.name.toLowerCase() === itemName.toLowerCase() && p.type === type);
        return product ? product.price : null;
    };

    const getDiscountInfo = (item: any, type: 'one-time' | 'recurring') => {
        let originalPrice = item.originalPrice;

        if (!originalPrice && products) {
            const product = products.find(p => p.name.toLowerCase() === item.name.toLowerCase() && p.type === type);
            if (product) originalPrice = product.price;
        }

        if (originalPrice && originalPrice > item.price) {
            const discountValue = originalPrice - item.price;
            const discountPercent = (discountValue / originalPrice) * 100;
            return {
                hasDiscount: true,
                originalPrice,
                discountPercent: Math.round(discountPercent)
            };
        }
        return { hasDiscount: false, originalPrice: null, discountPercent: 0 };
    };

    useEffect(() => {
        if (proposal.status === 'sent' || proposal.status === 'draft') {
            markProposalAsViewed(proposal.id);
        }
    }, [proposal.id, proposal.status]);

    const handlePrint = () => {
        window.print();
    };

    const handleAccept = async () => {
        const confirm = window.confirm("Deseja confirmar o aceite desta proposta?");
        if (!confirm) return;

        try {
            await acceptProposal(proposal.id);
            setStatus('accepted');
            router.refresh(); // Atualiza para pegar dados de pagamento gerados no servidor

            // Fire confetti
            const duration = 5 * 1000;
            const animationEnd = Date.now() + duration;
            const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

            const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

            const interval: ReturnType<typeof setInterval> = setInterval(function () {
                const timeLeft = animationEnd - Date.now();

                if (timeLeft <= 0) {
                    return clearInterval(interval);
                }

                const particleCount = 50 * (timeLeft / duration);
                confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
                confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
            }, 250);

            if (proposal.paymentLink) {
                toast.success("Proposta aceita! Redirecionando para pagamento...", { duration: 4000 });
                setTimeout(() => {
                    window.location.href = proposal.paymentLink!;
                }, 2500);
            } else {
                toast.success("Proposta aceita com sucesso! Entraremos em contato.");
            }
        } catch {
            toast.error("Erro ao aceitar proposta.");
        }
    };

    const handleReject = async () => {
        const confirm = window.confirm("Tem certeza que deseja recusar esta proposta?");
        if (!confirm) return;

        try {
            await rejectProposal(proposal.id);
            setStatus('rejected');
            toast.info("Proposta recusada. Obrigado pelo retorno.");
        } catch {
            toast.error("Erro ao recusar proposta.");
        }
    };

    const handleNegotiate = async () => {
        try {
            await negotiateProposal(proposal.id);
            setStatus('negotiating');
            toast.success("Entraremos em contato para negociar os termos.");
        } catch {
            toast.error("Erro ao solicitar negociação.");
        }
    };

    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

    // Build engaging WhatsApp message with formatting (* for bold, _ for italic)
    const whatsappShareText = `🎯 *Proposta Comercial Exclusiva!*

Olá *${proposal.clientName}*! 👋

Preparamos uma proposta _especialmente_ para você/sua empresa${proposal.clientCompany ? ` *${proposal.clientCompany}*` : ''}.

✨ _Confira todos os detalhes, condições e benefícios_ através do link abaixo:

👉 ${shareUrl}

📱 Acesse pelo link acima para visualizar a proposta completa e aprovar com apenas um clique!

_Estamos à disposição para esclarecer qualquer dúvida._ 😊

— *${company?.name || 'Equipe Comercial'}*`;

    const telegramShareText = `Olá ${proposal.clientName}, preparamos uma proposta comercial especialmente para você!`;
    const emailShareText = `Olá ${proposal.clientName},\n\nPreparamos uma proposta comercial especialmente para você.\nAcesse o link abaixo para visualizar todos os detalhes:\n\n`;

    const handleShare = (platform: 'whatsapp' | 'telegram' | 'email') => {
        let url = '';
        switch (platform) {
            case 'whatsapp':
                url = `https://wa.me/?text=${encodeURIComponent(whatsappShareText)}`;
                break;
            case 'telegram':
                url = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(telegramShareText)}`;
                break;
            case 'email':
                url = `mailto:?subject=${encodeURIComponent(`Proposta Comercial - ${company?.name || 'Nova Proposta'}`)}&body=${encodeURIComponent(emailShareText + shareUrl)}`;
                break;
        }
        if (url) window.open(url, '_blank');
    };

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemAnim = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <div className="min-h-screen pb-20 print:bg-white print:pb-0" style={{ backgroundColor: proposal.customColors?.headerBg || 'hsl(var(--background))' }}>
            <style jsx global>{`
                @media print {
                    @page { margin: 1cm; size: auto; }
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .no-print { display: none !important; }
                    .print-break-inside-avoid { break-inside: avoid; }
                }
            `}</style>

            {/* Header / Hero */}
            <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full bg-background/80 backdrop-blur-md border-b sticky top-0 z-50 no-print"
            >
                <div className="container max-w-5xl mx-auto px-4 py-3 md:p-4 flex justify-between items-center">
                    <div className="flex items-center gap-2 md:gap-3">
                        {company?.logoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={company.logoUrl}
                                alt={company.name}
                                className="h-10 w-auto object-contain"
                            />
                        ) : (
                            <div className="font-bold text-xl tracking-tight">
                                {company?.name || 'Proposta Comercial'}
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" onClick={handlePrint} className="hidden md:flex gap-2" title="Imprimir / Salvar como PDF">
                            <Printer className="w-4 h-4" />
                            <FileText className="w-4 h-4" />
                        </Button>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="flex gap-2">
                                    <Share2 className="w-4 h-4" />
                                    <span className="hidden md:inline">Compartilhar</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleShare('whatsapp')} className="gap-2 cursor-pointer">
                                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-[#25D366]" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
                                    WhatsApp
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleShare('telegram')} className="gap-2 cursor-pointer">
                                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-[#0088cc]" xmlns="http://www.w3.org/2000/svg"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" /></svg>
                                    Telegram
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleShare('email')} className="gap-2 cursor-pointer">
                                    <Mail className="w-4 h-4" />
                                    Email
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        {status === 'accepted' && (
                            <Badge variant="default" className="bg-green-600 hover:bg-green-600 text-white px-4 py-1">
                                <Check className="w-3 h-3 mr-2" /> Proposta Aceita
                            </Badge>
                        )}
                        {status === 'rejected' && (
                            <Badge variant="default" className="bg-red-600 hover:bg-red-600 text-white px-4 py-1">
                                <X className="w-3 h-3 mr-2" /> Proposta Recusada
                            </Badge>
                        )}
                        {status === 'negotiating' && (
                            <Badge variant="default" className="bg-orange-500 hover:bg-orange-500 text-white px-4 py-1">
                                <MessageCircle className="w-3 h-3 mr-2" /> Em Negociação
                            </Badge>
                        )}
                        {(status === 'sent' || status === 'viewed' || status === 'draft') && (
                            <Badge variant="outline" className="animate-pulse">Aguardando Aprovação</Badge>
                        )}
                    </div>
                </div>
            </motion.header>

            <motion.main
                variants={container}
                initial="hidden"
                animate="show"
                className="container max-w-4xl mx-auto p-4 md:p-8 space-y-8"
            >

                {/* Introduction */}
                <motion.section variants={itemAnim} className="text-center space-y-6 pt-10 pb-6 rounded-xl" style={{ backgroundColor: proposal.customColors?.introductionBg || 'transparent' }}>
                    {company?.logoUrl ? (
                        <div className="mb-6">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={company.logoUrl}
                                alt={company.name}
                                className="h-24 w-auto object-contain mx-auto"
                            />
                        </div>
                    ) : (
                        <div className={`inline-block p-3 rounded-full mb-4 ${isDarkColor(proposal.customColors?.introductionBg || '') ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'}`}>
                            <FileIcon className="w-8 h-8" />
                        </div>
                    )}
                    <h1
                        className="text-3xl md:text-6xl font-extrabold tracking-tight"
                        style={proposal.customColors?.introductionBg && isDarkColor(proposal.customColors.introductionBg)
                            ? { color: '#ffffff' }
                            : {}}
                    >
                        <span className={proposal.customColors?.introductionBg && isDarkColor(proposal.customColors.introductionBg) ? '' : 'bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent'}>
                            Proposta Comercial
                        </span>
                    </h1>
                    <p className="text-lg md:text-2xl" style={getContrastMutedStyle(proposal.customColors?.introductionBg)}>
                        Preparada especialmente para <span className="font-semibold" style={getContrastTextStyle(proposal.customColors?.introductionBg)}>{proposal.clientName}</span>
                        {proposal.clientCompany && (
                            <span className="block text-lg mt-1 font-medium opacity-80">{proposal.clientCompany}</span>
                        )}
                    </p>
                    <div className="flex justify-center gap-4 text-sm mt-4" style={getContrastMutedStyle(proposal.customColors?.introductionBg)}>
                        <span className="flex items-center"><Calendar className="w-4 h-4 mr-1" /> {new Date(proposal.createdAt).toLocaleDateString('pt-BR')}</span>
                        <span className="flex items-center"><ShieldCheck className="w-4 h-4 mr-1" /> Validade: {proposal.validityDays || 15} dias</span>
                        <span className="flex items-center"><ShieldCheck className="w-4 h-4 mr-1" /> Validade: {proposal.validityDays || 15} dias</span>
                    </div>

                    {proposal.introduction && (
                        <div className="max-w-3xl mx-auto mt-8 bg-card border rounded-xl p-4 md:p-6 shadow-sm">
                            <h3 className="font-semibold text-sm mb-3 text-slate-700 dark:text-slate-300">Apresentação</h3>
                            <div
                                className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed prose prose-sm max-w-none dark:prose-invert"
                                dangerouslySetInnerHTML={{ __html: proposal.introduction }}
                            />
                        </div>
                    )}
                </motion.section>

                {/* Company Intro (optional) */}
                {company && (
                    <motion.section variants={itemAnim}>
                        <Card className="bg-card/50 backdrop-blur-sm border-none shadow-lg">
                            <CardContent className="p-8 flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold mb-2">Apresentado por {proposal.createdBy?.name || company.responsible}</h3>
                                    <p className="text-muted-foreground mb-4">
                                        Estamos muito felizes em apresentar esta solução para o seu negócio.
                                        Abaixo você encontrará o detalhamento dos serviços e produtos selecionados.
                                    </p>
                                    <div className="flex flex-wrap justify-center md:justify-start gap-4">
                                        <Button variant="outline" size="sm" asChild>
                                            <a href={`mailto:${proposal.createdBy?.email || company.email}`}><Mail className="w-4 h-4 mr-2" /> {proposal.createdBy?.email || company.email}</a>
                                        </Button>
                                        <Button variant="outline" size="sm" asChild>
                                            <a href={`tel:${proposal.createdBy?.phone || company.phone}`}><Phone className="w-4 h-4 mr-2" /> {proposal.createdBy?.phone || company.phone}</a>
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.section>
                )}

                {/* Portfolio Section */}
                {(proposal as any).includePortfolio && (proposal as any).portfolioItems && (proposal as any).portfolioItems.length > 0 && (
                    <motion.section variants={itemAnim}>
                        <PortfolioSection items={(proposal as any).portfolioItems} />
                    </motion.section>
                )}

                {/* Client Logos Section */}
                {(proposal as any).includeClientLogos && company?.clientLogos && company.clientLogos.length > 0 && (
                    <motion.section variants={itemAnim}>
                        <ClientLogosSection logos={company.clientLogos} grayscale={(proposal as any).clientLogosGrayscale !== false} />
                    </motion.section>
                )}

                <Separator className="opacity-50" />

                {/* One Time Items */}
                {proposal.items && proposal.items.length > 0 && (
                    <motion.section variants={itemAnim} className="space-y-6 rounded-xl p-6" style={{ backgroundColor: proposal.customColors?.oneTimeBg || '#F5F7EB' }}>
                        <div className="flex items-center gap-3 mb-6">
                            <div className={`h-8 w-1 rounded-full ${isDarkColor(proposal.customColors?.oneTimeBg || '#F5F7EB') ? 'bg-white' : 'bg-primary'}`}></div>
                            <h2 className="text-2xl font-bold" style={getContrastTextStyle(proposal.customColors?.oneTimeBg || '#F5F7EB')}>Investimento Único</h2>
                        </div>

                        <div className="grid gap-4">
                            {proposal.items.map((item, idx) => {
                                const { hasDiscount: rawHasDiscount, originalPrice, discountPercent } = getDiscountInfo(item, 'one-time');
                                const hasDiscount = rawHasDiscount && (item.showDiscount ?? true);
                                return (
                                    <motion.div
                                        key={idx}
                                        whileHover={{ scale: 1.01 }}
                                        className="bg-card border rounded-xl p-4 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm relative overflow-hidden"
                                    >
                                        {hasDiscount && (
                                            <div className="absolute top-0 right-0 bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg z-10">
                                                {discountPercent}% OFF
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-lg">{item.name}</h3>
                                            <p className="text-muted-foreground text-sm whitespace-pre-wrap break-words">{item.description}</p>
                                        </div>
                                        <div className="w-full md:w-auto flex flex-row md:flex-col justify-between md:justify-end items-center md:items-end mt-2 md:mt-0 md:text-right min-w-[120px]">
                                            <div className="text-xs text-muted-foreground">{item.quantity}x de</div>
                                            {hasDiscount ? (
                                                <div className="flex flex-col items-end">
                                                    <span className="text-xs text-muted-foreground line-through">
                                                        R$ {originalPrice?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                    </span>
                                                    <div className="font-bold text-xl text-green-600">
                                                        R$ {item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="font-bold text-xl">R$ {item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>

                        <div className="flex justify-end mt-4">
                            <div className={`text-right p-4 rounded-lg border ${isDarkColor(proposal.customColors?.oneTimeBg || '#F5F7EB') ? 'bg-white/10 border-white/20' : 'bg-primary/5 border-primary/10'}`}>
                                <p className="text-sm" style={getContrastMutedStyle(proposal.customColors?.oneTimeBg || '#F5F7EB')}>Total Setup / Único</p>
                                <p className={`text-2xl font-bold ${isDarkColor(proposal.customColors?.oneTimeBg || '#F5F7EB') ? 'text-white' : 'text-primary'}`}>R$ {proposal.totalOneTime.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                            </div>
                        </div>
                    </motion.section>
                )}

                {/* Recurring Items */}
                {proposal.recurringItems && proposal.recurringItems.length > 0 && (
                    <motion.section variants={itemAnim} className="space-y-6 rounded-xl p-4 md:p-6" style={{ backgroundColor: proposal.customColors?.recurringBg || '#eff6ff' }}>
                        <div className="flex items-center gap-3 mb-6">
                            <div className={`h-8 w-1 rounded-full ${isDarkColor(proposal.customColors?.recurringBg || '#eff6ff') ? 'bg-white' : 'bg-blue-500'}`}></div>
                            <h2 className="text-2xl font-bold" style={getContrastTextStyle(proposal.customColors?.recurringBg)}>Mensalidade Recorrente</h2>
                        </div>

                        <div className="grid gap-4">
                            {proposal.recurringItems.map((item, idx) => {
                                const { hasDiscount: rawHasDiscount, originalPrice, discountPercent } = getDiscountInfo(item, 'recurring');
                                const hasDiscount = rawHasDiscount && (item.showDiscount ?? true);
                                return (
                                    <motion.div
                                        key={idx}
                                        whileHover={{ scale: 1.01 }}
                                        className="bg-card border-l-4 border-l-blue-500 rounded-r-xl rounded-l-none border-y border-r p-4 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm relative overflow-hidden"
                                    >
                                        {hasDiscount && (
                                            <div className="absolute top-0 right-0 bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg z-10">
                                                {discountPercent}% OFF
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-lg">{item.name}</h3>
                                            <p className="text-muted-foreground text-sm whitespace-pre-wrap break-words">{item.description}</p>
                                        </div>
                                        <div className="w-full md:w-auto flex flex-row md:flex-col justify-between md:justify-end items-center md:items-end mt-2 md:mt-0 md:text-right min-w-[120px]">
                                            <div className="text-xs text-muted-foreground">{item.quantity}x de</div>
                                            <div className="flex flex-col items-end">
                                                {hasDiscount ? (
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-xs text-muted-foreground line-through">
                                                            R$ {originalPrice?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                        </span>
                                                        <div className="font-bold text-xl text-green-600">
                                                            R$ {item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="font-bold text-xl text-blue-500">
                                                        R$ {item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                    </div>
                                                )}
                                                <div className="text-xs text-muted-foreground">/mês</div>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>

                        <div className="flex justify-end mt-4">
                            <div className={`text-right p-4 rounded-lg border ${isDarkColor(proposal.customColors?.recurringBg || '#eff6ff') ? 'bg-white/10 border-white/20' : 'bg-blue-500/5 border-blue-500/10'}`}>
                                <p className="text-sm" style={getContrastMutedStyle(proposal.customColors?.recurringBg)}>Total Recorrente</p>
                                <p className={`text-2xl font-bold ${isDarkColor(proposal.customColors?.recurringBg || '#eff6ff') ? 'text-white' : 'text-blue-500'}`}>R$ {proposal.totalRecurring.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} <span className="text-sm font-normal">/ mês</span></p>
                            </div>
                        </div>
                    </motion.section>
                )}

                {/* Payment & Notes */}
                <motion.section variants={itemAnim} className="grid md:grid-cols-2 gap-6 print:break-inside-avoid">
                    {((proposal.paymentMethods?.length || 0) > 0 || (proposal.paymentTerms?.length || 0) > 0) && (
                        <Card className="border shadow-sm h-full" style={{ backgroundColor: proposal.customColors?.notesBg || 'hsl(var(--card))' }}>
                            <CardContent className="p-6 space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                                        <CreditCard className="w-5 h-5" />
                                    </div>
                                    <h3 className="font-semibold text-lg">Pagamento</h3>
                                </div>
                                {proposal.paymentMethods && proposal.paymentMethods.length > 0 && (
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-muted-foreground">Formas aceitas:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {proposal.paymentMethods.map((pm, idx) => (
                                                <Badge key={idx} variant="secondary" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">
                                                    {pm}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {proposal.paymentTerms && proposal.paymentTerms.length > 0 && (
                                    <div className="space-y-2 pt-2">
                                        <p className="text-sm font-medium text-muted-foreground">Condições:</p>
                                        <ul className="space-y-2">
                                            {proposal.paymentTerms.map((term, idx) => (
                                                <li key={idx} className="text-sm bg-slate-50 dark:bg-slate-900 p-2 rounded border text-slate-700 dark:text-slate-300">
                                                    {term}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {proposal.notes && proposal.notes.length > 0 && (
                        <Card className="border shadow-sm h-full" style={{ backgroundColor: proposal.customColors?.notesBg || 'hsl(var(--card))' }}>
                            <CardContent className="p-6 space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="p-2 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <h3 className="font-semibold text-lg">Observações e Termos</h3>
                                </div>
                                <ul className="space-y-3">
                                    {proposal.notes.map((note, idx) => (
                                        <li key={idx} className="text-sm text-slate-600 dark:text-slate-400 flex gap-2">
                                            <span className="text-violet-500 mt-1">•</span>
                                            <span className="whitespace-pre-wrap">{note}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    )}
                </motion.section>

                {/* Total Summary */}
                <motion.section variants={itemAnim} className="pt-8 print:break-inside-avoid">
                    <Card
                        className="border-none overflow-hidden relative"
                        style={{
                            backgroundColor: proposal.customColors?.totalBg || '#1e1e1e',
                            color: isDarkColor(proposal.customColors?.totalBg || '#1e1e1e') ? '#ffffff' : '#1e293b'
                        }}
                    >
                        <div className="absolute top-0 right-0 p-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                        <CardContent className="p-8 md:p-12 text-center space-y-6 relative z-10">
                            <h2 className="text-3xl font-bold">Resumo do Investimento</h2>
                            <div className="flex flex-col md:flex-row justify-center gap-8 md:gap-16">
                                {proposal.totalOneTime > 0 && (
                                    <div>
                                        <p className="text-lg opacity-80">Investimento Inicial</p>
                                        <p className="text-4xl font-extrabold">R$ {proposal.totalOneTime.toLocaleString('pt-BR')}</p>
                                    </div>
                                )}
                                {proposal.totalRecurring > 0 && (
                                    <div className={proposal.totalOneTime > 0 ? "md:border-l md:border-current/20 md:pl-16" : ""}>
                                        <p className="text-lg opacity-80">Mensalidade</p>
                                        <p className="text-4xl font-extrabold">R$ {proposal.totalRecurring.toLocaleString('pt-BR')}</p>

                                        {/* Recurring Period Subtotal */}
                                        {proposal.recurringPeriod && (proposal.recurringPeriodType === 'years' || proposal.recurringPeriod > 1) && (
                                            <div className="mt-2 pt-2 border-t border-current/20">
                                                <p className="text-sm opacity-70">
                                                    Total em {proposal.recurringPeriod} {proposal.recurringPeriodType === 'years' ? (proposal.recurringPeriod === 1 ? 'ano' : 'anos') : (proposal.recurringPeriod === 1 ? 'mês' : 'meses')}:
                                                </p>
                                                <p className="text-lg font-bold">
                                                    R$ {(proposal.totalRecurring * (proposal.recurringPeriodType === 'years' ? proposal.recurringPeriod * 12 : proposal.recurringPeriod)).toLocaleString('pt-BR')}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>


                            {(status === 'sent' || status === 'viewed' || status === 'draft') && (
                                <div className="pt-12 no-print">
                                    {/* Call-to-Action Section */}
                                    <div className="flex flex-col items-center">
                                        {/* Pulsing glow effect behind button */}
                                        <div className="relative">
                                            <motion.div
                                                className="absolute inset-0 bg-emerald-500/40 rounded-lg blur-xl -m-2"
                                                animate={{
                                                    opacity: [0.5, 1, 0.5],
                                                    scale: [0.98, 1.02, 0.98],
                                                }}
                                                transition={{
                                                    duration: 2,
                                                    repeat: Infinity,
                                                    ease: "easeInOut"
                                                }}
                                            />

                                            {/* Main Accept Button usando shadcn */}
                                            <motion.div
                                                animate={{
                                                    scale: [1, 1.02, 1],
                                                }}
                                                transition={{
                                                    duration: 2,
                                                    repeat: Infinity,
                                                    ease: "easeInOut"
                                                }}
                                                className="relative"
                                            >
                                                <Button
                                                    size="lg"
                                                    onClick={handleAccept}
                                                    className="bg-green-600 hover:bg-green-500 text-white font-bold text-lg border-2 border-white shadow-xl hover:shadow-2xl transition-all duration-200"
                                                >
                                                    <Check className="mr-2 h-5 w-5" />
                                                    Aceitar Proposta
                                                </Button>
                                            </motion.div>
                                        </div>
                                    </div>

                                    {/* Secondary actions */}
                                    <div className="flex flex-wrap justify-center gap-6 md:gap-12 mt-10">
                                        <button
                                            onClick={handleNegotiate}
                                            className="text-sm font-semibold text-orange-500 hover:text-orange-400 transition-colors flex items-center gap-2"
                                        >
                                            <MessageCircle className="w-4 h-4" />
                                            Negociar
                                        </button>
                                        <button
                                            onClick={handleReject}
                                            className="text-sm font-semibold text-red-500 hover:text-red-400 transition-colors flex items-center gap-2"
                                        >
                                            <X className="w-4 h-4" />
                                            Recusar
                                        </button>
                                    </div>
                                    <p className="text-xs mt-6 opacity-50 text-center">Ao clicar em aceitar, você concorda com os termos deste serviço.</p>
                                </div>
                            )}
                            {status === 'accepted' && (
                                <div className="pt-8 animate-in fade-in zoom-in duration-500">
                                    <div className="bg-white/20 inline-block p-4 rounded-full mb-4">
                                        <Check className="w-12 h-12" />
                                    </div>
                                    <h3 className="text-2xl font-bold">Proposta Aceita!</h3>
                                    <p className="opacity-80 mb-6">Obrigado pela confiança. Entraremos em contato em breve.</p>

                                    {((proposal as any).asaasInvoiceUrl) && (
                                        <div className="bg-white/10 p-6 rounded-xl border border-white/20 max-w-md mx-auto animate-in slide-in-from-bottom-4 duration-700 delay-300">
                                            <h4 className="font-semibold mb-2 flex items-center justify-center gap-2">
                                                <CreditCard className="w-5 h-5" />
                                                Pagamento Gerado
                                            </h4>
                                            <p className="text-sm opacity-80 mb-4">
                                                Para agilizar o inicio do projeto, efetue o pagamento da primeira parcela/sinal.
                                            </p>
                                            <Button className="bg-emerald-500 hover:bg-emerald-600 text-white w-full font-bold shadow-lg shadow-emerald-500/20" size="lg" asChild>
                                                <a href={(proposal as any).asaasInvoiceUrl} target="_blank" rel="noopener noreferrer">
                                                    Pagar Agora
                                                    <ArrowRight className="w-4 h-4 ml-2" />
                                                </a>
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}
                            {status === 'rejected' && (
                                <div className="pt-8 animate-in fade-in zoom-in duration-500">
                                    <div className="bg-red-500/20 inline-block p-4 rounded-full mb-4">
                                        <X className="w-12 h-12" />
                                    </div>
                                    <h3 className="text-2xl font-bold">Proposta Recusada</h3>
                                    <p className="opacity-80">Agradecemos pelo retorno.</p>
                                </div>
                            )}
                            {status === 'negotiating' && (
                                <div className="pt-8 animate-in fade-in zoom-in duration-500">
                                    <div className="bg-orange-500/20 inline-block p-4 rounded-full mb-4">
                                        <MessageCircle className="w-12 h-12" />
                                    </div>
                                    <h3 className="text-2xl font-bold">Em Negociação</h3>
                                    <p className="opacity-80">Entraremos em contato para discutir os termos.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.section>

            </motion.main>
        </div >
    );
}

function FileIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
            <path d="M14 2v4a2 2 0 0 0 2 2h4" />
        </svg>
    )
}
