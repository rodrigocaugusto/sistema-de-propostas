
import { fetchProducts, logoutAction } from "@/app/actions";
import { getSession } from "@/lib/auth";
import { ProductsManager } from "@/components/products-manager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { RefreshCw, DollarSign, ShoppingBag, Layers } from "lucide-react";

interface ProductData {
    id: string;
    name: string;
    description: string;
    price: number;
    type: string;
}

export default async function ProductsPage() {
    const session = await getSession();
    const products: ProductData[] = await fetchProducts();

    const totalProducts = products.length;
    const oneTimeProducts = products.filter(p => p.type === 'one-time');
    const recurringProducts = products.filter(p => p.type === 'recurring');

    const avgOneTimePrice = oneTimeProducts.length > 0
        ? oneTimeProducts.reduce((sum, p) => sum + p.price, 0) / oneTimeProducts.length
        : 0;
    const avgRecurringPrice = recurringProducts.length > 0
        ? recurringProducts.reduce((sum, p) => sum + p.price, 0) / recurringProducts.length
        : 0;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
            <PageHeader
                title="Produtos & Serviços"
                subtitle="Gerencie seu catálogo"
                iconName="package"
                iconGradient="from-purple-500 to-pink-600"
                session={session}
                logoutAction={logoutAction}
            />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
                {/* Stats */}
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {/* Total - #029DAF Teal */}
                    <Card className="border-l-4 border-l-[#029DAF] bg-white dark:bg-slate-900 shadow-lg">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Total de Produtos</CardTitle>
                                <div className="p-2 rounded-lg bg-[#029DAF]/10 dark:bg-[#029DAF]/20">
                                    <Layers className="h-4 w-4 text-[#029DAF]" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-slate-900 dark:text-white">{totalProducts}</div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">itens no catálogo</p>
                        </CardContent>
                    </Card>

                    {/* Produtos Únicos - #FFC219 Golden */}
                    <Card className="border-l-4 border-l-[#FFC219] bg-white dark:bg-slate-900 shadow-lg">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Produtos Únicos</CardTitle>
                                <div className="p-2 rounded-lg bg-[#FFC219]/10 dark:bg-[#FFC219]/20">
                                    <ShoppingBag className="h-4 w-4 text-[#FFC219]" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-slate-900 dark:text-white">{oneTimeProducts.length}</div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                Média: R$ {avgOneTimePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                        </CardContent>
                    </Card>

                    {/* Recorrentes - #F07C19 Orange */}
                    <Card className="border-l-4 border-l-[#F07C19] bg-white dark:bg-slate-900 shadow-lg">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Serviços Recorrentes</CardTitle>
                                <div className="p-2 rounded-lg bg-[#F07C19]/10 dark:bg-[#F07C19]/20">
                                    <RefreshCw className="h-4 w-4 text-[#F07C19]" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-slate-900 dark:text-white">{recurringProducts.length}</div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                Média: R$ {avgRecurringPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês
                            </p>
                        </CardContent>
                    </Card>

                    {/* Valor Total - #E5D599 Gold  */}
                    <Card className="border-l-4 border-l-[#E5D599] bg-white dark:bg-slate-900 shadow-lg">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Valor Total Catálogo</CardTitle>
                                <div className="p-2 rounded-lg bg-[#E5D599]/20 dark:bg-[#E5D599]/20">
                                    <DollarSign className="h-4 w-4 text-[#B8A850]" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-slate-900 dark:text-white">
                                R$ {products.reduce((sum, p) => sum + p.price, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">soma de todos os itens</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Products Manager */}
                <div className="space-y-4">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Gerenciar Catálogo</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Adicione, edite ou remova produtos e serviços</p>
                    </div>

                    <ProductsManager initialProducts={products} />
                </div>
            </main>
        </div>
    );
}
