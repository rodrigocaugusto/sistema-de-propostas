'use client';

import { useEffect, useState } from 'react';
import { Proposal, Company, Product } from '@/lib/db';
import { markProposalAsViewed, acceptProposal, rejectProposal, negotiateProposal } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Share2, Check, Mail, Phone, Calendar, ShieldCheck, X, MessageCircle, Printer, CreditCard, FileText, Minus, ArrowRight } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';
import { PortfolioSection, ClientLogosSection } from '@/components/proposal-preview-templates';

interface ProposalViewMinimalProps {
    proposal: Proposal;
    company: Company | null;
    products?: Product[];
}

export function ProposalViewMinimal({ proposal, company, products = [] }: ProposalViewMinimalProps) {
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

            // Fire confetti - more subtle for minimal theme
            const duration = 3 * 1000;
            const animationEnd = Date.now() + duration;
            const defaults = { startVelocity: 20, spread: 180, ticks: 40, zIndex: 0, colors: ['#0ea5e9', '#18181b', '#71717a'] };

            const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

            const interval: ReturnType<typeof setInterval> = setInterval(function () {
                const timeLeft = animationEnd - Date.now();

                if (timeLeft <= 0) {
                    return clearInterval(interval);
                }

                const particleCount = 30 * (timeLeft / duration);
                confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.2, 0.4), y: Math.random() - 0.2 } });
                confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.6, 0.8), y: Math.random() - 0.2 } });
            }, 300);

            if (proposal.paymentLink) {
                toast.success("Proposta aceita! Redirecionando para pagamento...", { duration: 4000 });
                setTimeout(() => {
                    window.location.href = proposal.paymentLink!;
                }, 2500);
            } else {
                toast.success("Proposta aceita com sucesso!");
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
            toast.info("Proposta recusada.");
        } catch {
            toast.error("Erro ao recusar proposta.");
        }
    };

    const handleNegotiate = async () => {
        try {
            await negotiateProposal(proposal.id);
            setStatus('negotiating');
            toast.success("Entraremos em contato para negociar.");
        } catch {
            toast.error("Erro ao solicitar negociação.");
        }
    };

    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
    const shareText = `Proposta comercial de ${company?.name || 'nossa empresa'} para ${proposal.clientName}`;

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
                staggerChildren: 0.05
            }
        }
    };

    const itemAnim = {
        hidden: { opacity: 0, y: 10 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <div className="min-h-screen bg-white dark:bg-zinc-950 pb-20 print:bg-white print:pb-0">
            <style jsx global>{`
                @media print {
                    @page { margin: 2cm; size: auto; }
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .no-print { display: none !important; }
                    .print-break-inside-avoid { break-inside: avoid; }
                }
            `}</style>

            {/* Minimal Header */}
            <motion.header
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full border-b border-zinc-100 dark:border-zinc-900 sticky top-0 z-50 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-sm no-print"
            >
                <div className="container max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        {company?.logoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={company.logoUrl}
                                alt={company.name}
                                className="h-8 w-auto object-contain dark:invert"
                            />
                        ) : (
                            <span className="font-medium text-zinc-900 dark:text-zinc-100 tracking-tight">
                                {company?.name || 'Proposta'}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" onClick={handlePrint} className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100" title="Imprimir">
                            <Printer className="w-4 h-4" />
                        </Button>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
                                    <Share2 className="w-4 h-4" />
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
                            <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                <Check className="w-4 h-4" /> Aceita
                            </span>
                        )}
                        {status === 'rejected' && (
                            <span className="text-sm font-medium text-red-600 dark:text-red-400 flex items-center gap-1">
                                <X className="w-4 h-4" /> Recusada
                            </span>
                        )}
                        {status === 'negotiating' && (
                            <span className="text-sm font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                <MessageCircle className="w-4 h-4" /> Negociando
                            </span>
                        )}
                    </div>
                </div>
            </motion.header>

            <motion.main
                variants={container}
                initial="hidden"
                animate="show"
                className="container max-w-4xl mx-auto px-6 py-16 md:py-24"
            >
                {/* Hero - Ultra Minimal */}
                <motion.section variants={itemAnim} className="space-y-8 mb-20">
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 text-sm text-zinc-500 dark:text-zinc-500">
                            <span>{new Date(proposal.createdAt).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                            <span>•</span>
                            <span>Válido por {proposal.validityDays || 15} dias</span>
                        </div>
                        <h1 className="text-3xl md:text-6xl font-light tracking-tight text-zinc-900 dark:text-zinc-100">
                            Proposta Comercial
                        </h1>
                        <div className="h-px w-20 bg-sky-500"></div>
                        <div>
                            <p className="text-2xl text-zinc-600 dark:text-zinc-400 font-light">
                                Para <span className="text-zinc-900 dark:text-zinc-100">{proposal.clientName}</span>
                            </p>
                            {proposal.clientCompany && (
                                <p className="text-lg text-zinc-500 dark:text-zinc-500 mt-1">{proposal.clientCompany}</p>
                            )}
                        </div>
                    </div>

                    {proposal.introduction && (
                        <motion.div
                            variants={itemAnim}
                            className="max-w-2xl mt-8 p-6 bg-zinc-50 dark:bg-zinc-900 rounded-xl"
                        >
                            <h3 className="font-medium text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-500 mb-3">Apresentação</h3>
                            <div
                                className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed prose prose-sm prose-zinc dark:prose-invert max-w-none"
                                dangerouslySetInnerHTML={{ __html: proposal.introduction }}
                            />
                        </motion.div>
                    )}
                </motion.section>

                {/* Presenter Info */}
                {company && (
                    <motion.section variants={itemAnim} className="mb-20 pb-10 border-b border-zinc-100 dark:border-zinc-900">
                        <p className="text-sm text-zinc-500 dark:text-zinc-500 mb-3">SOBRE NÓS</p>
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                                <p className="text-zinc-900 dark:text-zinc-100 font-medium">
                                    {proposal.createdBy?.name || company.responsible}
                                </p>
                                <p className="text-zinc-500 dark:text-zinc-500 text-sm">
                                    {company.name}
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-4 text-sm">
                                <a href={`mailto:${proposal.createdBy?.email || company.email}`} className="text-zinc-600 dark:text-zinc-400 hover:text-sky-500 transition-colors flex items-center gap-2">
                                    <Mail className="w-4 h-4" /> {proposal.createdBy?.email || company.email}
                                </a>
                                <a href={`tel:${proposal.createdBy?.phone || company.phone}`} className="text-zinc-600 dark:text-zinc-400 hover:text-sky-500 transition-colors flex items-center gap-2">
                                    <Phone className="w-4 h-4" /> {proposal.createdBy?.phone || company.phone}
                                </a>
                            </div>
                        </div>
                    </motion.section>
                )}

                {/* Portfolio Section */}
                {(proposal as any).includePortfolio && (proposal as any).portfolioItems && (proposal as any).portfolioItems.length > 0 && (
                    <motion.section variants={itemAnim} className="mb-16">
                        <PortfolioSection items={(proposal as any).portfolioItems} />
                    </motion.section>
                )}

                {/* Client Logos Section */}
                {(proposal as any).includeClientLogos && company?.clientLogos && company.clientLogos.length > 0 && (
                    <motion.section variants={itemAnim} className="mb-16">
                        <ClientLogosSection logos={company.clientLogos} grayscale={(proposal as any).clientLogosGrayscale !== false} />
                    </motion.section>
                )}

                {/* One Time Items */}
                {proposal.items && proposal.items.length > 0 && (
                    <motion.section variants={itemAnim} className="mb-16">
                        <p className="text-sm text-zinc-500 dark:text-zinc-500 mb-6 uppercase tracking-wider">Investimento Único</p>

                        <div className="space-y-0 divide-y divide-zinc-100 dark:divide-zinc-900">
                            {proposal.items.map((item, idx) => {
                                const { hasDiscount: rawHasDiscount, originalPrice, discountPercent } = getDiscountInfo(item, 'one-time');
                                const hasDiscount = rawHasDiscount && (item.showDiscount ?? true);
                                return (
                                    <motion.div
                                        key={idx}
                                        whileHover={{ x: 4 }}
                                        className="py-4 md:py-6 flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3">
                                                <h3 className="font-medium text-zinc-900 dark:text-zinc-100">{item.name}</h3>
                                                {hasDiscount && (
                                                    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded">
                                                        -{discountPercent}%
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-zinc-500 dark:text-zinc-500 mt-1">{item.description}</p>
                                        </div>
                                        <div className="text-left md:text-right shrink-0 flex flex-row md:flex-col justify-between items-center md:items-end w-full md:w-auto mt-2 md:mt-0 pt-2 md:pt-0 border-t md:border-t-0 border-zinc-100 dark:border-zinc-800">
                                            {item.quantity > 1 && (
                                                <p className="text-xs text-zinc-400 dark:text-zinc-600 mb-1 order-1 md:order-none">{item.quantity}×</p>
                                            )}
                                            {hasDiscount && (
                                                <p className="text-sm text-zinc-400 dark:text-zinc-600 line-through">
                                                    R$ {originalPrice?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </p>
                                            )}
                                            <p className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
                                                R$ {item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </p>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>

                        <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-800 flex justify-end">
                            <div className="text-right">
                                <p className="text-sm text-zinc-500 dark:text-zinc-500">Subtotal</p>
                                <p className="text-2xl font-light text-zinc-900 dark:text-zinc-100">
                                    R$ {proposal.totalOneTime.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                        </div>
                    </motion.section>
                )}

                {/* Recurring Items */}
                {proposal.recurringItems && proposal.recurringItems.length > 0 && (
                    <motion.section variants={itemAnim} className="mb-16">
                        <div className="flex items-center gap-3 mb-6">
                            <p className="text-sm text-zinc-500 dark:text-zinc-500 uppercase tracking-wider">Mensalidade</p>
                            <div className="h-px flex-1 bg-zinc-100 dark:bg-zinc-900"></div>
                        </div>

                        <div className="space-y-0 divide-y divide-zinc-100 dark:divide-zinc-900">
                            {proposal.recurringItems.map((item, idx) => {
                                const { hasDiscount: rawHasDiscount, originalPrice, discountPercent } = getDiscountInfo(item, 'recurring');
                                const hasDiscount = rawHasDiscount && (item.showDiscount ?? true);
                                return (
                                    <motion.div
                                        key={idx}
                                        whileHover={{ x: 4 }}
                                        className="py-4 md:py-6 flex flex-col md:flex-row md:items-center justify-between gap-4 group border-l-2 border-l-sky-500 pl-4"
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3">
                                                <h3 className="font-medium text-zinc-900 dark:text-zinc-100">{item.name}</h3>
                                                {hasDiscount && (
                                                    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded">
                                                        -{discountPercent}%
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-zinc-500 dark:text-zinc-500 mt-1">{item.description}</p>
                                        </div>
                                        <div className="text-left md:text-right shrink-0 flex flex-row md:flex-col justify-between items-center md:items-end w-full md:w-auto mt-2 md:mt-0 pt-2 md:pt-0 border-t md:border-t-0 border-zinc-100 dark:border-zinc-800">
                                            {item.quantity > 1 && (
                                                <p className="text-xs text-zinc-400 dark:text-zinc-600 mb-1 order-1 md:order-none">{item.quantity}×</p>
                                            )}
                                            {hasDiscount && (
                                                <p className="text-sm text-zinc-400 dark:text-zinc-600 line-through">
                                                    R$ {originalPrice?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </p>
                                            )}
                                            <p className="text-lg font-medium text-sky-600 dark:text-sky-400">
                                                R$ {item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                <span className="text-sm font-normal text-zinc-500">/mês</span>
                                            </p>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>

                        <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-800 flex justify-end">
                            <div className="text-right">
                                <p className="text-sm text-zinc-500 dark:text-zinc-500">Total Mensal</p>
                                <p className="text-2xl font-light text-sky-600 dark:text-sky-400">
                                    R$ {proposal.totalRecurring.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    <span className="text-sm text-zinc-500 dark:text-zinc-500 font-normal">/mês</span>
                                </p>
                            </div>
                        </div>
                    </motion.section>
                )}

                {/* Payment & Notes - Side by side on desktop */}
                {((proposal.paymentMethods?.length || 0) > 0 || (proposal.paymentTerms?.length || 0) > 0 || (proposal.notes?.length || 0) > 0) && (
                    <motion.section variants={itemAnim} className="grid md:grid-cols-2 gap-12 mb-20 py-10 border-y border-zinc-100 dark:border-zinc-900">
                        {((proposal.paymentMethods?.length || 0) > 0 || (proposal.paymentTerms?.length || 0) > 0) && (
                            <div>
                                <p className="text-sm text-zinc-500 dark:text-zinc-500 uppercase tracking-wider mb-4">Pagamento</p>
                                {proposal.paymentMethods && proposal.paymentMethods.length > 0 && (
                                    <div className="mb-4">
                                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">Formas aceitas</p>
                                        <div className="flex flex-wrap gap-2">
                                            {proposal.paymentMethods.map((pm, idx) => (
                                                <span key={idx} className="text-sm text-zinc-900 dark:text-zinc-100 bg-zinc-100 dark:bg-zinc-900 px-3 py-1 rounded">
                                                    {pm}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {proposal.paymentTerms && proposal.paymentTerms.length > 0 && (
                                    <div>
                                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">Condições</p>
                                        <ul className="space-y-2">
                                            {proposal.paymentTerms.map((term, idx) => (
                                                <li key={idx} className="text-sm text-zinc-700 dark:text-zinc-300 flex gap-2">
                                                    <span className="text-sky-500 mt-0.5">—</span>
                                                    {term}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}

                        {proposal.notes && proposal.notes.length > 0 && (
                            <div>
                                <p className="text-sm text-zinc-500 dark:text-zinc-500 uppercase tracking-wider mb-4">Observações</p>
                                <ul className="space-y-3">
                                    {proposal.notes.map((note, idx) => (
                                        <li key={idx} className="text-sm text-zinc-600 dark:text-zinc-400 flex gap-2">
                                            <span className="text-zinc-300 dark:text-zinc-700 mt-0.5">•</span>
                                            <span className="whitespace-pre-wrap">{note}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </motion.section>
                )}

                {/* Total Summary - Clean and focused */}
                <motion.section variants={itemAnim} className="mb-16">
                    <div className="bg-zinc-50 dark:bg-zinc-900 rounded-2xl p-8 md:p-12">
                        <p className="text-sm text-zinc-500 dark:text-zinc-500 uppercase tracking-wider mb-6">Resumo</p>

                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                            <div className="space-y-4">
                                {proposal.totalOneTime > 0 && (
                                    <div>
                                        <p className="text-sm text-zinc-500 dark:text-zinc-500">Investimento Inicial</p>
                                        <p className="text-3xl font-light text-zinc-900 dark:text-zinc-100">
                                            R$ {proposal.totalOneTime.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                )}
                                {proposal.totalRecurring > 0 && (
                                    <div>
                                        <p className="text-sm text-zinc-500 dark:text-zinc-500">Mensalidade</p>
                                        <p className="text-3xl font-light text-sky-600 dark:text-sky-400">
                                            R$ {proposal.totalRecurring.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            <span className="text-lg text-zinc-500 dark:text-zinc-500">/mês</span>
                                        </p>

                                        {proposal.recurringPeriod && (proposal.recurringPeriodType === 'years' || proposal.recurringPeriod > 1) && (
                                            <p className="text-sm text-zinc-500 dark:text-zinc-500 mt-2">
                                                Total em {proposal.recurringPeriod} {proposal.recurringPeriodType === 'years' ? (proposal.recurringPeriod === 1 ? 'ano' : 'anos') : (proposal.recurringPeriod === 1 ? 'mês' : 'meses')}:
                                                <span className="text-zinc-900 dark:text-zinc-100 font-medium ml-1">
                                                    R$ {(proposal.totalRecurring * (proposal.recurringPeriodType === 'years' ? proposal.recurringPeriod * 12 : proposal.recurringPeriod)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </span>
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            {(status === 'sent' || status === 'viewed' || status === 'draft') && (
                                <div className="flex flex-col gap-3 no-print">
                                    <Button
                                        size="lg"
                                        onClick={handleAccept}
                                        className="bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 text-white rounded-full px-8 h-12"
                                    >
                                        Aceitar Proposta
                                        <ArrowRight className="ml-2 w-4 h-4" />
                                    </Button>
                                    <div className="flex gap-4 justify-center">
                                        <button
                                            onClick={handleNegotiate}
                                            className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                                        >
                                            Negociar
                                        </button>
                                        <button
                                            onClick={handleReject}
                                            className="text-sm text-zinc-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                        >
                                            Recusar
                                        </button>
                                    </div>
                                </div>
                            )}

                            {status === 'accepted' && (
                                <div className="text-center md:text-right animate-in fade-in duration-500">
                                    <div className="inline-flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-2">
                                        <Check className="w-5 h-5" />
                                        <span className="font-medium">Proposta Aceita</span>
                                    </div>
                                    <p className="text-sm text-zinc-500 dark:text-zinc-500">Entraremos em contato em breve.</p>
                                </div>
                            )}
                            {status === 'rejected' && (
                                <div className="text-center md:text-right animate-in fade-in duration-500">
                                    <div className="inline-flex items-center gap-2 text-red-600 dark:text-red-400 mb-2">
                                        <X className="w-5 h-5" />
                                        <span className="font-medium">Proposta Recusada</span>
                                    </div>
                                    <p className="text-sm text-zinc-500 dark:text-zinc-500">Agradecemos pelo retorno.</p>
                                </div>
                            )}
                            {status === 'negotiating' && (
                                <div className="text-center md:text-right animate-in fade-in duration-500">
                                    <div className="inline-flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-2">
                                        <MessageCircle className="w-5 h-5" />
                                        <span className="font-medium">Em Negociação</span>
                                    </div>
                                    <p className="text-sm text-zinc-500 dark:text-zinc-500">Entraremos em contato.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.section>

                {/* Footer */}
                <motion.footer variants={itemAnim} className="text-center text-sm text-zinc-400 dark:text-zinc-600">
                    <p>Ao aceitar esta proposta, você concorda com os termos descritos acima.</p>
                </motion.footer>
            </motion.main>
        </div>
    );
}
