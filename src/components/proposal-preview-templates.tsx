'use client';

import { Company, PortfolioItem } from '@/lib/db';
import {
    ClassicCustomColors,
    ModernCustomColors,
    MinimalCustomColors,
    DEFAULT_CLASSIC_COLORS,
    DEFAULT_MODERN_COLORS,
    DEFAULT_MINIMAL_COLORS
} from '@/lib/proposal-templates';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Calendar, ShieldCheck, Mail, Phone, CreditCard, Check, CheckCircle2, Play, Image as ImageIcon, Eye, ChevronLeft, ChevronRight, X, Video } from 'lucide-react';

// Helper to check if a color is dark
function isDarkColor(hexColor: string): boolean {
    const hex = hexColor.replace('#', '');
    if (hex.length !== 6) return false;
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance < 0.5;
}

interface PreviewProps {
    company: Company | null;
    clientName: string;
    clientCompany?: string;
    proposalNumber: string;
    validityDays: number;
    items: Array<{ name: string; description: string; price: number; quantity: number; originalPrice?: number | null; showDiscount?: boolean }>;
    recurringItems: Array<{ name: string; description: string; price: number; quantity: number; originalPrice?: number | null; showDiscount?: boolean }>;
    totalOneTime: number;
    totalRecurring: number;
    selectedPaymentMethods: string[];
    selectedPaymentTerms: string[];
    selectedNotes: string[];
    recurringPeriod?: number;
    recurringPeriodType?: string;
    introduction?: string;
    includePortfolio?: boolean;
    includeClientLogos?: boolean;
    clientLogosGrayscale?: boolean;
    portfolioItems?: PortfolioItem[];
}

// Helper Marquee Component
function LogoMarquee({ items, direction = 'left', grayscale }: { items: any[], direction?: 'left' | 'right', grayscale?: boolean }) {
    if (!items || items.length === 0) return null;

    // Ensure we have enough items for smoother infinite loop
    let set = [...items];
    while (set.length < 10) {
        set = [...set, ...items];
    }

    // Render 2 sets for seamless loop (Set A + Set A), sliding by 50% (width of A)
    const renderList = [...set, ...set];

    return (
        <div className="flex overflow-hidden w-full relative group select-none">
            {/* Soft fade edges */}
            <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white via-white/80 to-transparent dark:from-slate-950 dark:via-slate-950/80 z-10 pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-white via-white/80 to-transparent dark:from-slate-950 dark:via-slate-950/80 z-10 pointer-events-none" />

            <motion.div
                className="flex gap-6 min-w-max"
                initial={{ x: direction === 'left' ? "0%" : "-50%" }}
                animate={{ x: direction === 'left' ? "-50%" : "0%" }}
                transition={{ duration: Math.max(20, set.length * 2.5), ease: "linear", repeat: Infinity }}
            >
                {renderList.map((logo, idx) => (
                    <div
                        key={`${logo.url}-${idx}`}
                        className="
                             w-[100px] h-[100px] shrink-0
                             bg-white dark:bg-slate-900 
                             border border-slate-200 dark:border-slate-800 
                             rounded-xl flex items-center justify-center p-4
                             hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-sm
                         "
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={logo.url}
                            alt={logo.name || 'Client Logo'}
                            className={`
                                 max-w-full max-h-full object-contain
                                 ${grayscale ? 'grayscale brightness-0 invert-[0.6] dark:invert-[0.4] transition-opacity duration-300' : ''}
                             `}
                        />
                    </div>
                ))}
            </motion.div>
        </div>
    );
}

export function ClientLogosSection({ logos, grayscale }: { logos: { url: string; name?: string | null }[], grayscale?: boolean }) {
    if (!logos || logos.length === 0) return null;

    // Split into 2 rows if > 6 items
    const twoRows = logos.length > 6;
    const row1 = twoRows ? logos.slice(0, Math.ceil(logos.length / 2)) : logos;
    const row2 = twoRows ? logos.slice(Math.ceil(logos.length / 2)) : [];

    return (
        <div className="py-12 border-t border-dashed border-gray-200 dark:border-gray-700 overflow-hidden">
            <h3 className="text-center text-xs font-semibold text-muted-foreground mb-8 uppercase tracking-widest">Confiam em nosso trabalho</h3>

            <div className="flex flex-col gap-6">
                <LogoMarquee items={row1} direction="left" grayscale={grayscale} />
                {twoRows && <LogoMarquee items={row2} direction="right" grayscale={grayscale} />}
            </div>
        </div>
    );
}

function getVideoEmbedUrl(url: string) {
    if (!url) return null;
    const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1`;
    const vimeoMatch = url.match(/(?:www\.|player\.)?vimeo.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)(?:[a-zA-Z0-9_\-]+)?/);
    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;
    return url;
}

// --- New Gallery Components ---

function VideoCarousel({ items }: { items: any[] }) {
    const [index, setIndex] = useState(0);

    if (!items || items.length === 0) return null;

    const currentItem = items[index];

    const handleNext = () => setIndex((prev) => (prev + 1) % items.length);
    const handlePrev = () => setIndex((prev) => (prev - 1 + items.length) % items.length);

    return (
        <div className="space-y-4">
            {/* Section Header */}
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-red-500 to-pink-600 text-white">
                        <Video className="w-4 h-4" />
                    </div>
                    <span>Nossos Trabalhos</span>
                </h3>
                {items.length > 1 && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handlePrev}
                            className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-sm text-muted-foreground min-w-[40px] text-center">
                            {index + 1}/{items.length}
                        </span>
                        <button
                            onClick={handleNext}
                            className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>

            {/* Video Player */}
            <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-xl bg-black"
            >
                <iframe
                    src={getVideoEmbedUrl(currentItem.url) || currentItem.url}
                    className="w-full h-full"
                    allow="autoplay; encrypted-media; picture-in-picture"
                    allowFullScreen
                />
            </motion.div>

            {/* Video Title */}
            {currentItem.title && (
                <p className="text-center text-sm text-muted-foreground">
                    {currentItem.title}
                </p>
            )}

            {/* Thumbnail Strip */}
            {items.length > 1 && (
                <div className="flex gap-2 justify-center overflow-x-auto py-2 px-1">
                    {items.map((item, i) => (
                        <button
                            key={i}
                            onClick={() => setIndex(i)}
                            className={`relative flex-shrink-0 w-20 h-12 rounded-lg overflow-hidden transition-all duration-300 ${i === index
                                ? 'ring-2 ring-primary ring-offset-2 scale-105'
                                : 'opacity-60 hover:opacity-100 grayscale hover:grayscale-0'
                                }`}
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={item.thumbnailUrl || (item.url.includes('v=') ? `https://img.youtube.com/vi/${item.url.split('v=')[1]?.split('&')[0]}/mqdefault.jpg` : 'https://placehold.co/160x90/1a1a1a/666?text=Video')}
                                className="w-full h-full object-cover"
                                alt={item.title || `Video ${i + 1}`}
                            />
                            {i === index && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                    <Play className="w-4 h-4 text-white fill-white" />
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

function ImageCarousel({ items }: { items: any[] }) {
    const [index, setIndex] = useState(0);

    if (!items || items.length === 0) return null;

    const handleNext = () => setIndex((prev) => (prev + 1) % items.length);
    const handlePrev = () => setIndex((prev) => (prev - 1 + items.length) % items.length);

    // For single image, show simple display
    if (items.length === 1) {
        return (
            <div className="space-y-3">
                <h3 className="font-semibold text-base flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-gradient-to-br from-blue-500 to-cyan-600 text-white">
                        <ImageIcon className="w-3.5 h-3.5" />
                    </div>
                    <span>Nosso Portfólio</span>
                </h3>
                <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden shadow-lg">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={items[0].url} className="w-full h-full object-cover" alt={items[0].title || ''} />
                    {items[0].title && (
                        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent">
                            <p className="text-white font-medium text-sm">{items[0].title}</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-base flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-gradient-to-br from-blue-500 to-cyan-600 text-white">
                        <ImageIcon className="w-3.5 h-3.5" />
                    </div>
                    <span>Nosso Portfólio</span>
                </h3>
                <div className="flex items-center gap-1.5">
                    <button
                        onClick={handlePrev}
                        className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                        <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs text-muted-foreground min-w-[32px] text-center font-medium">
                        {index + 1}/{items.length}
                    </span>
                    <button
                        onClick={handleNext}
                        className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                        <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* Main Content: Image + Thumbnails side by side on larger screens */}
            <div className="flex flex-col md:flex-row gap-3">
                {/* Main Image */}
                <motion.div
                    key={index}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.25 }}
                    className="relative flex-1 aspect-[16/9] md:aspect-[4/3] rounded-xl overflow-hidden shadow-lg bg-slate-100 dark:bg-slate-800"
                >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={items[index].url}
                        className="w-full h-full object-cover"
                        alt={items[index].title || ''}
                    />
                    {items[index].title && (
                        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent">
                            <p className="text-white font-medium text-sm">{items[index].title}</p>
                        </div>
                    )}

                    {/* Navigation arrows on image */}
                    <button
                        onClick={handlePrev}
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors backdrop-blur-sm"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                        onClick={handleNext}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors backdrop-blur-sm"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </motion.div>

                {/* Thumbnail Strip - vertical on desktop, horizontal on mobile */}
                <div className="flex md:flex-col gap-1.5 overflow-x-auto md:overflow-y-auto md:max-h-[200px] md:w-20 pb-1 md:pb-0 md:pr-1">
                    {items.map((item, i) => (
                        <button
                            key={i}
                            onClick={() => setIndex(i)}
                            className={`relative flex-shrink-0 w-14 h-10 md:w-full md:h-12 rounded-md overflow-hidden transition-all duration-200 ${i === index
                                ? 'ring-2 ring-primary shadow-md'
                                : 'opacity-60 hover:opacity-100'
                                }`}
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={item.url}
                                className="w-full h-full object-cover"
                                alt={item.title || `Image ${i + 1}`}
                            />
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

export function PortfolioSection({ items }: { items: any[] }) {
    if (!items || items.length === 0) return null;

    // Logic: Select first Video-Type Gallery and first Image-Type Gallery
    const videoGallery = items.find(i => i.type === 'video');
    const imageGallery = items.find(i => i.type === 'image');

    // Helper to unpack items (supports both JSON field and JSON-in-URL hack)
    const unpackItems = (galleryBox: any) => {
        if (!galleryBox) return [];
        if (galleryBox.items && Array.isArray(galleryBox.items)) return galleryBox.items;
        if (galleryBox.url && typeof galleryBox.url === 'string' && galleryBox.url.startsWith('JSON::')) {
            try {
                return JSON.parse(galleryBox.url.replace('JSON::', ''));
            } catch (e) {
                console.error('Failed to parse gallery items', e);
                return [];
            }
        }
        // Fallback legacy single item
        return [{ url: galleryBox.url, thumbnailUrl: galleryBox.thumbnailUrl, title: galleryBox.title, type: galleryBox.type }];
    };

    const videoItems = unpackItems(videoGallery);
    const imageItems = unpackItems(imageGallery);

    if (items.length > 0 && videoItems.length === 0 && imageItems.length === 0) {
        return (
            <div className="p-4 border border-red-200 bg-red-50 rounded-lg text-center">
                <p className="text-red-500 text-sm font-medium">Erro ao carregar galeria.</p>
                <p className="text-xs text-red-400">Verifique se o item foi salvo corretamente.</p>
            </div>
        );
    }

    if (videoItems.length === 0 && imageItems.length === 0) return null;

    return (
        <div className="py-6 space-y-8">
            {videoItems.length > 0 && <VideoCarousel items={videoItems} />}
            {imageItems.length > 0 && <ImageCarousel items={imageItems} />}
        </div>
    );
}

// ============ CLASSIC PREVIEW ============
interface ClassicPreviewProps extends PreviewProps {
    customColors: ClassicCustomColors;
}

export function ClassicPreview({
    company,
    clientName,
    clientCompany,
    proposalNumber,
    validityDays,
    items,
    recurringItems,
    totalOneTime,
    totalRecurring,
    selectedPaymentMethods,
    selectedPaymentTerms,
    selectedNotes,
    recurringPeriod,
    recurringPeriodType,
    introduction,
    customColors,
    includePortfolio,
    includeClientLogos,
    clientLogosGrayscale,
    portfolioItems
}: ClassicPreviewProps) {
    const displayPortfolio = portfolioItems !== undefined ? portfolioItems : (company?.portfolioItems || []);
    const getContrastTextStyle = (bgColor: string) => ({
        color: isDarkColor(bgColor) ? '#ffffff' : '#1e293b'
    });

    const getContrastMutedStyle = (bgColor: string) => ({
        color: isDarkColor(bgColor) ? 'rgba(255,255,255,0.7)' : '#64748b'
    });

    return (
        <div className="bg-gradient-to-br from-background via-background to-secondary/20 border rounded-xl overflow-hidden shadow-2xl">
            {/* Preview Header */}
            <div className="bg-background/80 backdrop-blur-md border-b p-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    {company?.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={company.logoUrl} alt={company.name} className="h-8 w-auto object-contain" />
                    ) : (
                        <div className="font-bold text-lg tracking-tight">{company?.name || 'Sua Empresa'}</div>
                    )}
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium border bg-yellow-500/10 text-yellow-500 border-yellow-500/20 animate-pulse">
                    Pré-visualização
                </span>
            </div>

            {/* Preview Content */}
            <div className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto" style={{ backgroundColor: customColors.headerBg }}>
                {/* Introduction */}
                <div className="text-center space-y-3 py-6 rounded-lg p-4" style={{ backgroundColor: customColors.introductionBg }}>
                    {company?.logoUrl ? (
                        <div className="mb-4">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={company.logoUrl} alt={company.name} className="h-16 w-auto object-contain mx-auto" />
                        </div>
                    ) : (
                        <div className={`inline-block p-3 rounded-full ${isDarkColor(customColors.introductionBg) ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'}`}>
                            <FileText className="w-6 h-6" />
                        </div>
                    )}
                    <h2 className="text-2xl font-extrabold tracking-tight" style={isDarkColor(customColors.introductionBg) ? { color: '#ffffff' } : {}}>
                        <span className={isDarkColor(customColors.introductionBg) ? '' : 'bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent'}>
                            Proposta Comercial
                        </span>
                    </h2>
                    <div className={`inline-block px-3 py-1 rounded-full ${isDarkColor(customColors.introductionBg) ? 'bg-white/20' : 'bg-violet-100 dark:bg-violet-900/30'}`}>
                        <span className={`text-xs font-medium ${isDarkColor(customColors.introductionBg) ? 'text-white' : 'text-violet-700 dark:text-violet-300'}`}>{proposalNumber}</span>
                    </div>
                    <p style={getContrastMutedStyle(customColors.introductionBg)}>
                        Preparada para <span className="font-semibold" style={getContrastTextStyle(customColors.introductionBg)}>{clientName || 'Nome do Cliente'}</span>
                    </p>
                    {clientCompany && (
                        <p className="text-sm font-medium -mt-2" style={getContrastMutedStyle(customColors.introductionBg)}>{clientCompany}</p>
                    )}
                    <div className="flex justify-center gap-4 text-xs" style={getContrastMutedStyle(customColors.introductionBg)}>
                        <span className="flex items-center"><Calendar className="w-3 h-3 mr-1" /> {new Date().toLocaleDateString('pt-BR')}</span>
                        <span className="flex items-center"><ShieldCheck className="w-3 h-3 mr-1" /> Validade: {validityDays} dias</span>
                    </div>
                </div>

                {/* Company Intro */}
                {company && (
                    <div className="bg-card/50 backdrop-blur-sm rounded-lg p-4 text-center">
                        <h3 className="text-sm font-semibold mb-1">Apresentado por {company.responsible}</h3>
                        <div className="flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
                            <span className="flex items-center"><Mail className="w-3 h-3 mr-1" /> {company.email}</span>
                            <span className="flex items-center"><Phone className="w-3 h-3 mr-1" /> {company.phone}</span>
                        </div>
                    </div>
                )}

                {/* Introduction Text */}
                {introduction && (
                    <div className="bg-card border rounded-lg p-6 shadow-sm">
                        <h3 className="font-semibold text-sm mb-2 text-slate-700 dark:text-slate-300">Apresentação</h3>
                        <div
                            className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed prose prose-sm max-w-none dark:prose-invert"
                            dangerouslySetInnerHTML={{ __html: introduction }}
                        />
                    </div>
                )}

                {/* Portfolio */}
                {includePortfolio && displayPortfolio.length > 0 && (
                    <PortfolioSection items={displayPortfolio} />
                )}

                {/* One Time Items */}
                {items.length > 0 && (
                    <div className="space-y-3 rounded-lg p-4" style={{ backgroundColor: customColors.oneTimeBg }}>
                        <div className="flex items-center gap-2">
                            <div className={`h-5 w-1 rounded-full ${isDarkColor(customColors.oneTimeBg) ? 'bg-white' : 'bg-primary'}`}></div>
                            <h3 className="font-bold text-sm" style={getContrastTextStyle(customColors.oneTimeBg)}>Investimento Único</h3>
                        </div>
                        <div className="space-y-2">
                            {items.map((item, idx) => {
                                const originalPrice = item.originalPrice || 0;
                                const hasDiscount = (item.showDiscount ?? true) && originalPrice > item.price;
                                const discountPercent = hasDiscount && originalPrice ? Math.round(((originalPrice - item.price) / originalPrice) * 100) : 0;

                                return (
                                    <div key={idx} className="bg-card border rounded-lg p-3 flex justify-between items-center gap-2 relative overflow-hidden">
                                        {hasDiscount && (
                                            <div className="absolute top-0 right-0 bg-green-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg z-10">
                                                {discountPercent}%
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-medium text-sm">{item.name}</h4>
                                            <p className="text-muted-foreground text-xs whitespace-pre-wrap break-words">{item.description}</p>
                                            {item.quantity > 1 && (
                                                <p className="text-muted-foreground text-xs mt-0.5">{item.quantity}x R$ {item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                            )}
                                        </div>
                                        <div className="text-right shrink-0">
                                            {hasDiscount ? (
                                                <div className="flex flex-col items-end">
                                                    <span className="text-[10px] text-muted-foreground line-through">
                                                        R$ {(originalPrice * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                    </span>
                                                    <div className="font-bold text-sm text-green-600">
                                                        R$ {(item.price * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="font-bold text-sm">R$ {(item.price * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className={`text-right p-2 rounded-lg border ${isDarkColor(customColors.oneTimeBg) ? 'bg-white/10 border-white/20' : 'bg-primary/5 border-primary/10'}`}>
                            <p className="text-xs" style={getContrastMutedStyle(customColors.oneTimeBg)}>Total Único</p>
                            <p className={`text-lg font-bold ${isDarkColor(customColors.oneTimeBg) ? 'text-white' : 'text-primary'}`}>R$ {totalOneTime.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        </div>
                    </div>
                )}

                {/* Recurring Items */}
                {recurringItems.length > 0 && (
                    <div className="space-y-3 rounded-lg p-4" style={{ backgroundColor: customColors.recurringBg }}>
                        <div className="flex items-center gap-2">
                            <div className={`h-5 w-1 rounded-full ${isDarkColor(customColors.recurringBg) ? 'bg-white' : 'bg-blue-500'}`}></div>
                            <h3 className="font-bold text-sm" style={getContrastTextStyle(customColors.recurringBg)}>Mensalidade Recorrente</h3>
                        </div>
                        <div className="space-y-2">
                            {recurringItems.map((item, idx) => {
                                const originalPrice = item.originalPrice || 0;
                                const hasDiscount = (item.showDiscount ?? true) && originalPrice > item.price;
                                const discountPercent = hasDiscount && originalPrice ? Math.round(((originalPrice - item.price) / originalPrice) * 100) : 0;

                                return (
                                    <div key={idx} className="bg-card border-l-4 border-l-blue-500 rounded-r-lg border-y border-r p-3 flex justify-between items-center gap-2 relative overflow-hidden">
                                        {hasDiscount && (
                                            <div className="absolute top-0 right-0 bg-green-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg z-10">
                                                {discountPercent}%
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-medium text-sm">{item.name}</h4>
                                            <p className="text-muted-foreground text-xs whitespace-pre-wrap break-words">{item.description}</p>
                                            {item.quantity > 1 && (
                                                <p className="text-muted-foreground text-xs mt-0.5">{item.quantity}x R$ {item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                            )}
                                        </div>
                                        <div className="text-right shrink-0">
                                            {hasDiscount ? (
                                                <div className="flex flex-col items-end">
                                                    <span className="text-[10px] text-muted-foreground line-through">
                                                        R$ {(originalPrice * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                    </span>
                                                    <div className="font-bold text-sm text-blue-500">
                                                        R$ {(item.price * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="font-bold text-sm text-blue-500">R$ {(item.price * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês</div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className={`text-right p-2 rounded-lg border ${isDarkColor(customColors.recurringBg) ? 'bg-white/10 border-white/20' : 'bg-blue-500/5 border-blue-500/10'}`}>
                            <p className="text-xs" style={getContrastMutedStyle(customColors.recurringBg)}>Total Mensal</p>
                            <p className={`text-lg font-bold ${isDarkColor(customColors.recurringBg) ? 'text-white' : 'text-blue-500'}`}>
                                R$ {totalRecurring.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} <span className="text-xs font-normal">/mês</span>
                            </p>
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {items.length === 0 && recurringItems.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                        <p className="text-sm">Adicione itens à proposta para visualizar o preview.</p>
                    </div>
                )}

                {/* Payment & Terms */}
                {(selectedPaymentMethods.length > 0 || selectedPaymentTerms.length > 0) && (
                    <div className="rounded-lg p-4 border border-emerald-200 dark:border-emerald-800" style={{ backgroundColor: customColors.notesBg }}>
                        <div className="flex items-center gap-2 mb-2">
                            <CreditCard className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            <h4 className="font-semibold text-sm text-emerald-800 dark:text-emerald-300">Pagamento</h4>
                        </div>
                        {selectedPaymentMethods.length > 0 && (
                            <p className="text-sm text-emerald-700 dark:text-emerald-400">
                                <span className="font-medium">Formas:</span> {selectedPaymentMethods.join(', ')}
                            </p>
                        )}
                        {selectedPaymentTerms.length > 0 && (
                            <div className="mt-2 text-sm text-emerald-700 dark:text-emerald-400">
                                <span className="font-medium">Condições:</span>
                                <ul className="list-disc list-inside mt-1 space-y-1">
                                    {selectedPaymentTerms.map((term, idx) => (
                                        <li key={idx} className="text-xs">{term}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}

                {/* Notes */}
                {selectedNotes.length > 0 && (
                    <div className="rounded-lg p-4 border border-violet-200 dark:border-violet-800" style={{ backgroundColor: customColors.notesBg }}>
                        <div className="flex items-center gap-2 mb-2">
                            <FileText className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                            <h4 className="font-semibold text-sm text-violet-800 dark:text-violet-300">Observações</h4>
                        </div>
                        <ul className="space-y-2">
                            {selectedNotes.map((note, idx) => (
                                <li key={idx} className="text-sm text-violet-700 dark:text-violet-400">• {note}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Summary */}
                {(items.length > 0 || recurringItems.length > 0) && (
                    <div
                        className="rounded-lg p-4 text-center space-y-2 relative overflow-hidden"
                        style={{
                            backgroundColor: customColors.totalBg,
                            color: isDarkColor(customColors.totalBg) ? '#ffffff' : '#1e293b'
                        }}
                    >
                        <div className="absolute top-0 right-0 p-16 bg-white/10 rounded-full -mr-8 -mt-8 blur-xl"></div>
                        <h3 className="font-bold relative z-10">Resumo do Investimento</h3>
                        <div className="flex justify-center gap-6 relative z-10">
                            {totalOneTime > 0 && (
                                <div>
                                    <p className="text-xs opacity-80">Inicial</p>
                                    <p className="text-xl font-extrabold">R$ {totalOneTime.toLocaleString('pt-BR')}</p>
                                </div>
                            )}
                            {totalRecurring > 0 && (
                                <div className={totalOneTime > 0 ? "border-l border-current/20 pl-6" : ""}>
                                    <p className="text-xs opacity-80">Mensal</p>
                                    <p className="text-xl font-extrabold">R$ {totalRecurring.toLocaleString('pt-BR')}</p>
                                    {recurringPeriod && (recurringPeriodType === 'years' || recurringPeriod > 1) && (
                                        <div className="mt-1 pt-1 border-t border-current/20">
                                            <p className="text-[10px] opacity-70 leading-tight">
                                                Total em {recurringPeriod} {recurringPeriodType === 'years' ? (recurringPeriod === 1 ? 'ano' : 'anos') : (recurringPeriod === 1 ? 'mês' : 'meses')}:
                                            </p>
                                            <p className="text-sm font-bold">
                                                R$ {(totalRecurring * (recurringPeriodType === 'years' ? recurringPeriod * 12 : recurringPeriod)).toLocaleString('pt-BR')}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
                {/* Client Logos */}
                {includeClientLogos && company?.clientLogos && company.clientLogos.length > 0 && (
                    <ClientLogosSection logos={company.clientLogos} grayscale={clientLogosGrayscale} />
                )}
            </div>
        </div>
    );
}

// ============ MODERN PREVIEW ============
interface ModernPreviewProps extends PreviewProps {
    customColors: ModernCustomColors;
}

export function ModernPreview({
    company,
    clientName,
    clientCompany,
    proposalNumber,
    validityDays,
    items,
    recurringItems,
    totalOneTime,
    totalRecurring,
    selectedPaymentMethods,
    selectedPaymentTerms,
    selectedNotes,
    recurringPeriod,
    recurringPeriodType,
    introduction,
    customColors,
    includePortfolio,
    includeClientLogos,
    clientLogosGrayscale,
    portfolioItems
}: ModernPreviewProps) {
    const displayPortfolio = portfolioItems !== undefined ? portfolioItems : (company?.portfolioItems || []);
    const gradientStyle = {
        background: `linear-gradient(135deg, ${customColors.gradientStart}, ${customColors.gradientMiddle}, ${customColors.gradientEnd})`
    };

    return (
        <div className="border rounded-xl overflow-hidden shadow-2xl">
            {/* Header with gradient */}
            <div style={gradientStyle} className="p-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    {company?.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={company.logoUrl} alt={company.name} className="h-8 w-auto object-contain brightness-0 invert" />
                    ) : (
                        <div className="font-bold text-lg tracking-tight text-white">{company?.name || 'Sua Empresa'}</div>
                    )}
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/20 text-white border border-white/30 backdrop-blur animate-pulse">
                    Pré-visualização
                </span>
            </div>

            {/* Content with gradient background */}
            <div style={gradientStyle} className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto relative">
                {/* Animated glow effects */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-400/20 rounded-full blur-3xl"></div>

                {/* Hero Section */}
                <div className="text-center space-y-4 relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur border border-white/20 text-white/80 text-xs">
                        ✨ Proposta Exclusiva
                    </div>
                    <h1 className="text-3xl font-black tracking-tight text-white drop-shadow-lg">
                        Proposta Comercial
                    </h1>
                    <p className="text-lg text-white/80">
                        Para <span className="font-bold text-white">{clientName || 'Nome do Cliente'}</span>
                    </p>
                    {clientCompany && <p className="text-sm text-white/60">{clientCompany}</p>}
                    <div className="flex justify-center gap-4 text-xs text-white/60">
                        <span className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-full">
                            <Calendar className="w-3 h-3" /> {new Date().toLocaleDateString('pt-BR')}
                        </span>
                        <span className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-full">
                            <ShieldCheck className="w-3 h-3" /> {validityDays} dias
                        </span>
                    </div>
                </div>

                {/* Introduction */}
                {introduction && (
                    <div className="relative z-10 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
                        <div
                            className="text-white/90 text-sm leading-relaxed prose prose-sm max-w-none prose-invert"
                            dangerouslySetInnerHTML={{ __html: introduction }}
                        />
                        {/* Quote styling removed as it might conflict with arbitrary HTML */}
                    </div>
                )}

                {/* Portfolio */}
                {includePortfolio && displayPortfolio.length > 0 && (
                    <PortfolioSection items={displayPortfolio} />
                )}

                {/* One Time Items - Glassmorphism cards */}
                {items.length > 0 && (
                    <div className="space-y-3 relative z-10">
                        <div className="flex items-center gap-2">
                            <div className="h-6 w-1 rounded-full" style={{ backgroundColor: customColors.accentColor }}></div>
                            <h3 className="font-bold text-white">Investimento Único</h3>
                        </div>
                        <div className="space-y-2">
                            {items.map((item, idx) => {
                                const originalPrice = item.originalPrice || 0;
                                const hasDiscount = (item.showDiscount ?? true) && originalPrice > item.price;
                                const discountPercent = hasDiscount && originalPrice ? Math.round(((originalPrice - item.price) / originalPrice) * 100) : 0;

                                return (
                                    <div key={idx} className="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-4 flex justify-between items-center relative overflow-hidden">
                                        {hasDiscount && (
                                            <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg z-10">
                                                {discountPercent}%
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-white">{item.name}</h4>
                                            <p className="text-white/60 text-xs whitespace-pre-wrap break-words">{item.description}</p>
                                            {item.quantity > 1 && (
                                                <p className="text-white/60 text-xs mt-0.5">{item.quantity}x R$ {item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            {hasDiscount ? (
                                                <div className="flex flex-col items-end">
                                                    <span className="text-[10px] text-white/50 line-through">
                                                        R$ {(originalPrice * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                    </span>
                                                    <div className="font-bold text-lg" style={{ color: customColors.accentColor }}>
                                                        R$ {(item.price * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="font-bold text-lg" style={{ color: customColors.accentColor }}>
                                                    R$ {(item.price * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="text-right p-3 rounded-xl bg-white/10 backdrop-blur border border-white/20">
                            <p className="text-xs text-white/60">Total Único</p>
                            <p className="text-xl font-bold" style={{ color: customColors.accentColor }}>
                                R$ {totalOneTime.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                    </div>
                )}

                {/* Recurring Items */}
                {recurringItems.length > 0 && (
                    <div className="space-y-3 relative z-10">
                        <div className="flex items-center gap-2">
                            <div className="h-6 w-1 rounded-full bg-cyan-400"></div>
                            <h3 className="font-bold text-white">Mensalidade</h3>
                        </div>
                        <div className="space-y-2">
                            {recurringItems.map((item, idx) => {
                                const originalPrice = item.originalPrice || 0;
                                const hasDiscount = (item.showDiscount ?? true) && originalPrice > item.price;
                                const discountPercent = hasDiscount && originalPrice ? Math.round(((originalPrice - item.price) / originalPrice) * 100) : 0;

                                return (
                                    <div key={idx} className="bg-white/10 backdrop-blur border-l-4 border-l-cyan-400 border border-white/20 rounded-xl rounded-l-none p-4 flex justify-between items-center relative overflow-hidden">
                                        {hasDiscount && (
                                            <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg z-10">
                                                {discountPercent}%
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-white">{item.name}</h4>
                                            <p className="text-white/60 text-xs whitespace-pre-wrap break-words">{item.description}</p>
                                            {item.quantity > 1 && (
                                                <p className="text-white/60 text-xs mt-0.5">{item.quantity}x R$ {item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            {hasDiscount ? (
                                                <div className="flex flex-col items-end">
                                                    <span className="text-[10px] text-white/50 line-through">
                                                        R$ {(originalPrice * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                    </span>
                                                    <div className="font-bold text-lg text-cyan-400">
                                                        R$ {(item.price * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-right">
                                                    <div className="font-bold text-lg text-cyan-400">
                                                        R$ {(item.price * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                    </div>
                                                    <div className="text-xs text-white/50">/mês</div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="text-right p-3 rounded-xl bg-cyan-400/20 backdrop-blur border border-cyan-400/30">
                            <p className="text-xs text-white/60">Total Mensal</p>
                            <p className="text-xl font-bold text-cyan-400">
                                R$ {totalRecurring.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} <span className="text-sm font-normal text-white/60">/mês</span>
                            </p>
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {items.length === 0 && recurringItems.length === 0 && (
                    <div className="text-center py-8 text-white/60 relative z-10">
                        <p className="text-sm">Adicione itens à proposta para visualizar o preview.</p>
                    </div>
                )}

                {/* Payment & Terms */}
                {(selectedPaymentMethods.length > 0 || selectedPaymentTerms.length > 0) && (
                    <div className="relative z-10 bg-white/10 backdrop-blur border border-white/20 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <CreditCard className="h-4 w-4 text-emerald-400" />
                            <h3 className="font-bold text-sm text-white">Pagamento</h3>
                        </div>
                        {selectedPaymentMethods.length > 0 && (
                            <p className="text-sm text-white/80">
                                <span className="font-medium text-white">Formas:</span> {selectedPaymentMethods.join(', ')}
                            </p>
                        )}
                        {selectedPaymentTerms.length > 0 && (
                            <div className="mt-2 text-sm text-white/80">
                                <span className="font-medium text-white">Condições:</span>
                                <ul className="list-disc list-inside mt-1 space-y-1">
                                    {selectedPaymentTerms.map((term, idx) => (
                                        <li key={idx} className="text-xs">{term}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}

                {/* Notes */}
                {selectedNotes.length > 0 && (
                    <div className="relative z-10 bg-white/10 backdrop-blur border border-white/20 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <FileText className="h-4 w-4 text-violet-400" />
                            <h3 className="font-bold text-sm text-white">Observações</h3>
                        </div>
                        <ul className="space-y-2">
                            {selectedNotes.map((note, idx) => (
                                <li key={idx} className="text-sm text-white/80">• {note}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Summary */}
                {(items.length > 0 || recurringItems.length > 0) && (
                    <div className="relative z-10 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 text-center space-y-4">
                        <h3 className="font-bold text-xl text-white">Resumo do Investimento</h3>
                        <div className="flex justify-center gap-8">
                            {totalOneTime > 0 && (
                                <div>
                                    <p className="text-sm text-white/60">Inicial</p>
                                    <p className="text-2xl font-extrabold text-white">R$ {totalOneTime.toLocaleString('pt-BR')}</p>
                                </div>
                            )}
                            {totalRecurring > 0 && (
                                <div className={totalOneTime > 0 ? "border-l border-white/20 pl-8" : ""}>
                                    <p className="text-sm text-white/60">Mensal</p>
                                    <p className="text-2xl font-extrabold text-white">R$ {totalRecurring.toLocaleString('pt-BR')}</p>
                                    {recurringPeriod && (recurringPeriodType === 'years' || recurringPeriod > 1) && (
                                        <div className="mt-1 pt-1 border-t border-white/20">
                                            <p className="text-[10px] text-white/70 leading-tight">
                                                Total em {recurringPeriod} {recurringPeriodType === 'years' ? (recurringPeriod === 1 ? 'ano' : 'anos') : (recurringPeriod === 1 ? 'mês' : 'meses')}:
                                            </p>
                                            <p className="text-sm font-bold text-white">
                                                R$ {(totalRecurring * (recurringPeriodType === 'years' ? recurringPeriod * 12 : recurringPeriod)).toLocaleString('pt-BR')}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
                {/* Client Logos */}
                {includeClientLogos && company?.clientLogos && company.clientLogos.length > 0 && (
                    <ClientLogosSection logos={company.clientLogos} grayscale={clientLogosGrayscale} />
                )}
            </div>
        </div>
    );
}

// ============ MINIMAL PREVIEW ============
interface MinimalPreviewProps extends PreviewProps {
    customColors: MinimalCustomColors;
}

export function MinimalPreview({
    company,
    clientName,
    clientCompany,
    proposalNumber,
    validityDays,
    items,
    recurringItems,
    totalOneTime,
    totalRecurring,
    selectedPaymentMethods,
    selectedPaymentTerms,
    selectedNotes,
    recurringPeriod,
    recurringPeriodType,
    introduction,
    customColors,
    includePortfolio,
    includeClientLogos,
    clientLogosGrayscale,
    portfolioItems
}: MinimalPreviewProps) {
    const displayPortfolio = portfolioItems !== undefined ? portfolioItems : (company?.portfolioItems || []);
    return (
        <div className="border rounded-xl overflow-hidden shadow-2xl" style={{ backgroundColor: customColors.backgroundColor }}>
            {/* Minimal Header */}
            <div className="border-b p-4 flex justify-between items-center" style={{ borderColor: '#e5e7eb' }}>
                <div className="flex items-center gap-3">
                    {company?.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={company.logoUrl} alt={company.name} className="h-8 w-auto object-contain" />
                    ) : (
                        <span className="font-medium tracking-tight" style={{ color: customColors.textColor }}>
                            {company?.name || 'Proposta'}
                        </span>
                    )}
                </div>
                <span className="text-xs" style={{ color: customColors.accentColor }}>
                    Pré-visualização
                </span>
            </div>

            {/* Minimal Content */}
            <div className="p-6 space-y-8 max-h-[calc(100vh-200px)] overflow-y-auto">
                {/* Hero */}
                <div className="space-y-4">
                    <div className="text-xs" style={{ color: '#9ca3af' }}>
                        {new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })} • {validityDays} dias
                    </div>
                    <h1 className="text-3xl font-light tracking-tight" style={{ color: customColors.textColor }}>
                        Proposta Comercial
                    </h1>
                    <div className="h-px w-16" style={{ backgroundColor: customColors.accentColor }}></div>
                    <p className="text-lg" style={{ color: '#6b7280' }}>
                        Para <span style={{ color: customColors.textColor }}>{clientName || 'Nome do Cliente'}</span>
                    </p>
                    {clientCompany && <p className="text-sm" style={{ color: '#9ca3af' }}>{clientCompany}</p>}
                </div>

                {/* Introduction */}
                {introduction && (
                    <div className="py-4 border-t border-b" style={{ borderColor: '#e5e7eb' }}>
                        <div
                            className="text-sm leading-relaxed prose prose-sm max-w-none prose-slate"
                            style={{ color: '#4b5563' }}
                            dangerouslySetInnerHTML={{ __html: introduction }}
                        />
                    </div>
                )}

                {/* Portfolio */}
                {includePortfolio && displayPortfolio.length > 0 && (
                    <PortfolioSection items={displayPortfolio} />
                )}

                {/* One Time Items */}
                {items.length > 0 && (
                    <div className="space-y-4">
                        <p className="text-xs uppercase tracking-wider" style={{ color: '#9ca3af' }}>Investimento Único</p>
                        <div className="divide-y" style={{ borderColor: '#f3f4f6' }}>
                            {items.map((item, idx) => {
                                const originalPrice = item.originalPrice || 0;
                                const hasDiscount = (item.showDiscount ?? true) && originalPrice > item.price;
                                const discountPercent = hasDiscount && originalPrice ? Math.round(((originalPrice - item.price) / originalPrice) * 100) : 0;

                                return (
                                    <div key={idx} className="py-4 flex items-center justify-between gap-4 relative" style={{ backgroundColor: customColors.productBlockBg, padding: '1rem', borderRadius: '0.5rem', marginBottom: '0.5rem' }}>
                                        <div className="flex items-start gap-3 flex-1">
                                            {customColors.showCheckmarks && (
                                                <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#22c55e' }} />
                                            )}
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-medium" style={{ color: customColors.textColor }}>{item.name}</h4>
                                                    {hasDiscount && (
                                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-green-100 text-green-700">
                                                            -{discountPercent}%
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs whitespace-pre-wrap break-words" style={{ color: '#9ca3af' }}>{item.description}</p>
                                                {item.quantity > 1 && (
                                                    <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>{item.quantity}x R$ {item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            {hasDiscount ? (
                                                <div className="flex flex-col items-end">
                                                    <span className="text-xs line-through" style={{ color: '#9ca3af' }}>
                                                        R$ {(originalPrice * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                    </span>
                                                    <div className="font-medium" style={{ color: customColors.textColor }}>
                                                        R$ {(item.price * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="font-medium" style={{ color: customColors.textColor }}>
                                                    R$ {(item.price * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex justify-end pt-2 border-t" style={{ borderColor: '#e5e7eb' }}>
                            <div className="text-right">
                                <p className="text-xs" style={{ color: '#9ca3af' }}>Subtotal</p>
                                <p className="text-xl font-light" style={{ color: customColors.textColor }}>
                                    R$ {totalOneTime.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Recurring Items */}
                {recurringItems.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <p className="text-xs uppercase tracking-wider" style={{ color: '#9ca3af' }}>Mensalidade</p>
                            <div className="h-px flex-1" style={{ backgroundColor: '#f3f4f6' }}></div>
                        </div>
                        <div>
                            {recurringItems.map((item, idx) => {
                                const originalPrice = item.originalPrice || 0;
                                const hasDiscount = (item.showDiscount ?? true) && originalPrice > item.price;
                                const discountPercent = hasDiscount && originalPrice ? Math.round(((originalPrice - item.price) / originalPrice) * 100) : 0;

                                return (
                                    <div
                                        key={idx}
                                        className="py-4 flex items-center justify-between gap-4 relative"
                                        style={{
                                            backgroundColor: customColors.productBlockBg,
                                            padding: '1rem',
                                            borderRadius: '0.5rem',
                                            marginBottom: '0.5rem',
                                            borderLeft: `3px solid ${customColors.accentColor}`
                                        }}
                                    >
                                        <div className="flex items-start gap-3 flex-1">
                                            {customColors.showCheckmarks && (
                                                <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#22c55e' }} />
                                            )}
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-medium" style={{ color: customColors.textColor }}>{item.name}</h4>
                                                    {hasDiscount && (
                                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-green-100 text-green-700">
                                                            -{discountPercent}%
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs whitespace-pre-wrap break-words" style={{ color: '#9ca3af' }}>{item.description}</p>
                                                {item.quantity > 1 && (
                                                    <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>{item.quantity}x R$ {item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            {hasDiscount ? (
                                                <div className="flex flex-col items-end">
                                                    <span className="text-xs line-through" style={{ color: '#9ca3af' }}>
                                                        R$ {(originalPrice * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                    </span>
                                                    <div className="font-medium" style={{ color: customColors.accentColor }}>
                                                        R$ {(item.price * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-right">
                                                    <div className="font-medium" style={{ color: customColors.accentColor }}>
                                                        R$ {(item.price * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                    </div>
                                                    <div className="text-xs" style={{ color: '#9ca3af' }}>/mês</div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex justify-end pt-2 border-t" style={{ borderColor: '#e5e7eb' }}>
                            <div className="text-right">
                                <p className="text-xs" style={{ color: '#9ca3af' }}>Total Mensal</p>
                                <p className="text-xl font-light" style={{ color: customColors.accentColor }}>
                                    R$ {totalRecurring.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    <span className="text-sm" style={{ color: '#9ca3af' }}>/mês</span>
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {items.length === 0 && recurringItems.length === 0 && (
                    <div className="text-center py-8" style={{ color: '#9ca3af' }}>
                        <p className="text-sm">Adicione itens à proposta.</p>
                    </div>
                )}

                {/* Payment & Terms */}
                {(selectedPaymentMethods.length > 0 || selectedPaymentTerms.length > 0) && (
                    <div className="rounded-lg p-4 mb-4" style={{ backgroundColor: customColors.productBlockBg }}>
                        <div className="flex items-center gap-2 mb-2">
                            <CreditCard className="h-4 w-4" style={{ color: customColors.accentColor }} />
                            <h3 className="font-medium text-sm" style={{ color: customColors.textColor }}>Pagamento</h3>
                        </div>
                        {selectedPaymentMethods.length > 0 && (
                            <p className="text-sm">
                                <span className="font-medium" style={{ color: customColors.textColor }}>Formas:</span> <span style={{ color: '#6b7280' }}>{selectedPaymentMethods.join(', ')}</span>
                            </p>
                        )}
                        {selectedPaymentTerms.length > 0 && (
                            <div className="mt-2 text-sm">
                                <span className="font-medium" style={{ color: customColors.textColor }}>Condições:</span>
                                <ul className="list-disc list-inside mt-1 space-y-1" style={{ color: '#6b7280' }}>
                                    {selectedPaymentTerms.map((term, idx) => (
                                        <li key={idx} className="text-xs">{term}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}

                {/* Notes */}
                {selectedNotes.length > 0 && (
                    <div className="rounded-lg p-4 mb-4" style={{ backgroundColor: customColors.productBlockBg }}>
                        <div className="flex items-center gap-2 mb-2">
                            <FileText className="h-4 w-4" style={{ color: customColors.accentColor }} />
                            <h3 className="font-medium text-sm" style={{ color: customColors.textColor }}>Observações</h3>
                        </div>
                        <ul className="space-y-2">
                            {selectedNotes.map((note, idx) => (
                                <li key={idx} className="text-sm" style={{ color: '#6b7280' }}>• {note}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Summary */}
                {(items.length > 0 || recurringItems.length > 0) && (
                    <div className="rounded-xl p-6" style={{ backgroundColor: customColors.productBlockBg }}>
                        <p className="text-xs uppercase tracking-wider mb-4" style={{ color: '#9ca3af' }}>Resumo</p>
                        <div className="flex gap-8">
                            {totalOneTime > 0 && (
                                <div>
                                    <p className="text-xs" style={{ color: '#9ca3af' }}>Inicial</p>
                                    <p className="text-2xl font-light" style={{ color: customColors.textColor }}>
                                        R$ {totalOneTime.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                            )}
                            {totalRecurring > 0 && (
                                <div>
                                    <p className="text-xs" style={{ color: '#9ca3af' }}>Mensal</p>
                                    <p className="text-2xl font-light" style={{ color: customColors.accentColor }}>
                                        R$ {totalRecurring.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </p>
                                    {recurringPeriod && (recurringPeriodType === 'years' || recurringPeriod > 1) && (
                                        <div className="mt-1 pt-1 border-t" style={{ borderColor: '#e5e7eb' }}>
                                            <p className="text-[10px]" style={{ color: '#9ca3af' }}>
                                                Total em {recurringPeriod} {recurringPeriodType === 'years' ? (recurringPeriod === 1 ? 'ano' : 'anos') : (recurringPeriod === 1 ? 'mês' : 'meses')}:
                                            </p>
                                            <p className="text-sm font-medium" style={{ color: customColors.accentColor }}>
                                                R$ {(totalRecurring * (recurringPeriodType === 'years' ? recurringPeriod * 12 : recurringPeriod)).toLocaleString('pt-BR')}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
                {/* Client Logos */}
                {includeClientLogos && company?.clientLogos && company.clientLogos.length > 0 && (
                    <ClientLogosSection logos={company.clientLogos} grayscale={clientLogosGrayscale} />
                )}
            </div>
        </div>
    );
}
