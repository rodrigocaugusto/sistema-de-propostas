'use client';

import { Eye } from 'lucide-react';
import { Company, PortfolioItem } from '@/lib/db';
import {
    ProposalTemplateId,
    PROPOSAL_TEMPLATES,
    DEFAULT_MODERN_COLORS,
    DEFAULT_MINIMAL_COLORS
} from '@/lib/proposal-templates';
import { ClassicPreview, ModernPreview, MinimalPreview } from '@/components/proposal-preview-templates';

interface Item {
    id: string;
    name: string;
    description: string;
    price: number;
    originalPrice?: number;
    quantity: number;
    showDiscount?: boolean;
}

interface ClassicCustomColors {
    headerBg: string;
    introductionBg: string;
    oneTimeBg: string;
    recurringBg: string;
    totalBg: string;
    notesBg: string;
}

interface ProposalPreviewPanelProps {
    selectedTemplate: ProposalTemplateId;
    company: Company | null;
    clientName: string;
    clientCompany: string;
    proposalNumber: string;
    validityDays: number;
    items: Item[];
    recurringItems: Item[];
    totalOneTime: number;
    totalRecurring: number;
    selectedPaymentMethods: string[];
    selectedPaymentTerms: string[];
    selectedNotes: string[];
    recurringPeriod: number;
    recurringPeriodType: 'months' | 'years' | 'indeterminate';
    introduction?: string;
    customColors: ClassicCustomColors;
    includePortfolio?: boolean;
    includeClientLogos?: boolean;
    clientLogosGrayscale?: boolean;
    portfolioItems?: PortfolioItem[];
}

export function ProposalPreviewPanel({
    selectedTemplate,
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
}: ProposalPreviewPanelProps) {
    const templateInfo = PROPOSAL_TEMPLATES.find(t => t.id === selectedTemplate);

    return (
        <div className="hidden xl:block">
            <div className="sticky top-8">
                <div className="flex items-center gap-2 mb-4 text-muted-foreground">
                    <Eye className="h-4 w-4" />
                    <span className="text-sm font-medium">Pré-visualização</span>
                    <span
                        className="text-xs px-2 py-0.5 rounded-full border"
                        style={{
                            backgroundColor: `${templateInfo?.colors.primary}15`,
                            borderColor: `${templateInfo?.colors.primary}30`,
                            color: templateInfo?.colors.primary
                        }}
                    >
                        {templateInfo?.name || 'Clássico'}
                    </span>
                </div>

                {/* Template-based Preview */}
                <div className="max-h-[calc(100vh-120px)] overflow-y-auto rounded-xl shadow-2xl border">
                    {selectedTemplate === 'classic' && (
                        <ClassicPreview
                            company={company}
                            clientName={clientName}
                            clientCompany={clientCompany}
                            proposalNumber={proposalNumber}
                            validityDays={validityDays}
                            items={items}
                            recurringItems={recurringItems}
                            totalOneTime={totalOneTime}
                            totalRecurring={totalRecurring}
                            selectedPaymentMethods={selectedPaymentMethods}
                            selectedPaymentTerms={selectedPaymentTerms}
                            selectedNotes={selectedNotes}
                            recurringPeriod={recurringPeriod}
                            recurringPeriodType={recurringPeriodType}
                            introduction={introduction}
                            customColors={customColors}
                            includePortfolio={includePortfolio}
                            includeClientLogos={includeClientLogos}
                            clientLogosGrayscale={clientLogosGrayscale}
                            portfolioItems={portfolioItems}
                        />
                    )}

                    {selectedTemplate === 'modern' && (
                        <ModernPreview
                            company={company}
                            clientName={clientName}
                            clientCompany={clientCompany}
                            proposalNumber={proposalNumber}
                            validityDays={validityDays}
                            items={items}
                            recurringItems={recurringItems}
                            totalOneTime={totalOneTime}
                            totalRecurring={totalRecurring}
                            selectedPaymentMethods={selectedPaymentMethods}
                            selectedPaymentTerms={selectedPaymentTerms}
                            selectedNotes={selectedNotes}
                            recurringPeriod={recurringPeriod}
                            recurringPeriodType={recurringPeriodType}
                            introduction={introduction}
                            customColors={DEFAULT_MODERN_COLORS}
                            includePortfolio={includePortfolio}
                            includeClientLogos={includeClientLogos}
                            clientLogosGrayscale={clientLogosGrayscale}
                            portfolioItems={portfolioItems}
                        />
                    )}

                    {selectedTemplate === 'minimal' && (
                        <MinimalPreview
                            company={company}
                            clientName={clientName}
                            clientCompany={clientCompany}
                            proposalNumber={proposalNumber}
                            validityDays={validityDays}
                            items={items}
                            recurringItems={recurringItems}
                            totalOneTime={totalOneTime}
                            totalRecurring={totalRecurring}
                            selectedPaymentMethods={selectedPaymentMethods}
                            selectedPaymentTerms={selectedPaymentTerms}
                            selectedNotes={selectedNotes}
                            recurringPeriod={recurringPeriod}
                            recurringPeriodType={recurringPeriodType}
                            introduction={introduction}
                            customColors={DEFAULT_MINIMAL_COLORS}
                            includePortfolio={includePortfolio}
                            includeClientLogos={includeClientLogos}
                            clientLogosGrayscale={clientLogosGrayscale}
                            portfolioItems={portfolioItems}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
