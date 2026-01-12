'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createNewProposal, saveProduct } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from "sonner";
import { Loader2, Plus, Trash2, ArrowRight, Mail, Phone, Package, Search, Check, RefreshCw, Save, CreditCard, FileText, Palette, ChevronDown, Play, Image as ImageIcon } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Company, ProductPlan, PortfolioItem } from '@/lib/db';
import { getContrastTextStyle, getContrastMutedStyle, isDarkColor } from '@/lib/colors';
import { ProposalTemplateId } from '@/lib/proposal-templates';
import { ProposalPreviewPanel } from '@/components/proposal-preview-panel';
import { useMask } from '@react-input/mask';
import { RichTextEditor } from '@/components/rich-text-editor';

interface Item {
    id: string;
    name: string;
    description: string;
    price: number;
    originalPrice?: number;
    quantity: number;
    showDiscount?: boolean;
}

interface ProductWithId {
    id: string;
    name: string;
    description: string;
    price: number;
    type: string;
    plans?: ProductPlan[];
}

interface PaymentMethodType {
    id: string;
    name: string;
    description?: string | null;
}

interface ProposalNoteType {
    id: string;
    title: string;
    content: string;
}

interface ClientType {
    id: string;
    name: string;
    email: string;
    company?: string | null;
    phone?: string | null;
    cpfCnpj?: string | null;
}

const MODERN_THEMES = [
    { name: 'Aurora', colors: { gradientStart: '#8b5cf6', gradientMiddle: '#a855f7', gradientEnd: '#ec4899', accentColor: '#fbbf24' } },
    { name: 'Ocean', colors: { gradientStart: '#0ea5e9', gradientMiddle: '#3b82f6', gradientEnd: '#6366f1', accentColor: '#38bdf8' } },
    { name: 'Forest', colors: { gradientStart: '#10b981', gradientMiddle: '#059669', gradientEnd: '#047857', accentColor: '#34d399' } },
    { name: 'Sunset', colors: { gradientStart: '#f59e0b', gradientMiddle: '#ea580c', gradientEnd: '#dc2626', accentColor: '#fbbf24' } },
    { name: 'Midnight', colors: { gradientStart: '#1e1b4b', gradientMiddle: '#312e81', gradientEnd: '#4338ca', accentColor: '#818cf8' } },
    { name: 'Gold', colors: { gradientStart: '#78350f', gradientMiddle: '#b45309', gradientEnd: '#f59e0b', accentColor: '#fcd34d' } }
];

interface PaymentTermsTemplateType {
    id: string;
    title: string;
    content: string;
}

interface ProposalFormProps {
    company: Company | null;
    products: ProductWithId[];
    paymentMethods?: PaymentMethodType[];
    proposalNotes?: ProposalNoteType[];
    paymentTermsTemplates?: PaymentTermsTemplateType[];
    clients?: ClientType[];
    selectedTemplate?: ProposalTemplateId;
    portfolioItems?: PortfolioItem[];
}

export function ProposalForm({ company, products: initialProducts, paymentMethods = [], proposalNotes = [], paymentTermsTemplates = [], clients = [], selectedTemplate = 'classic', portfolioItems = [] }: ProposalFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // Generate proposal number
    // Generate proposal number on client side only to avoid hydration mismatch
    const [proposalNumber, setProposalNumber] = useState('');

    useEffect(() => {
        setProposalNumber(`PROP-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${String(Math.floor(Math.random() * 9000) + 1000)}`);
    }, []);

    const [clientName, setClientName] = useState('');
    const [clientCompany, setClientCompany] = useState('');
    const [clientEmail, setClientEmail] = useState('');
    const [clientPhone, setClientPhone] = useState('');
    const [clientCpfCnpj, setClientCpfCnpj] = useState('');
    const [selectedClientId, setSelectedClientId] = useState('');

    const [items, setItems] = useState<Item[]>([]);
    const [recurringItems, setRecurringItems] = useState<Item[]>([]);
    const [introduction, setIntroduction] = useState('Com base nas suas necessidades, preparamos esta proposta comercial personalizada. Acreditamos que esta solução trará os resultados esperados para o seu negócio.');
    const [showIntroduction, setShowIntroduction] = useState(true);
    const [includePortfolio, setIncludePortfolio] = useState(false);
    const [includeClientLogos, setIncludeClientLogos] = useState(false);
    const [clientLogosGrayscale, setClientLogosGrayscale] = useState(false);

    // Payment and notes - NOW ARRAYS for multiple selections
    const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<string[]>([]);
    const [paymentLink, setPaymentLink] = useState('');
    const [selectedPaymentTerms, setSelectedPaymentTerms] = useState<string[]>([]);
    const [validityDays, setValidityDays] = useState(15);
    const [selectedNotes, setSelectedNotes] = useState<string[]>([]);
    const [selectedPortfolioItemIds, setSelectedPortfolioItemIds] = useState<string[]>([]);

    // Initialize selected portfolio items if any exist and are active ?
    // Or select all by default? 
    useEffect(() => {
        if (portfolioItems.length > 0 && selectedPortfolioItemIds.length === 0) {
            // Default select ALL? Or None? User usually wants to curate.
            // Let's select ALL for convenience if the list is small? 
            // Better: select ALL.
            setSelectedPortfolioItemIds(portfolioItems.filter(i => i.isActive).map(i => i.id));
        }
    }, [portfolioItems]); // Run once on mount/load

    // Recurring period options
    const [recurringPeriodType, setRecurringPeriodType] = useState<'months' | 'years' | 'indeterminate'>('indeterminate');
    const [recurringPeriod, setRecurringPeriod] = useState(12);
    const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());

    const toggleExpandProduct = (productId: string) => {
        const newSet = new Set(expandedProducts);
        if (newSet.has(productId)) newSet.delete(productId);
        else newSet.add(productId);
        setExpandedProducts(newSet);
    };

    // Temporary state for new item inputs
    const [newItem, setNewItem] = useState<Partial<Item>>({ name: '', description: '', price: 0, quantity: 1 });
    const [newItemType, setNewItemType] = useState<'one-time' | 'recurring'>('one-time');

    // Product catalog - now with local state for dynamic updates
    const [products, setProducts] = useState<ProductWithId[]>(initialProducts);
    const [searchTerm, setSearchTerm] = useState('');
    const [showCatalog, setShowCatalog] = useState(true);
    const [savingProduct, setSavingProduct] = useState(false);

    // Custom Colors State
    const [customColors, setCustomColors] = useState({
        headerBg: '#FFFFFF',
        introductionBg: '#FFFFFF',
        oneTimeBg: '#F5F7EB',
        recurringBg: '#eff6ff', // blue-50 equivalent
        totalBg: '#1e1e1e', // dark background for investment summary
        notesBg: '#FFFFFF',
        // Modern Template Defaults
        gradientStart: '#8b5cf6',
        gradientMiddle: '#a855f7',
        gradientEnd: '#ec4899',
        cardBg: 'rgba(255,255,255,0.1)',
        accentColor: '#fbbf24',
    });

    // Toggle payment method selection
    const togglePaymentMethod = (methodName: string) => {
        setSelectedPaymentMethods(prev =>
            prev.includes(methodName)
                ? prev.filter(m => m !== methodName)
                : [...prev, methodName]
        );
    };

    // Toggle payment terms selection
    const togglePaymentTerms = (content: string) => {
        setSelectedPaymentTerms(prev =>
            prev.includes(content)
                ? prev.filter(t => t !== content)
                : [...prev, content]
        );
    };

    // Toggle note selection
    const toggleNote = (content: string) => {
        setSelectedNotes(prev =>
            prev.includes(content)
                ? prev.filter(n => n !== content)
                : [...prev, content]
        );
    };

    const togglePortfolioItem = (id: string) => {
        const isSelected = selectedPortfolioItemIds.includes(id);
        if (isSelected) {
            setSelectedPortfolioItemIds(prev => prev.filter(i => i !== id));
            return;
        }

        const newItem = portfolioItems.find(i => i.id === id);
        if (!newItem) return;

        // Check existing selections
        const currentSelection = portfolioItems.filter(i => selectedPortfolioItemIds.includes(i.id));
        const existingSameType = currentSelection.find(i => i.type === newItem.type);

        if (existingSameType) {
            // Auto-swap if same type exists
            setSelectedPortfolioItemIds(prev => [...prev.filter(pid => pid !== existingSameType.id), id]);
            toast.info(`Galeria de ${newItem.type === 'video' ? 'Vídeo' : 'Imagem'} atualizada.`);
        } else {
            // Check max limit (should cover edge cases)
            if (currentSelection.length >= 2) {
                toast.error('Máximo de 2 galerias permitidas.');
                return;
            }
            setSelectedPortfolioItemIds(prev => [...prev, id]);
        }
    };

    const selectClient = (clientId: string) => {
        const client = clients.find(c => c.id === clientId);
        if (client) {
            setSelectedClientId(clientId);
            setClientName(client.name);
            setClientEmail(client.email);
            setClientCompany(client.company || '');
            setClientPhone(client.phone || '');
            setClientCpfCnpj(client.cpfCnpj || '');
            toast.success(`Cliente "${client.name}" selecionado`);
        }
    };

    const clearClient = () => {
        setSelectedClientId('');
        setClientName('');
        setClientEmail('');
        setClientCompany('');
        setClientPhone('');
        setClientCpfCnpj('');
    };



    const addItem = async () => {
        if (!newItem.name || !newItem.price) {
            toast.error("Preencha nome e preço do item.");
            return;
        }

        const item: Item = {
            id: Math.random().toString(36).substring(7),
            name: newItem.name,
            description: newItem.description || '',
            price: Number(newItem.price),
            quantity: Number(newItem.quantity) || 1,
            showDiscount: true,
        };

        if (newItemType === 'one-time') {
            setItems([...items, item]);
        } else {
            setRecurringItems([...recurringItems, item]);
        }

        // Check if product already exists in catalog
        const existingProduct = products.find(
            p => p.name.toLowerCase() === item.name.toLowerCase() && p.type === newItemType
        );

        if (!existingProduct) {
            // Save the new item to the products catalog
            setSavingProduct(true);
            try {
                const savedProduct = await saveProduct({
                    name: item.name,
                    description: item.description,
                    price: item.price,
                    type: newItemType,
                });

                // Add to local products list
                if (savedProduct) {
                    setProducts([...products, savedProduct as unknown as ProductWithId]);
                    toast.success(`"${item.name}" adicionado à proposta e salvo no catálogo!`, {
                        icon: <Save className="h-4 w-4" />,
                    });
                }
            } catch {
                // Even if saving fails, the item was added to the proposal
                toast.info(`"${item.name}" adicionado à proposta. (Não foi possível salvar no catálogo)`);
            } finally {
                setSavingProduct(false);
            }
        } else {
            toast.success(`"${item.name}" adicionado à proposta!`);
        }

        setNewItem({ name: '', description: '', price: 0, quantity: 1 });
    };

    const addProductFromCatalog = (product: ProductWithId, plan?: ProductPlan) => {
        const item: Item = {
            id: Math.random().toString(36).substring(7),
            name: plan ? `${product.name} - ${plan.name}` : product.name,
            description: plan ? plan.description : product.description,
            price: plan ? plan.price : product.price,
            originalPrice: plan ? (plan.originalPrice || plan.price) : product.price,
            quantity: 1,
            showDiscount: true,
        };

        if (product.type === 'one-time') {
            setItems([...items, item]);
        } else {
            setRecurringItems([...recurringItems, item]);
        }

        toast.success(`${item.name} adicionado!`);
    };

    const removeItem = (id: string, type: 'one-time' | 'recurring') => {
        if (type === 'one-time') {
            setItems(items.filter(i => i.id !== id));
        } else {
            setRecurringItems(recurringItems.filter(i => i.id !== id));
        }
    };

    const updateItemQuantity = (id: string, quantity: number, type: 'one-time' | 'recurring') => {
        if (type === 'one-time') {
            setItems(items.map(i => i.id === id ? { ...i, quantity: Math.max(1, quantity) } : i));
        } else {
            setRecurringItems(recurringItems.map(i => i.id === id ? { ...i, quantity } : i));
        }
    };

    const updateItemPrice = (id: string, newPrice: number, type: 'one-time' | 'recurring') => {
        if (type === 'one-time') {
            setItems(items.map(i => i.id === id ? { ...i, price: newPrice } : i));
        } else {
            setRecurringItems(recurringItems.map(i => i.id === id ? { ...i, price: newPrice } : i));
        }
    };

    const toggleShowDiscount = (id: string, show: boolean, type: 'one-time' | 'recurring') => {
        if (type === 'one-time') {
            setItems(items.map(i => i.id === id ? { ...i, showDiscount: show } : i));
        } else {
            setRecurringItems(recurringItems.map(i => i.id === id ? { ...i, showDiscount: show } : i));
        }
    };

    const totalOneTime = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const previewPortfolioItems = (portfolioItems || []).filter(item => selectedPortfolioItemIds.includes(item.id));
    const totalRecurring = recurringItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!clientName || !clientEmail) {
            toast.error("Preencha nome e email do cliente.");
            return;
        }
        if (items.length === 0 && recurringItems.length === 0) {
            toast.error("Adicione pelo menos um item à proposta.");
            return;
        }

        setLoading(true);
        try {
            const response = await createNewProposal({
                clientName,
                clientCompany: clientCompany || undefined,
                clientEmail,
                clientPhone: clientPhone || undefined,
                clientCpfCnpj: clientCpfCnpj || undefined, // Send to backend
                items,
                recurringItems,
                introduction: showIntroduction ? (introduction || null) : null,
                totalOneTime,
                totalRecurring,
                paymentMethods: selectedPaymentMethods,
                paymentLink: paymentLink || null,
                paymentTerms: selectedPaymentTerms,
                notes: selectedNotes,
                validityDays,
                recurringPeriodType,
                recurringPeriod: recurringPeriodType === 'indeterminate' ? undefined : (recurringPeriod || undefined),
                proposalNumber: proposalNumber || '', // Use the state value
                clientId: selectedClientId,
                template: selectedTemplate,
                customColors,
                includePortfolio,
                includeClientLogos,
                clientLogosGrayscale,
                portfolioItemIds: includePortfolio ? selectedPortfolioItemIds : []
            });

            if (response.success && response.data) {
                const proposal = response.data;
                toast.success("Proposta criada com sucesso!");
                const url = `/p/${proposal.id}`;
                // Open in a sized window (popup style) instead of full tab
                const width = 1100;
                const height = 900;
                const left = (window.screen.width - width) / 2;
                const top = (window.screen.height - height) / 2;
                const win = window.open(url, '_blank', `width=${width},height=${height},top=${top},left=${left},scrollbars=yes,resizable=yes`);

                if (win) {
                    win.focus();
                    router.push('/dashboard');
                } else {
                    router.push(url);
                }
            } else {
                console.error("Erro retornado pelo servidor:", response.error);
                toast.error(`Erro ao criar proposta: ${response.error || 'Verifique os dados e tente novamente.'}`);
            }
        } catch (err) {
            console.error("Erro inesperado no frontend:", err);
            toast.error("Erro inesperado ao criar proposta.");
        } finally {
            setLoading(false);
        }
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const oneTimeProducts = filteredProducts.filter(p => p.type === 'one-time');
    const recurringProducts = filteredProducts.filter(p => p.type === 'recurring');

    // Check if product is already in proposal
    const isProductAdded = (productName: string, productType: string) => {
        if (productType === 'one-time') {
            return items.some(i => i.name === productName);
        }
        return recurringItems.some(i => i.name === productName);
    };

    return (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* Left Side - Form */}
            <div className="space-y-6">
                {/* Proposal Number Badge */}
                <div className="flex items-center gap-3">
                    <div className="px-4 py-2 bg-gradient-to-r from-violet-500 to-indigo-600 text-white rounded-lg shadow-lg shadow-violet-500/25">
                        <span className="text-xs font-medium opacity-80">Nº da Proposta</span>
                        <p className="font-bold tracking-wide">{proposalNumber}</p>
                    </div>
                    <div className="px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        <span className="text-xs text-slate-500 dark:text-slate-400">Data</span>
                        <p className="font-medium text-sm text-slate-900 dark:text-white">{new Date().toLocaleDateString('pt-BR')}</p>
                    </div>
                </div>

                {/* Client Section */}
                <Card className="shadow-lg border-0 overflow-hidden">
                    <CardHeader className="pb-4 bg-white dark:bg-slate-900">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Mail className="h-5 w-5 text-violet-500" />
                                Dados do Cliente
                            </CardTitle>
                            {clients.length > 0 && (
                                <Select value={selectedClientId} onValueChange={selectClient}>
                                    <SelectTrigger className="w-[220px] h-9 text-sm">
                                        <SelectValue placeholder="Selecionar cliente..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {clients.map((client) => (
                                            <SelectItem key={client.id} value={client.id}>
                                                <div className="flex flex-col">
                                                    <span>{client.name}</span>
                                                    {client.company && (
                                                        <span className="text-xs text-slate-500">{client.company}</span>
                                                    )}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                        {selectedClientId && (
                            <button
                                onClick={clearClient}
                                className="text-xs text-violet-500 hover:underline mt-2"
                            >
                                Limpar e digitar novo cliente
                            </button>
                        )}
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-slate-600 dark:text-slate-400">Nome *</Label>
                                <Input
                                    placeholder="Nome do contato"
                                    value={clientName}
                                    onChange={(e) => setClientName(e.target.value)}
                                    className="h-11 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-slate-600 dark:text-slate-400">Empresa</Label>
                                <Input
                                    placeholder="Nome da empresa (opcional)"
                                    value={clientCompany}
                                    onChange={(e) => setClientCompany(e.target.value)}
                                    className="h-11 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                                />
                            </div>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-slate-600 dark:text-slate-400">Email *</Label>
                                <Input
                                    type="email"
                                    placeholder="email@cliente.com"
                                    value={clientEmail}
                                    onChange={(e) => setClientEmail(e.target.value)}
                                    className="h-11 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-slate-600 dark:text-slate-400">Celular / WhatsApp</Label>
                                <Input
                                    ref={useMask({ mask: '(__) _____-____', replacement: { _: /\d/ } })}
                                    type="tel"
                                    value={clientPhone}
                                    onChange={(e) => setClientPhone(e.target.value)}
                                    placeholder="(11) 99999-9999"
                                    className="h-11 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                                />
                            </div>
                        </div>
                        {(company as any)?.hasAsaasIntegration && (
                            <div className="grid md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-slate-600 dark:text-slate-400">CPF / CNPJ (Integração Asaas)</Label>
                                    <Input
                                        value={clientCpfCnpj}
                                        onChange={(e) => setClientCpfCnpj(e.target.value)}
                                        placeholder="000.000.000-00 ou 00.000.000/0000-00"
                                        className="h-11 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                                    />
                                    <p className="text-[10px] text-muted-foreground">Necessário para emissão de cobrança automática.</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Introduction */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-4">
                        <CardTitle className="text-base text-slate-700 dark:text-slate-200">Apresentação / Introdução</CardTitle>
                        <Switch
                            checked={showIntroduction}
                            onCheckedChange={setShowIntroduction}
                        />
                    </CardHeader>
                    {showIntroduction && (
                        <CardContent>
                            <RichTextEditor
                                placeholder="Escreva uma breve introdução para a proposta..."
                                className="min-h-[150px]"
                                value={introduction}
                                onChange={setIntroduction}
                            />
                        </CardContent>
                    )}
                </Card>

                {/* Media & Clients */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base text-slate-700 dark:text-slate-200">Mídia e Clientes</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-base">Incluir Galeria / Portfólio</Label>
                                <p className="text-sm text-slate-500">Exibir seção com vídeos e imagens selecionados</p>
                            </div>
                            <Switch
                                checked={includePortfolio}
                                onCheckedChange={setIncludePortfolio}
                            />
                        </div>
                        <Separator />

                        {includePortfolio && portfolioItems.length > 0 && (
                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 border border-slate-100 dark:border-slate-800 animate-in slide-in-from-top-2">
                                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 block">
                                    Itens do Portfólio ({selectedPortfolioItemIds.length}/{portfolioItems.length})
                                </Label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                                    {portfolioItems.map((item) => {
                                        const isSelected = selectedPortfolioItemIds.includes(item.id);
                                        return (
                                            <div
                                                key={item.id}
                                                onClick={() => togglePortfolioItem(item.id)}
                                                className={`
                                                    flex items-center gap-3 p-2 rounded-md border cursor-pointer transition-all
                                                    ${isSelected
                                                        ? 'bg-primary/5 border-primary/30'
                                                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                                                    }
                                                `}
                                            >
                                                <div className={`
                                                    w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors
                                                    ${isSelected ? 'bg-primary border-primary' : 'border-slate-300 dark:border-slate-600'}
                                                `}>
                                                    {isSelected && <Check className="w-3 h-3 text-white" />}
                                                </div>

                                                <div className="w-10 h-6 shrink-0 bg-slate-100 dark:bg-slate-800 rounded overflow-hidden relative">
                                                    {item.thumbnailUrl ? (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img src={item.thumbnailUrl} className="w-full h-full object-cover" alt="" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            {item.type === 'video' ? <Play className="w-3 h-3 opacity-50" /> : <ImageIcon className="w-3 h-3 opacity-50" />}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-medium truncate">{item.title || (item.type === 'video' ? 'Vídeo' : 'Imagem')}</p>
                                                    <p className="text-[10px] text-muted-foreground truncate">{item.url}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-base">Incluir Logos de Clientes</Label>
                                <p className="text-sm text-slate-500">Exibir logos de clientes cadastrados</p>
                            </div>
                            <Switch
                                checked={includeClientLogos}
                                onCheckedChange={setIncludeClientLogos}
                            />
                        </div>
                        {includeClientLogos && (
                            <div className="flex items-center justify-between pl-4 border-l-2 border-slate-100 dark:border-slate-800 ml-1">
                                <div className="space-y-0.5">
                                    <Label className="text-sm">Logos em Escala de Cinza</Label>
                                    <p className="text-xs text-slate-500">Uniformizar cores das logos</p>
                                </div>
                                <Switch
                                    checked={clientLogosGrayscale}
                                    onCheckedChange={setClientLogosGrayscale}
                                />
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Product Catalog Selection */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Package className="h-5 w-5 text-primary" />
                            <CardTitle>Selecionar Produtos</CardTitle>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowCatalog(!showCatalog)}
                        >
                            {showCatalog ? 'Ocultar' : 'Mostrar'}
                        </Button>
                    </CardHeader>
                    {showCatalog && (
                        <CardContent className="space-y-4">
                            {products.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground border rounded-lg border-dashed">
                                    <Package className="h-10 w-10 mx-auto mb-3 opacity-50" />
                                    <p className="mb-2">Nenhum produto cadastrado.</p>
                                    <Button variant="link" onClick={() => router.push('/products')}>
                                        Cadastrar produtos
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Buscar produtos..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-10"
                                        />
                                    </div>

                                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                                        {/* One-time Products */}
                                        {oneTimeProducts.length > 0 && (
                                            <div>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className="h-4 w-1 bg-primary rounded-full"></div>
                                                    <h4 className="font-semibold text-sm">Produtos / Serviços Únicos</h4>
                                                </div>
                                                <div className="grid gap-2">
                                                    {oneTimeProducts.map((product) => {
                                                        const added = isProductAdded(product.name, product.type);
                                                        const hasPlans = product.plans && product.plans.length > 0;
                                                        const isExpanded = expandedProducts.has(product.id);

                                                        return (
                                                            <div
                                                                key={product.id}
                                                                className={`flex flex-col p-3 border rounded-lg transition-all ${added && !hasPlans
                                                                    ? 'bg-primary/10 border-primary/30 cursor-default'
                                                                    : 'hover:bg-muted/50 hover:border-primary/50'
                                                                    }`}
                                                            >
                                                                {/* Main Product Header */}
                                                                <div
                                                                    className="flex items-center justify-between w-full cursor-pointer"
                                                                    onClick={() => hasPlans ? toggleExpandProduct(product.id) : (!added && addProductFromCatalog(product))}
                                                                >
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="flex items-center gap-2">
                                                                            <p className="font-medium text-sm text-wrap break-words">{product.name}</p>
                                                                            {hasPlans && <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full border">{product.plans?.length} Opções</span>}
                                                                        </div>
                                                                        <p className="text-xs text-muted-foreground whitespace-pre-wrap break-words max-h-24 overflow-y-auto mt-1 custom-scrollbar">{product.description}</p>
                                                                    </div>
                                                                    <div className="flex items-center gap-3 ml-4">
                                                                        {!hasPlans && (
                                                                            <>
                                                                                <span className="font-bold text-sm whitespace-nowrap">
                                                                                    R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                                                </span>
                                                                                {added ? (
                                                                                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                                                                                        <Check className="h-4 w-4 text-primary-foreground" />
                                                                                    </div>
                                                                                ) : (
                                                                                    <div className="w-6 h-6 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center hover:border-primary">
                                                                                        <Plus className="h-3 w-3 text-muted-foreground" />
                                                                                    </div>
                                                                                )}
                                                                            </>
                                                                        )}
                                                                        {hasPlans && (
                                                                            <div className="flex items-center text-xs text-muted-foreground">
                                                                                {isExpanded ? 'Fechar' : 'Expandir'}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {/* Plans Expanded View */}
                                                                {hasPlans && isExpanded && (
                                                                    <div className="mt-3 pl-3 border-l-2 border-primary/20 space-y-2 animate-in slide-in-from-top-2 duration-200">
                                                                        {product.plans?.map((plan) => (
                                                                            <div
                                                                                key={plan.id}
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    addProductFromCatalog(product, plan);
                                                                                }}
                                                                                className="flex justify-between items-center p-2 rounded hover:bg-muted cursor-pointer group"
                                                                            >
                                                                                <div className="flex-1">
                                                                                    <div className="text-sm font-medium group-hover:text-primary transition-colors">{plan.name}</div>
                                                                                    <div className="text-xs text-muted-foreground">{plan.description}</div>
                                                                                </div>
                                                                                <div className="flex items-center gap-3">
                                                                                    <div className="font-semibold text-sm">
                                                                                        R$ {plan.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                                                    </div>
                                                                                    <Plus className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {/* Recurring Products */}
                                        {recurringProducts.length > 0 && (
                                            <div>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className="h-4 w-1 bg-blue-500 rounded-full"></div>
                                                    <h4 className="font-semibold text-sm">Serviços Recorrentes (Mensal)</h4>
                                                </div>
                                                <div className="grid gap-2">
                                                    {recurringProducts.map((product) => {
                                                        const added = isProductAdded(product.name, product.type);
                                                        const hasPlans = product.plans && product.plans.length > 0;
                                                        const isExpanded = expandedProducts.has(product.id);

                                                        return (
                                                            <div
                                                                key={product.id}
                                                                className={`flex flex-col p-3 border rounded-lg transition-all ${added && !hasPlans
                                                                    ? 'bg-blue-500/10 border-blue-500/30 cursor-default'
                                                                    : 'hover:bg-muted/50 hover:border-blue-500/50'
                                                                    } ${hasPlans ? 'border-l-4 border-l-blue-500' : 'border-l-4 border-l-blue-500'}`}
                                                            >
                                                                {/* Main Recurring Product Header */}
                                                                <div
                                                                    className="flex items-center justify-between w-full cursor-pointer"
                                                                    onClick={() => hasPlans ? toggleExpandProduct(product.id) : (!added && addProductFromCatalog(product))}
                                                                >
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="flex items-center gap-2">
                                                                            <p className="font-medium text-sm text-wrap break-words">{product.name}</p>
                                                                            {hasPlans && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full border border-blue-200">{product.plans?.length} Opções</span>}
                                                                        </div>
                                                                        <p className="text-xs text-muted-foreground whitespace-pre-wrap break-words max-h-24 overflow-y-auto mt-1 custom-scrollbar">{product.description}</p>
                                                                    </div>
                                                                    <div className="flex items-center gap-3 ml-4">
                                                                        {!hasPlans && (
                                                                            <>
                                                                                <div className="text-right">
                                                                                    <span className="font-bold text-sm text-blue-500 whitespace-nowrap">
                                                                                        R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                                                    </span>
                                                                                    <span className="text-xs text-muted-foreground">/mês</span>
                                                                                </div>
                                                                                {added ? (
                                                                                    <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                                                                                        <Check className="h-4 w-4 text-white" />
                                                                                    </div>
                                                                                ) : (
                                                                                    <div className="w-6 h-6 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center hover:border-blue-500">
                                                                                        <Plus className="h-3 w-3 text-muted-foreground" />
                                                                                    </div>
                                                                                )}
                                                                            </>
                                                                        )}
                                                                        {hasPlans && (
                                                                            <div className="flex items-center text-xs text-muted-foreground">
                                                                                {isExpanded ? 'Fechar' : 'Expandir'}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {/* Plans Expanded View */}
                                                                {hasPlans && isExpanded && (
                                                                    <div className="mt-3 pl-3 border-l-2 border-blue-500/20 space-y-2 animate-in slide-in-from-top-2 duration-200">
                                                                        {product.plans?.map((plan) => (
                                                                            <div
                                                                                key={plan.id}
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    addProductFromCatalog(product, plan);
                                                                                }}
                                                                                className="flex justify-between items-center p-2 rounded hover:bg-muted cursor-pointer group"
                                                                            >
                                                                                <div className="flex-1">
                                                                                    <div className="text-sm font-medium group-hover:text-blue-600 transition-colors">{plan.name}</div>
                                                                                    <div className="text-xs text-muted-foreground">{plan.description}</div>
                                                                                </div>
                                                                                <div className="flex items-center gap-3">
                                                                                    <div className="text-right">
                                                                                        <div className="font-semibold text-sm text-blue-600">
                                                                                            R$ {plan.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                                                        </div>
                                                                                        <span className="text-[10px] text-muted-foreground">/mês</span>
                                                                                    </div>
                                                                                    <Plus className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {filteredProducts.length === 0 && searchTerm && (
                                            <div className="text-center py-6 text-muted-foreground">
                                                <p>Nenhum produto encontrado para "{searchTerm}"</p>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </CardContent>
                    )}
                </Card>

                {/* Manual Item Addition */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Adicionar Item Manual</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant={newItemType === 'one-time' ? 'default' : 'outline'}
                                onClick={() => setNewItemType('one-time')}
                                className="flex-1"
                                size="sm"
                            >
                                Único
                            </Button>
                            <Button
                                type="button"
                                variant={newItemType === 'recurring' ? 'default' : 'outline'}
                                onClick={() => setNewItemType('recurring')}
                                className="flex-1"
                                size="sm"
                            >
                                Recorrente
                            </Button>
                        </div>

                        <div className="grid grid-cols-12 gap-2">
                            <div className="col-span-5">
                                <Input
                                    placeholder="Nome"
                                    value={newItem.name}
                                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                                />
                            </div>
                            <div className="col-span-2">
                                <Input
                                    type="number"
                                    min="1"
                                    placeholder="Qtd"
                                    value={newItem.quantity}
                                    onChange={(e) => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
                                />
                            </div>
                            <div className="col-span-4">
                                <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="Preço"
                                    value={newItem.price || ''}
                                    onChange={(e) => setNewItem({ ...newItem, price: Number(e.target.value) })}
                                />
                            </div>
                            <div className="col-span-1">
                                <Button type="button" onClick={addItem} size="icon" className="w-full" disabled={savingProduct}>
                                    {savingProduct ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Selected Items Summary */}
                <Card>
                    <CardHeader>
                        <CardTitle>Itens Selecionados</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {items.length === 0 && recurringItems.length === 0 ? (
                            <div className="text-center py-6 text-muted-foreground border rounded-lg border-dashed">
                                <p>Nenhum item adicionado ainda.</p>
                                <p className="text-sm">Selecione produtos do catálogo ou adicione manualmente.</p>
                            </div>
                        ) : (
                            <>
                                {items.length > 0 && (
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <Package className="h-4 w-4 text-primary" />
                                            <h4 className="font-semibold text-sm">Investimento Único</h4>
                                        </div>
                                        <div className="space-y-2">
                                            {items.map((item) => {
                                                const originalProduct = products.find(p => p.name === item.name && p.type === 'one-time');
                                                const originalPrice = item.originalPrice || (originalProduct ? originalProduct.price : 0);
                                                const discount = originalPrice > 0 ? Math.round(((originalPrice - item.price) / originalPrice) * 100) : 0;

                                                return (
                                                    <div key={item.id} className="flex flex-col gap-2 p-3 bg-primary/5 rounded-lg border-l-2 border-l-primary/50">
                                                        <div className="flex justify-between items-start">
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-medium text-sm truncate">{item.name}</p>
                                                                {item.description && <p className="text-xs text-muted-foreground truncate">{item.description}</p>}
                                                            </div>
                                                            <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2" onClick={() => removeItem(item.id, 'one-time')}>
                                                                <Trash2 className="h-4 w-4 text-destructive" />
                                                            </Button>
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <div className="flex flex-col gap-1 w-20">
                                                                <Label className="text-[10px] text-muted-foreground">Qtd</Label>
                                                                <Input
                                                                    type="number"
                                                                    min="1"
                                                                    value={item.quantity}
                                                                    onChange={(e) => updateItemQuantity(item.id, Number(e.target.value), 'one-time')}
                                                                    className="h-8 text-center px-1"
                                                                />
                                                            </div>
                                                            <div className="flex flex-col gap-1 w-28">
                                                                <Label className="text-[10px] text-muted-foreground">Preço Unit. (R$)</Label>
                                                                <Input
                                                                    type="number"
                                                                    min="0"
                                                                    step="0.01"
                                                                    value={item.price}
                                                                    onChange={(e) => updateItemPrice(item.id, Number(e.target.value), 'one-time')}
                                                                    className="h-8 text-right px-2"
                                                                />
                                                            </div>
                                                            {originalPrice > 0 && (
                                                                <div className="flex flex-col gap-1 w-auto">
                                                                    <Label className="text-[10px] text-green-600 font-semibold text-center whitespace-nowrap">% Desc</Label>
                                                                    <div className="flex items-center gap-2">
                                                                        <Input
                                                                            type="number"
                                                                            min="0"
                                                                            max="100"
                                                                            value={discount}
                                                                            onChange={(e) => {
                                                                                const d = Number(e.target.value);
                                                                                const newPrice = originalPrice * (1 - d / 100);
                                                                                updateItemPrice(item.id, newPrice, 'one-time');
                                                                            }}
                                                                            className="h-8 w-14 text-center text-green-600 font-bold px-1"
                                                                        />
                                                                        <div className="flex flex-col items-center justify-center pt-1">
                                                                            <Label htmlFor={`show-discount-1-${item.id}`} className="text-[8px] text-muted-foreground mb-0.5 cursor-pointer">Mostrar</Label>
                                                                            <Switch
                                                                                checked={item.showDiscount ?? true}
                                                                                onCheckedChange={(checked) => toggleShowDiscount(item.id, checked, 'one-time')}
                                                                                id={`show-discount-1-${item.id}`}
                                                                                className="scale-75 data-[state=checked]:!bg-green-600 data-[state=unchecked]:bg-red-500"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                            <div className="flex flex-col gap-1 flex-1 items-end">
                                                                <Label className="text-[10px] text-muted-foreground">Subtotal</Label>
                                                                <span className="font-bold text-sm h-8 flex items-center">
                                                                    R$ {(item.price * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        {item.showDiscount && originalPrice > item.price && (
                                                            <div className="flex items-center justify-end gap-2 mt-1 w-full border-t border-black/5 pt-2">
                                                                <span className="text-xs text-muted-foreground">Original: <span className="line-through">R$ {originalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></span>
                                                                <span className="text-sm font-bold text-green-600">
                                                                    R$ {item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                                </span>
                                                                <span className="bg-green-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                                                                    {Math.round(((originalPrice - item.price) / originalPrice) * 100)}% OFF
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <div className="flex justify-end mt-2 p-2 bg-primary/5 rounded-lg">
                                            <span className="font-bold text-primary">
                                                Total: R$ {totalOneTime.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {recurringItems.length > 0 && (
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <RefreshCw className="h-4 w-4 text-blue-500" />
                                            <h4 className="font-semibold text-sm">Mensalidade Recorrente</h4>
                                        </div>
                                        <div className="space-y-2">
                                            {recurringItems.map((item) => {
                                                const originalProduct = products.find(p => p.name === item.name && p.type === 'recurring');
                                                const originalPrice = item.originalPrice || (originalProduct ? originalProduct.price : 0);
                                                const discount = originalPrice > 0 ? Math.round(((originalPrice - item.price) / originalPrice) * 100) : 0;

                                                return (
                                                    <div key={item.id} className="flex flex-col gap-2 p-3 bg-blue-500/5 rounded-lg border-l-2 border-l-blue-500">
                                                        <div className="flex justify-between items-start">
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-medium text-sm truncate">{item.name}</p>
                                                            </div>
                                                            <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2" onClick={() => removeItem(item.id, 'recurring')}>
                                                                <Trash2 className="h-4 w-4 text-destructive" />
                                                            </Button>
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <div className="flex flex-col gap-1 w-20">
                                                                <Label className="text-[10px] text-muted-foreground">Qtd</Label>
                                                                <Input
                                                                    type="number"
                                                                    min="1"
                                                                    value={item.quantity}
                                                                    onChange={(e) => updateItemQuantity(item.id, Number(e.target.value), 'recurring')}
                                                                    className="h-8 text-center px-1"
                                                                />
                                                            </div>
                                                            <div className="flex flex-col gap-1 w-28">
                                                                <Label className="text-[10px] text-muted-foreground">Preço Mensal (R$)</Label>
                                                                <Input
                                                                    type="number"
                                                                    min="0"
                                                                    step="0.01"
                                                                    value={item.price}
                                                                    onChange={(e) => updateItemPrice(item.id, Number(e.target.value), 'recurring')}
                                                                    className="h-8 text-right px-2"
                                                                />
                                                            </div>
                                                            {originalPrice > 0 && (
                                                                <div className="flex flex-col gap-1 w-auto">
                                                                    <Label className="text-[10px] text-blue-600 font-semibold text-center whitespace-nowrap">% Desc</Label>
                                                                    <div className="flex items-center gap-2">
                                                                        <Input
                                                                            type="number"
                                                                            min="0"
                                                                            max="100"
                                                                            value={discount}
                                                                            onChange={(e) => {
                                                                                const d = Number(e.target.value);
                                                                                const newPrice = originalPrice * (1 - d / 100);
                                                                                updateItemPrice(item.id, newPrice, 'recurring');
                                                                            }}
                                                                            className="h-8 w-14 text-center text-blue-600 font-bold px-1"
                                                                        />
                                                                        <div className="flex flex-col items-center justify-center pt-1">
                                                                            <Label htmlFor={`show-discount-2-${item.id}`} className="text-[8px] text-muted-foreground mb-0.5 cursor-pointer">Mostrar</Label>
                                                                            <Switch
                                                                                checked={item.showDiscount ?? true}
                                                                                onCheckedChange={(checked) => toggleShowDiscount(item.id, checked, 'recurring')}
                                                                                id={`show-discount-2-${item.id}`}
                                                                                className="scale-75 data-[state=checked]:!bg-green-600 data-[state=unchecked]:bg-red-500"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                            <div className="flex flex-col gap-1 flex-1 items-end">
                                                                <Label className="text-[10px] text-muted-foreground">Subtotal</Label>
                                                                <span className="font-bold text-sm h-8 flex items-center">
                                                                    R$ {(item.price * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        {item.showDiscount && originalPrice > item.price && (
                                                            <div className="flex items-center justify-end gap-2 mt-1 w-full border-t border-black/5 pt-2">
                                                                <span className="text-xs text-muted-foreground">Original: <span className="line-through">R$ {originalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></span>
                                                                <span className="text-sm font-bold text-green-600">
                                                                    R$ {item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                                </span>
                                                                <span className="bg-green-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                                                                    {Math.round(((originalPrice - item.price) / originalPrice) * 100)}% OFF
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <div className="flex justify-end mt-2 p-2 bg-blue-500/5 rounded-lg">
                                            <span className="font-bold text-blue-500">
                                                Total Mensal: R$ {totalRecurring.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Payment & Notes Section */}
                <Card className="shadow-lg border-0 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-950">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <CreditCard className="h-5 w-5 text-emerald-500" />
                            Pagamento e Observações
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Payment Methods - Multiple Selection */}
                        <div className="space-y-3">
                            <Label className="text-sm font-medium">Formas de Pagamento (selecione uma ou mais)</Label>
                            {paymentMethods.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {paymentMethods.map((pm) => {
                                        const isSelected = selectedPaymentMethods.includes(pm.name);
                                        return (
                                            <button
                                                key={pm.id}
                                                type="button"
                                                onClick={() => togglePaymentMethod(pm.name)}
                                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 border ${isSelected
                                                    ? 'bg-emerald-500 text-white border-emerald-500 shadow-md'
                                                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                                                    }`}
                                            >
                                                {isSelected && <Check className="h-3 w-3" />}
                                                <CreditCard className="h-3 w-3" />
                                                {pm.name}
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    💡 Cadastre formas de pagamento em Configurações para selecionar aqui.
                                </p>
                            )}
                            {selectedPaymentMethods.length > 0 && (
                                <p className="text-xs text-emerald-600 dark:text-emerald-400">
                                    ✓ {selectedPaymentMethods.length} forma(s) selecionada(s): {selectedPaymentMethods.join(', ')}
                                </p>
                            )}
                        </div>

                        {/* Validity */}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Validade da Proposta</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    type="number"
                                    min="1"
                                    value={validityDays}
                                    onChange={(e) => setValidityDays(parseInt(e.target.value) || 15)}
                                    className="w-20 bg-white dark:bg-slate-900"
                                />
                                <span className="text-sm text-muted-foreground">dias</span>
                            </div>
                        </div>

                        {/* Payment Link - Optional */}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Link de Pagamento e Redirecionamento (Opcional)</Label>
                            <Input
                                placeholder="https://pagseguro.uol.com.br/... ou https://link.asaas.com/..."
                                value={paymentLink}
                                onChange={(e) => setPaymentLink(e.target.value)}
                                className="bg-white dark:bg-slate-900"
                            />
                            <p className="text-xs text-muted-foreground">
                                Se preenchido, o cliente será redirecionado automaticamente para este link após clicar em "Aceitar Proposta".
                            </p>
                        </div>

                        {/* Payment Terms - Multiple Selection */}
                        <div className="space-y-3">
                            <Label className="text-sm font-medium">Condições de Pagamento (selecione uma ou mais)</Label>
                            {paymentTermsTemplates.length > 0 ? (
                                <div className="grid gap-2 md:grid-cols-2">
                                    {paymentTermsTemplates.map((template) => {
                                        const isSelected = selectedPaymentTerms.includes(template.content);
                                        return (
                                            <button
                                                key={template.id}
                                                type="button"
                                                onClick={() => togglePaymentTerms(template.content)}
                                                className={`p-3 rounded-lg text-left transition-all border ${isSelected
                                                    ? 'bg-amber-500 text-white border-amber-500 shadow-md'
                                                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="font-medium text-sm">{template.title}</span>
                                                    {isSelected && <Check className="h-4 w-4" />}
                                                </div>
                                                <p className={`text-xs ${isSelected ? 'text-amber-100' : 'text-muted-foreground'} line-clamp-2`}>
                                                    {template.content}
                                                </p>
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    💡 Cadastre condições de pagamento em Configurações para selecionar aqui.
                                </p>
                            )}
                            {selectedPaymentTerms.length > 0 && (
                                <p className="text-xs text-amber-600 dark:text-amber-400">
                                    ✓ {selectedPaymentTerms.length} condição(ões) selecionada(s)
                                </p>
                            )}
                        </div>

                        {/* Recurring Period - Only show if there are recurring items */}
                        {recurringItems.length > 0 && (
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 space-y-4">
                                <div className="flex items-center gap-2">
                                    <RefreshCw className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                    <Label className="text-sm font-semibold text-blue-800 dark:text-blue-300">Período do Contrato Recorrente</Label>
                                </div>

                                <div className="grid gap-3 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label className="text-xs text-blue-700 dark:text-blue-400">Tipo de Período</Label>
                                        <Select
                                            value={recurringPeriodType}
                                            onValueChange={(v: 'months' | 'years' | 'indeterminate') => setRecurringPeriodType(v)}
                                        >
                                            <SelectTrigger className="bg-white dark:bg-slate-900">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="indeterminate">🔄 Indeterminado</SelectItem>
                                                <SelectItem value="months">📅 Meses</SelectItem>
                                                <SelectItem value="years">📆 Anos</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {recurringPeriodType !== 'indeterminate' && (
                                        <div className="space-y-2">
                                            <Label className="text-xs text-blue-700 dark:text-blue-400">
                                                Quantidade de {recurringPeriodType === 'months' ? 'Meses' : 'Anos'}
                                            </Label>
                                            <Input
                                                type="number"
                                                min="1"
                                                value={recurringPeriod}
                                                onChange={(e) => setRecurringPeriod(parseInt(e.target.value) || 1)}
                                                className="bg-white dark:bg-slate-900"
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Summary calculation */}
                                {recurringPeriodType !== 'indeterminate' && (
                                    <div className="p-3 bg-blue-100 dark:bg-blue-800/30 rounded-lg">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-blue-700 dark:text-blue-300">
                                                Total do período ({recurringPeriod} {recurringPeriodType === 'months' ? 'meses' : 'anos'}):
                                            </span>
                                            <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                                R$ {(totalRecurring * (recurringPeriodType === 'years' ? recurringPeriod * 12 : recurringPeriod)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Notes - Multiple Selection */}
                        <div className="space-y-3">
                            <Label className="text-sm font-medium flex items-center gap-2">
                                <FileText className="h-4 w-4 text-violet-500" />
                                Observações / Notas (selecione uma ou mais)
                            </Label>
                            {proposalNotes.length > 0 ? (
                                <div className="grid gap-2 md:grid-cols-2">
                                    {proposalNotes.map((note) => {
                                        const isSelected = selectedNotes.includes(note.content);
                                        return (
                                            <button
                                                key={note.id}
                                                type="button"
                                                onClick={() => toggleNote(note.content)}
                                                className={`p-3 rounded-lg text-left transition-all border ${isSelected
                                                    ? 'bg-violet-500 text-white border-violet-500 shadow-md'
                                                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="font-medium text-sm">{note.title}</span>
                                                    {isSelected && <Check className="h-4 w-4" />}
                                                </div>
                                                <p className={`text-xs ${isSelected ? 'text-violet-100' : 'text-muted-foreground'} line-clamp-2`}>
                                                    {note.content.substring(0, 60)}...
                                                </p>
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    💡 Cadastre templates de notas em Configurações para selecionar aqui.
                                </p>
                            )}
                            {selectedNotes.length > 0 && (
                                <p className="text-xs text-violet-600 dark:text-violet-400">
                                    ✓ {selectedNotes.length} nota(s) selecionada(s)
                                </p>
                            )}
                        </div>

                        {/* Color Customization */}
                        <div className="space-y-4 pt-4 border-t">
                            <div className="flex items-center gap-2">
                                <Palette className="h-4 w-4 text-pink-500" />
                                <Label className="text-sm font-medium">Personalizar Cores do Email</Label>
                            </div>

                            {/* Modern Template Gradient Selector */}
                            {selectedTemplate === 'modern' && (
                                <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border mb-4">
                                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                        Tema da Proposta Moderna
                                    </Label>
                                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                                        {MODERN_THEMES.map((theme) => (
                                            <button
                                                key={theme.name}
                                                type="button"
                                                onClick={() => setCustomColors(prev => ({ ...prev, ...theme.colors }))}
                                                className="group relative flex flex-col items-center gap-1.5 p-1"
                                            >
                                                <div
                                                    className="w-full aspect-square rounded-lg shadow-sm border group-hover:scale-105 transition-transform"
                                                    style={{
                                                        background: `linear-gradient(135deg, ${theme.colors.gradientStart}, ${theme.colors.gradientMiddle}, ${theme.colors.gradientEnd})`
                                                    }}
                                                />
                                                <span className="text-[10px] font-medium text-muted-foreground">{theme.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 mt-2">
                                        <div className="space-y-1">
                                            <Label className="text-[10px] text-muted-foreground">Início Gradiente</Label>
                                            <div className="flex items-center gap-2">
                                                <input type="color" value={(customColors as any).gradientStart} onChange={(e) => setCustomColors(prev => ({ ...prev, gradientStart: e.target.value }))} className="w-6 h-6 rounded cursor-pointer border shadow-sm" />
                                                <span className="text-[10px] font-mono">{(customColors as any).gradientStart}</span>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[10px] text-muted-foreground">Fim Gradiente</Label>
                                            <div className="flex items-center gap-2">
                                                <input type="color" value={(customColors as any).gradientEnd} onChange={(e) => setCustomColors(prev => ({ ...prev, gradientEnd: e.target.value }))} className="w-6 h-6 rounded cursor-pointer border shadow-sm" />
                                                <span className="text-[10px] font-mono">{(customColors as any).gradientEnd}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground">Fundo Geral</Label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="color"
                                            value={customColors.headerBg}
                                            onChange={(e) => setCustomColors({ ...customColors, headerBg: e.target.value })}
                                            className="w-10 h-10 rounded-lg border cursor-pointer"
                                        />
                                        <Input
                                            value={customColors.headerBg}
                                            onChange={(e) => setCustomColors({ ...customColors, headerBg: e.target.value })}
                                            className="flex-1 h-10 font-mono text-sm"
                                            placeholder="#FFFFFF"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground">Bloco de Introdução</Label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="color"
                                            value={customColors.introductionBg}
                                            onChange={(e) => setCustomColors({ ...customColors, introductionBg: e.target.value })}
                                            className="w-10 h-10 rounded-lg border cursor-pointer"
                                        />
                                        <Input
                                            value={customColors.introductionBg}
                                            onChange={(e) => setCustomColors({ ...customColors, introductionBg: e.target.value })}
                                            className="flex-1 h-10 font-mono text-sm"
                                            placeholder="#FFFFFF"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground">Bloco Investimento Único</Label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="color"
                                            value={customColors.oneTimeBg}
                                            onChange={(e) => setCustomColors({ ...customColors, oneTimeBg: e.target.value })}
                                            className="w-10 h-10 rounded-lg border cursor-pointer"
                                        />
                                        <Input
                                            value={customColors.oneTimeBg}
                                            onChange={(e) => setCustomColors({ ...customColors, oneTimeBg: e.target.value })}
                                            className="flex-1 h-10 font-mono text-sm"
                                            placeholder="#FFFFFF"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground">Bloco Recorrente</Label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="color"
                                            value={customColors.recurringBg}
                                            onChange={(e) => setCustomColors({ ...customColors, recurringBg: e.target.value })}
                                            className="w-10 h-10 rounded-lg border cursor-pointer"
                                        />
                                        <Input
                                            value={customColors.recurringBg}
                                            onChange={(e) => setCustomColors({ ...customColors, recurringBg: e.target.value })}
                                            className="flex-1 h-10 font-mono text-sm"
                                            placeholder="#eff6ff"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground">Bloco de Totais</Label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="color"
                                            value={customColors.totalBg}
                                            onChange={(e) => setCustomColors({ ...customColors, totalBg: e.target.value })}
                                            className="w-10 h-10 rounded-lg border cursor-pointer"
                                        />
                                        <Input
                                            value={customColors.totalBg}
                                            onChange={(e) => setCustomColors({ ...customColors, totalBg: e.target.value })}
                                            className="flex-1 h-10 font-mono text-sm"
                                            placeholder="#F8FAFC"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground">Bloco Notas/Pagamento</Label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="color"
                                            value={customColors.notesBg}
                                            onChange={(e) => setCustomColors({ ...customColors, notesBg: e.target.value })}
                                            className="w-10 h-10 rounded-lg border cursor-pointer"
                                        />
                                        <Input
                                            value={customColors.notesBg}
                                            onChange={(e) => setCustomColors({ ...customColors, notesBg: e.target.value })}
                                            className="flex-1 h-10 font-mono text-sm"
                                            placeholder="#FFFFFF"
                                        />
                                    </div>
                                </div>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setCustomColors({
                                    headerBg: '#FFFFFF',
                                    introductionBg: '#FFFFFF',
                                    oneTimeBg: '#FFFFFF',
                                    recurringBg: '#eff6ff',
                                    totalBg: '#F8FAFC',
                                    notesBg: '#FFFFFF',
                                    gradientStart: '#8b5cf6',
                                    gradientMiddle: '#a855f7',
                                    gradientEnd: '#ec4899',
                                    cardBg: 'rgba(255,255,255,0.1)',
                                    accentColor: '#fbbf24',
                                })}
                                className="text-xs"
                            >
                                🔄 Restaurar Cores Padrão
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-4">
                    <Button variant="ghost" type="button" onClick={() => router.back()}>Cancelar</Button>
                    <Button onClick={handleSubmit} disabled={loading} size="lg" className="px-8 bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 shadow-lg shadow-violet-500/25">
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
                        Gerar Proposta
                    </Button>
                </div>
            </div >

            {/* Right Side - Preview */}
            <ProposalPreviewPanel
                selectedTemplate={selectedTemplate}
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
                introduction={showIntroduction ? introduction : undefined}
                customColors={customColors}
                includePortfolio={includePortfolio}
                includeClientLogos={includeClientLogos}
                clientLogosGrayscale={clientLogosGrayscale}
                portfolioItems={previewPortfolioItems}
            />
        </div>
    );
}
