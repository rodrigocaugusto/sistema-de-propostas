'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { editProposal, logoutAction } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, ArrowLeft, Save, ChevronLeft, Package, Search, Check, LogOut } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ThemeToggle } from '@/components/theme-toggle';
import Link from 'next/link';

interface Item {
    id?: string;
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
}

interface PaymentMethodType {
    id: string;
    name: string;
    description?: string | null;
}

interface PaymentTermsTemplateType {
    id: string;
    title: string;
    content: string;
}

interface ProposalNoteType {
    id: string;
    title: string;
    content: string;
}

interface ProposalData {
    id: string;
    clientName: string;
    clientCompany?: string | null;
    clientEmail: string;
    clientPhone?: string | null;
    status: string;
    introduction?: string | null;
    paymentMethod?: string | string[] | null;
    paymentLink?: string | null;
    paymentTerms?: string[] | null;
    validityDays?: number;
    notes?: string[] | null;
    items: Item[];
    recurringItems: Item[];
    totalOneTime: number;
    totalRecurring: number;
    recurringPeriod?: number | null;
    recurringPeriodType?: string | null;
}

interface ProposalEditFormProps {
    proposal: ProposalData;
    products: ProductWithId[];
    paymentMethods: PaymentMethodType[];
    proposalNotes: ProposalNoteType[];
    paymentTermsTemplates: PaymentTermsTemplateType[];
}

export function ProposalEditForm({ proposal, products, paymentMethods, proposalNotes, paymentTermsTemplates = [] }: ProposalEditFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const [clientName, setClientName] = useState(proposal.clientName);
    const [clientCompany, setClientCompany] = useState(proposal.clientCompany || '');
    const [clientEmail, setClientEmail] = useState(proposal.clientEmail);
    const [clientPhone, setClientPhone] = useState(proposal.clientPhone || '');

    const [items, setItems] = useState<Item[]>(proposal.items);
    const [recurringItems, setRecurringItems] = useState<Item[]>(proposal.recurringItems);


    // Ensure paymentTerms and notes are arrays
    const [paymentTerms, setPaymentTerms] = useState<string[]>(Array.isArray(proposal.paymentTerms) ? proposal.paymentTerms : (typeof proposal.paymentTerms === 'string' ? [proposal.paymentTerms] : []));
    const [notes, setNotes] = useState<string[]>(Array.isArray(proposal.notes) ? proposal.notes : (typeof proposal.notes === 'string' ? [proposal.notes] : []));

    // Support multiple payment methods (convert legacy single string to array if needed)
    const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<string[]>(
        proposal.paymentMethod ? (Array.isArray(proposal.paymentMethod) ? proposal.paymentMethod : [proposal.paymentMethod]) : []
    );

    const [introduction, setIntroduction] = useState(proposal.introduction || 'Com base nas suas necessidades, preparamos esta proposta comercial personalizada. Acreditamos que esta solução trará os resultados esperados para o seu negócio.');
    const [paymentLink, setPaymentLink] = useState(proposal.paymentLink || '');

    const [validityDays, setValidityDays] = useState(proposal.validityDays || 15);

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
        setPaymentTerms(prev =>
            prev.includes(content)
                ? prev.filter(t => t !== content)
                : [...prev, content]
        );
    };

    // Toggle note selection
    const toggleNote = (content: string) => {
        setNotes(prev =>
            prev.includes(content)
                ? prev.filter(n => n !== content)
                : [...prev, content]
        );
    };

    const [recurringPeriod, setRecurringPeriod] = useState<number | undefined>(proposal.recurringPeriod ?? undefined);
    const [recurringPeriodType, setRecurringPeriodType] = useState<string>(proposal.recurringPeriodType || 'indeterminate');

    // Temporary state for new item inputs
    const [newItem, setNewItem] = useState<Partial<Item>>({ name: '', description: '', price: 0, quantity: 1 });
    const [newItemType, setNewItemType] = useState<'one-time' | 'recurring'>('one-time');

    const [showCatalog, setShowCatalog] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [reactivateProposal, setReactivateProposal] = useState(false);

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const oneTimeProducts = filteredProducts.filter(p => p.type === 'one-time');
    const recurringProducts = filteredProducts.filter(p => p.type === 'recurring');

    const isProductAdded = (productName: string, productType: string) => {
        if (productType === 'one-time') {
            return items.some(i => i.name === productName);
        }
        return recurringItems.some(i => i.name === productName);
    };

    const addProductFromCatalog = (product: ProductWithId) => {
        const item: Item = {
            id: Date.now().toString(), // simplistic ID generation, ideally UUID
            name: product.name,
            description: product.description,
            price: product.price,
            originalPrice: product.price,
            quantity: 1,
            showDiscount: true
        };

        if (product.type === 'one-time') {
            setItems([...items, item]);
        } else {
            setRecurringItems([...recurringItems, item]);
        }
        toast.success("Produto adicionado!");
    };

    const addItem = () => {
        if (!newItem.name || !newItem.price) {
            toast.error("Preencha nome e preço do item");
            return;
        }

        const item: Item = {
            id: Date.now().toString(),
            name: newItem.name!,
            description: newItem.description || '',
            price: newItem.price!,
            quantity: newItem.quantity || 1,
            showDiscount: true
        };

        if (newItemType === 'one-time') {
            setItems([...items, item]);
        } else {
            setRecurringItems([...recurringItems, item]);
        }

        setNewItem({ name: '', description: '', price: 0, quantity: 1 });
        toast.success("Item adicionado!");
    };

    const removeItem = (id: string | undefined, type: 'one-time' | 'recurring') => {
        if (!id) return;
        if (type === 'one-time') {
            setItems(items.filter(i => i.id !== id));
        } else {
            setRecurringItems(recurringItems.filter(i => i.id !== id));
        }
    };

    const updateItemPrice = (index: number, newPrice: number, type: 'one-time' | 'recurring') => {
        if (type === 'one-time') {
            const newItems = [...items];
            newItems[index] = { ...newItems[index], price: newPrice };
            setItems(newItems);
        } else {
            const newRecurring = [...recurringItems];
            newRecurring[index] = { ...newRecurring[index], price: newPrice };
            setRecurringItems(newRecurring);
        }
    };

    const toggleShowDiscount = (index: number, show: boolean, type: 'one-time' | 'recurring') => {
        if (type === 'one-time') {
            const newItems = [...items];
            newItems[index] = { ...newItems[index], showDiscount: show };
            setItems(newItems);
        } else {
            const newRecurring = [...recurringItems];
            newRecurring[index] = { ...newRecurring[index], showDiscount: show };
            setRecurringItems(newRecurring);
        }
    };

    const getOriginalPrice = (item: Item, type: 'one-time' | 'recurring') => {
        const product = products.find(p => p.name === item.name && p.type === type);
        return product ? product.price : item.price;
    };

    const totalOneTime = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalOriginalOneTime = items.reduce((sum, item) => sum + (getOriginalPrice(item, 'one-time') * item.quantity), 0);
    const discountOneTime = totalOriginalOneTime - totalOneTime;
    const discountPercentOneTime = totalOriginalOneTime > 0 ? (discountOneTime / totalOriginalOneTime) * 100 : 0;

    const totalRecurring = recurringItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalOriginalRecurring = recurringItems.reduce((sum, item) => sum + (getOriginalPrice(item, 'recurring') * item.quantity), 0);
    const discountRecurring = totalOriginalRecurring - totalRecurring;
    const discountPercentRecurring = totalOriginalRecurring > 0 ? (discountRecurring / totalOriginalRecurring) * 100 : 0;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!clientName || !clientEmail) {
            toast.error("Nome e email do cliente são obrigatórios");
            return;
        }

        if (items.length === 0 && recurringItems.length === 0) {
            toast.error("Adicione pelo menos um item à proposta");
            return;
        }

        setLoading(true);

        try {
            await editProposal(proposal.id, {
                clientName,
                clientCompany,
                clientEmail,
                clientPhone,
                introduction: introduction || null,
                paymentMethods: selectedPaymentMethods,
                paymentLink: paymentLink || null,
                paymentTerms,
                validityDays,
                notes,
                items,
                recurringItems,
                totalOneTime,
                totalRecurring: totalRecurring,
                recurringPeriod: recurringPeriod,
                recurringPeriodType: recurringPeriodType,
                status: reactivateProposal ? 'sent' : undefined
            });

            toast.success("Proposta atualizada com sucesso!");
            router.push(`/p/${proposal.id}`);
        } catch {
            toast.error("Erro ao salvar proposta");
        } finally {
            setLoading(false);
        }
    };



    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
            {/* Header */}
            <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800">
                <div className="max-w-5xl mx-auto px-6 py-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <Link href="/dashboard">
                                <Button variant="ghost" size="sm" className="text-slate-600 dark:text-slate-400">
                                    <ChevronLeft className="mr-2 h-4 w-4" />
                                    Dashboard
                                </Button>
                            </Link>
                            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />
                            <div>
                                <h1 className="text-xl font-bold text-slate-900 dark:text-white">Editar Proposta</h1>
                                <p className="text-sm text-slate-500 dark:text-slate-400">#{proposal.id.slice(0, 8)}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <ThemeToggle />
                            <form action={logoutAction}>
                                <Button variant="ghost" size="icon" className="text-slate-600 dark:text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20">
                                    <LogOut className="h-4 w-4" />
                                </Button>
                            </form>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 py-8">
                {/* Reactivate Proposal Option */}
                {(proposal.status === 'negotiating' || proposal.status === 'rejected') && (
                    <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg flex items-center gap-3">
                        <Checkbox
                            id="reactivate"
                            checked={reactivateProposal}
                            onCheckedChange={(c) => setReactivateProposal(c as boolean)}
                        />
                        <div className="grid gap-1.5 leading-none">
                            <label
                                htmlFor="reactivate"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer text-amber-900 dark:text-amber-100"
                            >
                                Reativar Proposta para Aprovação
                            </label>
                            <p className="text-sm text-amber-700 dark:text-amber-300">
                                Ao marcar esta opção, o status da proposta mudará para "Enviado", permitindo que o cliente aceite os novos termos.
                            </p>
                        </div>
                    </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Client Info */}
                    <Card className="bg-white dark:bg-slate-900 shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-lg">Dados do Cliente</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-slate-600 dark:text-slate-400">Nome *</Label>
                                    <Input
                                        placeholder="Nome completo do cliente"
                                        value={clientName}
                                        onChange={(e) => setClientName(e.target.value)}
                                        required
                                        className="h-11 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="clientCompany">Empresa</Label>
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
                                        type="tel"
                                        placeholder="(11) 99999-9999"
                                        value={clientPhone}
                                        onChange={(e) => setClientPhone(e.target.value)}
                                        className="h-11 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2 pt-2">
                                <Label className="text-sm font-medium text-slate-600 dark:text-slate-400">Apresentação / Introdução</Label>
                                <Textarea
                                    placeholder="Introdução..."
                                    value={introduction}
                                    onChange={(e) => setIntroduction(e.target.value)}
                                    className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 min-h-[100px]"
                                />
                            </div>
                        </CardContent>
                    </Card>
                    {/* Product Catalog Selection */}
                    <Card className="bg-white dark:bg-slate-900 shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Package className="h-5 w-5 text-primary" />
                                <CardTitle className="text-lg">Selecionar Produtos</CardTitle>
                            </div>
                            <Button
                                type="button"
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
                                                            return (
                                                                <div
                                                                    key={product.id}
                                                                    onClick={() => !added && addProductFromCatalog(product)}
                                                                    className={`flex items-center justify-between p-3 border rounded-lg transition-all cursor-pointer ${added
                                                                        ? 'bg-primary/10 border-primary/30 cursor-default'
                                                                        : 'hover:bg-muted/50 hover:border-primary/50'
                                                                        }`}
                                                                >
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="font-medium text-sm whitespace-pre-wrap break-words">{product.name}</p>
                                                                        <p className="text-xs text-muted-foreground whitespace-pre-wrap break-words mt-1">{product.description}</p>
                                                                    </div>
                                                                    <div className="flex items-center gap-3 ml-4">
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
                                                                    </div>
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
                                                            return (
                                                                <div
                                                                    key={product.id}
                                                                    onClick={() => !added && addProductFromCatalog(product)}
                                                                    className={`flex items-center justify-between p-3 border-l-4 border-l-blue-500 border rounded-lg transition-all cursor-pointer ${added
                                                                        ? 'bg-blue-500/10 border-blue-500/30 cursor-default'
                                                                        : 'hover:bg-muted/50 hover:border-blue-500/50'
                                                                        }`}
                                                                >
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="font-medium text-sm whitespace-pre-wrap break-words">{product.name}</p>
                                                                        <p className="text-xs text-muted-foreground whitespace-pre-wrap break-words mt-1">{product.description}</p>
                                                                    </div>
                                                                    <div className="flex items-center gap-3 ml-4">
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
                                                                    </div>
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

                    {/* Items Section */}
                    <Card className="bg-white dark:bg-slate-900 shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-lg">Itens da Proposta</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* One-time items */}
                            <div>
                                <h3 className="font-semibold mb-3 text-[#029DAF]">Investimento Único</h3>
                                {items.length > 0 ? (
                                    <div className="space-y-2">
                                        {items.map((item, idx) => {
                                            const originalProduct = products.find(p => p.name === item.name && p.type === 'one-time');
                                            const originalPrice = item.originalPrice || (originalProduct ? originalProduct.price : 0);
                                            const discount = originalPrice > 0 ? Math.round(((originalPrice - item.price) / originalPrice) * 100) : 0;

                                            return (
                                                <div key={item.id || idx} className="flex flex-col gap-2 p-3 bg-white border rounded-lg shadow-sm">
                                                    <div className="flex justify-between items-start">
                                                        <div className="font-medium truncate flex-1">{item.name}</div>
                                                        <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => removeItem(item.id, 'one-time')}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <div className="flex flex-col gap-1 w-20">
                                                            <Label className="text-[10px] text-muted-foreground">Qtd</Label>
                                                            <Input
                                                                type="number"
                                                                min="1"
                                                                value={item.quantity}
                                                                onChange={(e) => {
                                                                    const newItems = [...items];
                                                                    newItems[idx] = { ...newItems[idx], quantity: parseInt(e.target.value) || 1 };
                                                                    setItems(newItems);
                                                                }}
                                                                className="h-8 text-center px-1"
                                                            />
                                                        </div>
                                                        <div className="flex flex-col gap-1 w-28">
                                                            <Label className="text-[10px] text-muted-foreground">Oportunidade (R$)</Label>
                                                            <Input
                                                                type="number"
                                                                min="0"
                                                                step="0.01"
                                                                value={item.price}
                                                                onChange={(e) => updateItemPrice(idx, parseFloat(e.target.value) || 0, 'one-time')}
                                                                className="h-8 text-right px-2 font-medium"
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
                                                                            updateItemPrice(idx, newPrice, 'one-time');
                                                                        }}
                                                                        className="h-8 w-14 text-center text-green-600 font-bold px-1"
                                                                    />
                                                                    <div className="flex flex-col items-center justify-center pt-1">
                                                                        <Label htmlFor={`edit-show-discount-1-${idx}`} className="text-[8px] text-muted-foreground mb-0.5 cursor-pointer">Mostrar</Label>
                                                                        <Switch
                                                                            checked={item.showDiscount ?? true}
                                                                            onCheckedChange={(checked) => toggleShowDiscount(idx, checked, 'one-time')}
                                                                            id={`edit-show-discount-1-${idx}`}
                                                                            className="scale-75 data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-red-500"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                        <div className="flex flex-col gap-1 flex-1 items-end">
                                                            <Label className="text-[10px] text-muted-foreground">Total</Label>
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
                                        <div className="mt-4 flex justify-between items-center p-3 bg-slate-100 dark:bg-slate-800 rounded-lg font-medium">
                                            <span>Total Único:</span>
                                            <span className="text-lg">R$ {totalOneTime.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-slate-500 italic">Nenhum item único adicionado</p>
                                )}
                            </div>

                            <Separator />

                            {/* Recurring items */}
                            <div>
                                <h3 className="font-semibold mb-3 text-[#F07C19]">Mensalidade Recorrente</h3>
                                {recurringItems.length > 0 ? (
                                    <div className="space-y-2">
                                        {recurringItems.map((item, idx) => {
                                            const originalProduct = products.find(p => p.name === item.name && p.type === 'recurring');
                                            const originalPrice = item.originalPrice || (originalProduct ? originalProduct.price : 0);
                                            const discount = originalPrice > 0 ? Math.round(((originalPrice - item.price) / originalPrice) * 100) : 0;

                                            return (
                                                <div key={item.id || idx} className="flex flex-col gap-2 p-3 bg-white border rounded-lg shadow-sm">
                                                    <div className="flex justify-between items-start">
                                                        <div className="font-medium truncate flex-1">{item.name}</div>
                                                        <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => removeItem(item.id, 'recurring')}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <div className="flex flex-col gap-1 w-20">
                                                            <Label className="text-[10px] text-muted-foreground">Qtd</Label>
                                                            <Input
                                                                type="number"
                                                                min="1"
                                                                value={item.quantity}
                                                                onChange={(e) => {
                                                                    const newItems = [...recurringItems];
                                                                    newItems[idx] = { ...newItems[idx], quantity: parseInt(e.target.value) || 1 };
                                                                    setRecurringItems(newItems);
                                                                }}
                                                                className="h-8 text-center px-1"
                                                            />
                                                        </div>
                                                        <div className="flex flex-col gap-1 w-28">
                                                            <Label className="text-[10px] text-muted-foreground">Mensal (R$)</Label>
                                                            <Input
                                                                type="number"
                                                                min="0"
                                                                step="0.01"
                                                                value={item.price}
                                                                onChange={(e) => updateItemPrice(idx, parseFloat(e.target.value) || 0, 'recurring')}
                                                                className="h-8 text-right px-2 font-medium"
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
                                                                            updateItemPrice(idx, newPrice, 'recurring');
                                                                        }}
                                                                        className="h-8 w-14 text-center text-blue-600 font-bold px-1"
                                                                    />
                                                                    <div className="flex flex-col items-center justify-center pt-1">
                                                                        <Label htmlFor={`edit-show-discount-2-${idx}`} className="text-[8px] text-muted-foreground mb-0.5 cursor-pointer">Mostrar</Label>
                                                                        <Switch
                                                                            checked={item.showDiscount ?? true}
                                                                            onCheckedChange={(checked) => toggleShowDiscount(idx, checked, 'recurring')}
                                                                            id={`edit-show-discount-2-${idx}`}
                                                                            className="scale-75 data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-red-500"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                        <div className="flex flex-col gap-1 flex-1 items-end">
                                                            <Label className="text-[10px] text-muted-foreground">Total</Label>
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

                                        <div className="mt-4 flex flex-col items-end p-3 bg-slate-100 dark:bg-slate-800 rounded-lg font-medium">
                                            <span className="font-bold text-lg">Total Mensal: R$ {totalRecurring.toLocaleString('pt-BR')}/mês</span>
                                        </div>

                                        <div className="flex items-center gap-4 justify-end mt-4 pt-4 border-t">
                                            <div className='flex items-center gap-2'>
                                                <Label className="whitespace-nowrap">Duração do Contrato:</Label>
                                                <Input
                                                    type="number"
                                                    min={1}
                                                    value={recurringPeriod || ''}
                                                    onChange={(e) => setRecurringPeriod(parseInt(e.target.value) || undefined)}
                                                    className="w-20"
                                                    placeholder="Qtd"
                                                    disabled={recurringPeriodType === 'indeterminate'}
                                                />
                                                <Select value={recurringPeriodType} onValueChange={setRecurringPeriodType}>
                                                    <SelectTrigger className="w-[140px]">
                                                        <SelectValue placeholder="Tipo" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="indeterminate">Indeterminado</SelectItem>
                                                        <SelectItem value="months">Meses</SelectItem>
                                                        <SelectItem value="years">Anos</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-slate-500 italic">Nenhum item recorrente adicionado</p>
                                )}
                            </div>

                            <Separator />

                            {/* Add new item */}
                            <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                <h4 className="font-medium">Adicionar Novo Item</h4>
                                <div className="grid gap-3 md:grid-cols-4">
                                    <Input
                                        placeholder="Nome do item"
                                        value={newItem.name || ''}
                                        onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                                    />
                                    <Input
                                        placeholder="Descrição"
                                        value={newItem.description || ''}
                                        onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                                    />
                                    <Input
                                        type="number"
                                        placeholder="Preço"
                                        value={newItem.price || ''}
                                        onChange={(e) => setNewItem({ ...newItem, price: parseFloat(e.target.value) || 0 })}
                                    />
                                    <Select value={newItemType} onValueChange={(v) => setNewItemType(v as 'one-time' | 'recurring')}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="one-time">Único</SelectItem>
                                            <SelectItem value="recurring">Recorrente</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button type="button" variant="outline" onClick={addItem}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Adicionar Item
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Payment & Notes */}
                    <Card className="bg-white dark:bg-slate-900 shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-lg">Pagamento e Observações</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label className="font-semibold text-emerald-600 mb-2 block">Formas de Pagamento</Label>
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
                                                        {pm.name}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">Termos não cadastrados.</p>
                                    )}
                                    {selectedPaymentMethods.length > 0 && (
                                        <p className="text-xs text-emerald-600 mt-2">
                                            ✓ {selectedPaymentMethods.length} selecionado(s)
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label>Validade (dias)</Label>
                                    <Input
                                        type="number"
                                        value={validityDays}
                                        onChange={(e) => setValidityDays(parseInt(e.target.value) || 15)}
                                    />
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

                            <div className="space-y-2 pt-4">
                                <Label className="font-semibold text-amber-600 mb-2 block">Condições de Pagamento</Label>
                                {paymentTermsTemplates.length > 0 ? (
                                    <div className="grid gap-2 md:grid-cols-2">
                                        {paymentTermsTemplates.map((template) => {
                                            const isSelected = paymentTerms.includes(template.content);
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
                                    <p className="text-sm text-muted-foreground">Templates não cadastrados.</p>
                                )}
                                {paymentTerms.length > 0 && (
                                    <p className="text-xs text-amber-600 mt-2">
                                        ✓ {paymentTerms.length} condição(ões) selecionada(s)
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2 pt-4">
                                <Label className="font-semibold text-purple-600 mb-2 block">Observações e Termos</Label>
                                {proposalNotes.length > 0 ? (
                                    <div className="grid gap-2 md:grid-cols-2">
                                        {proposalNotes.map((note) => {
                                            const isSelected = notes.includes(note.content);
                                            return (
                                                <button
                                                    key={note.id}
                                                    type="button"
                                                    onClick={() => toggleNote(note.content)}
                                                    className={`p-3 rounded-lg text-left transition-all border ${isSelected
                                                        ? 'bg-purple-500 text-white border-purple-500 shadow-md'
                                                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20'
                                                        }`}
                                                >
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="font-medium text-sm">{note.title}</span>
                                                        {isSelected && <Check className="h-4 w-4" />}
                                                    </div>
                                                    <p className={`text-xs ${isSelected ? 'text-purple-100' : 'text-muted-foreground'} line-clamp-2`}>
                                                        {note.content}
                                                    </p>
                                                </button>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">Notas não cadastradas.</p>
                                )}
                                {notes.length > 0 && (
                                    <p className="text-xs text-purple-600 mt-2">
                                        ✓ {notes.length} nota(s) selecionada(s)
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <div className="flex justify-between items-center">
                        <Link href={`/p/${proposal.id}`}>
                            <Button type="button" variant="outline">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Cancelar
                            </Button>
                        </Link>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="bg-[#029DAF] hover:bg-[#027A8C]"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Salvando...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4 mr-2" />
                                    Salvar Alterações
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </main>
        </div >
    );
}
