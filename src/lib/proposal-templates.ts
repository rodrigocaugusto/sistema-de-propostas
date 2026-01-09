// Proposal Templates Configuration
// Define the available proposal templates in the system

export type ProposalTemplateId = 'classic' | 'modern' | 'minimal';

// Custom colors interface for each template type
export interface ClassicCustomColors {
    headerBg: string;
    introductionBg: string;
    oneTimeBg: string;
    recurringBg: string;
    totalBg: string;
    notesBg: string;
}

export interface ModernCustomColors {
    gradientStart: string;
    gradientMiddle: string;
    gradientEnd: string;
    cardBg: string;
    accentColor: string;
}

export interface MinimalCustomColors {
    backgroundColor: string;
    productBlockBg: string;
    accentColor: string;
    textColor: string;
    showCheckmarks: boolean;
}

export type TemplateCustomColors = ClassicCustomColors | ModernCustomColors | MinimalCustomColors;

export interface ProposalTemplate {
    id: ProposalTemplateId;
    name: string;
    description: string;
    previewImage: string;
    isPremium: boolean;
    colors: {
        primary: string;
        secondary: string;
        accent: string;
    };
    defaultCustomColors: TemplateCustomColors;
}

// Default colors for each template
export const DEFAULT_CLASSIC_COLORS: ClassicCustomColors = {
    headerBg: '#FFFFFF',
    introductionBg: '#FFFFFF',
    oneTimeBg: '#F5F7EB',
    recurringBg: '#eff6ff',
    totalBg: '#1e1e1e',
    notesBg: '#FFFFFF',
};

export const DEFAULT_MODERN_COLORS: ModernCustomColors = {
    gradientStart: '#8b5cf6',  // Violet
    gradientMiddle: '#a855f7', // Purple
    gradientEnd: '#ec4899',    // Pink
    cardBg: 'rgba(255,255,255,0.1)',
    accentColor: '#fbbf24',    // Amber
};

export const DEFAULT_MINIMAL_COLORS: MinimalCustomColors = {
    backgroundColor: '#ffffff',
    productBlockBg: '#f8fafc',
    accentColor: '#0ea5e9',    // Sky
    textColor: '#18181b',
    showCheckmarks: true,
};

export const PROPOSAL_TEMPLATES: ProposalTemplate[] = [
    {
        id: 'classic',
        name: 'Clássico',
        description: 'O template padrão com layout tradicional, perfeito para propostas corporativas e profissionais.',
        previewImage: '/templates/classic.png',
        isPremium: false,
        colors: {
            primary: '#6366f1',
            secondary: '#3b82f6',
            accent: '#10b981',
        },
        defaultCustomColors: DEFAULT_CLASSIC_COLORS,
    },
    {
        id: 'modern',
        name: 'Moderno',
        description: 'Design arrojado com gradientes vibrantes e cards com glassmorphism para um visual premium.',
        previewImage: '/templates/modern.png',
        isPremium: false,
        colors: {
            primary: '#8b5cf6',
            secondary: '#ec4899',
            accent: '#f59e0b',
        },
        defaultCustomColors: DEFAULT_MODERN_COLORS,
    },
    {
        id: 'minimal',
        name: 'Minimalista',
        description: 'Elegância na simplicidade. Layout clean com foco no conteúdo e tipografia refinada.',
        previewImage: '/templates/minimal.png',
        isPremium: false,
        colors: {
            primary: '#18181b',
            secondary: '#71717a',
            accent: '#0ea5e9',
        },
        defaultCustomColors: DEFAULT_MINIMAL_COLORS,
    },
];

export function getTemplateById(id: ProposalTemplateId): ProposalTemplate | undefined {
    return PROPOSAL_TEMPLATES.find(t => t.id === id);
}

export function getDefaultTemplate(): ProposalTemplate {
    return PROPOSAL_TEMPLATES[0];
}

export function getDefaultColorsForTemplate(templateId: ProposalTemplateId): TemplateCustomColors {
    switch (templateId) {
        case 'modern':
            return { ...DEFAULT_MODERN_COLORS };
        case 'minimal':
            return { ...DEFAULT_MINIMAL_COLORS };
        case 'classic':
        default:
            return { ...DEFAULT_CLASSIC_COLORS };
    }
}

// Type guards
export function isClassicColors(colors: TemplateCustomColors): colors is ClassicCustomColors {
    return 'headerBg' in colors;
}

export function isModernColors(colors: TemplateCustomColors): colors is ModernCustomColors {
    return 'gradientStart' in colors;
}

export function isMinimalColors(colors: TemplateCustomColors): colors is MinimalCustomColors {
    return 'productBlockBg' in colors;
}
