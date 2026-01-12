'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateCompanyAsaasKey } from '@/app/actions';
import { toast } from 'sonner';
import { Loader2, CheckCircle, AlertCircle, Link as LinkIcon, ExternalLink, Wallet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface IntegrationsManagerProps {
    apiKey?: string | null;
}

export function IntegrationsManager({ apiKey }: IntegrationsManagerProps) {
    const [key, setKey] = useState(apiKey || '');
    const [isLoading, setIsLoading] = useState(false);

    const handleSave = async () => {
        setIsLoading(true);
        try {
            await updateCompanyAsaasKey(key);
            toast.success("Chave de API salva com sucesso");
        } catch (error) {
            toast.error("Erro ao salvar chave de API");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="border-0 shadow-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <div className="bg-[#0030b9] p-1 rounded text-white font-bold text-xs tracking-tighter w-8 h-8 flex items-center justify-center">
                        AS
                    </div>
                    Integração Asaas
                </CardTitle>
                <CardDescription>
                    Automatize a geração de boletos e Pix ao aceitar propostas.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="apiKey">Chave de API (Produção)</Label>
                    <div className="flex gap-2">
                        <Input
                            id="apiKey"
                            type="password"
                            value={key}
                            onChange={(e) => setKey(e.target.value)}
                            placeholder="$aact_..."
                            className="font-mono"
                        />
                        <Button onClick={handleSave} disabled={isLoading}>
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar'}
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <ExternalLink className="h-3 w-3" />
                        Obtenha sua chave em <a href="https://www.asaas.com/customerConfigIntegration" target="_blank" className="underline text-blue-500 hover:text-blue-600">Configurações do Asaas</a>
                    </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg text-sm border border-slate-200 dark:border-slate-800">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                        {apiKey ? <CheckCircle className="h-4 w-4 text-green-500" /> : <AlertCircle className="h-4 w-4 text-amber-500" />}
                        Status da Integração
                    </h4>
                    <p className="text-slate-600 dark:text-slate-400">
                        {apiKey
                            ? "Integração ativa. As cobranças serão geradas automaticamente quando o cliente aceitar a proposta."
                            : "Integração inativa. Configure a chave para habilitar a geração automática de cobranças."}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
