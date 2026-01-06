'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Product, ProductPlan } from '@/lib/db';
import { saveProduct, editProduct, removeProduct } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from "sonner";
import { Loader2, Plus, Pencil, Trash2, Package, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ProductWithId {
    id: string;
    name: string;
    description: string;
    price: number;
    type: string;
    plans?: ProductPlan[];
}

interface ProductsManagerProps {
    initialProducts: ProductWithId[];
}

export function ProductsManager({ initialProducts }: ProductsManagerProps) {
    const router = useRouter();
    const [products, setProducts] = useState<ProductWithId[]>(initialProducts);
    const [loading, setLoading] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<ProductWithId | null>(null);

    const [formData, setFormData] = useState<Omit<Product, 'id'>>({
        name: '',
        description: '',
        price: 0,
        type: 'one-time',
        plans: [],
    });

    const addPlan = () => {
        const newPlan: ProductPlan = {
            id: Date.now().toString(),
            name: '',
            description: '',
            price: 0,
        };
        setFormData(prev => ({ ...prev, plans: [...(prev.plans || []), newPlan] }));
    };

    const updatePlan = (index: number, field: keyof ProductPlan, value: any) => {
        const newPlans = [...(formData.plans || [])];
        newPlans[index] = { ...newPlans[index], [field]: value };
        setFormData(prev => ({ ...prev, plans: newPlans }));
    };

    const removePlan = (index: number) => {
        setFormData(prev => ({
            ...prev,
            plans: (prev.plans || []).filter((_, i) => i !== index)
        }));
    };

    const resetForm = () => {
        setFormData({ name: '', description: '', price: 0, type: 'one-time', plans: [] });
        setEditingProduct(null);
    };

    const openCreateDialog = () => {
        resetForm();
        setDialogOpen(true);
    };

    const openEditDialog = (product: ProductWithId) => {
        setEditingProduct(product);
        setFormData({
            name: product.name,
            description: product.description,
            price: product.price,
            type: product.type as 'one-time' | 'recurring',
            plans: product.plans || [],
        });
        setDialogOpen(true);
    };

    // This is the handleSubmit function, its body was directly in the component.
    // The user's instruction implies inserting after its logic block.
    const handleSubmit = async () => {
        if (!formData.name) {
            toast.error("Preencha o nome do produto.");
            return;
        }

        const hasPlans = formData.plans && formData.plans.length > 0;

        // If no plans, price is required
        if (!hasPlans && (!formData.price || formData.price <= 0)) {
            toast.error("Preço é obrigatório quando não há planos.");
            return;
        }

        // Sanitize plans to ensure valid JSON structure
        const safePlans = formData.plans?.map(p => ({
            id: p.id,
            name: p.name,
            description: p.description || '',
            price: Number(p.price) || 0,
            originalPrice: p.originalPrice || null
        })) || [];

        const submissionData = {
            ...formData,
            // Keep the base price as is (or 0), don't force it unnecessarily, 
            // but rely on validation above.
            plans: safePlans
        };

        setLoading(true);
        try {
            if (editingProduct) {
                await editProduct(editingProduct.id, submissionData);
                setProducts(products.map(p =>
                    p.id === editingProduct.id ? { ...p, ...submissionData } : p
                ));
                toast.success("Produto atualizado com sucesso!");
            } else {
                const newProduct = await saveProduct(submissionData);
                setProducts([newProduct as unknown as ProductWithId, ...products]);
                toast.success("Produto criado com sucesso!");
            }
            setDialogOpen(false);
            resetForm();
            router.refresh();
        } catch (error) {
            console.error(error);
            toast.error("Erro ao salvar produto.");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        const confirm = window.confirm("Tem certeza que deseja excluir este produto?");
        if (!confirm) return;

        setLoading(true);
        try {
            await removeProduct(id);
            setProducts(products.filter(p => p.id !== id));
            toast.success("Produto excluído com sucesso!");
            router.refresh();
        } catch {
            toast.error("Erro ao excluir produto.");
        } finally {
            setLoading(false);
        }
    };

    const oneTimeProducts = products.filter(p => p.type === 'one-time');
    const recurringProducts = products.filter(p => p.type === 'recurring');



    const hasPlans = formData.plans && formData.plans.length > 0;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-semibold">Catálogo de Produtos e Serviços</h2>
                    <p className="text-muted-foreground text-sm">
                        Cadastre produtos e serviços para usar nas suas propostas.
                    </p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={openCreateDialog}>
                            <Plus className="mr-2 h-4 w-4" />
                            Novo Produto
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>
                                {editingProduct ? 'Editar Produto' : 'Novo Produto / Serviço'}
                            </DialogTitle>
                            <DialogDescription>
                                Preencha as informações do produto ou serviço.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label>Nome</Label>
                                <Input
                                    placeholder="Ex: Desenvolvimento de Website"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Descrição</Label>
                                <Input
                                    placeholder="Descrição do produto ou serviço..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                {/* Only show Base Price if NO Plans are present */}
                                {!hasPlans && (
                                    <div className="space-y-2 animate-in fade-in zoom-in duration-200">
                                        <Label>Preço Base (R$)</Label>
                                        <Input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={formData.price || ''}
                                            onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                                        />
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <Label>Tipo</Label>

                                    <Select
                                        value={formData.type}
                                        onValueChange={(value: 'one-time' | 'recurring') => setFormData({ ...formData, type: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="one-time">Único (Setup / Projeto)</SelectItem>
                                            <SelectItem value="recurring">Recorrente (Mensal)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Plans Section */}
                            <div className="border-t pt-4 mt-2">
                                <div className="flex justify-between items-center mb-4">
                                    <Label className="text-base font-semibold">Planos / Variações</Label>
                                    <Button size="sm" variant="outline" onClick={addPlan} type="button">
                                        <Plus className="w-3 h-3 mr-1" /> Adicionar Plano
                                    </Button>
                                </div>
                                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                                    {(formData.plans || []).map((plan, idx) => (
                                        <div key={plan.id || idx} className="border p-3 rounded-lg bg-muted/30 relative space-y-3">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="absolute top-1 right-1 h-6 w-6 hover:bg-red-100 dark:hover:bg-red-900/30"
                                                onClick={() => removePlan(idx)}
                                            >
                                                <Trash2 className="w-3 h-3 text-red-500" />
                                            </Button>

                                            <div className="grid grid-cols-3 gap-2 pr-6">
                                                <div className="col-span-2 space-y-1">
                                                    <Label className="text-xs text-muted-foreground">Nome do Plano</Label>
                                                    <Input
                                                        value={plan.name}
                                                        onChange={(e) => updatePlan(idx, 'name', e.target.value)}
                                                        className="h-8 text-sm"
                                                        placeholder="Ex: Plano Básico"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs text-muted-foreground">Preço</Label>
                                                    <Input
                                                        type="number"
                                                        value={plan.price || ''}
                                                        onChange={(e) => updatePlan(idx, 'price', Number(e.target.value))}
                                                        className="h-8 text-sm"
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs text-muted-foreground">Descrição / Escopo</Label>
                                                <Input
                                                    value={plan.description}
                                                    onChange={(e) => updatePlan(idx, 'description', e.target.value)}
                                                    className="h-8 text-sm"
                                                    placeholder="Diferenciais deste plano..."
                                                />
                                            </div>
                                        </div>
                                    ))}
                                    {formData.plans?.length === 0 && (
                                        <p className="text-sm text-center text-muted-foreground py-2 italic">
                                            Nenhum plano adicionado. O produto usará o preço base acima.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                            <Button onClick={handleSubmit} disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {editingProduct ? 'Salvar Alterações' : 'Criar Produto'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {products.length === 0 ? (
                <Card className="bg-muted/20 border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Package className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground text-center mb-4">
                            Nenhum produto cadastrado ainda.
                        </p>
                        <Button onClick={openCreateDialog}>
                            <Plus className="mr-2 h-4 w-4" />
                            Cadastrar Primeiro Produto
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6">
                    {/* One-time Products */}
                    {oneTimeProducts.length > 0 && (
                        <Card>
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-2">
                                    <Package className="h-5 w-5 text-primary" />
                                    <CardTitle className="text-lg">Produtos / Serviços Únicos</CardTitle>
                                </div>
                                <CardDescription>Setup, implementação, projetos pontuais</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Nome</TableHead>
                                            <TableHead>Descrição</TableHead>
                                            <TableHead className="w-[150px]">Preço</TableHead>
                                            <TableHead className="w-[100px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {oneTimeProducts.map((product) => (
                                            <TableRow key={product.id}>
                                                <TableCell className="font-medium align-top">{product.name}</TableCell>
                                                <TableCell className="text-muted-foreground whitespace-pre-wrap break-words max-w-[300px]">{product.description}</TableCell>
                                                <TableCell className="font-semibold align-top">
                                                    {product.plans && product.plans.length > 0 ? (
                                                        <div className="flex flex-col">
                                                            <span className="text-sm">
                                                                {(() => {
                                                                    const prices = product.plans!.map(p => p.price);
                                                                    const min = Math.min(...prices);
                                                                    const max = Math.max(...prices);
                                                                    if (min === max) return `R$ ${min.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
                                                                    return `R$ ${min.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} - ${max.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
                                                                })()}
                                                            </span>
                                                            <div className="text-[10px] text-muted-foreground font-normal mt-1">
                                                                {product.plans.length} variações
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        `R$ ${product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                                                    )}
                                                </TableCell>
                                                <TableCell className="align-top">
                                                    <div className="flex gap-1">
                                                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(product)}>
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(product.id)}>
                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    )}

                    {/* Recurring Products */}
                    {recurringProducts.length > 0 && (
                        <Card>
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-2">
                                    <RefreshCw className="h-5 w-5 text-blue-500" />
                                    <CardTitle className="text-lg">Serviços Recorrentes</CardTitle>
                                </div>
                                <CardDescription>Mensalidades, assinaturas, manutenções</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Nome</TableHead>
                                            <TableHead>Descrição</TableHead>
                                            <TableHead className="w-[150px]">Preço/Mês</TableHead>
                                            <TableHead className="w-[100px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {recurringProducts.map((product) => (
                                            <TableRow key={product.id}>
                                                <TableCell className="font-medium align-top">{product.name}</TableCell>
                                                <TableCell className="text-muted-foreground whitespace-pre-wrap break-words max-w-[300px]">{product.description}</TableCell>
                                                <TableCell className="font-semibold text-blue-500 align-top">
                                                    {product.plans && product.plans.length > 0 ? (
                                                        <div className="flex flex-col">
                                                            <span className="text-sm">
                                                                {(() => {
                                                                    const prices = product.plans!.map(p => p.price);
                                                                    const min = Math.min(...prices);
                                                                    const max = Math.max(...prices);
                                                                    if (min === max) return `R$ ${min.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
                                                                    return `R$ ${min.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} - ${max.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
                                                                })()}
                                                            </span>
                                                            <div className="text-[10px] text-muted-foreground font-normal mt-1">
                                                                {product.plans.length} variações
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                            <span className="text-xs text-muted-foreground font-normal">/mês</span>
                                                        </>
                                                    )}
                                                </TableCell>
                                                <TableCell className="align-top">
                                                    <div className="flex gap-1">
                                                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(product)}>
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(product.id)}>
                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}
        </div>
    );
}
