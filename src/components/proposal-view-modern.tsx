'use client';

import { useEffect, useState } from 'react';
import { Proposal, Company, Product } from '@/lib/db';
import { markProposalAsViewed, acceptProposal, rejectProposal, negotiateProposal } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Share2, Check, Mail, Phone, Calendar, ShieldCheck, X, MessageCircle, Printer, CreditCard, FileText, Sparkles, ChevronDown } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';
import { PortfolioSection, ClientLogosSection } from '@/components/proposal-preview-templates';

interface ProposalViewModernProps {
    proposal: Proposal;
    company: Company | null;
    products?: Product[];
}

export function ProposalViewModern({ proposal, company, products = [] }: ProposalViewModernProps) {
    const [status, setStatus] = useState(proposal.status);

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
    const shareText = `Olá ${proposal.clientName}, veja a proposta comercial que preparamos para você:`;

    const handleShare = (platform: 'whatsapp' | 'telegram' | 'email') => {
        let url = '';
        switch (platform) {
            case 'whatsapp':
                url = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`;
                break;
            case 'telegram':
                url = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
                break;
            case 'email':
                url = `mailto:?subject=${encodeURIComponent(`Proposta Comercial - ${company?.name || 'Nova Proposta'}`)}&body=${encodeURIComponent(shareText + '\n\n' + shareUrl)}`;
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
        <div className="min-h-screen pb-20 print:bg-white print:pb-0">
            {/* Animated gradient background */}
            <div className="fixed inset-0 bg-gradient-to-br from-violet-600 via-purple-600 to-pink-500 -z-10" />
            <div className="fixed inset-0 -z-10">
                <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-400/30 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-400/30 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] bg-white/10 rounded-full blur-3xl" />
            </div>

            <style jsx global>{`
                @media print {
                    @page { margin: 1cm; size: auto; }
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .no-print { display: none !important; }
                    .print-break-inside-avoid { break-inside: avoid; }
                }
            `}</style>

            {/* Header with glass effect */}
            <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full bg-white/10 backdrop-blur-xl border-b border-white/20 sticky top-0 z-50 no-print"
            >
                <div className="container max-w-5xl mx-auto p-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        {company?.logoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={company.logoUrl}
                                alt={company.name}
                                className="h-10 w-auto object-contain brightness-0 invert"
                            />
                        ) : (
                            <div className="font-bold text-xl tracking-tight text-white">
                                {company?.name || 'Proposta Comercial'}
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" onClick={handlePrint} className="hidden md:flex gap-2 text-white/80 hover:text-white hover:bg-white/10">
                            <Printer className="w-4 h-4" />
                            <FileText className="w-4 h-4" />
                        </Button>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="flex gap-2 text-white/80 hover:text-white hover:bg-white/10 border border-white/20">
                                    <Share2 className="w-4 h-4" />
                                    <span className="hidden md:inline">Compartilhar</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-white/90 backdrop-blur-xl">
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
                            <Badge variant="default" className="bg-green-500/20 border-green-400/30 text-green-100 px-4 py-1 backdrop-blur">
                                <Check className="w-3 h-3 mr-2" /> Proposta Aceita
                            </Badge>
                        )}
                        {status === 'rejected' && (
                            <Badge variant="default" className="bg-red-500/20 border-red-400/30 text-red-100 px-4 py-1 backdrop-blur">
                                <X className="w-3 h-3 mr-2" /> Proposta Recusada
                            </Badge>
                        )}
                        {status === 'negotiating' && (
                            <Badge variant="default" className="bg-orange-500/20 border-orange-400/30 text-orange-100 px-4 py-1 backdrop-blur">
                                <MessageCircle className="w-3 h-3 mr-2" /> Em Negociação
                            </Badge>
                        )}
                        {(status === 'sent' || status === 'viewed' || status === 'draft') && (
                            <Badge className="bg-white/20 text-white border-white/30 animate-pulse backdrop-blur">Aguardando Aprovação</Badge>
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
                {/* Hero Section */}
                <motion.section variants={itemAnim} className="text-center space-y-6 pt-16 pb-10">
                    {company?.logoUrl && (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", bounce: 0.5 }}
                            className="inline-block"
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={company.logoUrl}
                                alt={company.name}
                                className="h-20 w-auto object-contain mx-auto brightness-0 invert drop-shadow-2xl"
                            />
                        </motion.div>
                    )}
                    <div className="space-y-4">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-lg border border-white/20 text-white/80 text-sm">
                                <Sparkles className="w-4 h-4 text-amber-400" />
                                Proposta Exclusiva
                            </span>
                        </motion.div>
                        <h1 className="text-5xl md:text-7xl font-black tracking-tight text-white drop-shadow-2xl">
                            Proposta Comercial
                        </h1>
                        <p className="text-xl md:text-2xl text-white/80">
                            Preparada especialmente para <span className="font-bold text-white">{proposal.clientName}</span>
                            {proposal.clientCompany && (
                                <span className="block text-lg mt-1 text-white/60">{proposal.clientCompany}</span>
                            )}
                        </p>
                    </div>
                    <div className="flex justify-center gap-6 text-sm text-white/60">
                        <span className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full backdrop-blur">
                            <Calendar className="w-4 h-4" /> {new Date(proposal.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                        <span className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full backdrop-blur">
                            <ShieldCheck className="w-4 h-4" /> Válido por {proposal.validityDays || 15} dias
                        </span>
                    </div>

                    {proposal.introduction && (
                        <motion.div
                            variants={itemAnim}
                            className="max-w-2xl mx-auto mt-8 p-6 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20"
                        >
                            <h3 className="font-semibold text-sm mb-3 text-white/80">Apresentação</h3>
                            <div
                                className="text-white/90 text-sm leading-relaxed prose prose-invert prose-sm max-w-none"
                                dangerouslySetInnerHTML={{ __html: proposal.introduction }}
                            />
                        </motion.div>
                    )}
                </motion.section>

                {/* Company Presenter */}
                {company && (
                    <motion.section variants={itemAnim}>
                        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 text-center text-white">
                            <h3 className="text-lg font-semibold mb-2">Apresentado por {proposal.createdBy?.name || company.responsible}</h3>
                            <p className="text-white/60 mb-4 text-sm">
                                Estamos muito felizes em apresentar esta solução para o seu negócio.
                            </p>
                            <div className="flex flex-wrap justify-center gap-4">
                                <a href={`mailto:${proposal.createdBy?.email || company.email}`} className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors text-sm">
                                    <Mail className="w-4 h-4" /> {proposal.createdBy?.email || company.email}
                                </a>
                                <a href={`tel:${proposal.createdBy?.phone || company.phone}`} className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors text-sm">
                                    <Phone className="w-4 h-4" /> {proposal.createdBy?.phone || company.phone}
                                </a>
                            </div>
                        </div>
                    </motion.section>
                )}

                {/* Portfolio Section */}
                {(proposal as any).includePortfolio && company?.portfolioItems && company.portfolioItems.length > 0 && (
                    <motion.section variants={itemAnim}>
                        <PortfolioSection items={company.portfolioItems} />
                    </motion.section>
                )}

                {/* Client Logos Section */}
                {(proposal as any).includeClientLogos && company?.clientLogos && company.clientLogos.length > 0 && (
                    <motion.section variants={itemAnim}>
                        <ClientLogosSection logos={company.clientLogos} grayscale={(proposal as any).clientLogosGrayscale !== false} />
                    </motion.section>
                )}

                {/* One Time Items */}
                {proposal.items && proposal.items.length > 0 && (
                    <motion.section variants={itemAnim} className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-1 rounded-full bg-gradient-to-b from-amber-400 to-orange-500"></div>
                            <h2 className="text-2xl font-bold text-white">Investimento Único</h2>
                        </div>

                        <div className="grid gap-3">
                            {proposal.items.map((item, idx) => {
                                const { hasDiscount: rawHasDiscount, originalPrice, discountPercent } = getDiscountInfo(item, 'one-time');
                                const hasDiscount = rawHasDiscount && (item.showDiscount ?? true);
                                return (
                                    <motion.div
                                        key={idx}
                                        whileHover={{ scale: 1.01, y: -2 }}
                                        className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden group"
                                    >
                                        {/* Hover glow effect */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-amber-400/0 via-amber-400/10 to-amber-400/0 opacity-0 group-hover:opacity-100 transition-opacity" />

                                        {hasDiscount && (
                                            <div className="absolute top-0 right-0 bg-gradient-to-r from-green-400 to-emerald-500 text-white text-xs font-bold px-4 py-1.5 rounded-bl-2xl z-10 shadow-lg">
                                                -{discountPercent}%
                                            </div>
                                        )}
                                        <div className="flex-1 relative z-10">
                                            <h3 className="font-semibold text-lg text-white">{item.name}</h3>
                                            <p className="text-white/60 text-sm">{item.description}</p>
                                        </div>
                                        <div className="relative z-10 text-right">
                                            <div className="text-xs text-white/40">{item.quantity}x de</div>
                                            {hasDiscount ? (
                                                <div className="flex flex-col items-end">
                                                    <span className="text-xs text-white/40 line-through">
                                                        R$ {originalPrice?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                    </span>
                                                    <div className="font-bold text-xl text-amber-400">
                                                        R$ {item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="font-bold text-xl text-white">R$ {item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>

                        <div className="flex justify-end">
                            <div className="text-right p-4 bg-gradient-to-r from-amber-400/20 to-orange-500/20 backdrop-blur-xl rounded-xl border border-amber-400/30">
                                <p className="text-sm text-white/60">Total Setup / Único</p>
                                <p className="text-2xl font-bold text-amber-400">R$ {proposal.totalOneTime.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                            </div>
                        </div>
                    </motion.section>
                )}

                {/* Recurring Items */}
                {proposal.recurringItems && proposal.recurringItems.length > 0 && (
                    <motion.section variants={itemAnim} className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-1 rounded-full bg-gradient-to-b from-cyan-400 to-blue-500"></div>
                            <h2 className="text-2xl font-bold text-white">Mensalidade Recorrente</h2>
                        </div>

                        <div className="grid gap-3">
                            {proposal.recurringItems.map((item, idx) => {
                                const { hasDiscount: rawHasDiscount, originalPrice, discountPercent } = getDiscountInfo(item, 'recurring');
                                const hasDiscount = rawHasDiscount && (item.showDiscount ?? true);
                                return (
                                    <motion.div
                                        key={idx}
                                        whileHover={{ scale: 1.01, y: -2 }}
                                        className="bg-white/10 backdrop-blur-xl border-l-4 border-l-cyan-400 border border-white/20 rounded-2xl rounded-l-none p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden group"
                                    >
                                        {/* Hover glow effect */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/0 via-cyan-400/10 to-cyan-400/0 opacity-0 group-hover:opacity-100 transition-opacity" />

                                        {hasDiscount && (
                                            <div className="absolute top-0 right-0 bg-gradient-to-r from-green-400 to-emerald-500 text-white text-xs font-bold px-4 py-1.5 rounded-bl-2xl z-10 shadow-lg">
                                                -{discountPercent}%
                                            </div>
                                        )}
                                        <div className="flex-1 relative z-10">
                                            <h3 className="font-semibold text-lg text-white">{item.name}</h3>
                                            <p className="text-white/60 text-sm">{item.description}</p>
                                        </div>
                                        <div className="relative z-10 text-right">
                                            <div className="text-xs text-white/40">{item.quantity}x de</div>
                                            {hasDiscount ? (
                                                <div className="flex flex-col items-end">
                                                    <span className="text-xs text-white/40 line-through">
                                                        R$ {originalPrice?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                    </span>
                                                    <div className="font-bold text-xl text-cyan-400">
                                                        R$ {item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="font-bold text-xl text-cyan-400">
                                                    R$ {item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </div>
                                            )}
                                            <div className="text-xs text-white/40">/mês</div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>

                        <div className="flex justify-end">
                            <div className="text-right p-4 bg-gradient-to-r from-cyan-400/20 to-blue-500/20 backdrop-blur-xl rounded-xl border border-cyan-400/30">
                                <p className="text-sm text-white/60">Total Recorrente</p>
                                <p className="text-2xl font-bold text-cyan-400">R$ {proposal.totalRecurring.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} <span className="text-sm font-normal text-white/60">/ mês</span></p>
                            </div>
                        </div>
                    </motion.section>
                )}

                {/* Payment & Notes */}
                <motion.section variants={itemAnim} className="grid md:grid-cols-2 gap-4">
                    {((proposal.paymentMethods?.length || 0) > 0 || (proposal.paymentTerms?.length || 0) > 0) && (
                        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-2 rounded-full bg-emerald-400/20">
                                    <CreditCard className="w-5 h-5 text-emerald-400" />
                                </div>
                                <h3 className="font-semibold text-lg text-white">Pagamento</h3>
                            </div>
                            {proposal.paymentMethods && proposal.paymentMethods.length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-sm font-medium text-white/60">Formas aceitas:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {proposal.paymentMethods.map((pm, idx) => (
                                            <Badge key={idx} className="bg-emerald-400/20 text-emerald-300 border-emerald-400/30">
                                                {pm}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {proposal.paymentTerms && proposal.paymentTerms.length > 0 && (
                                <div className="space-y-2 pt-2">
                                    <p className="text-sm font-medium text-white/60">Condições:</p>
                                    <ul className="space-y-2">
                                        {proposal.paymentTerms.map((term, idx) => (
                                            <li key={idx} className="text-sm bg-white/5 p-2 rounded-lg text-white/80">
                                                {term}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}

                    {proposal.notes && proposal.notes.length > 0 && (
                        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-2 rounded-full bg-violet-400/20">
                                    <FileText className="w-5 h-5 text-violet-400" />
                                </div>
                                <h3 className="font-semibold text-lg text-white">Observações e Termos</h3>
                            </div>
                            <ul className="space-y-3">
                                {proposal.notes.map((note, idx) => (
                                    <li key={idx} className="text-sm text-white/70 flex gap-2">
                                        <span className="text-violet-400 mt-1">•</span>
                                        <span className="whitespace-pre-wrap">{note}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </motion.section>

                {/* Total Summary */}
                <motion.section variants={itemAnim} className="pt-8">
                    <div className="bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/20 overflow-hidden relative">
                        {/* Decorative elements */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-amber-400/30 to-transparent rounded-full -mr-32 -mt-32 blur-3xl" />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-cyan-400/30 to-transparent rounded-full -ml-32 -mb-32 blur-3xl" />

                        <div className="p-8 md:p-12 text-center space-y-6 relative z-10">
                            <h2 className="text-3xl font-bold text-white">Resumo do Investimento</h2>
                            <div className="flex flex-col md:flex-row justify-center gap-8 md:gap-16">
                                {proposal.totalOneTime > 0 && (
                                    <div>
                                        <p className="text-lg text-white/60">Investimento Inicial</p>
                                        <p className="text-4xl font-extrabold text-white">R$ {proposal.totalOneTime.toLocaleString('pt-BR')}</p>
                                    </div>
                                )}
                                {proposal.totalRecurring > 0 && (
                                    <div className={proposal.totalOneTime > 0 ? "md:border-l md:border-white/20 md:pl-16" : ""}>
                                        <p className="text-lg text-white/60">Mensalidade</p>
                                        <p className="text-4xl font-extrabold text-white">R$ {proposal.totalRecurring.toLocaleString('pt-BR')}</p>

                                        {proposal.recurringPeriod && (proposal.recurringPeriodType === 'years' || proposal.recurringPeriod > 1) && (
                                            <div className="mt-2 pt-2 border-t border-white/20">
                                                <p className="text-sm text-white/50">
                                                    Total em {proposal.recurringPeriod} {proposal.recurringPeriodType === 'years' ? (proposal.recurringPeriod === 1 ? 'ano' : 'anos') : (proposal.recurringPeriod === 1 ? 'mês' : 'meses')}:
                                                </p>
                                                <p className="text-lg font-bold text-white">
                                                    R$ {(proposal.totalRecurring * (proposal.recurringPeriodType === 'years' ? proposal.recurringPeriod * 12 : proposal.recurringPeriod)).toLocaleString('pt-BR')}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>


                            {(status === 'sent' || status === 'viewed' || status === 'draft') && (
                                <div className="pt-12 no-print">
                                    <div className="flex flex-col items-center">
                                        <div className="relative">
                                            <motion.div
                                                className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-2xl blur-xl opacity-50"
                                                animate={{
                                                    opacity: [0.5, 0.8, 0.5],
                                                    scale: [0.98, 1.02, 0.98],
                                                }}
                                                transition={{
                                                    duration: 2,
                                                    repeat: Infinity,
                                                    ease: "easeInOut"
                                                }}
                                            />

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
                                                    className="bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white font-bold text-lg px-10 py-6 rounded-2xl shadow-2xl"
                                                >
                                                    <Check className="mr-2 h-5 w-5" />
                                                    Aceitar Proposta
                                                </Button>
                                            </motion.div>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap justify-center gap-6 md:gap-12 mt-10">
                                        <button
                                            onClick={handleNegotiate}
                                            className="text-sm font-semibold text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-2"
                                        >
                                            <MessageCircle className="w-4 h-4" />
                                            Negociar
                                        </button>
                                        <button
                                            onClick={handleReject}
                                            className="text-sm font-semibold text-red-400 hover:text-red-300 transition-colors flex items-center gap-2"
                                        >
                                            <X className="w-4 h-4" />
                                            Recusar
                                        </button>
                                    </div>
                                    <p className="text-xs mt-6 text-white/30 text-center">Ao clicar em aceitar, você concorda com os termos deste serviço.</p>
                                </div>
                            )}
                            {status === 'accepted' && (
                                <div className="pt-8 animate-in fade-in zoom-in duration-500">
                                    <div className="bg-green-400/20 inline-block p-4 rounded-full mb-4">
                                        <Check className="w-12 h-12 text-green-400" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-white">Proposta Aceita!</h3>
                                    <p className="text-white/60">Obrigado pela confiança. Entraremos em contato em breve.</p>
                                </div>
                            )}
                            {status === 'rejected' && (
                                <div className="pt-8 animate-in fade-in zoom-in duration-500">
                                    <div className="bg-red-400/20 inline-block p-4 rounded-full mb-4">
                                        <X className="w-12 h-12 text-red-400" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-white">Proposta Recusada</h3>
                                    <p className="text-white/60">Agradecemos pelo retorno.</p>
                                </div>
                            )}
                            {status === 'negotiating' && (
                                <div className="pt-8 animate-in fade-in zoom-in duration-500">
                                    <div className="bg-orange-400/20 inline-block p-4 rounded-full mb-4">
                                        <MessageCircle className="w-12 h-12 text-orange-400" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-white">Em Negociação</h3>
                                    <p className="text-white/60">Entraremos em contato para discutir os termos.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.section>

            </motion.main>
        </div>
    );
}
