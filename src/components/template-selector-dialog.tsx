'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PROPOSAL_TEMPLATES, ProposalTemplateId, ProposalTemplate } from '@/lib/proposal-templates';
import { Check, Sparkles, FileText, Layers, MinusSquare, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TemplateSelectorDialogProps {
    children: React.ReactNode;
}

// Template preview cards with visual representation
function TemplatePreviewCard({
    template,
    isSelected,
    onClick
}: {
    template: ProposalTemplate;
    isSelected: boolean;
    onClick: () => void;
}) {
    const getTemplateIcon = (id: ProposalTemplateId) => {
        switch (id) {
            case 'classic':
                return <FileText className="w-6 h-6" />;
            case 'modern':
                return <Sparkles className="w-6 h-6" />;
            case 'minimal':
                return <MinusSquare className="w-6 h-6" />;
            default:
                return <Layers className="w-6 h-6" />;
        }
    };

    const getTemplatePreview = (id: ProposalTemplateId) => {
        switch (id) {
            case 'classic':
                return (
                    <div className="w-full h-full bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 p-3 space-y-2">
                        {/* Header mockup */}
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600" />
                            <div className="flex-1 space-y-1">
                                <div className="h-2 w-20 bg-slate-300 dark:bg-slate-600 rounded" />
                                <div className="h-1.5 w-14 bg-slate-200 dark:bg-slate-700 rounded" />
                            </div>
                        </div>
                        {/* Content mockup */}
                        <div className="space-y-2 pt-2">
                            <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded" />
                            <div className="h-2 w-3/4 bg-slate-200 dark:bg-slate-700 rounded" />
                        </div>
                        {/* Cards mockup */}
                        <div className="grid grid-cols-2 gap-1.5 pt-2">
                            <div className="h-10 rounded bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800" />
                            <div className="h-10 rounded bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800" />
                        </div>
                        {/* Footer mockup */}
                        <div className="h-8 rounded bg-slate-900 dark:bg-slate-950 mt-2" />
                    </div>
                );
            case 'modern':
                return (
                    <div className="w-full h-full bg-gradient-to-br from-violet-600 via-purple-600 to-pink-500 p-3 space-y-2">
                        {/* Header mockup */}
                        <div className="flex items-center justify-between">
                            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur" />
                            <div className="flex gap-1">
                                <div className="w-2 h-2 rounded-full bg-white/40" />
                                <div className="w-2 h-2 rounded-full bg-white/40" />
                                <div className="w-2 h-2 rounded-full bg-white/40" />
                            </div>
                        </div>
                        {/* Hero text mockup */}
                        <div className="text-center pt-1">
                            <div className="h-2.5 w-16 bg-white/80 rounded mx-auto" />
                            <div className="h-1.5 w-12 bg-white/40 rounded mx-auto mt-1" />
                        </div>
                        {/* Glass cards mockup */}
                        <div className="space-y-1.5 pt-1">
                            <div className="h-8 rounded-lg bg-white/10 backdrop-blur border border-white/20" />
                            <div className="h-8 rounded-lg bg-white/10 backdrop-blur border border-white/20" />
                        </div>
                        {/* CTA mockup */}
                        <div className="h-6 rounded-full bg-amber-400 mt-1" />
                    </div>
                );
            case 'minimal':
                return (
                    <div className="w-full h-full bg-white dark:bg-zinc-950 p-4 space-y-3">
                        {/* Clean header */}
                        <div className="border-b border-zinc-200 dark:border-zinc-800 pb-2">
                            <div className="h-2 w-14 bg-zinc-900 dark:bg-zinc-100 rounded" />
                        </div>
                        {/* Content with generous spacing */}
                        <div className="space-y-2">
                            <div className="h-1.5 w-full bg-zinc-200 dark:bg-zinc-800 rounded" />
                            <div className="h-1.5 w-5/6 bg-zinc-200 dark:bg-zinc-800 rounded" />
                            <div className="h-1.5 w-4/6 bg-zinc-200 dark:bg-zinc-800 rounded" />
                        </div>
                        {/* Simple list */}
                        <div className="space-y-1.5 pt-1">
                            <div className="flex items-center gap-2">
                                <div className="w-1 h-1 rounded-full bg-sky-500" />
                                <div className="h-1.5 flex-1 bg-zinc-100 dark:bg-zinc-900 rounded" />
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-1 h-1 rounded-full bg-sky-500" />
                                <div className="h-1.5 flex-1 bg-zinc-100 dark:bg-zinc-900 rounded" />
                            </div>
                        </div>
                        {/* Footer */}
                        <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
                            <div className="h-5 w-16 bg-zinc-900 dark:bg-zinc-100 rounded" />
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className={`
        relative cursor-pointer rounded-2xl overflow-hidden transition-all duration-300
        ${isSelected
                    ? 'ring-4 ring-violet-500 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 shadow-xl shadow-violet-500/25'
                    : 'ring-1 ring-slate-200 dark:ring-slate-700 hover:ring-2 hover:ring-violet-300 dark:hover:ring-violet-700 hover:shadow-lg'
                }
      `}
        >
            {/* Selection indicator */}
            <AnimatePresence>
                {isSelected && (
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="absolute top-3 right-3 z-20 w-7 h-7 rounded-full bg-violet-500 flex items-center justify-center shadow-lg"
                    >
                        <Check className="w-4 h-4 text-white" />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Preview area */}
            <div className="h-36 overflow-hidden">
                {getTemplatePreview(template.id)}
            </div>

            {/* Info area */}
            <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-start gap-3">
                    <div
                        className="p-2 rounded-lg"
                        style={{
                            backgroundColor: `${template.colors.primary}15`,
                            color: template.colors.primary
                        }}
                    >
                        {getTemplateIcon(template.id)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                            {template.name}
                            {template.isPremium && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                    PRO
                                </span>
                            )}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                            {template.description}
                        </p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

export function TemplateSelectorDialog({ children }: TemplateSelectorDialogProps) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<ProposalTemplateId>('classic');

    const handleContinue = () => {
        setIsOpen(false);
        router.push(`/proposals/new?template=${selectedTemplate}`);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader className="text-center pb-4">
                    <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25 mb-4">
                        <Layers className="w-7 h-7 text-white" />
                    </div>
                    <DialogTitle className="text-2xl font-bold text-slate-900 dark:text-white">
                        Escolha um Template
                    </DialogTitle>
                    <DialogDescription className="text-slate-500 dark:text-slate-400">
                        Selecione o visual da sua proposta. O template pode ser alterado posteriormente.
                    </DialogDescription>
                </DialogHeader>

                {/* Templates Grid */}
                <div className="grid sm:grid-cols-3 gap-4 py-4">
                    {PROPOSAL_TEMPLATES.map((template) => (
                        <TemplatePreviewCard
                            key={template.id}
                            template={template}
                            isSelected={selectedTemplate === template.id}
                            onClick={() => setSelectedTemplate(template.id)}
                        />
                    ))}
                </div>

                <DialogFooter className="pt-4 border-t border-slate-200 dark:border-slate-800">
                    <Button
                        variant="ghost"
                        onClick={() => setIsOpen(false)}
                        className="text-slate-600 dark:text-slate-400"
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleContinue}
                        className="bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 shadow-lg shadow-violet-500/25"
                    >
                        Continuar
                        <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
